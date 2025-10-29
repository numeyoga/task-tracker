<script>
  import { allTasks, taskActions } from '../../stores/tasks.js';
  import EmptyState from '../EmptyState.svelte';
  import TaskForm from './TaskForm.svelte';

  // Modal state
  let showTaskModal = false;
  let modalMode = 'create'; // 'create' or 'edit'
  let selectedTask = null;
  let errorMessage = null;

  // Loading states
  let deletingTaskId = null;
  let archivingTaskId = null;

  function handleNewTask() {
    modalMode = 'create';
    selectedTask = null;
    showTaskModal = true;
  }

  function handleEditTask(task) {
    modalMode = 'edit';
    selectedTask = task;
    showTaskModal = true;
  }

  function handleCloseModal() {
    showTaskModal = false;
    modalMode = 'create';
    selectedTask = null;
    errorMessage = null;
  }

  function handleTaskCreated(event) {
    console.log('Task created:', event.detail.task);
    handleCloseModal();
  }

  function handleTaskUpdated(event) {
    console.log('Task updated:', event.detail.task);
    handleCloseModal();
  }

  function handleError(event) {
    errorMessage = event.detail.message;
    setTimeout(() => {
      errorMessage = null;
    }, 5000);
  }

  async function handleDeleteTask(task) {
    if (!confirm(`Are you sure you want to delete the task "${task.name}"?`)) {
      return;
    }

    try {
      deletingTaskId = task.id;
      await taskActions.deleteTask(task.id);
    } catch (error) {
      errorMessage = error.message;
      setTimeout(() => {
        errorMessage = null;
      }, 5000);
    } finally {
      deletingTaskId = null;
    }
  }

  async function handleArchiveTask(task) {
    try {
      archivingTaskId = task.id;
      await taskActions.updateTask(task.id, { isArchived: !task.isArchived });
    } catch (error) {
      errorMessage = error.message;
      setTimeout(() => {
        errorMessage = null;
      }, 5000);
    } finally {
      archivingTaskId = null;
    }
  }

  // Listen for keyboard shortcut from App.svelte
  if (typeof window !== 'undefined') {
    window.addEventListener('keyboardCreateTask', handleNewTask);
  }
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Error Message -->
  {#if errorMessage}
    <div class="alert alert-error shadow-lg">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
      <span>{errorMessage}</span>
    </div>
  {/if}

  <!-- Page Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-4xl font-bold text-base-content mb-2">Tasks</h1>
      <p class="text-base-content/70">Manage your work tasks</p>
    </div>
    <button class="btn btn-primary" on:click={handleNewTask}>
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"
        ></path>
      </svg>
      New Task
    </button>
  </div>

  <!-- Tasks List -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      {#if $allTasks.length === 0}
        <EmptyState
          icon="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          title="No Tasks Yet"
          description="Create your first task to start tracking time"
          actionText="Create Task"
          actionVariant="primary"
          on:action={handleNewTask}
        />
      {:else}
        <div class="space-y-3">
          {#each $allTasks.filter(t => !t.isArchived) as task (task.id)}
            <div class="flex items-center justify-between p-4 border border-base-300 rounded-lg hover:bg-base-200/50 transition-colors">
              <div class="flex items-center space-x-3 flex-1 min-w-0">
                <div
                  class="w-4 h-4 rounded-full flex-shrink-0"
                  style="background-color: {task.color || 'hsl(var(--p))'}"
                ></div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold truncate">{task.name}</div>
                  <div class="text-sm text-base-content/70">
                    Total: {Math.floor((task.totalTime || 0) / (1000 * 60 * 60))}h {Math.floor(((task.totalTime || 0) % (1000 * 60 * 60)) / (1000 * 60))}m
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2 flex-shrink-0">
                {#if task.isActive}
                  <span class="badge badge-primary">Active</span>
                {/if}
                <button
                  class="btn btn-ghost btn-sm"
                  on:click={() => handleEditTask(task)}
                  title="Edit task"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    ></path>
                  </svg>
                </button>
                <button
                  class="btn btn-ghost btn-sm"
                  on:click={() => handleArchiveTask(task)}
                  title="Archive task"
                  disabled={archivingTaskId === task.id}
                >
                  {#if archivingTaskId === task.id}
                    <span class="loading loading-spinner loading-xs"></span>
                  {:else}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      ></path>
                    </svg>
                  {/if}
                </button>
                <button
                  class="btn btn-ghost btn-sm text-error"
                  on:click={() => handleDeleteTask(task)}
                  title="Delete task"
                  disabled={deletingTaskId === task.id}
                >
                  {#if deletingTaskId === task.id}
                    <span class="loading loading-spinner loading-xs"></span>
                  {:else}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  {/if}
                </button>
              </div>
            </div>
          {/each}

          <!-- Archived Tasks -->
          {#if $allTasks.filter(t => t.isArchived).length > 0}
            <div class="divider">Archived Tasks</div>
            {#each $allTasks.filter(t => t.isArchived) as task (task.id)}
              <div class="flex items-center justify-between p-4 border border-base-300 rounded-lg opacity-60 hover:opacity-100 transition-opacity">
                <div class="flex items-center space-x-3 flex-1 min-w-0">
                  <div
                    class="w-4 h-4 rounded-full flex-shrink-0"
                    style="background-color: {task.color || 'hsl(var(--p))'}"
                  ></div>
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold truncate line-through">{task.name}</div>
                    <div class="text-sm text-base-content/70">
                      Archived • Total: {Math.floor((task.totalTime || 0) / (1000 * 60 * 60))}h {Math.floor(((task.totalTime || 0) % (1000 * 60 * 60)) / (1000 * 60))}m
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-2 flex-shrink-0">
                  <button
                    class="btn btn-ghost btn-sm"
                    on:click={() => handleArchiveTask(task)}
                    title="Restore task"
                    disabled={archivingTaskId === task.id}
                  >
                    {#if archivingTaskId === task.id}
                      <span class="loading loading-spinner loading-xs"></span>
                    {:else}
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        ></path>
                      </svg>
                    {/if}
                  </button>
                  <button
                    class="btn btn-ghost btn-sm text-error"
                    on:click={() => handleDeleteTask(task)}
                    title="Delete permanently"
                    disabled={deletingTaskId === task.id}
                  >
                    {#if deletingTaskId === task.id}
                      <span class="loading loading-spinner loading-xs"></span>
                    {:else}
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                      </svg>
                    {/if}
                  </button>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Task Form Modal -->
{#if showTaskModal}
  <TaskForm
    mode={modalMode}
    task={selectedTask}
    on:close={handleCloseModal}
    on:taskCreated={handleTaskCreated}
    on:taskUpdated={handleTaskUpdated}
    on:error={handleError}
  />
{/if}
