import Database from '@tauri-apps/plugin-sql';
import { browser } from '$app/environment';
import type { Track } from '$lib/types/types';

let db: Database | null = null;
let tracks = $state<Track[]>([]);
let loading = $state(false);
let dbError = $state<string | null>(null);
let scanProgress = $state(0);

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
		tracks = rows.map(rowToTrack);
	} catch (e) {
		console.error('[libraryStore] loadTracks failed:', e);
	} finally {
		loading = false;
	}
}

async function scanLibrary() {
	// Phase 2: wire to Tauri FS + audio metadata reader
	console.log('[libraryStore] scanLibrary — not yet implemented (Phase 2)');
}

async function clearLibrary() {
	if (!db) return;
	await db.execute('DELETE FROM songs');
	tracks = [];
}

export const libraryStore = {
	get tracks() { return tracks; },
	get loading() { return loading; },
	get dbError() { return dbError; },
	get scanProgress() { return scanProgress; },
	initDB,
	loadTracks,
	scanLibrary,
	clearLibrary,
};
