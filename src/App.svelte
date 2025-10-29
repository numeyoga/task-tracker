<script>
  import { onMount, onDestroy } from 'svelte';
  import { initializeStores, destroyStores } from './stores/index.js';
  import { currentView, viewActions, sidebarState } from './stores/view.js';
  import { timerState, timerActions, timerError } from './stores/timer.js';
  import { activeTask, allTasks, taskActions, tasksError } from './stores/tasks.js';
  import { settingsError } from './stores/settings.js';
  import { reportsError } from './stores/reports.js';

  // Import main layout components
  import Navigation from './components/Navigation.svelte';
  import ErrorNotification from './components/ErrorNotification.svelte';
  import SmoothTransition from './components/SmoothTransition.svelte';

  // Import view components
  import TimerView from './components/Timer/TimerView.svelte';
  import TasksView from './components/Tasks/TasksView.svelte';
  import ReportsView from './components/Reports/ReportsView.svelte';
  import SettingsView from './components/Settings/SettingsView.svelte';
  import AuditView from './components/Reports/AuditView.svelte';

  // Application state
  let isLoading = true;
  let initializationError = null;

  // Keyboard shortcuts state
  let isShortcutHelpVisible = false;

  // Current view component mapping
  const viewComponents = {
    timer: TimerView,
    tasks: TasksView,
    reports: ReportsView,
    settings: SettingsView,
    audit: AuditView
  };

  onDestroy(async () => {
    try {
      // Remove global keyboard listener
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleGlobalKeyboard);
      }
      await destroyStores();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  // Get current view component with transition support
  $: CurrentViewComponent = viewComponents[$currentView] || viewComponents.timer;

  // Keyboard shortcuts handler
  function handleGlobalKeyboard(event) {
    // Skip if user is typing in an input field
    const activeElement = document.activeElement;
    const isInInput =
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true' ||
        activeElement.closest('.modal'));

    // Don't interfere with form inputs, but allow some shortcuts
    if (isInInput && !(event.key === 'Escape' || (event.key === '?' && event.shiftKey))) {
      return;
    }

    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const modifierKey = ctrlKey || metaKey;

    try {
      // Help toggle (Shift + ?)
      if (shiftKey && key === '?') {
        event.preventDefault();
        isShortcutHelpVisible = !isShortcutHelpVisible;
        return;
      }

      // Close help/modals (Escape)
      if (key === 'Escape') {
        event.preventDefault();
        isShortcutHelpVisible = false;
        return;
      }

      // Skip other shortcuts if in input field
      if (isInInput) return;

      // Timer shortcuts (Space = start/stop timer)
      if (key === ' ') {
        event.preventDefault();
        handleTimerToggle();
        return;
      }

      // View navigation shortcuts (1-5)
      const viewKeys = {
        '1': 'timer',
        '2': 'tasks',
        '3': 'reports',
        '4': 'settings',
        '5': 'audit'
      };
      if (viewKeys[key]) {
        event.preventDefault();
        viewActions.setCurrentView(viewKeys[key]);
        return;
      }

      // Task shortcuts (with Ctrl/Cmd)
      if (modifierKey) {
        switch (key) {
          case 'n':
          case 'N':
            // Create new task - switch to tasks view and trigger create
            event.preventDefault();
            viewActions.setCurrentView('tasks');
            // We'll emit a custom event for this
            window.dispatchEvent(new CustomEvent('keyboardCreateTask'));
            break;

          case 't':
          case 'T':
            // Quick task switch - cycle through available tasks
            event.preventDefault();
            handleQuickTaskSwitch();
            break;

          case 's':
          case 'S':
            // Manual save
            event.preventDefault();
            handleManualSave();
            break;

          case 'm':
          case 'M':
            // Toggle meal break
            event.preventDefault();
            handleMealBreakToggle();
            break;
        }
      }

      // Arrow keys for task switching (Alt + arrows)
      if (altKey) {
        switch (key) {
          case 'ArrowUp':
          case 'ArrowDown':
            event.preventDefault();
            handleTaskNavigation(key === 'ArrowUp' ? 'prev' : 'next');
            break;
        }
      }
    } catch (error) {
      console.error('Error in keyboard shortcut handler:', error);
    }
  }

  // Timer toggle handler
  async function handleTimerToggle() {
    try {
      if ($timerState.isRunning) {
        await timerActions.stopTimer();
      } else if ($activeTask) {
        await timerActions.startTimer($activeTask.id, $activeTask.name);
      }
    } catch (error) {
      console.error('Error toggling timer:', error);
    }
  }

  // Quick task switching
  async function handleQuickTaskSwitch() {
    try {
      const availableTasks = $allTasks.filter((task) => !task.isArchived);
      if (availableTasks.length === 0) return;

      const currentIndex = $activeTask
        ? availableTasks.findIndex((t) => t.id === $activeTask.id)
        : -1;

      const nextIndex = (currentIndex + 1) % availableTasks.length;
      const nextTask = availableTasks[nextIndex];

      await taskActions.setActiveTask(nextTask.id);
    } catch (error) {
      console.error('Error switching task:', error);
    }
  }

  // Task navigation with arrow keys
  async function handleTaskNavigation(direction) {
    try {
      const availableTasks = $allTasks.filter((task) => !task.isArchived);
      if (availableTasks.length === 0) return;

      const currentIndex = $activeTask
        ? availableTasks.findIndex((t) => t.id === $activeTask.id)
        : -1;

      let nextIndex;
      if (direction === 'prev') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : availableTasks.length - 1;
      } else {
        nextIndex = currentIndex < availableTasks.length - 1 ? currentIndex + 1 : 0;
      }

      const nextTask = availableTasks[nextIndex];
      await taskActions.setActiveTask(nextTask.id);
    } catch (error) {
      console.error('Error navigating tasks:', error);
    }
  }

  // Manual save handler
  async function handleManualSave() {
    try {
      const serviceRegistry = (await import('./services/index.js')).getServiceRegistry();
      const dataService = serviceRegistry.getService('dataService');
      await dataService.autoSave();
      console.log('Manual save triggered');
    } catch (error) {
      console.error('Error during manual save:', error);
    }
  }

  // Meal break toggle handler
  async function handleMealBreakToggle() {
    try {
      // This will be implemented when meal break component is ready
      console.log('Meal break toggle (to be implemented)');
    } catch (error) {
      console.error('Error toggling meal break:', error);
    }
  }

  // Initialize view management
  onMount(async () => {
    try {
      console.log('Initializing Work Time Tracker...');

      // Initialize all stores and services
      await initializeStores();

      // Set up auto-save from settings
      const serviceRegistry = (await import('./services/index.js')).getServiceRegistry();
      const dataService = serviceRegistry.getService('dataService');
      const settingsService = serviceRegistry.getService('settingsService');

      const settings = await settingsService.getSettings();
      dataService.startAutoSave(settings.autoSaveInterval || 30000);

      // Start automatic data cleanup with settings-based retention
      dataService.startAutoCleanup(settings.dataRetentionWeeks || 5, 24); // Run daily

      // Apply initial theme from settings
      document.documentElement.setAttribute('data-theme', settings.theme || 'bumblebee');

      // Set up global keyboard shortcuts
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleGlobalKeyboard);
      }

      console.log('Application initialized successfully');
      isLoading = false;
    } catch (error) {
      console.error('Failed to initialize application:', error);
      initializationError = error.message;
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>Work Time Tracker</title>
  <meta name="description" content="Track your work time, tasks, and generate reports" />
</svelte:head>

<main class="min-h-screen bg-base-200">
  {#if isLoading}
    <!-- Loading Screen -->
    <div class="hero min-h-screen bg-base-200">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
          <h1 class="text-3xl font-bold text-base-content">Work Time Tracker</h1>
          <p class="py-6 text-base-content/70">Initializing application...</p>
        </div>
      </div>
    </div>
  {:else if initializationError}
    <!-- Initialization Error -->
    <div class="hero min-h-screen bg-error/10">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <div class="text-error text-6xl mb-4">⚠️</div>
          <h1 class="text-3xl font-bold text-error">Initialization Failed</h1>
          <p class="py-6 text-error/80">The application failed to initialize properly:</p>
          <div class="alert alert-error">
            <span>{initializationError}</span>
          </div>
          <div class="mt-6">
            <button class="btn btn-primary" on:click={() => window.location.reload()}>
              Reload Application
            </button>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Main Application Layout - Desktop Only -->
    <div class="flex min-h-screen">
      <!-- Sidebar Navigation -->
      <aside class="{$sidebarState.isCollapsed ? 'w-16' : 'w-64'} bg-base-100 border-r border-base-300 flex-shrink-0 transition-all duration-300">
        <Navigation />
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 bg-base-200 min-w-0">
        <div class="p-6 max-w-7xl">
          {#key $currentView}
            <SmoothTransition duration={300}>
              <div class="view-transition">
                <svelte:component this={CurrentViewComponent} />
              </div>
            </SmoothTransition>
          {/key}
        </div>
      </main>
    </div>

    <!-- Global Error Notifications -->
    <ErrorNotification error={$timerError} type="timer" on:dismiss={() => timerError.set(null)} />
    <ErrorNotification error={$tasksError} type="tasks" on:dismiss={() => tasksError.set(null)} />
    <ErrorNotification
      error={$settingsError}
      type="settings"
      on:dismiss={() => settingsError.set(null)}
    />
    <ErrorNotification
      error={$reportsError}
      type="reports"
      on:dismiss={() => reportsError.set(null)}
    />

    <!-- Keyboard Shortcuts Help Modal -->
    {#if isShortcutHelpVisible}
      <div class="modal modal-open">
        <div class="modal-box w-11/12 max-w-2xl">
          <!-- Modal Header -->
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-bold text-lg">Keyboard Shortcuts</h3>
            <button
              class="btn btn-sm btn-circle btn-ghost"
              on:click={() => (isShortcutHelpVisible = false)}
              aria-label="Close keyboard shortcuts help"
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

          <!-- Shortcuts Grid -->
          <div class="grid md:grid-cols-2 gap-6">
            <!-- General -->
            <div>
              <h4 class="font-semibold text-primary mb-3">General</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm">Show help</span>
                  <kbd class="kbd kbd-sm">Shift + ?</kbd>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Close modals</span>
                  <kbd class="kbd kbd-sm">Esc</kbd>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Manual save</span>
                  <div class="flex space-x-1">
                    <kbd class="kbd kbd-sm">Ctrl</kbd>
                    <kbd class="kbd kbd-sm">S</kbd>
                  </div>
                </div>
              </div>
            </div>

            <!-- Navigation -->
            <div>
              <h4 class="font-semibold text-primary mb-3">Navigation</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm">Timer view</span>
                  <kbd class="kbd kbd-sm">1</kbd>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Tasks view</span>
                  <kbd class="kbd kbd-sm">2</kbd>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Reports view</span>
                  <kbd class="kbd kbd-sm">3</kbd>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Settings view</span>
                  <kbd class="kbd kbd-sm">4</kbd>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Audit view</span>
                  <kbd class="kbd kbd-sm">5</kbd>
                </div>
              </div>
            </div>

            <!-- Timer -->
            <div>
              <h4 class="font-semibold text-primary mb-3">Timer</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm">Start/Stop timer</span>
                  <kbd class="kbd kbd-sm">Space</kbd>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Toggle meal break</span>
                  <div class="flex space-x-1">
                    <kbd class="kbd kbd-sm">Ctrl</kbd>
                    <kbd class="kbd kbd-sm">M</kbd>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tasks -->
            <div>
              <h4 class="font-semibold text-primary mb-3">Tasks</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm">Create new task</span>
                  <div class="flex space-x-1">
                    <kbd class="kbd kbd-sm">Ctrl</kbd>
                    <kbd class="kbd kbd-sm">N</kbd>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Switch to next task</span>
                  <div class="flex space-x-1">
                    <kbd class="kbd kbd-sm">Ctrl</kbd>
                    <kbd class="kbd kbd-sm">T</kbd>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Previous task</span>
                  <div class="flex space-x-1">
                    <kbd class="kbd kbd-sm">Alt</kbd>
                    <kbd class="kbd kbd-sm">↑</kbd>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Next task</span>
                  <div class="flex space-x-1">
                    <kbd class="kbd kbd-sm">Alt</kbd>
                    <kbd class="kbd kbd-sm">↓</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-6 pt-4 border-t border-base-300">
            <div class="text-sm text-base-content/60 text-center">
              Most shortcuts work when not typing in input fields
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="modal-action">
            <button class="btn" on:click={() => (isShortcutHelpVisible = false)}> Close </button>
          </div>
        </div>
        <div
          class="modal-backdrop"
          role="button"
          tabindex="0"
          on:click={() => (isShortcutHelpVisible = false)}
          on:keydown={(e) => e.key === 'Enter' && (isShortcutHelpVisible = false)}
          aria-label="Close modal"
        ></div>
      </div>
    {/if}
  {/if}
</main>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }

  :global(body) {
    margin: 0;
    font-family:
      'Inter',
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      sans-serif;
  }

  /* Custom scrollbar for webkit browsers */
  :global(::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
  }

  /* Focus styles for better accessibility */
  :global(:focus-visible) {
    outline: 2px solid hsl(var(--p));
    outline-offset: 2px;
  }

  /* Animation for view transitions */
  :global(.view-transition) {
    animation: fadeIn 0.2s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Keyboard shortcut styling */
  :global(.kbd) {
    background-color: hsl(var(--b2));
    border: 1px solid hsl(var(--b3));
    border-radius: 0.375rem;
    padding: 0.125rem 0.375rem;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1;
    color: hsl(var(--bc));
  }

  :global(.kbd-sm) {
    padding: 0.125rem 0.25rem;
    font-size: 0.625rem;
  }

  /* Modal backdrop */
  :global(.modal-backdrop) {
    background-color: rgba(0, 0, 0, 0.3);
  }
</style>
