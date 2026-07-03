import type { Track } from '$lib/types/types';
import { browser } from '$app/environment';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { moodStore } from '$lib/stores/mood.svelte';

const PERSIST_KEY = 'resonance-compass-player-state';

// ── Listening History ──────────────────────────────────────────────────────

const HISTORY_KEY = 'listening_history';
const HISTORY_MAX = 500;

export interface HistoryEntry {
	id: string;
	trackId: string;
	title: string;
	artist: string;
	album: string;
	coverArt?: string;
	duration: number;
	timestamp: number;
}

let history = $state<HistoryEntry[]>([]);
let histFlush: ReturnType<typeof setTimeout> | null = null;

function addToHistory(track: Track) {
	const ts = Date.now();
	const entry: HistoryEntry = {
		id: `${ts}-${track.id}`,
		trackId: track.id,
		title: track.title,
		artist: track.artist,
		album: track.album,
		coverArt: track.coverArt,
		duration: track.duration,
		timestamp: ts,
	};
	history = [entry, ...history].slice(0, HISTORY_MAX);
	if (histFlush) clearTimeout(histFlush);
	histFlush = setTimeout(() => {
		try { if (browser) localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
		histFlush = null;
	}, 1000);
}

function loadHistory() {
	if (!browser) return;
	try {
		const raw = localStorage.getItem(HISTORY_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) history = parsed;
		}
	} catch {}
}

function clearHistory() {
	history = [];
	try { if (browser) localStorage.removeItem(HISTORY_KEY); } catch {}
}

// ── Player State ───────────────────────────────────────────────────────────

let currentTrack = $state<Track | null>(null);
let queue = $state<Track[]>([]);
let queueIndex = $state(0);
let isPlaying = $state(false);
// Why play didn't produce sound (backend rejection) — shown in the MiniPlayer,
// since on Android there's no console to see the swallowed error in.
let playbackError = $state<string | null>(null);
let position = $state(0);
let duration = $state(0);
let volume = $state(1.0);
let shuffle = $state(false);
let repeatMode = $state<'off' | 'all' | 'one'>('off');

let listenersReady = false;
// True once `play_track` has actually been invoked for currentTrack in this
// session. False right after a localStorage restore — the Rust audio engine
// has no sink loaded yet, so resume()/pause() would silently no-op.
let trackLoadedInBackend = false;

function ensureListeners() {
	if (!browser || listenersReady) return;
	listenersReady = true;

	listen<number>('audio://position', (event) => {
		position = event.payload;
	});

	listen<number>('audio://duration', (event) => {
		duration = event.payload;
		if (currentTrack) currentTrack = { ...currentTrack, duration: event.payload };
	});

	listen('audio://track-end', () => {
		isPlaying = false;
		position = 0;
		next();
	});

	window.addEventListener('beforeunload', persistState);
}

interface PersistedPlayerState {
	currentTrack: Track | null;
	queue: Track[];
	queueIndex: number;
	position: number;
	volume: number;
	shuffle: boolean;
	repeatMode: 'off' | 'all' | 'one';
}

function persistState() {
	if (!browser) return;
	try {
		const data: PersistedPlayerState = { currentTrack, queue, queueIndex, position, volume, shuffle, repeatMode };
		localStorage.setItem(PERSIST_KEY, JSON.stringify(data));
	} catch (e) {
		console.error('[playerStore] persistState failed:', e);
	}
}

// Restores UI state only (track info, queue, saved position) without touching
// the audio backend — actually loading the file happens lazily on first play()
// so the app doesn't make sound on launch.
function restoreState() {
	if (!browser) return;
	try {
		const raw = localStorage.getItem(PERSIST_KEY);
		if (!raw) return;
		const data = JSON.parse(raw) as PersistedPlayerState;
		currentTrack = data.currentTrack ?? null;
		queue = data.queue ?? [];
		queueIndex = data.queueIndex ?? 0;
		position = data.position ?? 0;
		duration = currentTrack?.duration ?? 0;
		volume = data.volume ?? 1.0;
		shuffle = data.shuffle ?? false;
		repeatMode = data.repeatMode ?? 'off';
		trackLoadedInBackend = false;
		isPlaying = false;
	} catch (e) {
		console.error('[playerStore] restoreState failed:', e);
	}
	loadHistory();
}

// Loads a full Track (preserving real metadata) into the audio backend.
// resumeAt seeks once the engine starts — used to resume a restored session.
// record=false skips the history entry (repeat-one loops, session resume).
async function loadTrackObject(track: Track, resumeAt = 0, record = true) {
	ensureListeners();
	currentTrack = track;
	position = resumeAt;
	duration = track.duration || 0;
	playbackError = null;
	if (record && resumeAt === 0) addToHistory(track);
	try {
		await invoke('play_track', { path: track.uri });
		trackLoadedInBackend = true;
		isPlaying = true;
		if (resumeAt > 0) {
			await invoke('seek', { positionSecs: resumeAt });
		}
	} catch (e) {
		isPlaying = false;
		playbackError = e instanceof Error ? e.message : String(e);
		console.error('[playerStore] play_track failed:', e);
	}
}

async function play() {
	ensureListeners();
	if (!currentTrack) return;
	if (!trackLoadedInBackend) {
		await loadTrackObject(currentTrack, position);
		return;
	}
	try {
		await invoke('resume');
		isPlaying = true;
		playbackError = null;
	} catch (e) {
		playbackError = e instanceof Error ? e.message : String(e);
		console.error('[playerStore] resume failed:', e);
	}
}

async function pause() {
	try {
		await invoke('pause');
		isPlaying = false;
		persistState();
	} catch (e) {
		console.error('[playerStore] pause failed:', e);
	}
}

function togglePlay() {
	if (!currentTrack) return;
	if (isPlaying) {
		pause();
	} else {
		play();
	}
}

async function stopPlayback() {
	try {
		await invoke('stop');
	} catch (e) {
		console.error('[playerStore] stop failed:', e);
	}
	isPlaying = false;
	position = 0;
	trackLoadedInBackend = false;
}

// Logs a mood event for the track being skipped away from. Called before the
// track actually advances, using the position at the moment of the skip.
// When invoked from the natural audio://track-end handler, position has
// already been reset to 0 beforehand, so this correctly only fires for real
// manual skips (position > 0), not natural completion.
function logSkipIfMidTrack() {
	if (currentTrack && position > 0) {
		moodStore
			.addMoodEvent(currentTrack.id, '⏭️', 3, undefined, 'skip_prompt')
			.catch((e) => console.error('[playerStore] skip mood log failed:', e));
	}
}

async function next() {
	if (queue.length === 0 || !currentTrack) {
		await stopPlayback();
		return;
	}
	logSkipIfMidTrack();
	if (repeatMode === 'one') {
		await loadTrackObject(currentTrack, 0, false);
		persistState();
		return;
	}
	let nextIndex = queueIndex + 1;
	if (nextIndex >= queue.length) {
		if (repeatMode === 'all') {
			nextIndex = 0;
		} else {
			await stopPlayback();
			return;
		}
	}
	queueIndex = nextIndex;
	await loadTrackObject(queue[queueIndex]);
	persistState();
}

async function previous() {
	if (queue.length === 0 || !currentTrack) return;
	logSkipIfMidTrack();
	if (repeatMode === 'one') {
		await loadTrackObject(currentTrack, 0, false);
		persistState();
		return;
	}
	if (queueIndex <= 0) {
		if (repeatMode === 'all' && queue.length > 1) {
			queueIndex = queue.length - 1;
			await loadTrackObject(queue[queueIndex]);
			persistState();
		} else {
			await seek(0);
		}
		return;
	}
	queueIndex -= 1;
	await loadTrackObject(queue[queueIndex]);
	persistState();
}

// Reorders the queue once (Fisher-Yates), keeping the current track anchored
// first so playback doesn't jump. Turning shuffle back off leaves the order
// as-is — restoring the pre-shuffle order isn't tracked.
function toggleShuffle() {
	shuffle = !shuffle;
	if (shuffle && queue.length > 1) {
		const current = queue[queueIndex];
		const rest = queue.filter((_, i) => i !== queueIndex);
		for (let i = rest.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[rest[i], rest[j]] = [rest[j], rest[i]];
		}
		queue = current !== undefined ? [current, ...rest] : rest;
		queueIndex = 0;
	}
	persistState();
}

function cycleRepeat() {
	const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
	repeatMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
	persistState();
}

async function setVolume(v: number) {
	volume = Math.max(0, Math.min(1, v));
	try {
		await invoke('set_volume', { vol: volume });
	} catch (e) {
		console.error('[playerStore] set_volume failed:', e);
	}
}

async function seek(seconds: number) {
	position = seconds;
	try {
		await invoke('seek', { positionSecs: seconds });
	} catch (e) {
		console.error('[playerStore] seek failed:', e);
	}
}

function setQueue(tracks: Track[], startIndex = 0) {
	queue = tracks;
	queueIndex = startIndex;
	if (tracks[startIndex]) {
		loadTrackObject(tracks[startIndex]).then(persistState);
	}
}

function playFromQueue(index: number) {
	if (!queue[index]) return;
	queueIndex = index;
	loadTrackObject(queue[index]).then(persistState);
}

// Removing at/before the playing position shifts queueIndex down so next()
// still advances to the track that followed the removed one. The currently
// loaded audio keeps playing either way.
function removeFromQueue(index: number) {
	if (index < 0 || index >= queue.length) return;
	queue = queue.filter((_, i) => i !== index);
	if (index <= queueIndex) queueIndex = Math.max(0, queueIndex - 1);
	persistState();
}

function clearQueue() {
	queue = currentTrack ? [currentTrack] : [];
	queueIndex = 0;
	persistState();
}

export const playerStore = {
	get currentTrack() { return currentTrack; },
	get queue() { return queue; },
	get queueIndex() { return queueIndex; },
	get isPlaying() { return isPlaying; },
	get playbackError() { return playbackError; },
	get position() { return position; },
	get duration() { return duration; },
	get volume() { return volume; },
	get shuffle() { return shuffle; },
	get repeatMode() { return repeatMode; },
	get history() { return history; },
	clearHistory,
	play,
	pause,
	togglePlay,
	next,
	previous,
	setVolume,
	seek,
	setQueue,
	playFromQueue,
	removeFromQueue,
	clearQueue,
	toggleShuffle,
	cycleRepeat,
	restoreState,
};
