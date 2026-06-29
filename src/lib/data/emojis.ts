export interface EmojiDef {
  emoji: string;
  label: string;
  color: string;
  definition: string;
  sensory: {
    color: string;
    sound: string;
    texture: string;
    temperature: string;
  };
}

export const EMOJI_DEFS: EmojiDef[] = [
  {
    emoji: '😌',
    label: 'Calm',
    color: '#6C5CE7',
    definition: 'A settled stillness. Peace that arrived on its own — not earned, not performed. The breath after a long exhale.',
    sensory: { color: 'soft lavender', sound: 'low hum of a distant fan', texture: 'warm fleece', temperature: 'room temperature' },
  },
  {
    emoji: '🔥',
    label: 'Energy',
    color: '#E17055',
    definition: 'Kinetic aliveness. The feeling of becoming more than yourself — something lit, something moving. Intensity that wants to be used.',
    sensory: { color: 'deep amber', sound: 'crackling fire', texture: 'dry heat on skin', temperature: 'warm' },
  },
  {
    emoji: '😢',
    label: 'Sad',
    color: '#74B9FF',
    definition: 'The softness inside grief. Not collapse — presence. Sorrow that deserves to be seen and held.',
    sensory: { color: 'pale blue', sound: 'rain on glass', texture: 'damp cloth', temperature: 'cool' },
  },
  {
    emoji: '😊',
    label: 'Happy',
    color: '#FDCB6E',
    definition: 'Uncomplicated delight. The kind that needs no explanation. Joy that arrived without being summoned.',
    sensory: { color: 'warm yellow', sound: 'distant laughter', texture: 'sunlit surface', temperature: 'gentle warmth' },
  },
  {
    emoji: '🌀',
    label: 'Overstimulated',
    color: '#A29BFE',
    definition: 'Too much at once. The spiral inward. Patterns stacking faster than they can be tracked — the edges blurring.',
    sensory: { color: 'blinking static', sound: 'overlapping voices', texture: 'buzzing surface', temperature: 'uneven' },
  },
  {
    emoji: '🌙',
    label: 'Melancholy',
    color: '#636E72',
    definition: 'Ache with beauty in it. Not quite sadness — a longing for something half-remembered. The bittersweet that lives in the quiet.',
    sensory: { color: 'grey-blue moonlight', sound: 'silence between notes', texture: 'cold stone', temperature: 'cool and still' },
  },
  {
    emoji: '✨',
    label: 'Transcendent',
    color: '#FFD700',
    definition: 'Awe. The moment something becomes more than itself — past words, past understanding. A glimpse of something larger.',
    sensory: { color: 'gold and white', sound: 'ringing silence', texture: 'weightless', temperature: 'neither warm nor cold' },
  },
  {
    emoji: '🎯',
    label: 'Focused',
    color: '#00CEC9',
    definition: 'Everything peripheral disappears. Locked into one thing, completely. The world narrows to exactly what matters now.',
    sensory: { color: 'sharp teal', sound: 'clean tone', texture: 'smooth glass', temperature: 'slightly cool' },
  },
  {
    emoji: '💙',
    label: 'Connected',
    color: '#0984E3',
    definition: 'The felt sense of not being alone. Belonging — the thread between yourself and something beyond the self.',
    sensory: { color: 'deep blue', sound: 'resonant chord', texture: 'held hand', temperature: 'body temperature' },
  },
  {
    emoji: '😮‍💨',
    label: 'Relief',
    color: '#55EFC4',
    definition: 'The release of something held without knowing. Tension leaving the body. The long, slow exhale.',
    sensory: { color: 'mint green', sound: 'long exhale', texture: 'releasing grip', temperature: 'cool breeze' },
  },
  {
    emoji: '💤',
    label: 'Tired',
    color: '#B2BEC3',
    definition: 'Bone-deep depletion. The body asking — plainly, without apology — for rest.',
    sensory: { color: 'soft grey', sound: 'slow breathing', texture: 'heavy blanket', temperature: 'slightly warm' },
  },
  {
    emoji: '🎉',
    label: 'Celebratory',
    color: '#E84393',
    definition: 'Shared joy made loud. The moment that deserves to be marked — witnessed, felt, and remembered.',
    sensory: { color: 'bright magenta', sound: 'cheering crowd', texture: 'confetti', temperature: 'warm and electric' },
  },
];
