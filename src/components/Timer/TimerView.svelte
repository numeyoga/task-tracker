<script>
  import { timerState, mealBreakState, timerActions } from '../../stores/timer.js';
  import { allTasks, activeTask, taskActions } from '../../stores/tasks.js';

  // Timer display components would go here - for now using inline implementation
  let selectedTaskId = null;

  // Initialize with active task if available
  $: if ($activeTask && !selectedTaskId) {
    selectedTaskId = $activeTask.id;
  }

  async function startTimer() {
    if (!selectedTaskId) {
      alert('Please select a task first');
      return;
    }

    try {
      await timerActions.startTimer(selectedTaskId);
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  }

  async function stopTimer() {
    try {
      await timerActions.stopTimer();
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  }

  async function startMealBreak() {
    try {
      await timerActions.startMealBreak();
    } catch (error) {
      console.error('Failed to start meal break:', error);
    }
  }

  async function stopMealBreak() {
    try {
      await timerActions.stopMealBreak();
    } catch (error) {
      console.error('Failed to stop meal break:', error);
    }
  }
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Page Header -->
  <div class="text-center">
    <h1 class="text-4xl font-bold text-base-content mb-2">Work Timer</h1>
    <p class="text-base-content/70">Track your productive work time</p>
  </div>

  <!-- Main Timer Card -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body text-center">
      <!-- Timer Display -->
      <div class="mb-8">
        <div class="text-6xl font-mono font-bold text-primary mb-2">
          {$timerState.formattedElapsed || '00:00:00'}
        </div>
        {#if $timerState.isRunning && $timerState.taskName}
          <div class="text-xl text-base-content/70">
            Working on: <span class="font-semibold text-primary">{$timerState.taskName}</span>
          </div>
        {:else}
          <div class="text-xl text-base-content/50">Ready to start working</div>
        {/if}
      </div>

      <!-- Task Selection -->
      {#if !$timerState.isRunning}
        <div class="mb-6">
          <label class="label">
            <span class="label-text font-semibold">Select Task</span>
          </label>
          <select class="select select-bordered w-full max-w-md" bind:value={selectedTaskId}>
            <option value={null}>Choose a task...</option>
            {#each $allTasks as task (task.id)}
              <option value={task.id}>{task.name}</option>
            {/each}
          </select>
        </div>
      {/if}

      <!-- Timer Controls -->
      <div class="flex justify-center space-x-4">
        {#if $timerState.isRunning}
          <button class="btn btn-error btn-lg" on:click={stopTimer}>
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
            Stop Timer
          </button>
        {:else}
          <button class="btn btn-primary btn-lg" on:click={startTimer} disabled={!selectedTaskId}>
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9 4h10a1 1 0 001-1V7a1 1 0 00-1-1H7a1 1 0 00-1 1v10a1 1 0 001 1z"
              ></path>
            </svg>
            Start Timer
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Meal Break Card -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title flex items-center">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        Meal Break
      </h2>

      <div class="flex items-center justify-between">
        <div class="flex-1">
          {#if $mealBreakState.isRunning}
            <div class="text-2xl font-mono font-bold text-warning">
              {$mealBreakState.formattedElapsed || '00:00:00'}
            </div>
            <div class="text-sm text-base-content/70">Meal break in progress</div>
          {:else}
            <div class="text-base-content/70">No active meal break</div>
          {/if}
        </div>

        <div>
          {#if $mealBreakState.isRunning}
            <button class="btn btn-warning" on:click={stopMealBreak}> End Break </button>
          {:else}
            <button class="btn btn-outline" on:click={startMealBreak}> Start Meal Break </button>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Stats Card -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Today's Progress</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="stat">
          <div class="stat-title">Total Work Time</div>
          <div class="stat-value text-primary">0h 0m</div>
          <div class="stat-desc">Today</div>
        </div>

        <div class="stat">
          <div class="stat-title">Efficiency</div>
          <div class="stat-value text-success">---%</div>
          <div class="stat-desc">Work vs Presence</div>
        </div>

        <div class="stat">
          <div class="stat-title">Active Task</div>
          <div class="stat-value text-accent text-lg">
            {$activeTask?.name || 'None'}
          </div>
          <div class="stat-desc">Currently selected</div>
        </div>
      </div>
    </div>
  </div>
</div>
