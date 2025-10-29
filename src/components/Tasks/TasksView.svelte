<script>
  import { allTasks } from '../../stores/tasks.js';
  import EmptyState from '../EmptyState.svelte';
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Page Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-4xl font-bold text-base-content mb-2">Tasks</h1>
      <p class="text-base-content/70">Manage your work tasks</p>
    </div>
    <button class="btn btn-primary">
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
        />
      {:else}
        <div class="space-y-3">
          {#each $allTasks as task (task.id)}
            <div class="flex items-center justify-between p-4 border border-base-300 rounded-lg">
              <div class="flex items-center space-x-3">
                <div
                  class="w-4 h-4 rounded-full"
                  style="background-color: {task.color || 'hsl(var(--p))'}"
                ></div>
                <div>
                  <div class="font-semibold">{task.name}</div>
                  <div class="text-sm text-base-content/70">
                    Total: {Math.round((task.totalTime || 0) / (1000 * 60))}m
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                {#if task.isActive}
                  <span class="badge badge-primary">Active</span>
                {/if}
                <button class="btn btn-ghost btn-sm">Edit</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
