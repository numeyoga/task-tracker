<script>
  import { createEventDispatcher } from 'svelte';
  import { activeTask, sortedTasks, taskActions, taskUtils } from '../../stores/tasks.js';
  import { timerState } from '../../stores/timer.js';

  const dispatch = createEventDispatcher();

  export let showActions = true;
  export let showStats = true;
  export let allowSelection = true;
  export let compact = false;

  let selectedTaskId = null;
  let isProcessing = false;

  // Task actions
  async function handleSetActive(taskId) {
    if (isProcessing) return;

    try {
      isProcessing = true;
      await taskActions.setActiveTask(taskId);
      dispatch('taskActivated', { taskId });
    } catch (error) {
      dispatch('error', { message: `Failed to set active task: ${error.message}` });
    } finally {
      isProcessing = false;
    }
  }

  async function handleDeleteTask(taskId, taskName) {
    if (isProcessing) return;

    const confirmed = confirm(
      `Are you sure you want to delete the task "${taskName}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      isProcessing = true;
      await taskActions.deleteTask(taskId);
      dispatch('taskDeleted', { taskId, taskName });
    } catch (error) {
      dispatch('error', { message: `Failed to delete task: ${error.message}` });
    } finally {
      isProcessing = false;
    }
  }

  function handleEditTask(task) {
    dispatch('editTask', { task });
  }

  function handleTaskSelect(taskId) {
    if (!allowSelection) return;
    selectedTaskId = selectedTaskId === taskId ? null : taskId;
    dispatch('taskSelected', { taskId: selectedTaskId });
  }

  function getTaskColorClass(color) {
    const colorMap = {
      primary: 'bg-primary text-primary-content',
      secondary: 'bg-secondary text-secondary-content',
      accent: 'bg-accent text-accent-content',
      success: 'bg-success text-success-content',
      warning: 'bg-warning text-warning-content',
      error: 'bg-error text-error-content',
      info: 'bg-info text-info-content',
      neutral: 'bg-neutral text-neutral-content'
    };
    return colorMap[color] || colorMap.primary;
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

<div class="space-y-3">
  {#if $sortedTasks.length === 0}
    <!-- Empty State -->
    <div class="text-center py-12 {compact ? 'py-8' : ''}">
      <svg
        class="w-16 h-16 mx-auto text-base-content/30 mb-4 {compact ? 'w-12 h-12 mb-3' : ''}"
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
      <h3 class="text-lg font-semibold text-base-content mb-2 {compact ? 'text-base mb-1' : ''}">
        No Tasks Yet
      </h3>
      <p class="text-base-content/70 mb-4 {compact ? 'text-sm mb-3' : ''}">
        Create your first task to start tracking time
      </p>
      <button
        class="btn btn-primary {compact ? 'btn-sm' : ''}"
        on:click={() => dispatch('createTask')}
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"
          ></path>
        </svg>
        Create Task
      </button>
    </div>
  {:else}
    <!-- Task List -->
    {#each $sortedTasks as task (task.id)}
      <div
        class="card bg-base-100 border border-base-300 hover:border-base-content/20 transition-all duration-200 cursor-pointer
        {compact ? 'card-compact' : ''}
        {selectedTaskId === task.id ? 'ring-2 ring-primary ring-opacity-50' : ''}
        {task.isActive ? 'border-primary border-2' : ''}
        {$timerState.isRunning && $timerState.taskId === task.id ? 'bg-primary/5' : ''}"
        on:click={() => allowSelection && handleTaskSelect(task.id)}
        on:keydown={(e) =>
          allowSelection && (e.key === 'Enter' || e.key === ' ') && handleTaskSelect(task.id)}
        tabindex={allowSelection ? 0 : -1}
        role={allowSelection ? 'button' : 'listitem'}
      >
        <div class="card-body {compact ? 'p-3' : 'p-4'}">
          <div class="flex items-center justify-between">
            <!-- Task Info -->
            <div class="flex items-center space-x-3 flex-1 min-w-0">
              <!-- Color Indicator -->
              <div
                class="w-4 h-4 rounded-full flex-shrink-0 {getTaskIndicatorClass(task.color)}"
              ></div>

              <!-- Task Details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1">
                  <h3 class="font-semibold text-base-content truncate {compact ? 'text-sm' : ''}">
                    {task.name}
                  </h3>

                  <!-- Status Badges -->
                  {#if task.isActive}
                    <span class="badge badge-primary badge-xs {compact ? 'badge-xs' : 'badge-sm'}">
                      Active
                    </span>
                  {/if}

                  {#if $timerState.isRunning && $timerState.taskId === task.id}
                    <span
                      class="badge badge-success badge-xs {compact
                        ? 'badge-xs'
                        : 'badge-sm'} animate-pulse"
                    >
                      Running
                    </span>
                  {/if}
                </div>

                <!-- Task Statistics -->
                {#if showStats}
                  <div class="flex items-center space-x-4 text-sm text-base-content/70">
                    <span class="flex items-center space-x-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <span>{taskUtils.formatTaskTime(task.totalTime)}</span>
                    </span>

                    {#if task.createdAt}
                      <span class="flex items-center space-x-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          ></path>
                        </svg>
                        <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
                      </span>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>

            <!-- Actions -->
            {#if showActions}
              <div class="flex items-center space-x-1 flex-shrink-0">
                <!-- Set Active Button -->
                {#if !task.isActive}
                  <button
                    class="btn btn-ghost btn-xs {compact ? 'btn-xs' : 'btn-sm'}"
                    on:click|stopPropagation={() => handleSetActive(task.id)}
                    disabled={isProcessing}
                    title="Set as active task"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </button>
                {/if}

                <!-- Edit Button -->
                <button
                  class="btn btn-ghost btn-xs {compact ? 'btn-xs' : 'btn-sm'}"
                  on:click|stopPropagation={() => handleEditTask(task)}
                  disabled={isProcessing}
                  title="Edit task"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    ></path>
                  </svg>
                </button>

                <!-- Delete Button -->
                {#if !task.isActive && !($timerState.isRunning && $timerState.taskId === task.id)}
                  <button
                    class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content {compact
                      ? 'btn-xs'
                      : 'btn-sm'}"
                    on:click|stopPropagation={() => handleDeleteTask(task.id, task.name)}
                    disabled={isProcessing}
                    title="Delete task"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                {/if}
              </div>
            {/if}
          </div>

          <!-- Progress Bar (if task has time) -->
          {#if task.totalTime > 0 && showStats}
            <div class="w-full bg-base-200 rounded-full h-1.5 mt-2">
              <div
                class="h-1.5 rounded-full {getTaskColorClass(task.color).split(' ')[0]}"
                style="width: {Math.min(100, (task.totalTime / (8 * 60 * 60 * 1000)) * 100)}%"
              ></div>
            </div>
          {/if}
        </div>
      </div>
    {/each}

    <!-- Summary Stats -->
    {#if showStats && $sortedTasks.length > 1}
      <div class="stats stats-horizontal bg-base-200/50 w-full {compact ? 'stats-horizontal' : ''}">
        <div class="stat">
          <div class="stat-title {compact ? 'text-xs' : 'text-sm'}">Total Tasks</div>
          <div class="stat-value text-primary {compact ? 'text-lg' : 'text-2xl'}">
            {$sortedTasks.length}
          </div>
        </div>

        <div class="stat">
          <div class="stat-title {compact ? 'text-xs' : 'text-sm'}">Total Time</div>
          <div class="stat-value text-success {compact ? 'text-lg' : 'text-2xl'}">
            {taskUtils.formatTaskTime(
              $sortedTasks.reduce((sum, task) => sum + (task.totalTime || 0), 0)
            )}
          </div>
        </div>

        <div class="stat">
          <div class="stat-title {compact ? 'text-xs' : 'text-sm'}">Active Task</div>
          <div class="stat-value text-accent {compact ? 'text-sm' : 'text-lg'} truncate">
            {$activeTask?.name || 'None'}
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .card:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.1);
  }

  .card[role='button']:focus {
    outline: 2px solid hsl(var(--p));
    outline-offset: 2px;
  }
</style>
