<script>
  import { createEventDispatcher } from 'svelte';
  import { timerState, mealBreakState, timerActions } from '../../stores/timer.js';

  const dispatch = createEventDispatcher();

  export let size = 'normal'; // 'sm', 'normal', 'lg'
  export let showControls = true;
  export let showDescription = true;

  let isProcessing = false;

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'text-sm',
      button: 'btn-sm',
      timer: 'text-2xl',
      icon: 'w-4 h-4'
    },
    normal: {
      container: 'text-base',
      button: '',
      timer: 'text-3xl',
      icon: 'w-5 h-5'
    },
    lg: {
      container: 'text-lg',
      button: 'btn-lg',
      timer: 'text-4xl',
      icon: 'w-6 h-6'
    }
  };

  $: classes = sizeClasses[size] || sizeClasses.normal;
  $: canStartMealBreak = !$mealBreakState.isRunning && $timerState.isRunning;
  $: canStopMealBreak = $mealBreakState.isRunning;

  async function handleStartMealBreak() {
    if (isProcessing || !canStartMealBreak) return;

    try {
      isProcessing = true;
      await timerActions.startMealBreak();
      dispatch('mealBreakStarted');
    } catch (error) {
      dispatch('error', { message: `Failed to start meal break: ${error.message}` });
    } finally {
      isProcessing = false;
    }
  }

  async function handleStopMealBreak() {
    if (isProcessing || !canStopMealBreak) return;

    try {
      isProcessing = true;
      await timerActions.stopMealBreak();
      dispatch('mealBreakStopped');
    } catch (error) {
      dispatch('error', { message: `Failed to stop meal break: ${error.message}` });
    } finally {
      isProcessing = false;
    }
  }

</script>

<div class="card bg-base-100 border border-warning/20 {classes.container}">
  <div class="card-body p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-warning rounded-full {$mealBreakState.isRunning ? 'animate-pulse' : ''}"></div>
        <h3 class="font-semibold text-warning">Meal Break</h3>
        {#if $mealBreakState.isRunning}
          <div class="badge badge-warning badge-sm">Active</div>
        {/if}
      </div>

      <!-- Quick Status -->
      <div class="text-right">
        <div class="text-xs text-base-content/60">
          {#if $mealBreakState.isRunning}
            Started {$mealBreakState.startTime ? new Date($mealBreakState.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
          {:else if !$timerState.isRunning}
            Start timer first
          {:else}
            Ready
          {/if}
        </div>
      </div>
    </div>

    <!-- Timer Display -->
    <div class="text-center mb-4">
      <div class="font-mono {classes.timer} font-bold {$mealBreakState.isRunning ? 'text-warning' : 'text-base-content/60'}">
        {$mealBreakState.formattedElapsed || '00:00'}
      </div>
      {#if showDescription && $mealBreakState.isRunning}
        <div class="text-sm text-base-content/60 mt-2">
          Your work timer is paused during meal break
        </div>
      {/if}
    </div>

    <!-- Controls -->
    {#if showControls}
      <div class="flex flex-col space-y-2">
        {#if !$timerState.isRunning}
          <!-- Not working - can't start meal break -->
          <div class="alert alert-info">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-sm">Start your work timer first to track meal breaks</span>
          </div>
        {:else if $mealBreakState.isRunning}
          <!-- Meal break is active -->
          <button
            class="btn btn-warning {classes.button} w-full"
            class:loading={isProcessing}
            disabled={isProcessing}
            on:click={handleStopMealBreak}
          >
            {#if isProcessing}
              <span class="loading loading-spinner loading-sm"></span>
            {:else}
              <svg class="{classes.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10l2 2 4-4"></path>
              </svg>
            {/if}
            End Meal Break
          </button>

          <!-- Quick actions -->
          <div class="flex space-x-2">
            <button
              class="btn btn-outline btn-warning btn-sm flex-1"
              disabled={isProcessing}
              on:click={() => dispatch('addTime', { minutes: 15 })}
            >
              +15 min
            </button>
            <button
              class="btn btn-outline btn-warning btn-sm flex-1"
              disabled={isProcessing}
              on:click={() => dispatch('addTime', { minutes: 30 })}
            >
              +30 min
            </button>
          </div>
        {:else}
          <!-- Can start meal break -->
          <button
            class="btn btn-outline btn-warning {classes.button} w-full"
            class:loading={isProcessing}
            disabled={isProcessing || !canStartMealBreak}
            on:click={handleStartMealBreak}
          >
            {#if isProcessing}
              <span class="loading loading-spinner loading-sm"></span>
            {:else}
              <svg class="{classes.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            {/if}
            Start Meal Break
          </button>

          <!-- Suggested durations -->
          <div class="flex space-x-2">
            <button
              class="btn btn-ghost btn-sm flex-1"
              disabled={isProcessing || !canStartMealBreak}
              on:click={() => { handleStartMealBreak(); dispatch('setDuration', { minutes: 30 }); }}
            >
              30 min
            </button>
            <button
              class="btn btn-ghost btn-sm flex-1"
              disabled={isProcessing || !canStartMealBreak}
              on:click={() => { handleStartMealBreak(); dispatch('setDuration', { minutes: 60 }); }}
            >
              60 min
            </button>
            <button
              class="btn btn-ghost btn-sm flex-1"
              disabled={isProcessing || !canStartMealBreak}
              on:click={() => { handleStartMealBreak(); dispatch('setDuration', { minutes: 90 }); }}
            >
              90 min
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Statistics -->
    {#if showDescription && ($mealBreakState.elapsed > 0 || $mealBreakState.isRunning)}
      <div class="stats stats-vertical lg:stats-horizontal mt-4">
        <div class="stat">
          <div class="stat-title text-xs">Today's Breaks</div>
          <div class="stat-value text-lg">3</div>
          <div class="stat-desc text-xs">Average: 45 min</div>
        </div>
      </div>
    {/if}

    <!-- Help Text -->
    {#if showDescription && !$mealBreakState.isRunning && !$timerState.isRunning}
      <div class="text-xs text-base-content/50 text-center mt-2">
        Use <kbd class="kbd kbd-xs">Ctrl + M</kbd> to quickly toggle meal breaks
      </div>
    {/if}
  </div>
</div>

<style>
  .kbd {
    background-color: hsl(var(--b2));
    border: 1px solid hsl(var(--b3));
    border-radius: 0.25rem;
    padding: 0.125rem 0.25rem;
    font-size: 0.625rem;
  }

  .stats {
    background: transparent;
    border: none;
  }

  .stat {
    background: transparent;
    padding: 0.5rem;
  }

  .stat-title {
    color: hsl(var(--bc) / 0.6);
  }

  .stat-value {
    color: hsl(var(--wa));
  }

  .stat-desc {
    color: hsl(var(--bc) / 0.5);
  }

  .alert {
    padding: 0.75rem;
    border-radius: 0.5rem;
  }
</style>