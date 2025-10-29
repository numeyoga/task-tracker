<script>
  import { createEventDispatcher } from 'svelte';
  import { allTasks, activeTask, taskActions } from '../../stores/tasks.js';
  import { timerState } from '../../stores/timer.js';

  const dispatch = createEventDispatcher();

  export let size = 'normal'; // 'sm', 'normal', 'lg'
  export let showLabel = true;
  export let showCreateOption = true;
  export let placeholder = 'Select active task...';

  let isProcessing = false;
  let dropdownOpen = false;

  // Size classes
  const sizeClasses = {
    sm: { select: 'select-sm', text: 'text-sm' },
    normal: { select: '', text: 'text-base' },
    lg: { select: 'select-lg', text: 'text-lg' }
  };

  $: classes = sizeClasses[size] || sizeClasses.normal;
  $: currentActiveTask = $activeTask;
  $: availableTasks = $allTasks.filter((task) => !task.isArchived);

  async function handleTaskChange(taskId) {
    if (isProcessing || taskId === currentActiveTask?.id) return;

    try {
      isProcessing = true;

      if (taskId) {
        await taskActions.setActiveTask(taskId);
        dispatch('taskActivated', { taskId });
      } else {
        await taskActions.deactivateAllTasks();
        dispatch('taskDeactivated');
      }
    } catch (error) {
      dispatch('error', { message: `Failed to change active task: ${error.message}` });
    } finally {
      isProcessing = false;
    }
  }

  function handleCreateTask() {
    dropdownOpen = false;
    dispatch('createTask');
  }


  function getTaskIndicatorClass(color) {
    const colorMap = {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      accent: 'bg-accent',
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-error',
      info: 'bg-info',
      neutral: 'bg-neutral'
    };
    return colorMap[color] || colorMap.primary;
  }
</script>

<div class="form-control w-full">
  {#if showLabel}
    <label class="label">
      <span class="label-text font-semibold">Active Task</span>
      <span class="label-text-alt text-base-content/60">
        {availableTasks.length} task{availableTasks.length !== 1 ? 's' : ''}
        {#if $timerState.isRunning && currentActiveTask}
          • Running
        {/if}
      </span>
    </label>
  {/if}

  <div class="dropdown w-full" class:dropdown-open={dropdownOpen}>
    <!-- Dropdown Button -->
    <button
      tabindex="0"
      class="btn btn-outline w-full justify-between {classes.select}"
      class:btn-primary={currentActiveTask}
      class:loading={isProcessing}
      disabled={isProcessing}
      on:click={() => (dropdownOpen = !dropdownOpen)}
    >
      <div class="flex items-center space-x-2 flex-1 min-w-0">
        {#if currentActiveTask}
          <div
            class="w-3 h-3 rounded-full flex-shrink-0 {getTaskIndicatorClass(
              currentActiveTask.color
            )}"
          ></div>
          <span class="truncate {classes.text}">{currentActiveTask.name}</span>
          {#if $timerState.isRunning && $timerState.taskId === currentActiveTask.id}
            <div class="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          {/if}
        {:else}
          <span class="text-base-content/60 {classes.text}">{placeholder}</span>
        {/if}
      </div>

      <svg
        class="w-4 h-4 ml-2 transition-transform duration-200"
        class:rotate-180={dropdownOpen}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
        ></path>
      </svg>
    </button>

    <!-- Dropdown Content -->
    <div
      class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-y-auto border border-base-300 z-50"
    >
      <!-- Clear Selection Option -->
      {#if currentActiveTask}
        <li>
          <button
            on:click={() => {
              handleTaskChange(null);
              dropdownOpen = false;
            }}
            disabled={isProcessing}
            class="text-left"
          >
            <svg
              class="w-4 h-4 text-base-content/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
            <span class="text-base-content/60">Clear selection</span>
          </button>
        </li>
        <li class="menu-title">
          <span>Available Tasks</span>
        </li>
      {/if}

      <!-- Task List -->
      {#each availableTasks as task (task.id)}
        <li>
          <button
            on:click={() => {
              handleTaskChange(task.id);
              dropdownOpen = false;
            }}
            disabled={isProcessing}
            class="text-left {currentActiveTask?.id === task.id ? 'active' : ''}"
          >
            <div class="flex items-center space-x-2 flex-1 min-w-0">
              <div
                class="w-3 h-3 rounded-full flex-shrink-0 {getTaskIndicatorClass(task.color)}"
              ></div>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{task.name}</div>
                {#if task.totalTime > 0}
                  <div class="text-xs text-base-content/60">
                    {Math.round(task.totalTime / (1000 * 60))} minutes total
                  </div>
                {/if}
              </div>
              {#if currentActiveTask?.id === task.id}
                <svg
                  class="w-4 h-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              {/if}
              {#if $timerState.isRunning && $timerState.taskId === task.id}
                <div class="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              {/if}
            </div>
          </button>
        </li>
      {/each}

      <!-- Create Task Option -->
      {#if showCreateOption}
        <li class="menu-title">
          <span>Actions</span>
        </li>
        <li>
          <button
            on:click={handleCreateTask}
            disabled={isProcessing}
            class="text-left text-primary"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
            <span>Create new task</span>
          </button>
        </li>
      {/if}

      <!-- Empty State -->
      {#if availableTasks.length === 0}
        <li class="disabled">
          <div class="text-center py-4">
            <svg
              class="w-8 h-8 mx-auto text-base-content/30 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <p class="text-sm text-base-content/60">No tasks available</p>
            {#if showCreateOption}
              <button class="btn btn-primary btn-sm mt-2" on:click={handleCreateTask}>
                Create First Task
              </button>
            {/if}
          </div>
        </li>
      {/if}
    </div>
  </div>

  <!-- Keyboard shortcuts help -->
  {#if showLabel && dropdownOpen}
    <label class="label">
      <span class="label-text-alt text-base-content/60">
        Use <kbd class="kbd kbd-xs">↑</kbd> <kbd class="kbd kbd-xs">↓</kbd> to navigate,
        <kbd class="kbd kbd-xs">Enter</kbd> to select
      </span>
    </label>
  {/if}
</div>

<!-- Click outside to close dropdown -->
{#if dropdownOpen}
  <div class="fixed inset-0 z-40" on:click={() => (dropdownOpen = false)}></div>
{/if}

<style>
  .dropdown-content {
    top: 100%;
    margin-top: 4px;
    position: absolute;
  }

  .dropdown-open .dropdown-content {
    display: block;
  }

  .dropdown:not(.dropdown-open) .dropdown-content {
    display: none;
  }

  .menu li > button.active {
    background-color: hsl(var(--p) / 0.1);
    color: hsl(var(--p));
  }

  .kbd {
    background-color: hsl(var(--b2));
    border: 1px solid hsl(var(--b3));
  }

  /* Color indicators */
  .bg-primary {
    background-color: hsl(var(--p));
  }
  .bg-secondary {
    background-color: hsl(var(--s));
  }
  .bg-accent {
    background-color: hsl(var(--a));
  }
  .bg-success {
    background-color: hsl(var(--su));
  }
  .bg-warning {
    background-color: hsl(var(--wa));
  }
  .bg-error {
    background-color: hsl(var(--er));
  }
  .bg-info {
    background-color: hsl(var(--in));
  }
  .bg-neutral {
    background-color: hsl(var(--n));
  }
</style>
