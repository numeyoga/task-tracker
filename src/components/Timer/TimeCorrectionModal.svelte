<script>
  import { createEventDispatcher } from 'svelte';
  import { allTasks } from '../../stores/tasks.js';

  const dispatch = createEventDispatcher();

  export let showModal = false;
  export let timeEntry = null; // TimeEntry object to correct
  export let mode = 'edit'; // 'edit' or 'create'

  // Form state
  let formData = {
    taskId: timeEntry?.taskId || '',
    startTime: timeEntry?.startTime ? formatDateTimeLocal(new Date(timeEntry.startTime)) : '',
    endTime: timeEntry?.endTime ? formatDateTimeLocal(new Date(timeEntry.endTime)) : '',
    duration: timeEntry
      ? Math.round((new Date(timeEntry.endTime) - new Date(timeEntry.startTime)) / (1000 * 60))
      : 0,
    reason: '',
    description: timeEntry?.description || ''
  };

  let errors = {};
  let isSubmitting = false;
  let modalRef;
  let correctionType = 'time'; // 'time', 'task', 'duration', 'split'

  // Available correction reasons
  const correctionReasons = [
    'Forgot to start timer',
    'Forgot to stop timer',
    'Timer ran during break',
    'Wrong task selected',
    'Interrupted by meeting',
    'Technical issue',
    'Split into multiple tasks',
    'Other'
  ];

  // Reactive calculations
  $: {
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (end > start) {
        formData.duration = Math.round((end - start) / (1000 * 60));
      }
    }
  }

  $: selectedTask = $allTasks.find((task) => task.id === formData.taskId);
  $: isValid = validateForm();
  $: title = mode === 'create' ? 'Add Time Entry' : 'Correct Time Entry';

  function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function validateForm() {
    errors = {};

    if (!formData.taskId) {
      errors.taskId = 'Please select a task';
    }

    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);

      if (end <= start) {
        errors.endTime = 'End time must be after start time';
      }

      if (formData.duration > 12 * 60) {
        // 12 hours
        errors.duration = 'Duration seems too long (>12 hours). Please verify.';
      }

      if (formData.duration < 1) {
        errors.duration = 'Duration must be at least 1 minute';
      }

      // Check for future times
      const now = new Date();
      if (start > now) {
        errors.startTime = 'Start time cannot be in the future';
      }
      if (end > now) {
        errors.endTime = 'End time cannot be in the future';
      }
    }

    if (!formData.reason && mode === 'edit') {
      errors.reason = 'Please select a reason for this correction';
    }

    return Object.keys(errors).length === 0;
  }

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  function getTaskColorClass(color) {
    const colorMap = {
      primary: 'text-primary',
      secondary: 'text-secondary',
      accent: 'text-accent',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
      info: 'text-info',
      neutral: 'text-neutral'
    };
    return colorMap[color] || colorMap.primary;
  }

  function getTaskBgClass(color) {
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

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;

    try {
      isSubmitting = true;

      const correctionData = {
        timeEntryId: timeEntry?.id,
        taskId: formData.taskId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        duration: formData.duration * 60 * 1000, // Convert to milliseconds
        reason: formData.reason,
        description: formData.description,
        correctionType,
        originalData: timeEntry
          ? {
              taskId: timeEntry.taskId,
              startTime: timeEntry.startTime,
              endTime: timeEntry.endTime,
              duration: timeEntry.duration
            }
          : null
      };

      if (mode === 'create') {
        dispatch('timeEntryCreated', correctionData);
      } else {
        dispatch('timeEntryCorrected', correctionData);
      }

      handleClose();
    } catch (error) {
      dispatch('error', { message: error.message });
    } finally {
      isSubmitting = false;
    }
  }

  function handleClose() {
    // Reset form
    if (timeEntry) {
      formData = {
        taskId: timeEntry.taskId || '',
        startTime: timeEntry.startTime ? formatDateTimeLocal(new Date(timeEntry.startTime)) : '',
        endTime: timeEntry.endTime ? formatDateTimeLocal(new Date(timeEntry.endTime)) : '',
        duration: timeEntry
          ? Math.round((new Date(timeEntry.endTime) - new Date(timeEntry.startTime)) / (1000 * 60))
          : 0,
        reason: '',
        description: timeEntry.description || ''
      };
    } else {
      formData = {
        taskId: '',
        startTime: '',
        endTime: '',
        duration: 0,
        reason: '',
        description: ''
      };
    }

    errors = {};
    correctionType = 'time';
    dispatch('close');
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleClose();
    } else if (event.key === 'Enter' && event.ctrlKey) {
      handleSubmit();
    }
  }

  // Auto-focus first input when modal opens
  function handleModalOpen(node) {
    modalRef = node;
    const firstInput = node.querySelector('select, input');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  // Quick time helpers
  function setCurrentTime(field) {
    const now = new Date();
    formData[field] = formatDateTimeLocal(now);
  }

  function adjustTime(field, minutes) {
    if (!formData[field]) return;

    const current = new Date(formData[field]);
    current.setMinutes(current.getMinutes() + minutes);
    formData[field] = formatDateTimeLocal(current);
  }

  function suggestEndTime() {
    if (!formData.startTime) return;

    const start = new Date(formData.startTime);
    const suggestedEnd = new Date(start);
    suggestedEnd.setHours(suggestedEnd.getHours() + 1); // Default 1 hour session

    formData.endTime = formatDateTimeLocal(suggestedEnd);
  }
</script>

{#if showModal}
  <!-- Modal Backdrop -->
  <div class="modal modal-open" on:keydown={handleKeydown} use:handleModalOpen>
    <div class="modal-box w-11/12 max-w-2xl">
      <!-- Modal Header -->
      <div class="flex justify-between items-center mb-6">
        <h3 class="font-bold text-lg">{title}</h3>
        <button
          class="btn btn-sm btn-circle btn-ghost"
          on:click={handleClose}
          disabled={isSubmitting}
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

      <!-- Correction Type Selector -->
      {#if mode === 'edit'}
        <div class="form-control mb-6">
          <label class="label">
            <span class="label-text font-semibold">Correction Type</span>
          </label>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              type="button"
              class="btn btn-outline {correctionType === 'time' ? 'btn-active' : ''}"
              on:click={() => (correctionType = 'time')}
            >
              📅 Time
            </button>
            <button
              type="button"
              class="btn btn-outline {correctionType === 'task' ? 'btn-active' : ''}"
              on:click={() => (correctionType = 'task')}
            >
              📋 Task
            </button>
            <button
              type="button"
              class="btn btn-outline {correctionType === 'duration' ? 'btn-active' : ''}"
              on:click={() => (correctionType = 'duration')}
            >
              ⏱️ Duration
            </button>
            <button
              type="button"
              class="btn btn-outline {correctionType === 'split' ? 'btn-active' : ''}"
              on:click={() => (correctionType = 'split')}
            >
              ✂️ Split
            </button>
          </div>
        </div>
      {/if}

      <!-- Form -->
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <!-- Task Selection -->
        <div class="form-control">
          <label class="label" for="task-select">
            <span class="label-text font-semibold">Task</span>
            <span class="label-text-alt text-base-content/60">
              {$allTasks.length} tasks available
            </span>
          </label>
          <select
            id="task-select"
            class="select select-bordered w-full {errors.taskId ? 'select-error' : ''}"
            bind:value={formData.taskId}
            disabled={isSubmitting}
            required
          >
            <option value="">Select a task...</option>
            {#each $allTasks.filter((t) => !t.isArchived) as task}
              <option value={task.id}>{task.name}</option>
            {/each}
          </select>
          {#if errors.taskId}
            <label class="label">
              <span class="label-text-alt text-error">{errors.taskId}</span>
            </label>
          {/if}
        </div>

        <!-- Time Range -->
        <div class="grid md:grid-cols-2 gap-4">
          <!-- Start Time -->
          <div class="form-control">
            <label class="label" for="start-time">
              <span class="label-text font-semibold">Start Time</span>
              <button
                type="button"
                class="label-text-alt link link-primary"
                on:click={() => setCurrentTime('startTime')}
                disabled={isSubmitting}
                title="Set to current time"
              >
                Now
              </button>
            </label>
            <input
              id="start-time"
              type="datetime-local"
              class="input input-bordered {errors.startTime ? 'input-error' : ''}"
              bind:value={formData.startTime}
              on:change={suggestEndTime}
              disabled={isSubmitting}
              required
            />
            <div class="flex space-x-2 mt-1">
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                on:click={() => adjustTime('startTime', -15)}
                disabled={!formData.startTime || isSubmitting}
                title="15 minutes earlier"
              >
                -15m
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                on:click={() => adjustTime('startTime', 15)}
                disabled={!formData.startTime || isSubmitting}
                title="15 minutes later"
              >
                +15m
              </button>
            </div>
            {#if errors.startTime}
              <label class="label">
                <span class="label-text-alt text-error">{errors.startTime}</span>
              </label>
            {/if}
          </div>

          <!-- End Time -->
          <div class="form-control">
            <label class="label" for="end-time">
              <span class="label-text font-semibold">End Time</span>
              <button
                type="button"
                class="label-text-alt link link-primary"
                on:click={() => setCurrentTime('endTime')}
                disabled={isSubmitting}
                title="Set to current time"
              >
                Now
              </button>
            </label>
            <input
              id="end-time"
              type="datetime-local"
              class="input input-bordered {errors.endTime ? 'input-error' : ''}"
              bind:value={formData.endTime}
              disabled={isSubmitting}
              required
            />
            <div class="flex space-x-2 mt-1">
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                on:click={() => adjustTime('endTime', -15)}
                disabled={!formData.endTime || isSubmitting}
                title="15 minutes earlier"
              >
                -15m
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                on:click={() => adjustTime('endTime', 15)}
                disabled={!formData.endTime || isSubmitting}
                title="15 minutes later"
              >
                +15m
              </button>
            </div>
            {#if errors.endTime}
              <label class="label">
                <span class="label-text-alt text-error">{errors.endTime}</span>
              </label>
            {/if}
          </div>
        </div>

        <!-- Duration Display -->
        {#if formData.duration > 0}
          <div class="alert {formData.duration > 8 * 60 ? 'alert-warning' : 'alert-info'}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>
              Duration: <strong>{formatDuration(formData.duration)}</strong>
              {#if formData.duration > 8 * 60}
                (This is quite long - please verify)
              {/if}
            </span>
          </div>
        {/if}

        <!-- Reason for Correction -->
        {#if mode === 'edit'}
          <div class="form-control">
            <label class="label" for="reason">
              <span class="label-text font-semibold">Reason for Correction</span>
              <span class="label-text-alt text-error">Required</span>
            </label>
            <select
              id="reason"
              class="select select-bordered {errors.reason ? 'select-error' : ''}"
              bind:value={formData.reason}
              disabled={isSubmitting}
              required
            >
              <option value="">Select a reason...</option>
              {#each correctionReasons as reason}
                <option value={reason}>{reason}</option>
              {/each}
            </select>
            {#if errors.reason}
              <label class="label">
                <span class="label-text-alt text-error">{errors.reason}</span>
              </label>
            {/if}
          </div>
        {/if}

        <!-- Description -->
        <div class="form-control">
          <label class="label" for="description">
            <span class="label-text font-semibold">Description</span>
            <span class="label-text-alt text-base-content/60">Optional</span>
          </label>
          <textarea
            id="description"
            class="textarea textarea-bordered"
            placeholder="Add notes about this time entry or correction..."
            bind:value={formData.description}
            disabled={isSubmitting}
            maxlength="500"
            rows="3"
          ></textarea>
          <label class="label">
            <span class="label-text-alt">
              {formData.description.length}/500 characters
            </span>
          </label>
        </div>

        <!-- Preview -->
        {#if selectedTask && formData.startTime && formData.endTime}
          <div class="card bg-base-200 border">
            <div class="card-body p-4">
              <h4 class="font-semibold mb-2">Preview</h4>
              <div class="flex items-center space-x-3">
                <div class="w-4 h-4 rounded-full {getTaskBgClass(selectedTask.color)}"></div>
                <div>
                  <div class="font-medium">{selectedTask.name}</div>
                  <div class="text-sm text-base-content/60">
                    {new Date(formData.startTime).toLocaleString()} - {new Date(
                      formData.endTime
                    ).toLocaleString()}
                  </div>
                  <div class="text-sm font-mono">{formatDuration(formData.duration)}</div>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Form Actions -->
        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            on:click={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={!isValid || isSubmitting}>
            {#if isSubmitting}
              <span class="loading loading-spinner loading-sm"></span>
            {:else}
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            {/if}
            {mode === 'create' ? 'Add Entry' : 'Apply Correction'}
          </button>
        </div>
      </form>

      <!-- Keyboard Shortcuts Help -->
      <div class="text-xs text-base-content/60 mt-4 pt-4 border-t border-base-300">
        <div class="flex justify-between">
          <span>Press <kbd class="kbd kbd-xs">Esc</kbd> to close</span>
          <span
            >Press <kbd class="kbd kbd-xs">Ctrl</kbd> + <kbd class="kbd kbd-xs">Enter</kbd> to submit</span
          >
        </div>
      </div>
    </div>

    <!-- Click outside to close -->
    <div class="modal-backdrop" on:click={handleClose}></div>
  </div>
{/if}

<style>
  .modal-backdrop {
    background-color: rgba(0, 0, 0, 0.3);
  }

  .kbd {
    background-color: hsl(var(--b2));
    border: 1px solid hsl(var(--b3));
  }

  /* Color classes */
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

  .text-primary {
    color: hsl(var(--p));
  }
  .text-secondary {
    color: hsl(var(--s));
  }
  .text-accent {
    color: hsl(var(--a));
  }
  .text-success {
    color: hsl(var(--su));
  }
  .text-warning {
    color: hsl(var(--wa));
  }
  .text-error {
    color: hsl(var(--er));
  }
  .text-info {
    color: hsl(var(--in));
  }
  .text-neutral {
    color: hsl(var(--n));
  }
</style>
