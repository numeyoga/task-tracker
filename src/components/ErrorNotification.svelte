<script context="module">
  import { fly } from 'svelte/transition';
</script>

<script>
  import { createEventDispatcher, onMount } from 'svelte';

  export let error = null;
  export let type = 'general';
  export let autoClose = true;
  export let autoCloseDelay = 5000;

  const dispatch = createEventDispatcher();

  let visible = false;
  let timeoutId = null;

  // Watch for error changes
  $: if (error) {
    showError();
  } else {
    hideError();
  }

  function showError() {
    visible = true;

    if (autoClose) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        dismissError();
      }, autoCloseDelay);
    }
  }

  function hideError() {
    visible = false;
    clearTimeout(timeoutId);
  }

  function dismissError() {
    hideError();
    dispatch('dismiss');
  }

  function getErrorIcon(type) {
    switch (type) {
      case 'timer':
        return 'M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 9h4m-4 0V5m0 6a1 1 0 11-2 0 1 1 0 012 0z';
      case 'tasks':
        return 'M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'settings':
        return 'M12 15a3 3 0 100-6 3 3 0 000 6z';
      case 'reports':
        return 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z';
      default:
        return 'M12 9v2m0 4h.01M12 3a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  function getErrorTitle(type) {
    switch (type) {
      case 'timer':
        return 'Timer Error';
      case 'tasks':
        return 'Task Error';
      case 'settings':
        return 'Settings Error';
      case 'reports':
        return 'Reports Error';
      default:
        return 'Error';
    }
  }

  // Cleanup on destroy
  function onDestroy() {
    clearTimeout(timeoutId);
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', onDestroy);
    }
  });
</script>

{#if visible && error}
  <div
    class="toast toast-end z-50"
    role="alert"
    aria-live="polite"
    in:fly={{ x: 300, duration: 200 }}
    out:fly={{ x: 300, duration: 200 }}
  >
    <div class="alert alert-error shadow-lg max-w-sm">
      <div class="flex items-start space-x-3">
        <!-- Error Icon -->
        <div class="flex-shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d={getErrorIcon(type)}
            ></path>
          </svg>
        </div>

        <!-- Error Content -->
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-sm">
            {getErrorTitle(type)}
          </div>
          <div class="text-sm opacity-90 mt-1 break-words">
            {error}
          </div>
        </div>

        <!-- Dismiss Button -->
        <button
          class="btn btn-ghost btn-sm btn-circle ml-2 flex-shrink-0"
          on:click={dismissError}
          aria-label="Dismiss error"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Auto-close progress bar -->
      {#if autoClose}
        <div class="absolute bottom-0 left-0 h-1 bg-error-content/20 w-full">
          <div
            class="h-full bg-error-content transition-all duration-100 ease-linear"
            style="width: 0%; animation: progress {autoCloseDelay}ms linear;"
          ></div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    top: auto;
    bottom: 1rem;
    right: 1rem;
    left: auto;
  }

  @keyframes progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  /* Responsive positioning */
  @media (max-width: 768px) {
    .toast {
      right: 1rem;
      left: 1rem;
      bottom: 1rem;
    }

    .alert {
      width: 100%;
    }
  }
</style>
