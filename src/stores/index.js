/**
 * Stores Index
 * Central export point for all Svelte stores and store subscriptions
 */

import { derived } from 'svelte/store';

// Import all stores
import {
  timerState,
  mealBreakState,
  timerError,
  timerStatus,
  timerActions,
  timerUtils
} from './timer.js';

import {
  allTasks,
  activeTask,
  tasksLoading,
  tasksError,
  taskStats,
  sortedTasks,
  taskColors,
  taskActions,
  taskUtils
} from './tasks.js';

import {
  currentSettings,
  settingsLoading,
  settingsError,
  availableThemes,
  formattedSettings,
  currentThemeInfo,
  settingsActions,
  settingsUtils
} from './settings.js';

import {
  currentView,
  previousView,
  viewHistory,
  modalState,
  sidebarState,
  viewLoadingStates,
  breadcrumbs,
  currentViewInfo,
  navigationItems,
  canNavigateBack,
  viewActions,
  modalActions,
  viewUtils
} from './view.js';

import {
  dailyReport,
  weeklyReport,
  availableWeeks,
  auditData,
  selectedDate,
  selectedWeekStart,
  reportsLoading,
  reportsError,
  auditDateRange,
  formattedDailyReport,
  formattedWeeklyReport,
  weeklySummaryStats,
  reportActions,
  reportUtils
} from './reports.js';

// Import service registry for store initialization
import { getServiceRegistry, initializeServices } from '../services/index.js';

/**
 * Application store manager
 * Handles initialization and coordination between stores
 */
export class StoreManager {
  constructor() {
    this.initialized = false;
    this.subscriptions = new Map();
  }

  /**
   * Initialize all stores with services
   */
  async initialize() {
    if (this.initialized) {
      console.warn('StoreManager already initialized');
      return;
    }

    try {
      console.log('Initializing stores...');

      // Ensure services are initialized first
      await initializeServices();

      // Initialize stores in order of dependencies
      await viewActions.initialize(); // First - sets up navigation
      await settingsActions.initialize(); // Settings needed by timer
      await taskActions.initialize(); // Tasks needed by timer
      await timerActions.initialize(); // Timer depends on tasks
      await reportActions.initialize(); // Reports depend on data

      // Set up cross-store subscriptions
      this.setupCrossStoreSubscriptions();

      this.initialized = true;
      console.log('All stores initialized successfully');
    } catch (error) {
      console.error('Error initializing stores:', error);
      throw error;
    }
  }

  /**
   * Set up subscriptions between stores for data consistency
   */
  setupCrossStoreSubscriptions() {
    // When timer stops, refresh task data and reports
    const timerStoppedSub = timerState.subscribe((state) => {
      if (!state.isRunning && this.initialized) {
        // Refresh the task that was being timed
        if (state.taskId) {
          taskActions.updateTaskTotalTime(state.taskId);
        }
        // Refresh current reports
        reportActions.refreshCurrentReports();
      }
    });
    this.subscriptions.set('timerStopped', timerStoppedSub);

    // When settings change, update relevant services
    const settingsChangedSub = currentSettings.subscribe((settings) => {
      if (this.initialized && settings) {
        // Apply theme changes
        if (document.documentElement.getAttribute('data-theme') !== settings.theme) {
          settingsActions.applyTheme(settings.theme);
        }
      }
    });
    this.subscriptions.set('settingsChanged', settingsChangedSub);

    // When active task changes, update view state if on timer view
    const activeTaskSub = activeTask.subscribe((task) => {
      if (this.initialized) {
        // Could update view state or breadcrumbs based on active task
        console.log('Active task changed:', task?.name || 'none');
      }
    });
    this.subscriptions.set('activeTask', activeTaskSub);

    // Auto-save timer state changes
    let saveTimer = null;
    const autoSaveSub = timerState.subscribe((state) => {
      if (this.initialized && state.isRunning) {
        // Clear previous timer
        if (saveTimer) {
          clearTimeout(saveTimer);
        }
        // Set new timer for auto-save (30 seconds default)
        saveTimer = setTimeout(async () => {
          try {
            const serviceRegistry = getServiceRegistry();
            const dataService = serviceRegistry.getService('dataService');
            await dataService.autoSave();
          } catch (error) {
            console.error('Auto-save failed:', error);
          }
        }, 30000);
      }
    });
    this.subscriptions.set('autoSave', autoSaveSub);

    console.log('Cross-store subscriptions established');
  }

  /**
   * Destroy store manager and cleanup subscriptions
   */
  async destroy() {
    if (!this.initialized) return;

    console.log('Destroying store manager...');

    // Unsubscribe from all store subscriptions
    this.subscriptions.forEach((unsubscribe, name) => {
      try {
        unsubscribe();
        console.log(`Unsubscribed from ${name}`);
      } catch (error) {
        console.error(`Error unsubscribing from ${name}:`, error);
      }
    });
    this.subscriptions.clear();

    // Reset stores to initial state
    timerState.set({
      isRunning: false,
      taskId: null,
      taskName: null,
      startTime: null,
      elapsed: 0,
      formattedElapsed: '00:00:00'
    });

    mealBreakState.set({
      isRunning: false,
      startTime: null,
      elapsed: 0,
      formattedElapsed: '00:00:00'
    });

    allTasks.set([]);
    activeTask.set(null);
    dailyReport.set(null);
    weeklyReport.set(null);

    this.initialized = false;
    console.log('Store manager destroyed');
  }

  /**
   * Get store health status
   */
  getHealthStatus() {
    return {
      initialized: this.initialized,
      subscriptions: this.subscriptions.size,
      stores: {
        timer: { hasError: false }, // Could check timerError store
        tasks: { hasError: false }, // Could check tasksError store
        settings: { hasError: false }, // Could check settingsError store
        view: { initialized: true },
        reports: { hasError: false } // Could check reportsError store
      }
    };
  }
}

// Global store manager instance
let storeManagerInstance = null;

/**
 * Get global store manager
 */
export function getStoreManager() {
  if (!storeManagerInstance) {
    storeManagerInstance = new StoreManager();
  }
  return storeManagerInstance;
}

/**
 * Initialize all application stores
 */
export async function initializeStores() {
  const manager = getStoreManager();
  await manager.initialize();
  return manager;
}

/**
 * Cleanup all stores
 */
export async function destroyStores() {
  if (storeManagerInstance) {
    await storeManagerInstance.destroy();
    storeManagerInstance = null;
  }
}

// Export all stores and actions
export {
  // Timer stores
  timerState,
  mealBreakState,
  timerError,
  timerStatus,
  timerActions,
  timerUtils,

  // Task stores
  allTasks,
  activeTask,
  tasksLoading,
  tasksError,
  taskStats,
  sortedTasks,
  taskColors,
  taskActions,
  taskUtils,

  // Settings stores
  currentSettings,
  settingsLoading,
  settingsError,
  availableThemes,
  formattedSettings,
  currentThemeInfo,
  settingsActions,
  settingsUtils,

  // View stores
  currentView,
  previousView,
  viewHistory,
  modalState,
  sidebarState,
  viewLoadingStates,
  breadcrumbs,
  currentViewInfo,
  navigationItems,
  canNavigateBack,
  viewActions,
  modalActions,
  viewUtils,

  // Report stores
  dailyReport,
  weeklyReport,
  availableWeeks,
  auditData,
  selectedDate,
  selectedWeekStart,
  reportsLoading,
  reportsError,
  auditDateRange,
  formattedDailyReport,
  formattedWeeklyReport,
  weeklySummaryStats,
  reportActions,
  reportUtils
};

/**
 * Utility functions for common store operations
 */
export const storeUtils = {
  /**
   * Subscribe to multiple stores with cleanup
   */
  subscribeToMultiple(storeSubscriptions) {
    const unsubscribers = storeSubscriptions.map(({ store, handler }) => {
      return store.subscribe(handler);
    });

    // Return cleanup function
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  },

  /**
   * Create derived store from multiple sources
   */
  deriveFromMultiple(stores, deriveFn) {
    return derived(stores, deriveFn);
  },

  /**
   * Wait for store to have specific value
   */
  waitForStoreValue(store, predicate, timeout = 5000) {
    return new Promise((resolve, reject) => {
      let unsubscribe;
      const timer = setTimeout(() => {
        if (unsubscribe) unsubscribe();
        reject(new Error('Timeout waiting for store value'));
      }, timeout);

      unsubscribe = store.subscribe((value) => {
        if (predicate(value)) {
          clearTimeout(timer);
          unsubscribe();
          resolve(value);
        }
      });
    });
  },

  /**
   * Batch store updates to minimize reactivity
   */
  batchUpdates(updates) {
    // Execute all updates synchronously to batch them
    updates.forEach((update) => update());
  }
};
