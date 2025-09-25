<script>
  import { createEventDispatcher } from 'svelte';
  import { timerState, timerActions } from '../../stores/timer.js';
  import { allTasks, activeTask } from '../../stores/tasks.js';

  const dispatch = createEventDispatcher();

  export let selectedTaskId = null;
  export let showTaskSelector = true;
  export let size = 'normal'; // 'sm', 'normal', 'lg'

  let isProcessing = false;

  // Size classes
  const sizeClasses = {
    sm: { btn: 'btn-sm', icon: 'w-4 h-4' },
    normal: { btn: '', icon: 'w-5 h-5' },
    lg: { btn: 'btn-lg', icon: 'w-6 h-6' }
  };

  $: classes = sizeClasses[size] || sizeClasses.normal;

  // Auto-select active task if none selected
  $: if ($activeTask && !selectedTaskId) {
    selectedTaskId = $activeTask.id;
  }

  async function handleStartTimer() {
    if (!selectedTaskId) {
      dispatch('error', { message: 'Please select a task first' });
      return;
    }

    try {
      isProcessing = true;
      await timerActions.startTimer(selectedTaskId);
      dispatch('timerStarted', { taskId: selectedTaskId });
    } catch (error) {
      dispatch('error', { message: `Failed to start timer: ${error.message}` });
    } finally {
      isProcessing = false;
    }
  }

  async function handleStopTimer() {
    try {
      isProcessing = true;
      await timerActions.stopTimer();
      dispatch('timerStopped');
    } catch (error) {
      dispatch('error', { message: `Failed to stop timer: ${error.message}` });
    } finally {
      isProcessing = false;
    }
  }

  async function handleSwitchTask() {
    if (!selectedTaskId) {
      dispatch('error', { message: 'Please select a task first' });
      return;
    }

    try {
      isProcessing = true;
      await timerActions.switchTask(selectedTaskId);
      dispatch('taskSwitched', { taskId: selectedTaskId });
    } catch (error) {
      dispatch('error', { message: `Failed to switch task: ${error.message}` });
    } finally {
      isProcessing = false;
    }
  }

  function handleTaskSelect(event) {
    selectedTaskId = event.target.value || null;
    dispatch('taskSelected', { taskId: selectedTaskId });
  }
</script>

<div class="space-y-4">
  <!-- Task Selection -->
  {#if showTaskSelector && !$timerState.isRunning}
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Select Task</span>
        <span class="label-text-alt text-base-content/60">
          {$allTasks.length} task{$allTasks.length !== 1 ? 's' : ''} available
        </span>
      </label>
      <select
        class="select select-bordered w-full"
        bind:value={selectedTaskId}
        on:change={handleTaskSelect}
        disabled={isProcessing}
      >
        <option value={null}>Choose a task to track...</option>
        {#each $allTasks as task (task.id)}
          <option value={task.id} class="flex items-center">
            {task.name}
            {#if task.totalTime > 0}
              - {Math.round(task.totalTime / (1000 * 60))}m total
            {/if}
          </option>
        {/each}
      </select>
    </div>
  {/if}

  <!-- Current Task Display (when timer is running) -->
  {#if $timerState.isRunning}
    <div class="alert alert-info">
      <svg
        class={`${classes.icon} flex-shrink-0`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
      <div>
        <div class="font-semibold">Timer Running</div>
        <div class="text-sm">Working on: {$timerState.taskName || 'Unknown Task'}</div>
      </div>
    </div>
  {/if}

  <!-- Timer Controls -->
  <div class="flex justify-center space-x-3">
    {#if $timerState.isRunning}
      <!-- Stop Timer Button -->
      <button
        class="btn btn-error {classes.btn}"
        on:click={handleStopTimer}
        disabled={isProcessing}
      >
        {#if isProcessing}
          <span class="loading loading-spinner loading-sm"></span>
        {:else}
          <svg class={`${classes.icon} mr-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        {/if}
        Stop Timer
      </button>

      <!-- Switch Task Button -->
      {#if showTaskSelector && $allTasks.length > 1}
        <div class="dropdown dropdown-top">
          <button tabindex="0" class="btn btn-outline {classes.btn}" disabled={isProcessing}>
            <svg class={classes.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              ></path>
            </svg>
            Switch Task
          </button>
          <ul
            tabindex="0"
            class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 max-h-60 overflow-y-auto"
          >
            {#each $allTasks.filter((t) => t.id !== $timerState.taskId) as task (task.id)}
              <li>
                <button
                  on:click={() => {
                    selectedTaskId = task.id;
                    handleSwitchTask();
                  }}
                  disabled={isProcessing}
                  class="text-left"
                >
                  <div
                    class="w-3 h-3 rounded-full bg-{task.color || 'primary'} flex-shrink-0"
                  ></div>
                  <span class="truncate">{task.name}</span>
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    {:else}
      <!-- Start Timer Button -->
      <button
        class="btn btn-primary {classes.btn}"
        on:click={handleStartTimer}
        disabled={!selectedTaskId || isProcessing}
      >
        {#if isProcessing}
          <span class="loading loading-spinner loading-sm"></span>
        {:else}
          <svg class={`${classes.icon} mr-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9 4h10a1 1 0 001-1V7a1 1 0 00-1-1H7a1 1 0 00-1 1v10a1 1 0 001 1z"
            ></path>
          </svg>
        {/if}
        Start Timer
      </button>

      <!-- Quick Start Buttons (for recently used tasks) -->
      {#if $allTasks.length > 0 && !showTaskSelector}
        <div class="dropdown dropdown-top">
          <button tabindex="0" class="btn btn-outline {classes.btn}">
            <svg class={classes.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
              ></path>
            </svg>
            Quick Start
          </button>
          <ul
            tabindex="0"
            class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 max-h-60 overflow-y-auto"
          >
            {#each $allTasks.slice(0, 5) as task (task.id)}
              <li>
                <button
                  on:click={() => {
                    selectedTaskId = task.id;
                    handleStartTimer();
                  }}
                  disabled={isProcessing}
                  class="text-left"
                >
                  <div
                    class="w-3 h-3 rounded-full bg-{task.color || 'primary'} flex-shrink-0"
                  ></div>
                  <span class="truncate">{task.name}</span>
                  {#if task.totalTime > 0}
                    <span class="text-xs opacity-60">
                      {Math.round(task.totalTime / (1000 * 60))}m
                    </span>
                  {/if}
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Helper Text -->
  {#if !$timerState.isRunning && $allTasks.length === 0}
    <div class="text-center text-base-content/60 text-sm">
      <p>No tasks available. Create a task first to start timing.</p>
    </div>
  {:else if !$timerState.isRunning && !selectedTaskId}
    <div class="text-center text-base-content/60 text-sm">
      <p>Select a task above to start tracking your work time.</p>
    </div>
  {/if}
</div>

<style>
  .dropdown-content {
    z-index: 1000;
  }

  /* Custom task color indicators */
  .dropdown-content .bg-primary {
    background-color: hsl(var(--p));
  }
  .dropdown-content .bg-secondary {
    background-color: hsl(var(--s));
  }
  .dropdown-content .bg-accent {
    background-color: hsl(var(--a));
  }
  .dropdown-content .bg-success {
    background-color: hsl(var(--su));
  }
  .dropdown-content .bg-warning {
    background-color: hsl(var(--wa));
  }
  .dropdown-content .bg-error {
    background-color: hsl(var(--er));
  }
  .dropdown-content .bg-info {
    background-color: hsl(var(--in));
  }
</style>
