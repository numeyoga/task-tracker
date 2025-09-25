<script>
  import { createEventDispatcher } from 'svelte';
  import { taskActions, taskUtils } from '../../stores/tasks.js';

  const dispatch = createEventDispatcher();

  export let task = null; // For editing existing task
  export let mode = 'create'; // 'create' or 'edit'
  export let showModal = true;

  // Form state
  let formData = {
    name: task?.name || '',
    color: task?.color || 'primary'
  };
  let errors = {};
  let isSubmitting = false;
  let modalRef;

  // Available colors for tasks
  const availableColors = [
    { value: 'primary', label: 'Primary', class: 'bg-primary' },
    { value: 'secondary', label: 'Secondary', class: 'bg-secondary' },
    { value: 'accent', label: 'Accent', class: 'bg-accent' },
    { value: 'success', label: 'Success', class: 'bg-success' },
    { value: 'warning', label: 'Warning', class: 'bg-warning' },
    { value: 'error', label: 'Error', class: 'bg-error' },
    { value: 'info', label: 'Info', class: 'bg-info' },
    { value: 'neutral', label: 'Neutral', class: 'bg-neutral' }
  ];

  // Reactive validation
  $: {
    errors = {};

    const nameValidation = taskUtils.validateTaskName(formData.name);
    if (!nameValidation.valid) {
      errors.name = nameValidation.error;
    }

    if (!formData.color) {
      errors.color = 'Please select a color for the task';
    }
  }

  $: isValid = Object.keys(errors).length === 0 && formData.name.trim().length > 0;
  $: title = mode === 'create' ? 'Create New Task' : 'Edit Task';
  $: submitLabel = mode === 'create' ? 'Create Task' : 'Update Task';

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;

    try {
      isSubmitting = true;

      if (mode === 'create') {
        const newTask = await taskActions.createTask(formData.name.trim(), formData.color);
        dispatch('taskCreated', { task: newTask });
      } else if (mode === 'edit' && task) {
        const updatedTask = await taskActions.updateTask(task.id, {
          name: formData.name.trim(),
          color: formData.color
        });
        dispatch('taskUpdated', { task: updatedTask });
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
    formData = {
      name: task?.name || '',
      color: task?.color || 'primary'
    };
    errors = {};
    dispatch('close');
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleClose();
    } else if (event.key === 'Enter' && event.ctrlKey) {
      handleSubmit();
    }
  }

  // Auto-focus name input when modal opens
  function handleModalOpen(node) {
    modalRef = node;
    const nameInput = node.querySelector('input[name="name"]');
    if (nameInput) {
      setTimeout(() => nameInput.focus(), 100);
    }
  }

  function handleColorSelect(color) {
    formData.color = color;
  }
</script>

{#if showModal}
  <!-- Modal Backdrop -->
  <div class="modal modal-open" on:keydown={handleKeydown} use:handleModalOpen>
    <div class="modal-box w-11/12 max-w-md">
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

      <!-- Form -->
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <!-- Task Name -->
        <div class="form-control">
          <label class="label" for="task-name">
            <span class="label-text font-semibold">Task Name</span>
            <span class="label-text-alt text-base-content/60">
              {formData.name.trim().length}/100
            </span>
          </label>
          <input
            id="task-name"
            name="name"
            type="text"
            class="input input-bordered w-full {errors.name ? 'input-error' : ''}"
            placeholder="Enter task name (e.g., Development, Meeting, Research)"
            bind:value={formData.name}
            maxlength="100"
            disabled={isSubmitting}
            required
          />
          {#if errors.name}
            <label class="label">
              <span class="label-text-alt text-error">{errors.name}</span>
            </label>
          {:else}
            <label class="label">
              <span class="label-text-alt">Choose a descriptive name for your work task</span>
            </label>
          {/if}
        </div>

        <!-- Color Selection -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Color</span>
            <span class="label-text-alt text-base-content/60"> For visual organization </span>
          </label>

          <div class="grid grid-cols-4 gap-3">
            {#each availableColors as color (color.value)}
              <button
                type="button"
                class="btn btn-outline p-2 h-auto flex-col space-y-1 {formData.color === color.value
                  ? 'btn-active'
                  : ''}"
                on:click={() => handleColorSelect(color.value)}
                disabled={isSubmitting}
              >
                <div class="w-6 h-6 rounded-full {color.class}"></div>
                <span class="text-xs">{color.label}</span>
              </button>
            {/each}
          </div>

          {#if errors.color}
            <label class="label">
              <span class="label-text-alt text-error">{errors.color}</span>
            </label>
          {/if}
        </div>

        <!-- Preview -->
        {#if formData.name.trim() && formData.color}
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Preview</span>
            </label>
            <div class="card bg-base-200 border">
              <div class="card-body p-3">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-4 h-4 rounded-full {availableColors.find(
                      (c) => c.value === formData.color
                    )?.class}"
                  ></div>
                  <span class="font-medium">{formData.name.trim()}</span>
                  <span class="badge badge-outline badge-sm">New</span>
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
            {submitLabel}
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
{:else}
  <!-- Inline Form (when showModal is false) -->
  <div class="card bg-base-100 border">
    <div class="card-body">
      <h3 class="card-title">{title}</h3>

      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <!-- Task Name -->
        <div class="form-control">
          <label class="label" for="task-name-inline">
            <span class="label-text font-semibold">Task Name</span>
          </label>
          <input
            id="task-name-inline"
            name="name"
            type="text"
            class="input input-bordered {errors.name ? 'input-error' : ''}"
            placeholder="Enter task name"
            bind:value={formData.name}
            maxlength="100"
            disabled={isSubmitting}
            required
          />
          {#if errors.name}
            <label class="label">
              <span class="label-text-alt text-error">{errors.name}</span>
            </label>
          {/if}
        </div>

        <!-- Color Selection -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Color</span>
          </label>
          <div class="flex flex-wrap gap-2">
            {#each availableColors as color (color.value)}
              <button
                type="button"
                class="btn btn-sm {formData.color === color.value ? 'btn-active' : 'btn-outline'}"
                on:click={() => handleColorSelect(color.value)}
                disabled={isSubmitting}
                title={color.label}
              >
                <div class="w-3 h-3 rounded-full {color.class}"></div>
              </button>
            {/each}
          </div>
        </div>

        <!-- Form Actions -->
        <div class="card-actions justify-end">
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
            {/if}
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
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

  /* Color preview circles */
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
