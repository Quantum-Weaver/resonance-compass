<script lang="ts">
  import IconPlay from './IconPlay.svelte';
  import IconPause from './IconPause.svelte';
  import IconSkipForward from './IconSkipForward.svelte';
  import IconSkipBack from './IconSkipBack.svelte';
  import IconShuffle from './IconShuffle.svelte';
  import IconRepeat from './IconRepeat.svelte';
  import IconRepeatOne from './IconRepeatOne.svelte';
  import IconVolume from './IconVolume.svelte';
  import IconVolumeMuted from './IconVolumeMuted.svelte';
  import IconHeart from './IconHeart.svelte';
  import IconSearch from './IconSearch.svelte';
  import IconChevron from './IconChevron.svelte';
  import IconHome from './IconHome.svelte';
  import IconLibrary from './IconLibrary.svelte';
  import IconPlaylist from './IconPlaylist.svelte';
  import IconTimer from './IconTimer.svelte';
  import IconSettings from './IconSettings.svelte';
  import IconResonance from './IconResonance.svelte';
  import IconVisualizer from './IconVisualizer.svelte';
  import IconEqualizer from './IconEqualizer.svelte';
  import IconSattva from './IconSattva.svelte';
  import IconFocus from './IconFocus.svelte';
  import IconFragment from './IconFragment.svelte';
  import IconHistory from './IconHistory.svelte';
  import IconProfiles from './IconProfiles.svelte';
  import IconLyrics from './IconLyrics.svelte';
  import IconCompass from './IconCompass.svelte';

  export type IconName =
    | 'play' | 'pause' | 'skip-forward' | 'skip-back'
    | 'shuffle' | 'repeat' | 'repeat-one'
    | 'volume' | 'volume-muted'
    | 'heart' | 'search' | 'chevron'
    | 'home' | 'library' | 'playlist' | 'timer'
    | 'settings' | 'resonance' | 'visualizer' | 'equalizer'
    | 'sattva' | 'focus' | 'fragment' | 'history'
    | 'profiles' | 'lyrics' | 'compass';

  let {
    name,
    size = 20,
    color = 'currentColor',
    filled = false,
    direction = 'down',
  }: {
    name: IconName;
    size?: number;
    color?: string;
    filled?: boolean;
    direction?: 'up' | 'down' | 'left' | 'right';
  } = $props();

  const components: Record<IconName, any> = {
    'play': IconPlay,
    'pause': IconPause,
    'skip-forward': IconSkipForward,
    'skip-back': IconSkipBack,
    'shuffle': IconShuffle,
    'repeat': IconRepeat,
    'repeat-one': IconRepeatOne,
    'volume': IconVolume,
    'volume-muted': IconVolumeMuted,
    'heart': IconHeart,
    'search': IconSearch,
    'chevron': IconChevron,
    'home': IconHome,
    'library': IconLibrary,
    'playlist': IconPlaylist,
    'timer': IconTimer,
    'settings': IconSettings,
    'resonance': IconResonance,
    'visualizer': IconVisualizer,
    'equalizer': IconEqualizer,
    'sattva': IconSattva,
    'focus': IconFocus,
    'fragment': IconFragment,
    'history': IconHistory,
    'profiles': IconProfiles,
    'lyrics': IconLyrics,
    'compass': IconCompass,
  };

  const Component = $derived(components[name]);
</script>

{#if Component}
  <Component {size} {color} {filled} {direction} />
{/if}
