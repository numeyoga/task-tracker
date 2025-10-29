<script>
  import { timerState, mealBreakState, timerActions } from '../../stores/timer.js';
  import { allTasks, activeTask } from '../../stores/tasks.js';

  // Timer display components would go here - for now using inline implementation
  let selectedTaskId = null;

  // Loading states
  let isStarting = false;
  let isStopping = false;
  let isMealStarting = false;
  let isMealStopping = false;

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
      isStarting = true;
      await timerActions.startTimer(selectedTaskId);
    } catch (error) {
      console.error('Failed to start timer:', error);
    } finally {
      isStarting = false;
    }
  }

  async function stopTimer() {
    try {
      isStopping = true;
      await timerActions.stopTimer();
    } catch (error) {
      console.error('Failed to stop timer:', error);
    } finally {
      isStopping = false;
    }
  }

  async function startMealBreak() {
    try {
      isMealStarting = true;
      await timerActions.startMealBreak();
    } catch (error) {
      console.error('Failed to start meal break:', error);
    } finally {
      isMealStarting = false;
    }
  }

  async function stopMealBreak() {
    try {
      isMealStopping = true;
      await timerActions.stopMealBreak();
    } catch (error) {
      console.error('Failed to stop meal break:', error);
    } finally {
      isMealStopping = false;
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
    <div class="card-body">
      <!-- Timer Display -->
      <div class="mb-8 text-center relative">
        <!-- Animated ring when timer is running -->
        {#if $timerState.isRunning}
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="timer-ring"></div>
          </div>
        {/if}

        <div class="relative z-10">
          <div
            class="text-4xl md:text-5xl font-mono font-bold text-primary mb-3 {$timerState.isRunning ? 'timer-pulse' : ''}"
          >
            {$timerState.formattedElapsed || '00:00:00'}
          </div>
          {#if $timerState.isRunning && $timerState.taskName}
            <div class="flex items-center justify-center space-x-2 text-lg text-base-content/70">
              <div class="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span>Working on:</span>
              <span class="font-semibold text-primary">{$timerState.taskName}</span>
            </div>
          {:else}
            <div class="text-lg text-base-content/60">Ready to start working</div>
          {/if}
        </div>
      </div>

      <!-- Task Selection -->
      <div class="mb-6">
        <label class="label" for="task-select">
          <span class="label-text font-semibold">
            {$timerState.isRunning ? 'Current Task' : 'Select Task'}
          </span>
        </label>
        {#if !$timerState.isRunning}
          <select
            id="task-select"
            class="select select-bordered select-lg w-full max-w-md mx-auto"
            bind:value={selectedTaskId}
          >
            <option value={null} disabled>Choose a task to start timing...</option>
            {#each $allTasks.filter(t => !t.isArchived) as task (task.id)}
              <option value={task.id}>
                {task.name} • {Math.floor((task.totalTime || 0) / (1000 * 60 * 60))}h {Math.floor(((task.totalTime || 0) % (1000 * 60 * 60)) / (1000 * 60))}m total
              </option>
            {/each}
          </select>
          {#if $allTasks.filter(t => !t.isArchived).length === 0}
            <div class="alert alert-warning mt-4">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                ></path>
              </svg>
              <span>No tasks available. Create a task first to start timing.</span>
            </div>
          {/if}
        {:else}
          <div class="flex items-center justify-center space-x-3 p-4 bg-primary/10 rounded-lg max-w-md mx-auto">
            <div class="w-4 h-4 bg-success rounded-full animate-pulse"></div>
            <span class="text-lg font-semibold text-primary">{$timerState.taskName}</span>
          </div>
        {/if}
      </div>

      <!-- Timer Controls -->
      <div class="flex justify-center space-x-3">
        {#if $timerState.isRunning}
          <button class="btn btn-error btn-lg gap-2" on:click={stopTimer} disabled={isStopping}>
            {#if isStopping}
              <span class="loading loading-spinner loading-sm"></span>
              <span>Stopping...</span>
            {:else}
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2"></rect>
              </svg>
              <span>Stop Timer</span>
            {/if}
          </button>
        {:else}
          <button
            class="btn btn-primary btn-lg gap-2"
            on:click={startTimer}
            disabled={!selectedTaskId || isStarting}
          >
            {#if isStarting}
              <span class="loading loading-spinner loading-sm"></span>
              <span>Starting...</span>
            {:else}
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"></path>
              </svg>
              <span>Start Timer</span>
            {/if}
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
            <button class="btn btn-warning gap-2" on:click={stopMealBreak} disabled={isMealStopping}>
              {#if isMealStopping}
                <span class="loading loading-spinner loading-sm"></span>
                Ending...
              {:else}
                End Break
              {/if}
            </button>
          {:else}
            <button class="btn btn-outline gap-2" on:click={startMealBreak} disabled={isMealStarting}>
              {#if isMealStarting}
                <span class="loading loading-spinner loading-sm"></span>
                Starting...
              {:else}
                Start Meal Break
              {/if}
            </button>
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

<style>
  /* Timer pulse animation */
  .timer-pulse {
    animation: pulse-timer 2s ease-in-out infinite;
  }

  @keyframes pulse-timer {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.95;
      transform: scale(1.02);
    }
  }

  /* Animated ring around timer */
  .timer-ring {
    width: 280px;
    height: 280px;
    border-radius: 50%;
    border: 3px solid transparent;
    border-top-color: hsl(var(--p) / 0.3);
    border-right-color: hsl(var(--p) / 0.2);
    animation: rotate-ring 3s linear infinite;
  }

  @keyframes rotate-ring {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Better select styling */
  select.select-lg {
    font-size: 1rem;
    min-height: 3rem;
  }

  /* Smooth transitions */
  .card {
    transition: all 0.3s ease;
  }

  .btn {
    transition: all 0.2s ease;
  }

  .btn:active {
    transform: scale(0.95);
  }
</style>
