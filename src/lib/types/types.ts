// Theme customization
export type TintLevel = 'off' | 'subtle' | 'full';

export interface ThemeConfig {
  mode: 'dark' | 'light' | 'amoled';
  accentColor: string;
  presetName?: string;
  fontSize: 'small' | 'medium' | 'large';
  /** How far the accent bleeds into the background. A config saved before
   *  this field existed merges over the default and reads as 'subtle'. */
  tint: TintLevel;
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
  /** The album folder this song lives in — the key its art hangs on. Empty for
   *  anything with no filesystem folder (content:// URIs, fragments, mixes). */
  folder: string;
  /** Path to the folder's ONE cover file, when the album has one on disk. */
  coverPath?: string;
  /** A displayable src, always — derived from the album folder's cover file,
   *  never fetched or stored per song. */
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

// Album — derived grouping for UI. id follows the "albumName|||artistName" format (CLAUDE.md).
export interface Album {
  id: string;
  name: string;
  artist: string;
  year?: number;
  genre?: string;
  /** A displayable src — the folder art its tracks derive from. */
  coverArt?: string;
  tracks: Track[];
}

// Artist — derived grouping for UI. id is the artist's name (original case).
export interface Artist {
  id: string;
  name: string;
  albums: Album[];
  trackCount: number;
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
