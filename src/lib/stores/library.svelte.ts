import Database from '@tauri-apps/plugin-sql';
import { browser } from '$app/environment';
import type { Track, Album, Artist } from '$lib/types/types';

let db: Database | null = null;
let tracks = $state<Track[]>([]);
let albums = $state<Album[]>([]);
let artists = $state<Artist[]>([]);
let loading = $state(false);
let dbError = $state<string | null>(null);
let isScanning = $state(false);
let scanProgress = $state(0);
let scanError = $state<string | null>(null);
let lastScanned = $state<number | null>(null);

// SQLite bound-parameter limit is 999. 13 cols x 50 rows = 650 params per batch.
const INSERT_BATCH = 50;

function rowToTrack(row: Record<string, unknown>): Track {
	return {
		id: row.id as string,
		uri: row.uri as string,
		filename: row.filename as string,
		title: row.title as string,
		artist: row.artist as string,
		album: row.album as string,
		genre: row.genre != null ? (row.genre as string) : undefined,
		year: row.year != null ? (row.year as number) : undefined,
		trackNumber: row.track_number != null ? (row.track_number as number) : undefined,
		duration: row.duration as number,
		coverArt: row.cover_art != null ? (row.cover_art as string) : undefined,
		lyrics: row.lyrics != null ? (row.lyrics as string) : undefined,
		dateAdded: row.date_added as number,
		lastScanned: row.last_scanned as number,
	};
}

// Builds one upsert statement for a single batch (max INSERT_BATCH rows).
// cover_art is deliberately excluded — embedded art can be 100-500KB per
// track, so batching 50 of those into one IPC call risks a huge/failing
// payload. It's written separately afterward, one UPDATE per track.
function buildInsertBatch(vals: unknown[][]): [string, unknown[]] {
	let p = 1;
	const rows = vals.map((row) => `(${row.map(() => '$' + p++).join(',')})`);
	const cols =
		'id,uri,filename,title,artist,album,genre,year,track_number,duration,lyrics,date_added,last_scanned';
	const upd =
		'uri=excluded.uri,filename=excluded.filename,title=excluded.title,artist=excluded.artist,album=excluded.album,genre=excluded.genre,year=excluded.year,track_number=excluded.track_number,duration=excluded.duration,lyrics=excluded.lyrics,date_added=excluded.date_added,last_scanned=excluded.last_scanned';
	return [
		`INSERT INTO songs (${cols}) VALUES ${rows.join(',')} ON CONFLICT(id) DO UPDATE SET ${upd}`,
		vals.flat(),
	];
}

async function initDB() {
	if (!browser || db) return;
	try {
		db = await Database.load('sqlite:compass.db');
		await loadTracks();
	} catch (e) {
		dbError = e instanceof Error ? e.message : String(e);
		console.error('[libraryStore] initDB failed:', e);
	}
}

async function loadTracks() {
	if (!db) return;
	loading = true;
	try {
		const rows = await db.select<Record<string, unknown>[]>(
			'SELECT * FROM songs ORDER BY artist, album, track_number'
		);
		const saved = rows.map(rowToTrack);
		if (saved.length > 0) setTracks(saved);
	} catch (e) {
		console.error('[libraryStore] loadTracks failed:', e);
	} finally {
		loading = false;
	}
}

// Parent folder of a track, decoded so content:// document IDs (%2F-encoded)
// split like plain paths. Trailing "Disc N"/"CD N" segments are stripped so
// multi-disc rips in per-disc subfolders still group as one album.
function folderOf(uri: string): string {
	let p = uri;
	try {
		p = decodeURIComponent(uri);
	} catch {}
	const cut = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
	const dir = cut >= 0 ? p.slice(0, cut) : p;
	return dir.replace(/[\\/](disc|cd)[\s._-]*\d+\s*$/i, '');
}

// Builds the album/artist groupings from a flat track list.
// Artist dedup is case-insensitive (.trim().toLowerCase()); album id follows
// the "albumName|||artistName" format (CLAUDE.md), gaining a "|||discriminator"
// suffix only when several releases share both name and artist (e.g. three
// self-titled albums): distinct tag years split first, source folders only when
// no year info exists at all — a lone tagged year must not split disc folders.
function setTracks(newTracks: Track[]) {
	tracks = newTracks;

	const baseGroups = new Map<string, Track[]>();
	for (const track of newTracks) {
		const key = `${track.album.trim().toLowerCase()}|||${track.artist.trim().toLowerCase()}`;
		const group = baseGroups.get(key);
		if (group) group.push(track);
		else baseGroups.set(key, [track]);
	}

	const albumList: Album[] = [];
	for (const group of baseGroups.values()) {
		const years = new Set(group.map((t) => t.year).filter((y) => y != null));
		const folders = new Set(group.map((t) => folderOf(t.uri)));

		let discOf: (t: Track) => string;
		if (years.size > 1) discOf = (t) => String(t.year ?? '?');
		else if (years.size === 0 && folders.size > 1) discOf = (t) => folderOf(t.uri);
		else discOf = () => '';

		const subGroups = new Map<string, Track[]>();
		for (const t of group) {
			const disc = discOf(t);
			const sub = subGroups.get(disc);
			if (sub) sub.push(t);
			else subGroups.set(disc, [t]);
		}

		for (const [disc, subTracks] of subGroups) {
			const albumName = subTracks[0].album.trim();
			const artistName = subTracks[0].artist.trim();
			albumList.push({
				id: disc ? `${albumName}|||${artistName}|||${disc}` : `${albumName}|||${artistName}`,
				name: albumName,
				artist: artistName,
				tracks: subTracks,
				coverArt: subTracks.find((t) => t.coverArt)?.coverArt,
				year: subTracks.find((t) => t.year != null)?.year,
				genre: subTracks[0].genre,
			});
		}
	}

	const artistMap = new Map<string, Artist>();
	for (const album of albumList) {
		const artistKey = album.artist.toLowerCase();
		if (!artistMap.has(artistKey)) {
			artistMap.set(artistKey, { id: album.artist, name: album.artist, albums: [], trackCount: 0 });
		}
		const artist = artistMap.get(artistKey)!;
		artist.albums.push(album);
		artist.trackCount += album.tracks.length;
	}

	albums = albumList;
	artists = Array.from(artistMap.values());
	lastScanned = Date.now();
}

// Note: explicit BEGIN/COMMIT is intentionally omitted — tauri-plugin-sql's
// SQLx connection pool issues ROLLBACK on connection release, which silently
// cancels explicit transactions. Each execute() call is autocommitted, and
// batching keeps each call under SQLite's 999 bound-parameter limit.
async function saveScannedTracks(scannedTracks: Track[]) {
	if (!db) return;

	const now = Math.floor(Date.now() / 1000);
	const vals = scannedTracks.map((t) => [
		t.id,
		t.uri,
		t.filename,
		t.title,
		t.artist,
		t.album,
		t.genre ?? null,
		t.year ?? null,
		t.trackNumber ?? null,
		t.duration,
		t.lyrics ?? null,
		t.dateAdded || now,
		now,
	]);
	for (let i = 0; i < vals.length; i += INSERT_BATCH) {
		const [stmt, params] = buildInsertBatch(vals.slice(i, i + INSERT_BATCH));
		await db.execute(stmt, params);
	}

	// Cover art: one UPDATE per track so no single IPC call carries more than one image.
	for (const t of scannedTracks) {
		if (t.coverArt) {
			await db.execute('UPDATE songs SET cover_art = $1 WHERE id = $2', [t.coverArt, t.id]);
		}
	}
}

// Android's dialog plugin rejects directory picks (FolderPickerNotImplemented
// in tauri-plugin-dialog's mobile branch), so there the standard public music
// locations are scanned directly instead — readable via plain paths once the
// vessel grants Media/Audio permission (declared in AndroidManifest.xml; the
// PERMISSION_DENIED scan error carries the Settings guidance).
const ANDROID_MUSIC_DIRS = ['/storage/emulated/0/Music', '/storage/emulated/0/Download'];

export const isAndroid = browser && navigator.userAgent.includes('Android');

// True while the pre-scan permission explainer should be shown (Android only).
// Set by scanLibrary, consumed by MediaPermissionDialog (mounted in +layout).
let permissionNeeded = $state(false);

// Gate: on Android, make sure media access is granted before scanning — a
// missing grant doesn't error, it just makes the music invisible (scoped
// storage), so without this the vessel sees a silent zero-track scan.
async function scanLibrary() {
	if (isAndroid) {
		const { invoke } = await import('@tauri-apps/api/core');
		try {
			const granted = await invoke<boolean>('check_audio_permission');
			if (!granted) {
				permissionNeeded = true;
				return;
			}
		} catch (e) {
			// Bridge unavailable (stale build) — proceed; the zero-track
			// guidance in runScan still covers the unpermitted case.
			console.error('[libraryStore] permission check failed:', e);
		}
	}
	await runScan();
}

// "Grant Access" in the explainer dialog: fires the system permission prompt,
// then scans on grant or surfaces the Settings guidance card on denial.
async function grantPermissionAndScan() {
	permissionNeeded = false;
	const { invoke } = await import('@tauri-apps/api/core');
	try {
		const granted = await invoke<boolean>('request_audio_permission');
		if (granted) {
			await runScan();
			return;
		}
	} catch (e) {
		console.error('[libraryStore] permission request failed:', e);
	}
	scanError =
		'PERMISSION_DENIED: Storage access is required to scan music files. ' +
		'Please grant Media or Files access in Settings → Apps → Resonance Compass → Permissions.';
}

function dismissPermissionPrompt() {
	permissionNeeded = false;
}

async function runScan() {
	const { invoke } = await import('@tauri-apps/api/core');
	const { listen } = await import('@tauri-apps/api/event');

	let selected: string[];
	if (isAndroid) {
		selected = ANDROID_MUSIC_DIRS;
	} else {
		const { open } = await import('@tauri-apps/plugin-dialog');
		const picked = await open({ directory: true, multiple: true, title: 'Select your music folders' });
		if (!picked || picked.length === 0) return;
		selected = picked as string[];
	}

	scanError = null;
	isScanning = true;
	scanProgress = 0;

	const unlisten = await listen<{ current: number; total: number }>('scan-progress', (event) => {
		const { current, total } = event.payload;
		if (total > 0) scanProgress = current / total;
	});

	try {
		const scanned = await invoke<Track[]>('scan_paths', { paths: selected });
		const now = Math.floor(Date.now() / 1000);
		const withTimestamps = scanned.map((t) => ({ ...t, lastScanned: now }));
		await saveScannedTracks(withTimestamps);
		if (isAndroid && scanned.length > 0 && db) {
			// Rows from the interim file-picker build hold content:// URIs whose
			// SAF grants died with that session — permanently unplayable, so drop
			// them now that the same files are re-scanned under real paths.
			await db.execute("DELETE FROM songs WHERE uri LIKE 'content://%'");
		}
		// Reload from the DB so the view reflects the union of every scanned
		// folder, not just this pass (scans are additive upserts).
		await loadTracks();
		if (isAndroid && scanned.length === 0 && !scanError) {
			scanError =
				'No tracks found in Music or Download. If your music is on this device, ' +
				'enable Music and audio access in Settings → Apps → Resonance Compass → Permissions, then rescan.';
		}
	} catch (e) {
		scanError = e instanceof Error ? e.message : String(e);
		console.error('[libraryStore] scan failed:', e);
	} finally {
		unlisten();
		isScanning = false;
		scanProgress = 0;
	}
}

async function updateAlbumCoverArt(albumId: string, coverArt: string) {
	if (!db) return;
	const album = albums.find((a) => a.id === albumId);
	if (!album) return;
	// Per-track updates — a WHERE artist+album match would also restamp
	// same-named sibling albums (split apart by year/folder) with this art.
	for (const t of album.tracks) {
		await db.execute('UPDATE songs SET cover_art = $1 WHERE id = $2', [coverArt, t.id]);
	}
	// Update in-memory tracks + album so UI reacts without a full reload.
	const ids = new Set(album.tracks.map((t) => t.id));
	for (const track of tracks) {
		if (ids.has(track.id)) track.coverArt = coverArt;
	}
	album.coverArt = coverArt;
}

async function updateTrackLyrics(trackId: string, lyrics: string) {
	if (!db) return;
	await db.execute('UPDATE songs SET lyrics = $1 WHERE id = $2', [lyrics, trackId]);
	const track = tracks.find((t) => t.id === trackId);
	if (track) track.lyrics = lyrics;
}

// Full data purge: every child table with a FOREIGN KEY to songs(id) must be
// emptied before songs itself, or SQLite rejects with a foreign-key violation
// (code 787). The children are mood_events, favorites, and fragments (playlists
// has no FK). mood_events is deleted HERE — not left to moodStore.purgeAll() —
// so the entire FK-safe ordering lives in one authoritative place; the previous
// version deleted songs while mood_events still referenced it, which is what
// raised 787. moodStore.purgeAll() still runs afterward to reset its in-memory
// stats (its own DELETE then no-ops). Throws instead of returning silently so
// the purge UI can tell the vessel when nothing was actually deleted.
async function purgeAllData() {
	if (!db) throw new Error('Database not ready — nothing was purged');
	await db.execute('DELETE FROM mood_events');
	await db.execute('DELETE FROM fragments');
	await db.execute('DELETE FROM favorites');
	await db.execute('DELETE FROM playlists');
	await db.execute('DELETE FROM songs');
	tracks = [];
	albums = [];
	artists = [];
	lastScanned = null;
}

async function importTracks(imported: Track[]) {
	if (!db || imported.length === 0) return;
	await saveScannedTracks(imported);
	await loadTracks();
}

function getTrackById(id: string): Track | undefined {
	return tracks.find((t) => t.id === id);
}

function getTracksByAlbum(albumId: string): Track[] {
	const album = albums.find((a) => a.id === albumId);
	return album ? [...album.tracks].sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0)) : [];
}

function getTracksByArtist(artistName: string): Track[] {
	const key = artistName.trim().toLowerCase();
	return tracks.filter((t) => t.artist.trim().toLowerCase() === key);
}

function getAlbumsByArtist(artistId: string): Album[] {
	const artist = artists.find((a) => a.id === artistId);
	return artist ? artist.albums : [];
}

function search(query: string): { tracks: Track[]; albums: Album[]; artists: Artist[] } {
	const q = query.trim().toLowerCase();
	if (!q) return { tracks: [], albums: [], artists: [] };
	return {
		tracks: tracks.filter(
			(t) =>
				t.title.toLowerCase().includes(q) ||
				t.artist.toLowerCase().includes(q) ||
				t.album.toLowerCase().includes(q)
		),
		albums: albums.filter((a) => a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)),
		artists: artists.filter((a) => a.name.toLowerCase().includes(q)),
	};
}

export const libraryStore = {
	get tracks() { return tracks; },
	get albums() { return albums; },
	get artists() { return artists; },
	get loading() { return loading; },
	get dbError() { return dbError; },
	get isScanning() { return isScanning; },
	get scanProgress() { return scanProgress; },
	get scanError() { return scanError; },
	get lastScanned() { return lastScanned; },
	get permissionNeeded() { return permissionNeeded; },
	grantPermissionAndScan,
	dismissPermissionPrompt,
	initDB,
	loadTracks,
	setTracks,
	saveScannedTracks,
	scanLibrary,
	updateAlbumCoverArt,
	updateTrackLyrics,
	purgeAllData,
	importTracks,
	getTrackById,
	getTracksByAlbum,
	getTracksByArtist,
	getAlbumsByArtist,
	search,
};
