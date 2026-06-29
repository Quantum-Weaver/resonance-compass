import Database from '@tauri-apps/plugin-sql';
import { browser } from '$app/environment';
import type { Echo } from '$lib/types/types';

let db: Database | null = null;
let echoes = $state<Echo[]>([]);
let totalCount = $state(0);
let loading = $state(false);
let dbError = $state<string | null>(null);

function generateId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	// Fallback for Android WebViews that predate randomUUID
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

function rowToEcho(row: Record<string, unknown>): Echo {
	return {
		id: row.id as string,
		name: row.name as string,
		sense: row.sense as string,
		subcategory: row.subcategory as string,
		emoji: row.emoji as string,
		note: row.note != null ? (row.note as string) : undefined,
		intensity: row.intensity as number,
		timestamp: row.timestamp as number,
		createdAt: row.created_at as number,
	};
}

async function initDB() {
	if (!browser || db) return;
	console.log('[initDB] starting... browser=' + browser + ' db=' + (db !== null));
	try {
		db = await Database.load('sqlite:echoes.db');
		console.log('[initDB] db loaded:', db !== null);
		await loadEchoes();
		console.log('[initDB] echoes loaded, count:', echoes.length);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		dbError = msg;
		console.error('[initDB] FAILED:', msg, e);
	}
}

async function loadEchoes(limit = 200, offset = 0) {
	if (!db) {
		console.log('[loadEchoes] skipped — db is null');
		return;
	}
	loading = true;
	try {
		const rows = await db.select<Record<string, unknown>[]>(
			'SELECT * FROM echoes ORDER BY timestamp DESC LIMIT $1 OFFSET $2',
			[limit, offset]
		);
		echoes = rows.map(rowToEcho);
		const countRows = await db.select<Record<string, unknown>[]>(
			'SELECT COUNT(*) as count FROM echoes'
		);
		totalCount = (countRows[0]?.count as number) || 0;
	} catch (e) {
		console.error('[loadEchoes] FAILED:', e);
	} finally {
		loading = false;
	}
}

async function addEcho(echo: Omit<Echo, 'id' | 'createdAt'>) {
	console.log('[addEcho] called with:', JSON.stringify(echo));
	console.log('[addEcho] db is null?', db === null);
	if (!db) {
		console.error('[addEcho] FAILED — db is null. initDB may not have completed or failed.');
		throw new Error('Database not ready — close and reopen the app.');
	}
	const id = generateId();
	const createdAt = Date.now();
	console.log('[addEcho] generated id:', id, 'createdAt:', createdAt);
	console.log('[addEcho] attempting INSERT...');
	try {
		await db.execute(
			'INSERT INTO echoes (id, name, sense, subcategory, emoji, note, intensity, timestamp, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
			[id, echo.name, echo.sense, echo.subcategory, echo.emoji, echo.note ?? null, echo.intensity, echo.timestamp, createdAt]
		);
		console.log('[addEcho] INSERT complete');
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		console.error('[addEcho] INSERT FAILED:', msg, e);
		throw e;
	}
	console.log('[addEcho] calling loadEchoes...');
	await loadEchoes();
	console.log('[addEcho] done. total echoes now:', echoes.length);
}

async function getEchoesBySense(senseId: string): Promise<Echo[]> {
	if (!db) return [];
	const rows = await db.select<Record<string, unknown>[]>(
		'SELECT * FROM echoes WHERE sense = $1 ORDER BY timestamp DESC',
		[senseId]
	);
	return rows.map(rowToEcho);
}

async function getEchoesByEmoji(emoji: string): Promise<Echo[]> {
	if (!db) return [];
	const rows = await db.select<Record<string, unknown>[]>(
		'SELECT * FROM echoes WHERE emoji = $1 ORDER BY timestamp DESC',
		[emoji]
	);
	return rows.map(rowToEcho);
}

async function searchEchoes(query: string, limit = 50): Promise<Echo[]> {
	if (!db) return [];
	const pattern = `%${query}%`;
	const rows = await db.select<Record<string, unknown>[]>(
		'SELECT * FROM echoes WHERE name LIKE $1 OR note LIKE $1 ORDER BY timestamp DESC LIMIT $2',
		[pattern, limit]
	);
	return rows.map(rowToEcho);
}

async function updateEcho(id: string, updates: Partial<Omit<Echo, 'id' | 'createdAt'>>) {
	if (!db) return;
	const echo = echoes.find(e => e.id === id);
	if (!echo) return;
	const updated = { ...echo, ...updates };
	await db.execute(
		'UPDATE echoes SET name=$1, sense=$2, subcategory=$3, emoji=$4, note=$5, intensity=$6, timestamp=$7 WHERE id=$8',
		[updated.name, updated.sense, updated.subcategory, updated.emoji, updated.note ?? null, updated.intensity, updated.timestamp, id]
	);
	await loadEchoes();
}

async function purgeAll() {
	if (!db) return;
	await db.execute('DELETE FROM echoes');
	echoes = [];
	totalCount = 0;
}

export const echoStore = {
	get echoes() { return echoes; },
	get totalCount() { return totalCount; },
	get loading() { return loading; },
	get dbError() { return dbError; },
	initDB,
	addEcho,
	updateEcho,
	loadEchoes,
	getEchoesBySense,
	getEchoesByEmoji,
	searchEchoes,
	purgeAll,
};
