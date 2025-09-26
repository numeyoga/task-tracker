<script>
  import { fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let duration = 300;
  export let delay = 0;
  export let easing = quintOut;
</script>

<div
  in:fade={{ duration, delay, easing }}
  out:fade={{ duration, delay, easing }}
  style="will-change: transform, opacity;"
>
  <slot />
</div>