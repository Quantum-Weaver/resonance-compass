import type { Track } from '$lib/types/types';

let currentTrack = $state<Track | null>(null);
let queue = $state<Track[]>([]);
let isPlaying = $state(false);
let position = $state(0);
let duration = $state(0);
let volume = $state(1.0);

function play(track?: Track) {
	if (track) currentTrack = track;
	isPlaying = true;
	// Phase 1: wire to Tauri audio backend
	console.log('[playerStore] play — not yet implemented (Phase 1)');
}

function pause() {
	isPlaying = false;
	// Phase 1: wire to Tauri audio backend
}

function next() {
	if (queue.length === 0) return;
	// Phase 1: implement queue progression
	console.log('[playerStore] next — not yet implemented (Phase 1)');
}

function previous() {
	// Phase 1: implement back navigation
	console.log('[playerStore] previous — not yet implemented (Phase 1)');
}

function setVolume(v: number) {
	volume = Math.max(0, Math.min(1, v));
	// Phase 1: wire to audio backend
}

function seek(seconds: number) {
	position = seconds;
	// Phase 1: wire to audio backend
}

function setQueue(tracks: Track[], startIndex = 0) {
	queue = tracks;
	if (tracks[startIndex]) currentTrack = tracks[startIndex];
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
	next,
	previous,
	setVolume,
	seek,
	setQueue,
};
