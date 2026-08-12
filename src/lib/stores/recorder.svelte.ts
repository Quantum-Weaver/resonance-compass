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
	paused: boolean;
	capped: boolean;
	device: string | null;
	sample_rate: number | null;
	channels: number | null;
	elapsed_secs: number;
	peak: number;
	clipped: number;
}

let recording = $state(false);
// Held, not ended. A paused take is still open and still ours; resume appends
// to it. (KP's ⚛ shape, 2026-08-12: "like a voice recorder works" — record,
// pause, resume, save, and deleting is a separate later act on the take row.)
let paused = $state(false);
// The take reached its maximum length: Rust already released the device on the
// capture thread. The samples wait here to be saved. Only ever true in the
// no-holding mode, which is the only mode that starts a take with a cap.
let capped = $state(false);
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

// Every run of the meter carries a generation. Clearing the timer stops new
// polls but CANNOT unsend one already in flight — and a status reply that
// lands after its take has ended belongs to a take that no longer exists.
// Desktop never felt this: the seal is sub-millisecond there and no reply
// ever outlived its take. On Android `recording_status` is a sync command
// sharing the main thread with a WebView drawing every 8ms, so the reply
// arrives AFTER stop() has reset the room and writes `recording = true` back
// over it — the room keeps saying ● Listening and the Record button never
// returns. (Found on the S25 by KP's hands, 2026-08-12; the phone's own log
// showed AAudioStream_close returning 0, which is what cleared Rust.)
let pollGen = 0;

function stopPolling() {
	if (pollTimer) clearInterval(pollTimer);
	pollTimer = null;
	pollGen++; // whatever is still in flight is now stale and must not land
}

function startPolling() {
	stopPolling();
	const gen = pollGen;
	pollTimer = setInterval(async () => {
		try {
			const s = await invoke<RecordingStatus>('recording_status');
			if (gen !== pollGen) return; // this reply outlived its take
			recording = s.recording;
			paused = s.paused;
			capped = s.capped;
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

// `maxSecs` caps the take. null = no cap, the take runs until stop is said.
// The cap is honored in Rust on the capture thread, never by a timer here.
async function start(deviceHint: string | null, maxSecs: number | null = null) {
	error = null;
	try {
		const granted = await invoke<boolean>('request_mic_permission');
		if (!granted) {
			error = 'Microphone permission not granted.';
			return false;
		}
		const s = await invoke<RecordingStatus>('start_recording', {
			device: deviceHint,
			maxSecs,
		});
		recording = true;
		paused = false;
		capped = false;
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
		paused = false;
		capped = false;
		device = null;
		elapsedSecs = 0;
		peak = 0;
		if (keep) await refreshTakes();
		return take;
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		recording = false;
		paused = false;
		capped = false;
		return null;
	}
}

// Hold the take without ending it — the device stays ours and resume appends
// to the same file. The room never asks keep-or-discard: a saved take lands on
// the shelf, and the shelf's own Delete is where a take goes away.
async function pause() {
	try {
		await invoke('pause_recording');
		paused = true;
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	}
}

async function resume() {
	try {
		await invoke('resume_recording');
		paused = false;
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
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
	get paused() { return paused; },
	get capped() { return capped; },
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
	pause,
	resume,
	stop,
	deleteTake,
	exportTake,
};
