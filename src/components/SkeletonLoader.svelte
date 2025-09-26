<script>
  export let lines = 3;
  export let height = 'h-4';
  export let className = '';
  export let animate = true;

  function generateLines(count) {
    return Array.from({ length: count }, (_, i) => i);
  }

  $: animationClass = animate ? 'animate-pulse-custom' : '';
  $: skeletonClass = `bg-base-300 rounded ${height} ${animationClass}`;
</script>

<div class="space-y-2 {className}">
  {#each generateLines(lines) as lineIndex (lineIndex)}
    <div
      class={skeletonClass}
      style="width: {Math.random() * 30 + 70}%; will-change: opacity;"
    ></div>
  {/each}
</div>

<style>
  /* Optimized skeleton animations for 60fps */
  .animate-pulse-custom {
    animation: skeleton-pulse 1.5s ease-in-out infinite;
    will-change: opacity;
  }

  @keyframes skeleton-pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
</style>