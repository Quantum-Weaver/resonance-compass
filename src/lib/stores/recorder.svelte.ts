import { invoke } from '@tauri-apps/api/core';

// The recording room's store (v3 Phase 2, 2026-08-09). The record verb is
// the spring's (the-recorder, via recorder.rs); this store is the room's
// window: reactive status, the takes shelf, and the sovereign-export door
// (KP's ⚛ storage ruling: storage in app, exports by the user's own hand).
// Opt-in by nature — nothing here fires except from the user's own tap.

export interface InputDevice {
	name: string;
	config: string;
	is_default: boolean;
}

export interface Take {
	file_name: string;
	path: string;
	seconds: number;
	sample_rate: number;
	channels: number;
	created_at: number;
}

interface RecordingStatus {
	recording: boolean;
	device: string | null;
	sample_rate: number | null;
	channels: number | null;
	elapsed_secs: number;
	peak: number;
	clipped: number;
}

let recording = $state(false);
let device = $state<string | null>(null);
let sampleRate = $state<number | null>(null);
let channels = $state<number | null>(null);
let elapsedSecs = $state(0);
let peak = $state(0);
let clipped = $state(0);
let devices = $state<InputDevice[]>([]);
let takes = $state<Take[]>([]);
let error = $state<string | null>(null);

let pollTimer: ReturnType<typeof setInterval> | null = null;

function stopPolling() {
	if (pollTimer) clearInterval(pollTimer);
	pollTimer = null;
}

function startPolling() {
	stopPolling();
	pollTimer = setInterval(async () => {
		try {
			const s = await invoke<RecordingStatus>('recording_status');
			recording = s.recording;
			elapsedSecs = s.elapsed_secs;
			clipped = s.clipped;
			// The meter reads the recent peak and lets it fall gently — a
			// level you can watch, never a value that jumps at you.
			peak = Math.max(s.peak, peak * 0.75);
			if (!s.recording) stopPolling();
		} catch {
			// A missed poll is silence, not an error state.
		}
	}, 120);
}

async function loadDevices() {
	try {
		devices = await invoke<InputDevice[]>('list_input_devices');
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	}
}

async function refreshTakes() {
	try {
		takes = await invoke<Take[]>('list_takes');
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	}
}

async function start(deviceHint: string | null) {
	error = null;
	try {
		const granted = await invoke<boolean>('request_mic_permission');
		if (!granted) {
			error = 'Microphone permission not granted.';
			return false;
		}
		const s = await invoke<RecordingStatus>('start_recording', { device: deviceHint });
		recording = true;
		device = s.device;
		sampleRate = s.sample_rate;
		channels = s.channels;
		elapsedSecs = 0;
		peak = 0;
		clipped = 0;
		startPolling();
		return true;
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		return false;
	}
}

async function stop(keep: boolean, name: string | null): Promise<Take | null> {
	stopPolling();
	try {
		const take = await invoke<Take | null>('stop_recording', { keep, name });
		recording = false;
		device = null;
		elapsedSecs = 0;
		peak = 0;
		if (keep) await refreshTakes();
		return take;
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		recording = false;
		return null;
	}
}

async function deleteTake(fileName: string) {
	try {
		await invoke('delete_take', { fileName });
		await refreshTakes();
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	}
}

// The sovereign export: the user's own dialog chooses where the copy lands;
// the shelf keeps its original.
async function exportTake(fileName: string): Promise<string | null> {
	try {
		const { save } = await import('@tauri-apps/plugin-dialog');
		const dest = await save({
			defaultPath: fileName,
			filters: [{ name: 'WAV audio', extensions: ['wav'] }],
		});
		if (!dest) return null;
		await invoke('export_take', { fileName, dest });
		return dest;
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		return null;
	}
}

export const recorderStore = {
	get recording() { return recording; },
	get device() { return device; },
	get sampleRate() { return sampleRate; },
	get channels() { return channels; },
	get elapsedSecs() { return elapsedSecs; },
	get peak() { return peak; },
	get clipped() { return clipped; },
	get devices() { return devices; },
	get takes() { return takes; },
	get error() { return error; },
	loadDevices,
	refreshTakes,
	start,
	stop,
	deleteTake,
	exportTake,
};
