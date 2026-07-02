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

// Builds the album/artist groupings from a flat track list.
// Artist dedup is case-insensitive (.trim().toLowerCase()); album id follows
// the "albumName|||artistName" format (CLAUDE.md).
function setTracks(newTracks: Track[]) {
	tracks = newTracks;

	const albumMap = new Map<string, Album>();
	const artistMap = new Map<string, Artist>();

	for (const track of newTracks) {
		const artistName = track.artist.trim();
		const albumName = track.album.trim();
		const artistKey = artistName.toLowerCase();
		const albumKey = `${albumName.toLowerCase()}|||${artistKey}`;

		if (!albumMap.has(albumKey)) {
			albumMap.set(albumKey, {
				id: `${albumName}|||${artistName}`,
				name: albumName,
				artist: artistName,
				tracks: [],
				coverArt: track.coverArt,
				year: track.year,
				genre: track.genre,
			});
		}
		const album = albumMap.get(albumKey)!;
		album.tracks.push(track);
		if (!album.coverArt && track.coverArt) album.coverArt = track.coverArt;

		if (!artistMap.has(artistKey)) {
			artistMap.set(artistKey, { id: artistName, name: artistName, albums: [], trackCount: 0 });
		}
		artistMap.get(artistKey)!.trackCount++;
	}

	for (const album of albumMap.values()) {
		const artist = artistMap.get(album.artist.toLowerCase());
		if (artist) artist.albums.push(album);
	}

	albums = Array.from(albumMap.values());
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

// Selects individual audio files rather than a folder: Android's SAF file
// picker (@tauri-apps/plugin-dialog) returns content:// URIs for a directory
// pick, but there's no way to enumerate a content:// tree's children — only
// to open a URI that's already known. Multi-selecting files sidesteps that
// entirely, and the Rust side (scan_files) opens each URI directly.
const AUDIO_EXTENSIONS = ['mp3', 'flac', 'wav', 'aac', 'ogg', 'm4a'];

async function scanLibrary() {
	const { open } = await import('@tauri-apps/plugin-dialog');
	const { invoke } = await import('@tauri-apps/api/core');
	const { listen } = await import('@tauri-apps/api/event');

	const selected = await open({
		multiple: true,
		filters: [{ name: 'Audio', extensions: AUDIO_EXTENSIONS }],
	});
	if (!selected || selected.length === 0) return;

	scanError = null;
	isScanning = true;
	scanProgress = 0;

	const unlisten = await listen<{ current: number; total: number }>('scan-progress', (event) => {
		const { current, total } = event.payload;
		if (total > 0) scanProgress = current / total;
	});

	try {
		const scanned = await invoke<Track[]>('scan_files', { paths: selected as string[] });
		const now = Math.floor(Date.now() / 1000);
		const withTimestamps = scanned.map((t) => ({ ...t, lastScanned: now }));
		setTracks(withTimestamps);
		await saveScannedTracks(withTimestamps);
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
	await db.execute(
		'UPDATE songs SET cover_art = $1 WHERE artist = $2 AND album = $3',
		[coverArt, album.artist, album.name]
	);
	// Update in-memory tracks + album so UI reacts without a full reload.
	for (const track of tracks) {
		if (track.artist.trim() === album.artist.trim() && track.album.trim() === album.name.trim()) {
			track.coverArt = coverArt;
		}
	}
	const albumObj = albums.find((a) => a.id === albumId);
	if (albumObj) albumObj.coverArt = coverArt;
}

async function updateTrackLyrics(trackId: string, lyrics: string) {
	if (!db) return;
	await db.execute('UPDATE songs SET lyrics = $1 WHERE id = $2', [lyrics, trackId]);
	const track = tracks.find((t) => t.id === trackId);
	if (track) track.lyrics = lyrics;
}

async function clearLibrary() {
	if (!db) return;
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
	initDB,
	loadTracks,
	setTracks,
	saveScannedTracks,
	scanLibrary,
	updateAlbumCoverArt,
	updateTrackLyrics,
	clearLibrary,
	importTracks,
	getTrackById,
	getTracksByAlbum,
	getTracksByArtist,
	getAlbumsByArtist,
	search,
};
