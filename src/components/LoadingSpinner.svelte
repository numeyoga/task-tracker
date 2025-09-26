<script>
  export let size = 'md'; // xs, sm, md, lg, xl
  export let color = 'primary'; // primary, secondary, accent, neutral, info, success, warning, error
  export let text = '';
  export let inline = false;

  const sizeClasses = {
    xs: 'loading-xs w-4 h-4',
    sm: 'loading-sm w-6 h-6',
    md: 'loading-md w-8 h-8',
    lg: 'loading-lg w-12 h-12',
    xl: 'loading-xl w-16 h-16'
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    neutral: 'text-neutral',
    info: 'text-info',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error'
  };

  $: spinnerClass = `loading loading-spinner ${sizeClasses[size]} ${colorClasses[color]}`;
  $: containerClass = inline ? 'inline-flex items-center space-x-2' : 'flex flex-col items-center justify-center space-y-2 p-4';
</script>

<div class={containerClass}>
  <div class={spinnerClass}></div>
  {#if text}
    <div class="text-sm {colorClasses[color]} animate-pulse-custom font-medium">
      {text}
    </div>
  {/if}
</div>

<style>
  /* Enhanced spinner animations for 60fps */
  .loading-spinner {
    animation: spin 0.75s linear infinite;
    will-change: transform;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* GPU acceleration for smooth animations */
  .animate-pulse-custom {
    will-change: opacity;
  }
</style>