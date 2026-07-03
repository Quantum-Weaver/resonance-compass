import Database from '@tauri-apps/plugin-sql';
import { browser } from '$app/environment';
import type { MoodEvent } from '$lib/types/types';

const PERSONAL_DEF_PREFIX = 'emoji_def_';

let db: Database | null = null;
let recentMoods = $state<MoodEvent[]>([]);
let topEmojis = $state<Array<{ emoji: string; count: number }>>([]);
let totalEvents = $state(0);
let loading = $state(false);
let dbError = $state<string | null>(null);
let personalDefinitions = $state<Record<string, string>>({});

function rowToMoodEvent(row: Record<string, unknown>): MoodEvent {
	return {
		id: row.id as number,
		trackId: row.track_id as string,
		emoji: row.emoji as string,
		timestamp: row.timestamp as number,
		intensity: (row.intensity as number) ?? 3,
		comment: row.comment != null ? (row.comment as string) : undefined,
		context: (row.context as string) ?? 'manual',
	};
}

function loadPersonalDefinitions() {
	if (!browser) return;
	const loaded: Record<string, string> = {};
	try {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(PERSONAL_DEF_PREFIX)) {
				const emoji = key.slice(PERSONAL_DEF_PREFIX.length);
				const val = localStorage.getItem(key);
				if (val) loaded[emoji] = val;
			}
		}
	} catch {}
	personalDefinitions = loaded;
}

function setPersonalDefinition(emoji: string, definition: string) {
	try {
		localStorage.setItem(`${PERSONAL_DEF_PREFIX}${emoji}`, definition);
		personalDefinitions = { ...personalDefinitions, [emoji]: definition };
	} catch {}
}

function getPersonalDefinition(emoji: string): string {
	return personalDefinitions[emoji] ?? '';
}

async function initDB() {
	if (!browser || db) return;
	try {
		db = await Database.load('sqlite:compass.db');
		await refreshStats();
		loadPersonalDefinitions();
	} catch (e) {
		dbError = e instanceof Error ? e.message : String(e);
		console.error('[moodStore] initDB failed:', e);
	}
}

async function loadRecentMoods(limit = 50) {
	if (!db) return;
	loading = true;
	try {
		const rows = await db.select<Record<string, unknown>[]>(
			'SELECT * FROM mood_events ORDER BY timestamp DESC LIMIT $1',
			[limit]
		);
		recentMoods = rows.map(rowToMoodEvent);
	} catch (e) {
		console.error('[moodStore] loadRecentMoods failed:', e);
	} finally {
		loading = false;
	}
}

async function addMoodEvent(
	trackId: string,
	emoji: string,
	intensity = 3,
	comment?: string,
	context = 'manual'
) {
	if (!db) throw new Error('Database not ready — call initDB first.');
	const timestamp = Date.now();
	await db.execute(
		'INSERT INTO mood_events (track_id, emoji, timestamp, intensity, comment, context) VALUES ($1, $2, $3, $4, $5, $6)',
		[trackId, emoji, timestamp, intensity, comment ?? null, context]
	);
	await refreshStats();
}

async function getMoodEventsByTrack(trackId: string): Promise<MoodEvent[]> {
	if (!db) return [];
	const rows = await db.select<Record<string, unknown>[]>(
		'SELECT * FROM mood_events WHERE track_id = $1 ORDER BY timestamp DESC',
		[trackId]
	);
	return rows.map(rowToMoodEvent);
}

async function getRecentMoods(limit = 50): Promise<MoodEvent[]> {
	if (!db) return [];
	const rows = await db.select<Record<string, unknown>[]>(
		'SELECT * FROM mood_events ORDER BY timestamp DESC LIMIT $1',
		[limit]
	);
	return rows.map(rowToMoodEvent);
}

async function getTopEmojis(limit = 8): Promise<Array<{ emoji: string; count: number }>> {
	if (!db) return [];
	return await db.select<Array<{ emoji: string; count: number }>>(
		'SELECT emoji, COUNT(*) as count FROM mood_events GROUP BY emoji ORDER BY count DESC LIMIT $1',
		[limit]
	);
}

async function getTotalEvents(): Promise<number> {
	if (!db) return 0;
	const rows = await db.select<Array<{ count: number }>>('SELECT COUNT(*) as count FROM mood_events');
	return rows[0]?.count ?? 0;
}

// Composite refresh — keeps recentMoods/topEmojis/totalEvents in sync after any write.
async function refreshStats() {
	recentMoods = await getRecentMoods(50);
	topEmojis = await getTopEmojis(8);
	totalEvents = await getTotalEvents();
}

async function getAllMoodEvents(): Promise<MoodEvent[]> {
	if (!db) return [];
	const rows = await db.select<Record<string, unknown>[]>(
		'SELECT * FROM mood_events ORDER BY timestamp ASC'
	);
	return rows.map(rowToMoodEvent);
}

async function importMoodEvents(events: MoodEvent[]) {
	if (!db) throw new Error('Database not ready — call initDB first.');
	for (const ev of events) {
		await db.execute(
			'INSERT INTO mood_events (track_id, emoji, timestamp, intensity, comment, context) VALUES ($1, $2, $3, $4, $5, $6)',
			[ev.trackId, ev.emoji, ev.timestamp, ev.intensity ?? 3, ev.comment ?? null, ev.context ?? 'manual']
		);
	}
	await refreshStats();
}

async function purgeAll() {
	if (!db) return;
	await db.execute('DELETE FROM mood_events');
	await refreshStats();
}

// Convenience bundle for dashboard consumers that want everything at once.
async function getMoodStats() {
	return {
		totalEvents: await getTotalEvents(),
		topEmojis: await getTopEmojis(8),
		recentActivity: await getRecentMoods(20),
	};
}

export const moodStore = {
	get recentMoods() { return recentMoods; },
	get topEmojis() { return topEmojis; },
	get totalEvents() { return totalEvents; },
	get loading() { return loading; },
	get dbError() { return dbError; },
	get personalDefinitions() { return personalDefinitions; },
	initDB,
	loadRecentMoods,
	addMoodEvent,
	getMoodEventsByTrack,
	getRecentMoods,
	getTopEmojis,
	getMoodStats,
	getAllMoodEvents,
	importMoodEvents,
	purgeAll,
	loadPersonalDefinitions,
	setPersonalDefinition,
	getPersonalDefinition,
};
