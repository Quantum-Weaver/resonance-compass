import type { Track } from '$lib/types/types';
import { browser } from '$app/environment';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

let currentTrack = $state<Track | null>(null);
let queue = $state<Track[]>([]);
let queueIndex = $state(0);
let isPlaying = $state(false);
let position = $state(0);
let duration = $state(0);
let volume = $state(1.0);

let listenersReady = false;

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
}

function trackFromPath(path: string): Track {
	const filename = path.split(/[/\\]/).pop() ?? path;
	const title = filename.replace(/\.[^.]+$/, '');
	return {
		id: path,
		uri: path,
		filename,
		title,
		artist: 'Unknown Artist',
		album: 'Unknown Album',
		duration: 0,
		dateAdded: Date.now(),
		lastScanned: Date.now(),
	};
}

async function loadTrack(path: string) {
	ensureListeners();
	currentTrack = trackFromPath(path);
	position = 0;
	duration = 0;
	try {
		await invoke('play_track', { path });
		isPlaying = true;
	} catch (e) {
		isPlaying = false;
		console.error('[playerStore] play_track failed:', e);
	}
}

async function play() {
	ensureListeners();
	if (!currentTrack) return;
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
}

async function next() {
	const nextIndex = queueIndex + 1;
	if (queue.length === 0 || nextIndex >= queue.length) {
		await stopPlayback();
		return;
	}
	queueIndex = nextIndex;
	await loadTrack(queue[queueIndex].uri);
}

async function previous() {
	if (queue.length === 0 || queueIndex <= 0) {
		await seek(0);
		return;
	}
	queueIndex -= 1;
	await loadTrack(queue[queueIndex].uri);
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
	if (tracks[startIndex]) loadTrack(tracks[startIndex].uri);
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
	loadTrack,
};
