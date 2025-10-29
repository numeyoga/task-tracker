/**
 * View Store
 * Manages current view state and navigation (no routing)
 */

import { writable, derived } from 'svelte/store';

/**
 * Available views in the application
 */
export const availableViews = [
  {
    id: 'timer',
    name: 'Timer',
    icon: 'timer',
    description: 'Track time on tasks and manage active work'
  },
  {
    id: 'tasks',
    name: 'Tasks',
    icon: 'list',
    description: 'Manage work tasks and view task statistics'
  },
  {
    id: 'reports',
    name: 'Reports',
    icon: 'chart',
    description: 'View daily and weekly work reports'
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: 'settings',
    description: 'Configure application preferences'
  },
  {
    id: 'audit',
    name: 'Audit',
    icon: 'history',
    description: 'View complete work history and audit data'
  }
];

/**
 * Current active view
 */
export const currentView = writable('timer');

/**
 * Previous view (for back navigation)
 */
export const previousView = writable(null);

/**
 * View history for navigation
 */
export const viewHistory = writable(['timer']);

/**
 * Modal/dialog state
 */
export const modalState = writable({
  isOpen: false,
  type: null,
  title: '',
  content: null,
  props: {}
});

/**
 * Sidebar state (for mobile/responsive)
 */
// Load collapsed state from localStorage
const savedCollapsedState = typeof window !== 'undefined'
  ? localStorage.getItem('sidebar-collapsed') === 'true'
  : false;

export const sidebarState = writable({
  isOpen: false,
  isPinned: true, // Desktop default
  isCollapsed: savedCollapsedState // Collapsed to 64px vs 256px
});

// Save collapsed state to localStorage whenever it changes
if (typeof window !== 'undefined') {
  sidebarState.subscribe(($state) => {
    localStorage.setItem('sidebar-collapsed', $state.isCollapsed.toString());
  });
}

/**
 * Loading states for different views
 */
export const viewLoadingStates = writable({
  timer: false,
  tasks: false,
  reports: false,
  settings: false,
  audit: false
});

/**
 * Breadcrumb navigation
 */
export const breadcrumbs = writable([]);

/**
 * Derived store for current view info
 */
export const currentViewInfo = derived([currentView], ([$currentView]) => {
  return availableViews.find((view) => view.id === $currentView) || availableViews[0]; // fallback to timer
});

/**
 * Derived store for navigation items
 */
export const navigationItems = derived([currentView], ([$currentView]) => {
  return availableViews.map((view) => ({
    ...view,
    isActive: view.id === $currentView,
    isAvailable: true // All views are always available
  }));
});

/**
 * Derived store for can navigate back
 */
export const canNavigateBack = derived([viewHistory], ([$viewHistory]) => {
  return $viewHistory.length > 1;
});

/**
 * View actions - functions for managing view state
 */
export const viewActions = {
  /**
   * Navigate to specific view
   */
  navigateTo(viewId, addToHistory = true) {
    const view = availableViews.find((v) => v.id === viewId);
    if (!view) {
      console.error(`View '${viewId}' not found`);
      return false;
    }

    // Store previous view
    currentView.subscribe((current) => {
      if (current !== viewId) {
        previousView.set(current);
      }
    })();

    // Update current view
    currentView.set(viewId);

    // Update history
    if (addToHistory) {
      viewHistory.update((history) => {
        const newHistory = [...history, viewId];
        // Limit history to last 10 views
        return newHistory.slice(-10);
      });
    }

    // Update breadcrumbs
    this.updateBreadcrumbs(viewId);

    // Close sidebar on mobile after navigation
    sidebarState.update((state) => ({
      ...state,
      isOpen: false
    }));

    console.log(`Navigated to view: ${viewId}`);
    return true;
  },

  /**
   * Navigate back to previous view
   */
  navigateBack() {
    return new Promise((resolve) => {
      previousView.subscribe((prev) => {
        if (prev) {
          this.navigateTo(prev, false);
          resolve(true);
        } else {
          // Fallback to timer view if no previous view
          this.navigateTo('timer', false);
          resolve(false);
        }
      })();
    });
  },

  /**
   * Navigate to home (timer view)
   */
  navigateHome() {
    this.navigateTo('timer');
  },

  /**
   * Open modal/dialog
   */
  openModal(type, title, content = null, props = {}) {
    modalState.set({
      isOpen: true,
      type,
      title,
      content,
      props
    });
  },

  /**
   * Close modal/dialog
   */
  closeModal() {
    modalState.set({
      isOpen: false,
      type: null,
      title: '',
      content: null,
      props: {}
    });
  },

  /**
   * Toggle sidebar
   */
  toggleSidebar() {
    sidebarState.update((state) => ({
      ...state,
      isOpen: !state.isOpen
    }));
  },

  /**
   * Pin/unpin sidebar
   */
  toggleSidebarPin() {
    sidebarState.update((state) => ({
      ...state,
      isPinned: !state.isPinned,
      isOpen: !state.isPinned ? false : state.isOpen
    }));
  },

  /**
   * Toggle sidebar collapsed state (64px vs 256px)
   */
  toggleSidebarCollapse() {
    sidebarState.update((state) => ({
      ...state,
      isCollapsed: !state.isCollapsed
    }));
  },

  /**
   * Set loading state for specific view
   */
  setViewLoading(viewId, isLoading) {
    viewLoadingStates.update((states) => ({
      ...states,
      [viewId]: isLoading
    }));
  },

  /**
   * Update breadcrumbs based on current view
   */
  updateBreadcrumbs(viewId) {
    const viewInfo = availableViews.find((v) => v.id === viewId);
    if (!viewInfo) return;

    // Simple breadcrumb: Home > Current View
    const crumbs = [{ label: 'Home', viewId: 'timer' }];

    if (viewId !== 'timer') {
      crumbs.push({ label: viewInfo.name, viewId });
    }

    breadcrumbs.set(crumbs);
  },

  /**
   * Get view loading state
   */
  isViewLoading(viewId) {
    return derived([viewLoadingStates], ([$viewLoadingStates]) => {
      return $viewLoadingStates[viewId] || false;
    });
  },

  /**
   * Clear view history
   */
  clearHistory() {
    viewHistory.set(['timer']);
    previousView.set(null);
  },

  /**
   * Initialize view state (called on app startup)
   */
  initialize() {
    // Set initial view to timer
    this.navigateTo('timer', false);

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Handle browser back button (for SPA)
    this.setupBrowserNavigation();
  },

  /**
   * Setup keyboard shortcuts for navigation
   */
  setupKeyboardShortcuts() {
    const shortcuts = {
      1: 'timer',
      2: 'tasks',
      3: 'reports',
      4: 'settings',
      5: 'audit'
    };

    document.addEventListener('keydown', (event) => {
      // Only trigger if Alt key is pressed and no input is focused
      if (event.altKey && !event.target.matches('input, textarea, [contenteditable]')) {
        const viewId = shortcuts[event.key];
        if (viewId) {
          event.preventDefault();
          this.navigateTo(viewId);
        }

        // Alt + Backspace for back navigation
        if (event.key === 'Backspace') {
          event.preventDefault();
          this.navigateBack();
        }

        // Alt + Home for home navigation
        if (event.key === 'Home') {
          event.preventDefault();
          this.navigateHome();
        }
      }

      // Escape to close modal
      if (event.key === 'Escape') {
        modalState.update((state) => {
          if (state.isOpen) {
            return {
              isOpen: false,
              type: null,
              title: '',
              content: null,
              props: {}
            };
          }
          return state;
        });
      }
    });
  },

  /**
   * Setup browser navigation handling
   */
  setupBrowserNavigation() {
    // Update URL hash based on current view (optional)
    currentView.subscribe((view) => {
      if (typeof window !== 'undefined') {
        window.location.hash = `#${view}`;
      }
    });

    // Handle hash changes (if user manually changes URL)
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1);
        const validView = availableViews.find((v) => v.id === hash);
        if (validView) {
          this.navigateTo(hash, false);
        }
      });

      // Set initial view from hash if present
      const initialHash = window.location.hash.slice(1);
      const initialView = availableViews.find((v) => v.id === initialHash);
      if (initialView) {
        this.navigateTo(initialHash, false);
      }
    }
  }
};

/**
 * Modal/Dialog utilities
 */
export const modalActions = {
  /**
   * Show confirmation dialog
   */
  showConfirmation(title, message, onConfirm, onCancel = null) {
    viewActions.openModal('confirmation', title, message, {
      onConfirm,
      onCancel
    });
  },

  /**
   * Show alert dialog
   */
  showAlert(title, message, onClose = null) {
    viewActions.openModal('alert', title, message, {
      onClose
    });
  },

  /**
   * Show time correction dialog
   */
  showTimeCorrection(timeEntry, onSave) {
    viewActions.openModal('time-correction', 'Correct Time Entry', null, {
      timeEntry,
      onSave
    });
  },

  /**
   * Show task creation dialog
   */
  showTaskCreation(onSave) {
    viewActions.openModal('task-creation', 'Create New Task', null, {
      onSave
    });
  },

  /**
   * Show task editing dialog
   */
  showTaskEditing(task, onSave) {
    viewActions.openModal('task-editing', 'Edit Task', null, {
      task,
      onSave
    });
  },

  /**
   * Show settings export dialog
   */
  showSettingsExport(exportData) {
    viewActions.openModal('settings-export', 'Export Settings', null, {
      exportData
    });
  },

  /**
   * Show settings import dialog
   */
  showSettingsImport(onImport) {
    viewActions.openModal('settings-import', 'Import Settings', null, {
      onImport
    });
  }
};

/**
 * View utility functions
 */
export const viewUtils = {
  /**
   * Get view title for page title
   */
  getPageTitle(viewId) {
    const viewInfo = availableViews.find((v) => v.id === viewId);
    const appName = 'Work Time Tracker';
    return viewInfo ? `${viewInfo.name} - ${appName}` : appName;
  },

  /**
   * Check if view exists
   */
  isValidView(viewId) {
    return availableViews.some((v) => v.id === viewId);
  },

  /**
   * Get next/previous view for keyboard navigation
   */
  getAdjacentView(currentViewId, direction = 'next') {
    const currentIndex = availableViews.findIndex((v) => v.id === currentViewId);
    if (currentIndex === -1) return null;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % availableViews.length;
    } else {
      newIndex = currentIndex === 0 ? availableViews.length - 1 : currentIndex - 1;
    }

    return availableViews[newIndex];
  },

  /**
   * Format view ID for display
   */
  formatViewName(viewId) {
    const viewInfo = availableViews.find((v) => v.id === viewId);
    return viewInfo ? viewInfo.name : viewId;
  }
};
