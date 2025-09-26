// Export main Icon component
export { default as Icon } from './Icon.svelte';

// Export specific icon components for common use cases
export { default as TimerIcon } from './TimerIcon.svelte';
export { default as PlayIcon } from './PlayIcon.svelte';
export { default as PauseIcon } from './PauseIcon.svelte';
export { default as StopIcon } from './StopIcon.svelte';

// Icon name constants for better type safety and autocomplete
export const ICONS = {
  // Timer and time-related icons
  TIMER: 'timer',
  CLOCK: 'clock',
  PLAY: 'play',
  PAUSE: 'pause',
  STOP: 'stop',

  // Task and list icons
  LIST: 'list',
  TASKS: 'tasks',
  CHECK: 'check',
  PLUS: 'plus',
  EDIT: 'edit',
  TRASH: 'trash',

  // Reports and analytics icons
  CHART: 'chart',
  HISTORY: 'history',
  CALENDAR: 'calendar',
  DOWNLOAD: 'download',

  // Settings and configuration icons
  SETTINGS: 'settings',
  COG: 'cog',

  // UI and navigation icons
  CLOSE: 'close',
  CHEVRON_DOWN: 'chevronDown',
  CHEVRON_UP: 'chevronUp',
  CHEVRON_LEFT: 'chevronLeft',
  CHEVRON_RIGHT: 'chevronRight',
  MENU: 'menu',
  SEARCH: 'search',

  // Status and feedback icons
  ERROR: 'error',
  WARNING: 'warning',
  SUCCESS: 'success',
  INFO: 'info',

  // Food and break icons
  COFFEE: 'coffee',
  MEAL: 'meal',
  UTENSILS: 'utensils'
};

// Common icon size classes for consistency
export const ICON_SIZES = {
  XS: 'w-3 h-3',
  SM: 'w-4 h-4',
  MD: 'w-5 h-5',
  LG: 'w-6 h-6',
  XL: 'w-8 h-8',
  XXL: 'w-10 h-10'
};

// Helper function to get icon with common props
export function createIconProps(name, size = ICON_SIZES.MD, className = '') {
  return {
    name,
    size,
    className
  };
}