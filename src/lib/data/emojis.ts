// The canon's water, arranged by the app's own hand.
//
// The twelve definitions live in ./emojis.gen — GENERATED from the Grammar
// base's thesaurus, folksonomy 'Compass'; never hand-edit, heal by
// regenerating (see MIRROR.md in this folder). The palette ORDER below is
// Compass's own: the canon carries no arrangement, and the set's row rules
// the app sovereign from the pour forward. The order is muscle memory on
// KP's phone — a sensory contract; reorder only at his word. Emojis that
// join the canon later append after the designed twelve, never vanish.

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
