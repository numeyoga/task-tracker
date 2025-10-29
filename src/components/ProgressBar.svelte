<script>
  /**
   * ProgressBar Component
   * Simple CSS-based progress bar for visualizing task time distribution
   *
   * Props:
   * - value: Current value (number)
   * - max: Maximum value (number, default: 100)
   * - label: Text label (string, optional)
   * - color: Bar color class (string, default: 'primary')
   * - showPercentage: Show percentage text (boolean, default: true)
   * - size: Size variant - 'sm', 'md', 'lg' (string, default: 'md')
   */

  export let value = 0;
  export let max = 100;
  export let label = '';
  export let color = 'primary'; // primary, secondary, success, warning, error, info
  export let showPercentage = true;
  export let size = 'md'; // sm, md, lg

  // Calculate percentage
  $: percentage = Math.min(100, Math.max(0, (value / max) * 100));
  $: percentageText = `${Math.round(percentage)}%`;

  // Size configurations
  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  $: sizeClass = sizes[size] || sizes.md;

  // Color configurations
  const colors = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
    neutral: 'bg-neutral'
  };

  $: colorClass = colors[color] || colors.primary;
</script>

<div class="progress-bar-container">
  {#if label || showPercentage}
    <div class="flex justify-between items-center mb-1">
      {#if label}
        <span class="text-sm font-medium text-base-content">{label}</span>
      {/if}
      {#if showPercentage}
        <span class="text-xs text-base-content/70">{percentageText}</span>
      {/if}
    </div>
  {/if}

  <div class="w-full bg-base-300 rounded-full {sizeClass} overflow-hidden">
    <div
      class="{colorClass} {sizeClass} rounded-full transition-all duration-500 ease-out"
      style="width: {percentage}%"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin="0"
      aria-valuemax={max}
      aria-label={label || `Progress: ${percentageText}`}
    ></div>
  </div>
</div>

<style>
  .progress-bar-container {
    width: 100%;
  }

  /* Smooth animation */
  div[role="progressbar"] {
    will-change: width;
  }
</style>
