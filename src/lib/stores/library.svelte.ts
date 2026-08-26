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

// Album art is a FILE in the album's folder; `album_art` maps folder → that
// file, read once per folder and cached here in module memory only — never
// persisted back into the DB.
const coverCache = new Map<string, string>();

/** The album folder a URI lives in — the raw parent directory, matching
 *  Rust's `folder_of`. Deliberately NOT the disc-stripped `folderOf` below. */
function dirOf(uri: string): string {
	if (uri.includes('://')) return ''; // content:// has no folder we may write into
	const cut = Math.max(uri.lastIndexOf('/'), uri.lastIndexOf('\\'));
	if (cut < 0) return '';
	// A root keeps its separator, matching Rust's Path::parent(): never the bare "D:".
	let dir = cut === 0 ? uri.slice(0, 1) : uri.slice(0, cut);
	if (/^[A-Za-z]:$/.test(dir)) dir += uri[cut];
	return dir;
}

function rowToTrack(row: Record<string, unknown>): Track {
	const uri = row.uri as string;
	return {
		id: row.id as string,
		uri,
		filename: row.filename as string,
		title: row.title as string,
		artist: row.artist as string,
		album: row.album as string,
		genre: row.genre != null ? (row.genre as string) : undefined,
		year: row.year != null ? (row.year as number) : undefined,
		trackNumber: row.track_number != null ? (row.track_number as number) : undefined,
		duration: row.duration as number,
		folder: dirOf(uri),
		coverArt: row.cover_art != null ? (row.cover_art as string) : undefined,
		lyrics: row.lyrics != null ? (row.lyrics as string) : undefined,
		dateAdded: row.date_added as number,
		lastScanned: row.last_scanned as number,
	};
}

// Builds one upsert statement for a batch (max INSERT_BATCH rows). cover_art
// is excluded — embedded art can be 100-500KB per track, so it's written
// separately afterward, one UPDATE per track.
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
		await sweepEmbeddedCoversIntoFolders(saved);
		await applyFolderArt(saved);
		if (saved.length > 0) setTracks(saved);
	} catch (e) {
		console.error('[libraryStore] loadTracks failed:', e);
	} finally {
		loading = false;
	}
}

async function readAlbumArtRows(): Promise<Map<string, string>> {
	if (!db) return new Map();
	const rows = await db.select<{ folder: string; path: string }[]>(
		'SELECT folder, path FROM album_art'
	);
	return new Map(rows.map((r) => [r.folder, r.path]));
}

async function upsertAlbumArt(folder: string, path: string) {
	if (!db) return;
	await db.execute(
		`INSERT INTO album_art (folder, path, updated_at) VALUES ($1, $2, $3)
		 ON CONFLICT(folder) DO UPDATE SET path = excluded.path, updated_at = excluded.updated_at`,
		[folder, path, Math.floor(Date.now() / 1000)]
	);
}

// One read per album folder, shared by every song in it. A folder whose cover
// file has since been deleted is left alone: the album_art row stays, and the
// track keeps whatever art it already had.
async function applyFolderArt(list: Track[]) {
	const byFolder = await readAlbumArtRows();
	if (byFolder.size === 0) return;

	const wanted = new Set<string>();
	for (const t of list) {
		if (t.folder && byFolder.has(t.folder)) wanted.add(t.folder);
	}

	const { invoke } = await import('@tauri-apps/api/core');
	for (const folder of wanted) {
		if (coverCache.has(folder)) continue;
		try {
			coverCache.set(folder, await invoke<string>('read_cover', { path: byFolder.get(folder)! }));
		} catch (e) {
			console.warn(`[libraryStore] cover unreadable for ${folder}:`, e);
		}
	}

	for (const t of list) {
		if (!t.folder) continue;
		const path = byFolder.get(t.folder);
		if (path) t.coverPath = path;
		const art = coverCache.get(t.folder);
		if (art) t.coverArt = art;
	}
}

// One-time sweep: lifts the first embedded cover per folder into a real file,
// records it in album_art, then clears the song rows — in that order, so
// nothing is dropped before its replacement is on disk. Idempotent; a folder
// already in album_art is skipped.
async function sweepEmbeddedCoversIntoFolders(list: Track[]) {
	if (!db) return;

	const known = await readAlbumArtRows();
	const candidates = new Map<string, { art: string; ids: string[] }>();
	for (const t of list) {
		if (!t.folder || !t.coverArt?.startsWith('data:') || known.has(t.folder)) continue;
		const entry = candidates.get(t.folder);
		if (entry) entry.ids.push(t.id);
		else candidates.set(t.folder, { art: t.coverArt, ids: [t.id] });
	}
	if (candidates.size === 0) return;

	const { invoke } = await import('@tauri-apps/api/core');
	const emptied = new Set<string>();
	let folders = 0;

	for (const [folder, { art, ids }] of candidates) {
		try {
			// adopt, not save: a folder that already holds a cover file keeps it.
			const path = await invoke<string>('adopt_album_cover', { folder, dataUri: art });
			await upsertAlbumArt(folder, path);
			folders++;
			for (let i = 0; i < ids.length; i += INSERT_BATCH) {
				const slice = ids.slice(i, i + INSERT_BATCH);
				const marks = slice.map((_, n) => `$${n + 1}`).join(',');
				await db.execute(`UPDATE songs SET cover_art = NULL WHERE id IN (${marks})`, slice);
				for (const id of slice) emptied.add(id);
			}
		} catch (e) {
			console.warn(`[libraryStore] could not move art into ${folder}:`, e);
		}
	}

	// applyFolderArt hands the folder's file back to these rows a moment later.
	for (const t of list) {
		if (emptied.has(t.id)) t.coverArt = undefined;
	}

	if (folders > 0) {
		const cleared = emptied.size;
		console.log(
			`[libraryStore] album art moved into ${folders} folder(s); ${cleared} song row(s) cleared of embedded art`
		);
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

// Builds the album/artist groupings from a flat track list. Artist dedup is
// case-insensitive; album id follows "albumName|||artistName", gaining a
// "|||discriminator" suffix when several releases share both name and artist:
// distinct tag years split first, source folders only when no year info exists.
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
				// The album's art IS its folder's art, read once from the one cover file.
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

// Explicit BEGIN/COMMIT is intentionally omitted — tauri-plugin-sql's SQLx
// pool issues ROLLBACK on connection release, silently cancelling explicit
// transactions. Each execute() call is autocommitted instead.
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

	// Album art: one row per folder, pointing at the cover file the scan wrote there.
	const artByFolder = new Map<string, string>();
	for (const t of scannedTracks) {
		if (t.folder && t.coverPath && !artByFolder.has(t.folder)) {
			artByFolder.set(t.folder, t.coverPath);
		}
	}
	for (const [folder, path] of artByFolder) {
		await upsertAlbumArt(folder, path);
		coverCache.delete(folder); // re-read on the next load; the file may be new
	}

	// Only remaining writer of songs.cover_art: legacy backups with embedded
	// base64 and no cover file. The sweep migrates them on the next load.
	for (const t of scannedTracks) {
		if (t.coverArt && !t.coverPath) {
			await db.execute('UPDATE songs SET cover_art = $1 WHERE id = $2', [t.coverArt, t.id]);
		}
	}
}

// Android's dialog plugin rejects directory picks, so the standard public
// music locations are scanned directly instead, once Media/Audio permission is granted.
const ANDROID_MUSIC_DIRS = ['/storage/emulated/0/Music', '/storage/emulated/0/Download'];

export const isAndroid = browser && navigator.userAgent.includes('Android');

// True while the pre-scan permission explainer should be shown (Android only).
// Set by scanLibrary, consumed by MediaPermissionDialog (mounted in +layout).
let permissionNeeded = $state(false);

// Gate: on Android, a missing media-access grant doesn't error, it just makes
// the music invisible (scoped storage) — this checks first to avoid a silent zero-track scan.
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
			// Bridge unavailable (stale build) — proceed; runScan still covers the unpermitted case.
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
		const withTimestamps = scanned.map((t) => ({ ...t, lastScanned: now, folder: dirOf(t.uri) }));
		await saveScannedTracks(withTimestamps);
		if (isAndroid && scanned.length > 0 && db) {
			await db.execute("DELETE FROM songs WHERE uri LIKE 'content://%'");
		}
		// Reload from the DB so the view reflects every scanned folder, not just this pass.
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

// Art the vessel chose lands as a FILE in the album's folder, and album_art
// records it. An album spanning several folders (a multi-disc rip in per-disc
// subfolders) gets the cover saved into EVERY folder that holds its tracks.
async function updateAlbumCoverArt(albumId: string, coverArt: string) {
	if (!db) return;
	const album = albums.find((a) => a.id === albumId);
	if (!album) return;

	const folders = [...new Set(album.tracks.map((t) => t.folder).filter(Boolean))];
	const { invoke } = await import('@tauri-apps/api/core');
	const landed = new Set<string>();

	for (const folder of folders) {
		try {
			const path = await invoke<string>('save_album_cover', { folder, dataUri: coverArt });
			await upsertAlbumArt(folder, path);
			coverCache.set(folder, coverArt);
			landed.add(folder);
		} catch (e) {
			console.error(`[libraryStore] could not save album art into ${folder}:`, e);
		}
	}
	if (landed.size === 0) return;

	// Update in-memory tracks + album so UI reacts without a full reload.
	for (const track of tracks) {
		if (landed.has(track.folder)) track.coverArt = coverArt;
	}
	album.coverArt = coverArt;
}

async function updateTrackLyrics(trackId: string, lyrics: string) {
	if (!db) return;
	await db.execute('UPDATE songs SET lyrics = $1 WHERE id = $2', [lyrics, trackId]);
	const track = tracks.find((t) => t.id === trackId);
	if (track) track.lyrics = lyrics;
}

// Full purge: child tables with a FOREIGN KEY to songs(id) — mood_events,
// favorites, fragments — must be emptied before songs, or SQLite raises a
// foreign-key violation (787). moodStore.purgeAll() runs afterward to reset
// its own in-memory stats. Throws instead of failing silently so the UI can
// report when nothing was purged.
async function purgeAllData() {
	if (!db) throw new Error('Database not ready — nothing was purged');
	await db.execute('DELETE FROM mood_events');
	await db.execute('DELETE FROM fragments');
	await db.execute('DELETE FROM favorites');
	await db.execute('DELETE FROM playlists');
	await db.execute('DELETE FROM songs');
	// The folder → cover mapping and in-memory cache are purged too. The cover
	// FILES stay — they live in the vessel's own music folders.
	await db.execute('DELETE FROM album_art');
	coverCache.clear();
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

// Reports missing tracks only — deletes nothing. A missing track that still
// carries mood tags or fragments is reported as KEPT rather than sweepable,
// since removing it would cascade through their FOREIGN KEYs to songs(id).
export interface MissingTrack {
	id: string;
	uri: string;
	title: string;
	artist: string;
	moodCount: number;
	fragmentCount: number;
}

async function findMissingTracks(): Promise<MissingTrack[]> {
	await initDB();
	if (!db) throw new Error('Database not ready — nothing was checked');
	const rows = await db.select<Record<string, unknown>[]>(
		`SELECT s.id, s.uri, s.title, s.artist,
		        (SELECT COUNT(*) FROM mood_events m WHERE m.track_id = s.id) AS mood_count,
		        (SELECT COUNT(*) FROM fragments f WHERE f.source_track_id = s.id) AS fragment_count
		 FROM songs s`
	);
	const { invoke } = await import('@tauri-apps/api/core');
	const gone = new Set(
		await invoke<string[]>('find_missing_tracks', { uris: rows.map((r) => r.uri as string) })
	);
	return rows
		.filter((r) => gone.has(r.uri as string))
		.map((r) => ({
			id: r.id as string,
			uri: r.uri as string,
			title: (r.title as string) ?? '',
			artist: (r.artist as string) ?? '',
			moodCount: Number(r.mood_count ?? 0),
			fragmentCount: Number(r.fragment_count ?? 0),
		}));
}

// Removal half — runs only on caller-confirmed ids, chunked under SQLite's
// 999-parameter limit. `favorites` is swept alongside for FK hygiene (unused today).
async function removeTracksByIds(ids: string[]): Promise<number> {
	if (!db || ids.length === 0) return 0;
	const CHUNK = 400;
	let removed = 0;
	for (let i = 0; i < ids.length; i += CHUNK) {
		const slice = ids.slice(i, i + CHUNK);
		const marks = slice.map((_, n) => `$${n + 1}`).join(',');
		await db.execute(`DELETE FROM favorites WHERE track_id IN (${marks})`, slice);
		await db.execute(`DELETE FROM songs WHERE id IN (${marks})`, slice);
		removed += slice.length;
	}
	await loadTracks();
	return removed;
}

export const libraryStore = {
	get tracks() { return tracks; },
	get albums() { return albums; },
	get artists() { return artists; },
	get loading() { return loading; },
	get dbError() { return dbError; },
	get isScanning() { return isScanning; },
	get scanProgress() { return scanProgress; },
	findMissingTracks,
	removeTracksByIds,
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
