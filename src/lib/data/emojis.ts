// The canon's water, arranged by the app's own hand.
//
// The definitions in ./emojis.gen are GENERATED — never hand-edit them; heal
// by regenerating (see MIRROR.md in this folder). The palette ORDER below is
// this app's own and is a sensory contract: reorder only at KP's word. New
// canon emojis append after the designed twelve, never vanish.

import { EMOJI_DEFS as CANON_DEFS } from './emojis.gen';
import type { EmojiDef } from './emojis.gen';

export type { EmojiDef } from './emojis.gen';

const PALETTE_ORDER = ['😌', '🔥', '😢', '😊', '🌀', '🌙', '✨', '🎯', '💙', '😮‍💨', '💤', '🎉'];

export const EMOJI_DEFS: EmojiDef[] = [
  ...PALETTE_ORDER.map((e) => CANON_DEFS.find((d) => d.emoji === e)).filter(
    (d): d is EmojiDef => d !== undefined
  ),
  ...CANON_DEFS.filter((d) => !PALETTE_ORDER.includes(d.emoji)),
];
