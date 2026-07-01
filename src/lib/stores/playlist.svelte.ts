import type { Playlist } from '$lib/types/types';
import { browser } from '$app/environment';
import { moodStore } from '$lib/stores/mood.svelte';

const STORAGE_KEY = 'resonance-compass-playlists';
const FAVORITES_ID = 'favorites';

let playlists = $state<Playlist[]>([]);

function persist() {
	if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
}

function loadPlaylists() {
	if (!browser) return;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) playlists = JSON.parse(stored) as Playlist[];
	} catch (e) {
		console.error('[playlistStore] loadPlaylists failed:', e);
	}
	if (!playlists.find((p) => p.id === FAVORITES_ID)) {
		const now = Date.now();
		playlists = [
			{ id: FAVORITES_ID, name: '❤️ Favorites', description: '', trackIds: [], createdAt: now, updatedAt: now },
			...playlists,
		];
		persist();
	}
}

function createPlaylist(name: string): string {
	const id = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	const now = Date.now();
	playlists = [...playlists, { id, name, description: '', trackIds: [], createdAt: now, updatedAt: now }];
	persist();
	return id;
}

function deletePlaylist(id: string) {
	if (id === FAVORITES_ID) return;
	playlists = playlists.filter((p) => p.id !== id);
	persist();
}

function renamePlaylist(id: string, name: string) {
	if (id === FAVORITES_ID) return;
	playlists = playlists.map((p) => (p.id === id ? { ...p, name, updatedAt: Date.now() } : p));
	persist();
}

function addTrack(playlistId: string, trackId: string) {
	playlists = playlists.map((p) =>
		p.id === playlistId && !p.trackIds.includes(trackId)
			? { ...p, trackIds: [...p.trackIds, trackId], updatedAt: Date.now() }
			: p
	);
	persist();
}

function removeTrack(playlistId: string, trackId: string) {
	playlists = playlists.map((p) =>
		p.id === playlistId ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId), updatedAt: Date.now() } : p
	);
	persist();
}

function getPlaylist(id: string): Playlist | undefined {
	return playlists.find((p) => p.id === id);
}

function isFavorite(trackId: string): boolean {
	return getPlaylist(FAVORITES_ID)?.trackIds.includes(trackId) ?? false;
}

function toggleFavorite(trackId: string) {
	if (isFavorite(trackId)) {
		removeTrack(FAVORITES_ID, trackId);
	} else {
		addTrack(FAVORITES_ID, trackId);
		moodStore
			.addMoodEvent(trackId, '❤️', 3, undefined, 'favorite')
			.catch((e) => console.error('[playlistStore] favorite mood log failed:', e));
	}
}

export const playlistStore = {
	get playlists() { return playlists; },
	loadPlaylists,
	createPlaylist,
	deletePlaylist,
	renamePlaylist,
	addTrack,
	removeTrack,
	getPlaylist,
	isFavorite,
	toggleFavorite,
};
