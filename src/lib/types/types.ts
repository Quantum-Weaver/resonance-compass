// Theme customization
export interface ThemeConfig {
  mode: 'dark' | 'light' | 'amoled';
  accentColor: string;
  presetName?: string;
  fontSize: 'small' | 'medium' | 'large';
}

// Track — a single song in the library (mirrors the songs table)
export interface Track {
  id: string;
  uri: string;
  filename: string;
  title: string;
  artist: string;
  album: string;
  genre?: string;
  year?: number;
  trackNumber?: number;
  duration: number;
  coverArt?: string;
  lyrics?: string;
  dateAdded: number;
  lastScanned: number;
}

// MoodEvent — a mood tag applied to a track (mirrors the mood_events table)
export interface MoodEvent {
  id: number;
  trackId: string;
  emoji: string;
  timestamp: number;
  intensity: number;
  comment?: string;
  context: string;
}

// Album — derived grouping for UI
export interface Album {
  name: string;
  artist: string;
  year?: number;
  coverArt?: string;
  tracks: Track[];
}

// Artist — derived grouping for UI
export interface Artist {
  name: string;
  albums: Album[];
}

// Playlist — mirrors the playlists table
export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

// PlayerState — runtime playback state
export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
}

// Sense — top-level perception category (Resonance Grammar)
export interface Sense {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

// Subcategory — fine-grain entry under each Sense
export interface Subcategory {
  id: string;
  senseId: string;
  name: string;
  description: string;
}

// Emoji definition — the sensory lexicon atom (canonical shape lives in emojis.ts)
export type { EmojiDef as EmojiDefinition } from '$lib/data/emojis';
