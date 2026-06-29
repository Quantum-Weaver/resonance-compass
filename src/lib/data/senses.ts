export interface Sense {
	id: string;
	name: string;
	emoji: string;
	description: string;
	subcategories: Subcategory[];
}

export interface Subcategory {
	id: string;
	name: string;
}

export const SENSES: Sense[] = [
	{
		id: 'seen',
		name: 'Seen',
		emoji: '👁️',
		description: 'Visual experiences — movies, art, nature',
		subcategories: [
			{ id: 'movie', name: 'movie' },
			{ id: 'art', name: 'art' },
			{ id: 'nature', name: 'nature' },
			{ id: 'custom', name: 'custom' }
		]
	},
	{
		id: 'heard',
		name: 'Heard',
		emoji: '👂',
		description: 'Auditory experiences — music, podcasts, voices',
		subcategories: [
			{ id: 'music', name: 'music' },
			{ id: 'podcast', name: 'podcast' },
			{ id: 'voice', name: 'voice' },
			{ id: 'silence', name: 'silence' },
			{ id: 'custom', name: 'custom' }
		]
	},
	{
		id: 'felt',
		name: 'Felt',
		emoji: '✋',
		description: 'Tactile and emotional experiences',
		subcategories: [
			{ id: 'activity', name: 'activity' },
			{ id: 'embrace', name: 'embrace' },
			{ id: 'texture', name: 'texture' },
			{ id: 'custom', name: 'custom' }
		]
	},
	{
		id: 'thought',
		name: 'Thought',
		emoji: '💭',
		description: 'Internal experiences — ideas, memories, reflections',
		subcategories: [
			{ id: 'idea', name: 'idea' },
			{ id: 'memory', name: 'memory' },
			{ id: 'reflection', name: 'reflection' },
			{ id: 'worry', name: 'worry' },
			{ id: 'custom', name: 'custom' }
		]
	},
	{
		id: 'felt_inside',
		name: 'Felt Inside',
		emoji: '🫀',
		description: 'Somatic and body experiences',
		subcategories: [
			{ id: 'symptom', name: 'symptom' },
			{ id: 'energy', name: 'energy' },
			{ id: 'pain', name: 'pain' },
			{ id: 'relief', name: 'relief' },
			{ id: 'custom', name: 'custom' }
		]
	},
	{
		id: 'dreamt',
		name: 'Dreamt',
		emoji: '🌙',
		description: 'Dream experiences',
		subcategories: [
			{ id: 'dream', name: 'dream' },
			{ id: 'nightmare', name: 'nightmare' },
			{ id: 'vision', name: 'vision' },
			{ id: 'custom', name: 'custom' }
		]
	},
	{
		id: 'grateful_for',
		name: 'Grateful For',
		emoji: '🙏',
		description: 'Gratitude — people, moments, things',
		subcategories: [
			{ id: 'person', name: 'person' },
			{ id: 'moment', name: 'moment' },
			{ id: 'thing', name: 'thing' },
			{ id: 'custom', name: 'custom' }
		]
	},
	{
		id: 'other',
		name: 'Other',
		emoji: '✨',
		description: 'Anything else',
		subcategories: [{ id: 'custom', name: 'custom' }]
	}
];
