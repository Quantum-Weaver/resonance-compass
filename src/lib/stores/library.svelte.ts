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

// ── Album art hangs on the FOLDER ───────────────────────────────────────────
// KP's ⚛ word, 2026-08-22, verbatim: "album art should be stored in the album
// folders and songs should derive the art from the album, not each song needing
// the art separately fetched."
//
// So the art is a FILE in the album's own folder, `album_art` maps folder →
// that file, and a song's `coverArt` is read from it ONCE per folder and shared
// by every track in it. The read result is cached here, in module memory only —
// never back into the DB, which is the whole point.
const coverCache = new Map<string, string>();

/** The album folder a URI lives in — the raw parent directory, byte-for-byte
 *  what Rust's `folder_of` returns, because it is the key both sides share.
 *  Deliberately NOT the disc-stripped `folderOf` below: art sits in the real
 *  directory, so a "Disc 2" subfolder keeps its own cover file. */
function dirOf(uri: string): string {
	if (uri.includes('://')) return ''; // content:// has no folder we may write into
	const cut = Math.max(uri.lastIndexOf('/'), uri.lastIndexOf('\\'));
	if (cut < 0) return '';
	// A root keeps its separator, exactly as Rust's Path::parent() reports it:
	// "/a.mp3" → "/", "D:\a.mp3" → "D:\" — never the bare, drive-relative "D:".
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

// ONE read per album folder, shared by every song in it — the derivation KP
// asked for. A folder whose cover file has since been deleted is warned about
// and left alone: the album_art row stays (lose-nothing), and the track keeps
// whatever art it already had.
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

// ── The one-time sweep (2026-08-22, at KP's ⚛ word) ─────────────────────────
// Every library scanned before tonight holds one base64 copy of the same album
// cover in every song row — 100-500 KB each, all of it inside compass.db. This
// lifts the FIRST copy in each folder out to a real file in that folder, records
// it in album_art, and only THEN clears the song rows. Order is the whole
// safety: nothing is dropped from the DB before its replacement is on disk.
//
// Idempotent by construction — a folder already in album_art is skipped — and
// quiet: it logs counts and nothing else.
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
			// adopt, not save: a folder that already holds a cover file keeps it,
			// and the row simply learns to point at what was always there.
			const path = await invoke<string>('adopt_album_cover', { folder, dataUri: art });
			await upsertAlbumArt(folder, path);
			folders++;
			// Only now: the art is on disk and recorded, so the rows may let go.
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

	// The in-memory rows follow the DB; applyFolderArt hands the folder's file
	// back to them a moment later.
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
				// The album's art IS its folder's art — every track already carries
				// the same string, read once from the one cover file.
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

	// Album art: ONE row per folder, pointing at the cover file the Rust scan
	// found or wrote there — not one base64 copy per song (KP ⚛ 2026-08-22).
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

	// The one door that still writes songs.cover_art: restoring a backup taken
	// before tonight, whose tracks carry base64 and no cover file. The sweep at
	// the next load lifts it into its folder like any other legacy row — nothing
	// imported is dropped for arriving in the old shape.
	for (const t of scannedTracks) {
		if (t.coverArt && !t.coverPath) {
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
		const withTimestamps = scanned.map((t) => ({ ...t, lastScanned: now, folder: dirOf(t.uri) }));
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

// Art the vessel chose (a Cover Art Archive fetch) lands as a FILE in the album's
// folder — the same place a scan would have put it — and album_art records it.
// An album spanning several folders (a multi-disc rip in per-disc subfolders)
// gets the cover saved into EVERY folder that holds its tracks: each folder is a
// complete album folder in its own right, and a later scan of only one of them
// must still find art there.
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
	// The folder → cover mapping goes too, and the in-memory cache with it: the
	// purge truly purges. The cover FILES stay where they are — they live in the
	// vessel's own music folders, which this app does not get to empty.
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

// ── The missing-track sweep (2026-08-12, at KP's ⚛ word) ────────────────────
// The gap the 2026-07-02 v1→v2 report named as the only data-correctness one:
// v2 scans are additive upserts, so a file deleted from disk keeps its row
// forever. This half REPORTS ONLY — it deletes nothing, because verification
// comes before deletion, always.
//
// A missing track that carries mood tags or fragments is reported as KEPT, not
// as sweepable. mood_events, favorites and fragments each hold a FOREIGN KEY to
// songs(id), so removing such a row would take the tags — and the fragment
// rows, whose WAVs are real files on disk — down with it. Lose-nothing decides
// that: the row stays, and the room says why.
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

// The removal half, and it only ever runs on ids the caller confirmed. Chunked
// under SQLite's 999-parameter ceiling (CLAUDE.md rule 3). `favorites` is swept
// alongside because it holds the same FK; it is reserved-and-unused today, so
// this is FK hygiene rather than data loss.
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
