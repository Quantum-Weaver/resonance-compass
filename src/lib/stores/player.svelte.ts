import type { Track } from '$lib/types/types';
import { browser } from '$app/environment';
import { invoke, addPluginListener } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { moodStore } from '$lib/stores/mood.svelte';

const PERSIST_KEY = 'resonance-compass-player-state';

// Listening History

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

// Player State

let currentTrack = $state<Track | null>(null);
let queue = $state<Track[]>([]);
let queueIndex = $state(0);
let isPlaying = $state(false);
// Backend rejection message shown in the MiniPlayer — Android has no console to see it in.
let playbackError = $state<string | null>(null);
let position = $state(0);
let duration = $state(0);
let volume = $state(1.0);
let shuffle = $state(false);
let repeatMode = $state<'off' | 'all' | 'one'>('off');

let listenersReady = false;
// True once `play_track` has actually been invoked for currentTrack. False
// right after a localStorage restore — the Rust engine has no sink loaded
// yet, so resume()/pause() would silently no-op.
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
		mediaMetadataSync(); // the lockscreen seekbar learns the true length
	});

	listen('audio://track-end', () => {
		isPlaying = false;
		position = 0;
		next();
	});

	// Android: pause when audio output disconnects (Bluetooth dropped, headphones
	// unplugged) so playback never jumps to the phone speaker. Nothing auto-plays
	// on reconnect. Android-only — rejected on desktop, and that's expected.
	addPluginListener('media-permission', 'audioBecomingNoisy', () => {
		if (isPlaying) pause();
	}).catch((e) => console.error('[media-permission] audioBecomingNoisy listener failed:', e));

	// Android: transport commands from the system (Bluetooth/AVRCP buttons,
	// headset clicks, lockscreen controls) relayed by MediaSessionPlugin. This
	// store stays the only authority — the plugin never touches the audio engine.
	addPluginListener('media-session', 'mediaCommand', (e: { action: string; positionMs?: number }) => {
		switch (e.action) {
			case 'play': play(); break;
			case 'pause': pause(); break;
			case 'next': next(); break;
			case 'previous': previous(); break;
			case 'seek': if (typeof e.positionMs === 'number') seek(e.positionMs / 1000); break;
			case 'stop': stopPlayback(); break;
		}
	}).catch((e) => console.error('[media-session] mediaCommand listener failed:', e));

	window.addEventListener('beforeunload', persistState);
}

// Android MediaSession bridge — Rust commands no-op Ok on desktop, so every
// call here is unconditional and every failure swallowed.

let notifPermissionAsked = false;

function mediaMetadataSync() {
	if (!currentTrack) return;
	invoke('media_update_metadata', {
		title: currentTrack.title,
		artist: currentTrack.artist,
		album: currentTrack.album,
		durationMs: Math.round((currentTrack.duration || 0) * 1000),
		artBase64: currentTrack.coverArt ?? null,
	}).catch(() => {});
}

// Sent on transitions only (load/play/pause/seek) — the system extrapolates
// position from state + speed, so no per-tick chatter crosses the bridge.
function mediaPlaybackSync() {
	invoke('media_update_playback', {
		isPlaying,
		positionMs: Math.round(position * 1000),
	}).catch(() => {});
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
		if (!notifPermissionAsked) {
			notifPermissionAsked = true;
			// First playback is the natural moment to ask — it's what this permission unlocks.
			invoke('request_notification_permission').catch(() => {});
		}
		mediaMetadataSync();
		mediaPlaybackSync();
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
		mediaPlaybackSync();
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
		mediaPlaybackSync();
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
	invoke('media_release').catch(() => {});
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

// Volume before the last mute, so unmuting restores it (fresh sessions
// default to full volume rather than staying inaudible).
let preMuteVolume = 1;

async function toggleMute() {
	if (volume > 0) {
		preMuteVolume = volume;
		await setVolume(0);
	} else {
		await setVolume(preMuteVolume > 0 ? preMuteVolume : 1);
	}
}

async function seek(seconds: number) {
	position = seconds;
	try {
		await invoke('seek', { positionSecs: seconds });
	} catch (e) {
		console.error('[playerStore] seek failed:', e);
	}
	mediaPlaybackSync();
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

// Appending never interrupts what is playing; with nothing loaded the first
// added track is loaded (not started) so the bar shows what the queue now
// holds. A track already in the queue is appended again on purpose — a queue
// is an order, not a set.
function addToQueue(tracks: Track | Track[]) {
	const list = Array.isArray(tracks) ? tracks : [tracks];
	if (list.length === 0) return;
	const wasEmpty = queue.length === 0;
	queue = [...queue, ...list];
	if (wasEmpty) {
		queueIndex = 0;
		if (!currentTrack) loadTrackObject(queue[0]).then(persistState);
		else persistState();
	} else {
		persistState();
	}
}

// Slots the track(s) right after the one playing, so they come up next.
function playNext(tracks: Track | Track[]) {
	const list = Array.isArray(tracks) ? tracks : [tracks];
	if (list.length === 0) return;
	if (queue.length === 0) return addToQueue(list);
	const at = queueIndex + 1;
	queue = [...queue.slice(0, at), ...list, ...queue.slice(at)];
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
	toggleMute,
	seek,
	setQueue,
	playFromQueue,
	removeFromQueue,
	clearQueue,
	addToQueue,
	playNext,
	toggleShuffle,
	cycleRepeat,
	restoreState,
};
