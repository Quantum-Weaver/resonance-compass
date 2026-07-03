import { browser } from '$app/environment';

const FOCUS_HISTORY_KEY = 'focus_sessions';
const FOCUS_SETTINGS_KEY = 'focus_settings';

export interface FocusSession {
	id: string;
	startedAt: number;
	durationMs: number;
	playlistId: string | null;
	playlistName: string;
	lockUI: boolean;
	breakReminders: boolean;
}

export interface FocusRecord {
	id: string;
	date: number;
	durationMs: number;
	plannedMs: number;
	playlistName: string;
	tracksPlayed: number;
	completed: boolean;
}

export interface FocusSettings {
	defaultDuration: number;
	defaultPlaylistId: string | null;
	lockUI: boolean;
	breakReminders: boolean;
}

const FOCUS_DEFAULTS: FocusSettings = {
	defaultDuration: 25,
	defaultPlaylistId: null,
	lockUI: true,
	breakReminders: true,
};

let activeSession = $state<FocusSession | null>(null);
let sessionHistory = $state<FocusRecord[]>([]);

export const focusStore = {
	get activeSession() { return activeSession; },
	get sessionHistory() { return sessionHistory; },
	get isLocked() { return !!activeSession?.lockUI; },

	loadSettings(): FocusSettings {
		if (!browser) return { ...FOCUS_DEFAULTS };
		try {
			const raw = localStorage.getItem(FOCUS_SETTINGS_KEY);
			if (raw) return { ...FOCUS_DEFAULTS, ...(JSON.parse(raw) as Partial<FocusSettings>) };
		} catch {}
		return { ...FOCUS_DEFAULTS };
	},

	saveSettings(s: FocusSettings) {
		if (!browser) return;
		try { localStorage.setItem(FOCUS_SETTINGS_KEY, JSON.stringify(s)); } catch {}
	},

	loadHistory() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(FOCUS_HISTORY_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as unknown;
				if (Array.isArray(parsed)) sessionHistory = parsed as FocusRecord[];
			}
		} catch {}
	},

	startSession(session: FocusSession) {
		activeSession = session;
	},

	endSession(tracksPlayed: number, completed: boolean) {
		if (!activeSession) return;
		const record: FocusRecord = {
			id: activeSession.id,
			date: activeSession.startedAt,
			durationMs: Date.now() - activeSession.startedAt,
			plannedMs: activeSession.durationMs,
			playlistName: activeSession.playlistName,
			tracksPlayed,
			completed,
		};
		sessionHistory = [record, ...sessionHistory].slice(0, 50);
		try {
			if (browser) localStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(sessionHistory));
		} catch {}
		activeSession = null;
	},

	clearHistory() {
		sessionHistory = [];
		try { if (browser) localStorage.removeItem(FOCUS_HISTORY_KEY); } catch {}
	},
};
