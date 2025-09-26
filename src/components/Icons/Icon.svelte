<script>
  export let name;
  export let size = 'w-5 h-5';
  export let className = '';
  export let fill = 'none';
  export let stroke = 'currentColor';
  export let strokeWidth = '2';

  // Icon path definitions
  const iconPaths = {
    // Timer and time-related icons
    timer: 'M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 9h4m-4 0V5m0 6a1 1 0 11-2 0 1 1 0 012 0z',
    clock: 'M12 6v6l4 2',
    play: 'M8 5v14l11-7z',
    pause: 'M6 4h4v16H6V4zm8 0h4v16h-4V4z',
    stop: 'M6 6h12v12H6z',

    // Task and list icons
    list: 'M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    tasks: 'M9 12l2 2 4-4m6-2a9 9 0 11-18 0 9 9 0 0118 0z',
    check: 'M5 13l4 4L19 7',
    plus: 'M12 4v16m8-8H4',
    edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7m-2-1L13.5 4.5a2.121 2.121 0 00-3 3L5 13l4 4 6.5-6.5z',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',

    // Reports and analytics icons
    chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    history: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',

    // Settings and configuration icons
    settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
    cog: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',

    // UI and navigation icons
    close: 'M6 18L18 6M6 6l12 12',
    chevronDown: 'M19 9l-7 7-7-7',
    chevronUp: 'M5 15l7-7 7 7',
    chevronLeft: 'M15 18l-6-6 6-6',
    chevronRight: 'M9 18l6-6-6-6',
    menu: 'M4 6h16M4 12h16M4 18h16',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',

    // Status and feedback icons
    error: 'M12 9v2m0 4h.01M12 3a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    success: 'M9 12l2 2 4-4m6-2a9 9 0 11-18 0 9 9 0 0118 0z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',

    // Food and break icons
    coffee: 'M17.5 4.5c-1.5 0-3 1-3 2.5v1h3v-1c0-1.5 1.5-2.5 3-2.5M12 4h-2a2 2 0 00-2 2v12a2 2 0 002 2h2a2 2 0 002-2V6a2 2 0 00-2-2z',
    meal: 'M12 2l3.09 6.26L22 9l-5.91 3.74L18 22l-6-4-6 4 1.91-9.26L2 9l6.91-1.74L12 2z',
    utensils: 'M16 4v12l-4 4-4-4V4M8 4l4 4 4-4'
  };

  $: iconPath = iconPaths[name] || '';

  // Combine classes
  $: combinedClass = `${size} ${className}`.trim();
</script>

{#if iconPath}
  <svg
    class={combinedClass}
    {fill}
    {stroke}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width={strokeWidth}
      d={iconPath}
    />
  </svg>
{:else}
  <!-- Fallback icon if name not found -->
  <svg
    class={combinedClass}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M12 9v2m0 4h.01M12 3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
{/if}