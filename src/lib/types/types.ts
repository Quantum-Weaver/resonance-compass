// Theme customization
export interface ThemeConfig {
  mode: 'dark' | 'light' | 'amoled';
  accentColor: string;
  presetName?: string;
  fontSize: 'small' | 'medium' | 'large';
}

// Echo — a single journal entry
export interface Echo {
  id: string;
  name: string;
  sense: string;
  subcategory: string;
  emoji: string;
  note?: string;
  intensity: number;
  timestamp: number;
  createdAt: number;
}

// Sense — top-level perception category (Seen, Heard, Felt, Thought, etc.)
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
