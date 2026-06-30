import type { Track } from '$lib/types/types';
import { browser } from '$app/environment';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

const PERSIST_KEY = 'resonance-compass-player-state';

let currentTrack = $state<Track | null>(null);
let queue = $state<Track[]>([]);
let queueIndex = $state(0);
let isPlaying = $state(false);
let position = $state(0);
let duration = $state(0);
let volume = $state(1.0);

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
}

function persistState() {
	if (!browser) return;
	try {
		const data: PersistedPlayerState = { currentTrack, queue, queueIndex, position, volume };
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
		trackLoadedInBackend = false;
		isPlaying = false;
	} catch (e) {
		console.error('[playerStore] restoreState failed:', e);
	}
}

// Loads a full Track (preserving real metadata) into the audio backend.
// resumeAt seeks once the engine starts — used to resume a restored session.
async function loadTrackObject(track: Track, resumeAt = 0) {
	ensureListeners();
	currentTrack = track;
	position = resumeAt;
	duration = track.duration || 0;
	try {
		await invoke('play_track', { path: track.uri });
		trackLoadedInBackend = true;
		isPlaying = true;
		if (resumeAt > 0) {
			await invoke('seek', { positionSecs: resumeAt });
		}
	} catch (e) {
		isPlaying = false;
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
	} catch (e) {
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

async function next() {
	const nextIndex = queueIndex + 1;
	if (queue.length === 0 || nextIndex >= queue.length) {
		await stopPlayback();
		return;
	}
	queueIndex = nextIndex;
	await loadTrackObject(queue[queueIndex]);
	persistState();
}

async function previous() {
	if (queue.length === 0 || queueIndex <= 0) {
		await seek(0);
		return;
	}
	queueIndex -= 1;
	await loadTrackObject(queue[queueIndex]);
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

export const playerStore = {
	get currentTrack() { return currentTrack; },
	get queue() { return queue; },
	get isPlaying() { return isPlaying; },
	get position() { return position; },
	get duration() { return duration; },
	get volume() { return volume; },
	play,
	pause,
	togglePlay,
	next,
	previous,
	setVolume,
	seek,
	setQueue,
	restoreState,
};
