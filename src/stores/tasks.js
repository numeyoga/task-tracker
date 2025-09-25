/**
 * Tasks Store
 * Manages task list and active task state
 */

import { writable, derived } from 'svelte/store';
import { getTaskService } from '../services/index.js';

/**
 * All tasks store
 */
export const allTasks = writable([]);

/**
 * Active task store
 */
export const activeTask = writable(null);

/**
 * Task loading state
 */
export const tasksLoading = writable(false);

/**
 * Task error state
 */
export const tasksError = writable(null);

/**
 * Derived store for task statistics
 */
export const taskStats = derived([allTasks], ([$allTasks]) => ({
  totalTasks: $allTasks.length,
  activeTasks: $allTasks.filter((task) => !task.isArchived).length,
  totalTime: $allTasks.reduce((sum, task) => sum + (task.totalTime || 0), 0),
  averageTime:
    $allTasks.length > 0
      ? $allTasks.reduce((sum, task) => sum + (task.totalTime || 0), 0) / $allTasks.length
      : 0
}));

/**
 * Derived store for sorted tasks (by total time, descending)
 */
export const sortedTasks = derived([allTasks], ([$allTasks]) => {
  return [...$allTasks].sort((a, b) => (b.totalTime || 0) - (a.totalTime || 0));
});

/**
 * Derived store for available task colors
 */
export const taskColors = derived([allTasks], ([$allTasks]) => {
  const usedColors = new Set($allTasks.map((task) => task.color));
  const availableColors = [
    'primary',
    'secondary',
    'accent',
    'neutral',
    'info',
    'success',
    'warning',
    'error'
  ];
  return availableColors.filter((color) => !usedColors.has(color));
});

/**
 * Task actions - functions that interact with TaskService
 */
export const taskActions = {
  /**
   * Initialize tasks store with service
   */
  async initialize() {
    try {
      const taskService = getTaskService();

      // Set up event listeners
      taskService.on('taskCreated', (taskData) => {
        allTasks.update((tasks) => [...tasks, taskData]);
        tasksError.set(null);
      });

      taskService.on('taskUpdated', (data) => {
        allTasks.update((tasks) => {
          const index = tasks.findIndex((t) => t.id === data.task.id);
          if (index >= 0) {
            tasks[index] = data.task;
          }
          return [...tasks];
        });

        // Update active task if it was the one updated
        if (data.changes.includes('isActive')) {
          if (data.task.isActive) {
            activeTask.set(data.task);
          } else {
            activeTask.update((current) =>
              current && current.id === data.task.id ? null : current
            );
          }
        }
      });

      taskService.on('taskDeleted', (data) => {
        allTasks.update((tasks) => tasks.filter((t) => t.id !== data.taskId));
        activeTask.update((current) => (current && current.id === data.taskId ? null : current));
      });

      taskService.on('taskActivated', (taskData) => {
        activeTask.set(taskData);
        // Update the task in the list as well
        allTasks.update((tasks) => {
          return tasks.map((t) => ({
            ...t,
            isActive: t.id === taskData.id
          }));
        });
      });

      // Load initial data
      await this.loadTasks();
    } catch (error) {
      console.error('Error initializing tasks store:', error);
      tasksError.set(`Initialization failed: ${error.message}`);
    }
  },

  /**
   * Load all tasks from service
   */
  async loadTasks() {
    try {
      tasksLoading.set(true);
      const taskService = getTaskService();

      const tasks = await taskService.getAllTasks();
      allTasks.set(tasks.map((task) => task.toJSON()));

      const currentActiveTask = await taskService.getActiveTask();
      activeTask.set(currentActiveTask ? currentActiveTask.toJSON() : null);

      tasksError.set(null);
    } catch (error) {
      console.error('Error loading tasks:', error);
      tasksError.set(`Failed to load tasks: ${error.message}`);
    } finally {
      tasksLoading.set(false);
    }
  },

  /**
   * Create new task
   */
  async createTask(name, color = 'primary') {
    try {
      tasksLoading.set(true);
      const taskService = getTaskService();

      const task = await taskService.createTask(name.trim(), color);
      tasksError.set(null);

      return task;
    } catch (error) {
      console.error('Error creating task:', error);
      tasksError.set(`Failed to create task: ${error.message}`);
      throw error;
    } finally {
      tasksLoading.set(false);
    }
  },

  /**
   * Update existing task
   */
  async updateTask(taskId, updates) {
    try {
      const taskService = getTaskService();

      const updatedTask = await taskService.updateTask(taskId, updates);
      tasksError.set(null);

      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      tasksError.set(`Failed to update task: ${error.message}`);
      throw error;
    }
  },

  /**
   * Delete task
   */
  async deleteTask(taskId) {
    try {
      const taskService = getTaskService();

      const success = await taskService.deleteTask(taskId);
      tasksError.set(null);

      return success;
    } catch (error) {
      console.error('Error deleting task:', error);
      tasksError.set(`Failed to delete task: ${error.message}`);
      throw error;
    }
  },

  /**
   * Set active task
   */
  async setActiveTask(taskId) {
    try {
      const taskService = getTaskService();

      const task = await taskService.setActiveTask(taskId);
      tasksError.set(null);

      return task;
    } catch (error) {
      console.error('Error setting active task:', error);
      tasksError.set(`Failed to set active task: ${error.message}`);
      throw error;
    }
  },

  /**
   * Deactivate all tasks
   */
  async deactivateAllTasks() {
    try {
      const taskService = getTaskService();
      await taskService.deactivateAllTasks();

      activeTask.set(null);
      allTasks.update((tasks) => tasks.map((t) => ({ ...t, isActive: false })));

      tasksError.set(null);
    } catch (error) {
      console.error('Error deactivating tasks:', error);
      tasksError.set(`Failed to deactivate tasks: ${error.message}`);
    }
  },

  /**
   * Get task statistics
   */
  async getTaskStatistics(taskId, dateRange = null) {
    try {
      const taskService = getTaskService();

      const stats = await taskService.getTaskStats(taskId, dateRange);
      tasksError.set(null);

      return stats;
    } catch (error) {
      console.error('Error getting task statistics:', error);
      tasksError.set(`Failed to get task statistics: ${error.message}`);
      throw error;
    }
  },

  /**
   * Update task total time (usually called after timer stops)
   */
  async updateTaskTotalTime(taskId) {
    try {
      const taskService = getTaskService();
      await taskService.updateTaskTotalTime(taskId);

      // Refresh the task in the store
      const task = await taskService.getTaskById(taskId);
      if (task) {
        allTasks.update((tasks) => {
          const index = tasks.findIndex((t) => t.id === taskId);
          if (index >= 0) {
            tasks[index] = task.toJSON();
          }
          return [...tasks];
        });

        // Update active task if it's the one that changed
        activeTask.update((current) =>
          current && current.id === taskId ? task.toJSON() : current
        );
      }
    } catch (error) {
      console.error('Error updating task total time:', error);
    }
  },

  /**
   * Search tasks by name
   */
  searchTasks(query) {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    return derived([allTasks], ([$allTasks]) => {
      return $allTasks.filter((task) => task.name.toLowerCase().includes(searchTerm));
    });
  },

  /**
   * Filter tasks by color
   */
  filterTasksByColor(color) {
    return derived([allTasks], ([$allTasks]) => {
      return $allTasks.filter((task) => task.color === color);
    });
  },

  /**
   * Get tasks with minimum time threshold
   */
  getTasksWithMinTime(minTime = 0) {
    return derived([allTasks], ([$allTasks]) => {
      return $allTasks.filter((task) => (task.totalTime || 0) >= minTime);
    });
  },

  /**
   * Clear tasks error
   */
  clearError() {
    tasksError.set(null);
  },

  /**
   * Get next available color for new task
   */
  getNextAvailableColor() {
    const defaultColors = [
      'primary',
      'secondary',
      'accent',
      'neutral',
      'info',
      'success',
      'warning',
      'error'
    ];

    return derived([allTasks], ([$allTasks]) => {
      const usedColors = new Set($allTasks.map((task) => task.color));
      const availableColor = defaultColors.find((color) => !usedColors.has(color));
      return availableColor || 'primary'; // fallback to primary if all colors used
    });
  }
};

/**
 * Task utility functions
 */
export const taskUtils = {
  /**
   * Format task time for display
   */
  formatTaskTime(milliseconds) {
    if (typeof milliseconds !== 'number' || milliseconds < 0) {
      return '0h 0m';
    }

    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },

  /**
   * Get task efficiency percentage
   */
  getTaskEfficiency(taskTime, totalWorkTime) {
    if (!totalWorkTime || totalWorkTime === 0) return 0;
    return Math.round((taskTime / totalWorkTime) * 100);
  },

  /**
   * Validate task name
   */
  validateTaskName(name) {
    if (typeof name !== 'string') {
      return { valid: false, error: 'Task name must be a string' };
    }

    const trimmed = name.trim();
    if (!trimmed) {
      return { valid: false, error: 'Task name cannot be empty' };
    }

    if (trimmed.length > 100) {
      return { valid: false, error: 'Task name cannot exceed 100 characters' };
    }

    return { valid: true, value: trimmed };
  },

  /**
   * Check if color is valid DaisyUI color
   */
  isValidColor(color) {
    const validColors = [
      'primary',
      'secondary',
      'accent',
      'neutral',
      'base-100',
      'base-200',
      'base-300',
      'info',
      'success',
      'warning',
      'error'
    ];
    return validColors.includes(color);
  },

  /**
   * Generate task summary
   */
  generateTaskSummary(task) {
    if (!task) return null;

    const totalHours = (task.totalTime || 0) / (1000 * 60 * 60);
    const formattedTime = this.formatTaskTime(task.totalTime || 0);

    return {
      name: task.name,
      totalTime: task.totalTime || 0,
      formattedTime,
      totalHours: Math.round(totalHours * 100) / 100, // 2 decimal places
      color: task.color,
      isActive: task.isActive || false,
      createdAt: task.createdAt
    };
  }
};
