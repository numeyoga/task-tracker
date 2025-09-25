/**
 * TaskService Implementation
 * Service for managing work tasks and task operations
 */

import { Task } from '../models/Task.js';

export class TaskService {
  constructor(dataService = null) {
    this.dataService = dataService;
    this.eventListeners = new Map();
  }

  /**
   * Create new work task
   * @param {string} name - Task name (1-100 characters)
   * @param {string} color - DaisyUI color class
   * @returns {Promise<Task>} - Created task
   */
  async createTask(name, color = 'primary') {
    if (typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('Task name is required');
    }

    if (name.length > 100) {
      throw new ValidationError('Task name cannot exceed 100 characters');
    }

    if (typeof color !== 'string' || !color.trim()) {
      throw new ValidationError('Task color is required');
    }

    // Check for duplicate names
    const existingTasks = await this.getAllTasks();
    const duplicateTask = existingTasks.find(
      (task) => task.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (duplicateTask) {
      throw new DuplicateTaskNameError(`Task with name "${name}" already exists`);
    }

    // Create new task
    const task = new Task({
      name: name.trim(),
      color,
      isActive: false,
      totalTime: 0
    });

    // Save to storage
    await this.saveTask(task);

    // Emit event
    this.emit('taskCreated', task.toJSON());

    return task;
  }

  /**
   * Update existing task
   * @param {string} taskId - Task identifier
   * @param {Object} updates - Fields to update
   * @returns {Promise<Task>} - Updated task
   */
  async updateTask(taskId, updates) {
    if (typeof taskId !== 'string' || !taskId) {
      throw new ValidationError('Task ID is required');
    }

    if (!updates || typeof updates !== 'object') {
      throw new ValidationError('Updates object is required');
    }

    // Get existing task
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new TaskNotFoundError(`Task with ID ${taskId} not found`);
    }

    const changes = [];

    // Validate and apply updates
    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || !updates.name.trim()) {
        throw new ValidationError('Task name must be a non-empty string');
      }
      if (updates.name.length > 100) {
        throw new ValidationError('Task name cannot exceed 100 characters');
      }

      // Check for duplicate names (excluding current task)
      const existingTasks = await this.getAllTasks();
      const duplicateTask = existingTasks.find(
        (t) => t.id !== taskId && t.name.toLowerCase() === updates.name.trim().toLowerCase()
      );

      if (duplicateTask) {
        throw new DuplicateTaskNameError(`Task with name "${updates.name}" already exists`);
      }

      if (task.name !== updates.name.trim()) {
        task.name = updates.name.trim();
        changes.push('name');
      }
    }

    if (updates.color !== undefined) {
      if (typeof updates.color !== 'string' || !updates.color.trim()) {
        throw new ValidationError('Task color must be a non-empty string');
      }
      if (task.color !== updates.color) {
        task.color = updates.color;
        changes.push('color');
      }
    }

    if (updates.isActive !== undefined) {
      if (typeof updates.isActive !== 'boolean') {
        throw new ValidationError('Task isActive must be a boolean');
      }

      // If setting as active, deactivate other tasks first
      if (updates.isActive && !task.isActive) {
        await this.deactivateAllTasks();
        task.isActive = true;
        changes.push('isActive');
      } else if (!updates.isActive && task.isActive) {
        task.isActive = false;
        changes.push('isActive');
      }
    }

    // Only save if there were changes
    if (changes.length > 0) {
      await this.saveTask(task);

      // Emit event
      this.emit('taskUpdated', {
        task: task.toJSON(),
        changes
      });
    }

    return task;
  }

  /**
   * Delete task (soft delete with archiving)
   * @param {string} taskId - Task identifier
   * @returns {Promise<boolean>} - Success status
   */
  async deleteTask(taskId) {
    if (typeof taskId !== 'string' || !taskId) {
      throw new ValidationError('Task ID is required');
    }

    // Get existing task
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new TaskNotFoundError(`Task with ID ${taskId} not found`);
    }

    // Check if task is currently active
    if (task.isActive) {
      throw new ActiveTaskDeleteError('Cannot delete active task. Deactivate it first.');
    }

    // Remove from storage
    await this.removeTask(taskId);

    // Emit event
    this.emit('taskDeleted', {
      taskId: task.id,
      name: task.name
    });

    return true;
  }

  /**
   * Get all active tasks
   * @returns {Task[]} - Array of active tasks
   */
  async getAllTasks() {
    if (!this.dataService) {
      return [];
    }

    try {
      const data = this.dataService.loadData();
      if (!data || !data.tasks) {
        return [];
      }

      return data.tasks.map((taskData) => Task.fromJSON(taskData));
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }

  /**
   * Get task by ID
   * @param {string} taskId - Task identifier
   * @returns {Promise<Task|null>} - Task or null if not found
   */
  async getTaskById(taskId) {
    const tasks = await this.getAllTasks();
    return tasks.find((task) => task.id === taskId) || null;
  }

  /**
   * Get currently active task
   * @returns {Task|null} - Active task or null
   */
  async getActiveTask() {
    const tasks = await this.getAllTasks();
    return tasks.find((task) => task.isActive) || null;
  }

  /**
   * Set specified task as active
   * @param {string} taskId - Task identifier
   * @returns {Promise<Task>} - Activated task
   */
  async setActiveTask(taskId) {
    if (typeof taskId !== 'string' || !taskId) {
      throw new ValidationError('Task ID is required');
    }

    // Get the task to activate
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new TaskNotFoundError(`Task with ID ${taskId} not found`);
    }

    // If already active, return it
    if (task.isActive) {
      return task;
    }

    // Deactivate all other tasks
    await this.deactivateAllTasks();

    // Set this task as active
    task.isActive = true;
    await this.saveTask(task);

    // Emit event
    this.emit('taskActivated', task.toJSON());

    return task;
  }

  /**
   * Get time statistics for specific task
   * @param {string} taskId - Task identifier
   * @param {Object} dateRange - Date range for stats
   * @returns {Object} - Statistics object
   */
  async getTaskStats(taskId, dateRange = null) {
    if (typeof taskId !== 'string' || !taskId) {
      throw new ValidationError('Task ID is required');
    }

    // Verify task exists
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new TaskNotFoundError(`Task with ID ${taskId} not found`);
    }

    if (!this.dataService) {
      return this.createEmptyStats(task);
    }

    try {
      const data = this.dataService.loadData();
      if (!data || !data.timeEntries) {
        return this.createEmptyStats(task);
      }

      // Filter time entries for this task
      let timeEntries = data.timeEntries.filter(
        (entry) => entry.taskId === taskId && entry.endTime !== null
      );

      // Apply date range filter if provided
      if (dateRange && dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);

        timeEntries = timeEntries.filter((entry) => {
          const entryDate = new Date(entry.startTime);
          return entryDate >= startDate && entryDate <= endDate;
        });
      }

      // Calculate statistics
      const totalDuration = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
      const sessionCount = timeEntries.length;
      const averageSession = sessionCount > 0 ? totalDuration / sessionCount : 0;

      // Group by date for daily breakdown
      const dailyBreakdown = this.groupEntriesByDate(timeEntries);

      return {
        taskId: task.id,
        taskName: task.name,
        totalDuration,
        sessionCount,
        averageSession,
        dailyBreakdown,
        dateRange: dateRange || null
      };
    } catch (error) {
      console.error('Error calculating task stats:', error);
      return this.createEmptyStats(task);
    }
  }

  /**
   * Update task total time from time entries
   * @param {string} taskId - Task identifier
   */
  async updateTaskTotalTime(taskId) {
    const task = await this.getTaskById(taskId);
    if (!task) return;

    if (!this.dataService) return;

    try {
      const data = this.dataService.loadData();
      if (!data || !data.timeEntries) return;

      // Calculate total time from completed entries
      const totalTime = data.timeEntries
        .filter((entry) => entry.taskId === taskId && entry.endTime !== null)
        .reduce((sum, entry) => sum + (entry.duration || 0), 0);

      if (task.totalTime !== totalTime) {
        task.totalTime = totalTime;
        await this.saveTask(task);
      }
    } catch (error) {
      console.error('Error updating task total time:', error);
    }
  }

  /**
   * Deactivate all tasks
   */
  async deactivateAllTasks() {
    const tasks = await this.getAllTasks();
    const activeTasks = tasks.filter((task) => task.isActive);

    for (const task of activeTasks) {
      task.isActive = false;
      await this.saveTask(task);
    }
  }

  /**
   * Save task to storage
   */
  async saveTask(task) {
    if (!this.dataService) {
      throw new Error('DataService not available');
    }

    try {
      const data = this.dataService.loadData() || { tasks: [] };
      if (!data.tasks) data.tasks = [];

      // Find and update or add task
      const taskIndex = data.tasks.findIndex((t) => t.id === task.id);
      if (taskIndex >= 0) {
        data.tasks[taskIndex] = task.toJSON();
      } else {
        data.tasks.push(task.toJSON());
      }

      await this.dataService.saveData(data);
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  }

  /**
   * Remove task from storage
   */
  async removeTask(taskId) {
    if (!this.dataService) {
      throw new Error('DataService not available');
    }

    try {
      const data = this.dataService.loadData() || { tasks: [] };
      if (!data.tasks) return;

      data.tasks = data.tasks.filter((t) => t.id !== taskId);
      await this.dataService.saveData(data);
    } catch (error) {
      console.error('Error removing task:', error);
      throw error;
    }
  }

  /**
   * Create empty statistics object
   */
  createEmptyStats(task) {
    return {
      taskId: task.id,
      taskName: task.name,
      totalDuration: 0,
      sessionCount: 0,
      averageSession: 0,
      dailyBreakdown: {},
      dateRange: null
    };
  }

  /**
   * Group time entries by date
   */
  groupEntriesByDate(timeEntries) {
    const dailyBreakdown = {};

    timeEntries.forEach((entry) => {
      const date = entry.date || new Date(entry.startTime).toISOString().split('T')[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = {
          duration: 0,
          sessionCount: 0,
          entries: []
        };
      }

      dailyBreakdown[date].duration += entry.duration || 0;
      dailyBreakdown[date].sessionCount += 1;
      dailyBreakdown[date].entries.push(entry);
    });

    return dailyBreakdown;
  }

  /**
   * Event emitter functionality
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event);
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy service and clean up
   */
  destroy() {
    this.eventListeners.clear();
  }
}

// Custom error classes
export class TaskNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TaskNotFoundError';
  }
}

export class DuplicateTaskNameError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DuplicateTaskNameError';
  }
}

export class ActiveTaskDeleteError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ActiveTaskDeleteError';
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
