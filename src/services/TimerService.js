/**
 * TimerService Implementation
 * Service for managing task timers and time calculations
 */

import { TimeEntry } from '../models/TimeEntry.js';
import { MealBreak } from '../models/MealBreak.js';

export class TimerService {
  constructor(dataService = null, taskService = null) {
    this.dataService = dataService;
    this.taskService = taskService;
    this.eventListeners = new Map();

    // Current state
    this.activeTimer = null; // Current TimeEntry being timed
    this.activeMealBreak = null; // Current MealBreak being timed
    this.timerInterval = null;
    this.mealBreakInterval = null;

    // Default settings
    this.maxDuration = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    this.tickInterval = 1000; // 1 second

    // Initialize from persisted data
    this.initialize();
  }

  /**
   * Initialize service from persisted data
   */
  async initialize() {
    if (!this.dataService) return;

    try {
      const data = this.dataService.loadData();
      if (data) {
        // Find active timer from time entries
        const activeEntry = data.timeEntries?.find((entry) => !entry.endTime);
        if (activeEntry) {
          this.activeTimer = TimeEntry.fromJSON(activeEntry);
          this.startTimerTicks();
        }

        // Find active meal break
        const activeMeal = data.mealBreaks?.find((mb) => !mb.endTime);
        if (activeMeal) {
          this.activeMealBreak = MealBreak.fromJSON(activeMeal);
          this.startMealBreakTicks();
        }
      }
    } catch (error) {
      this.emit('storageError', error);
    }
  }

  /**
   * Start timing for specified task
   * @param {string} taskId - Task identifier
   * @returns {Promise<TimeEntry>} - Created time entry
   */
  async startTimer(taskId) {
    if (typeof taskId !== 'string' || !taskId) {
      throw new ValidationError('Task ID must be a non-empty string');
    }

    // Check if timer is already active
    if (this.activeTimer) {
      throw new TimerAlreadyActiveError(
        'A timer is already running. Stop it first or use switchTask.'
      );
    }

    // Validate task exists (if taskService is available)
    if (this.taskService) {
      const task = await this.taskService.getTaskById(taskId);
      if (!task) {
        throw new TaskNotFoundError(`Task with ID ${taskId} not found`);
      }
    }

    // Create new time entry
    this.activeTimer = new TimeEntry({
      taskId,
      startTime: new Date(),
      endTime: null
    });

    // Start timer ticks
    this.startTimerTicks();

    // Save to storage
    await this.saveActiveTimer();

    // Emit event
    this.emit('timerStarted', {
      taskId,
      timeEntry: this.activeTimer.toJSON()
    });

    return this.activeTimer;
  }

  /**
   * Stop the currently active timer
   * @returns {Promise<TimeEntry>} - Completed time entry
   */
  async stopTimer() {
    if (!this.activeTimer) {
      throw new NoActiveTimerError('No active timer to stop');
    }

    // Stop the timer
    const completedEntry = this.activeTimer.stop();
    this.stopTimerTicks();

    const taskId = completedEntry.taskId;

    // Save completed entry
    await this.saveCompletedTimer(completedEntry);

    // Clear active timer
    this.activeTimer = null;

    // Emit event
    this.emit('timerStopped', {
      taskId,
      timeEntry: completedEntry.toJSON()
    });

    return completedEntry;
  }

  /**
   * Get current timer status and elapsed time
   * @returns {Object|null} - Current timer info or null
   */
  getCurrentTimer() {
    if (!this.activeTimer) {
      return null;
    }

    return {
      taskId: this.activeTimer.taskId,
      startTime: this.activeTimer.startTime,
      elapsed: this.activeTimer.getElapsedTime(),
      formattedElapsed: this.activeTimer.getFormattedDuration()
    };
  }

  /**
   * Switch active timer to different task
   * @param {string} newTaskId - New task identifier
   * @returns {Promise<{stopped: TimeEntry, started: TimeEntry}>}
   */
  async switchTask(newTaskId) {
    if (typeof newTaskId !== 'string' || !newTaskId) {
      throw new ValidationError('New task ID must be a non-empty string');
    }

    // Validate new task exists (if taskService is available)
    if (this.taskService) {
      const task = await this.taskService.getTaskById(newTaskId);
      if (!task) {
        throw new TaskNotFoundError(`Task with ID ${newTaskId} not found`);
      }
    }

    let stoppedEntry = null;

    // Stop current timer if active
    if (this.activeTimer) {
      stoppedEntry = await this.stopTimer();
    }

    // Start new timer
    const startedEntry = await this.startTimer(newTaskId);

    return {
      stopped: stoppedEntry?.toJSON() || null,
      started: startedEntry.toJSON()
    };
  }

  /**
   * Manually adjust time for specific time entry
   * @param {string} entryId - Time entry identifier
   * @param {number} newDuration - New duration in milliseconds
   * @param {string} note - Reason for adjustment
   * @returns {Promise<TimeEntry>} - Updated time entry
   */
  async adjustTime(entryId, newDuration, note) {
    if (typeof entryId !== 'string' || !entryId) {
      throw new ValidationError('Entry ID must be a non-empty string');
    }

    if (typeof newDuration !== 'number' || newDuration < 0) {
      throw new InvalidDurationError('Duration must be a non-negative number');
    }

    if (typeof note !== 'string' || !note.trim()) {
      throw new ValidationError('Adjustment note is required');
    }

    // Load data to find entry
    if (!this.dataService) {
      throw new Error('DataService not available');
    }

    const data = this.dataService.loadData();
    const entryData = data?.timeEntries?.find((e) => e.id === entryId);

    if (!entryData) {
      throw new TimeEntryNotFoundError(`Time entry with ID ${entryId} not found`);
    }

    // Create TimeEntry instance and adjust
    const entry = TimeEntry.fromJSON(entryData);
    entry.adjustTime(newDuration, note);

    // Update in data
    const entryIndex = data.timeEntries.findIndex((e) => e.id === entryId);
    data.timeEntries[entryIndex] = entry.toJSON();

    // Save updated data
    await this.dataService.saveData(data);

    return entry;
  }

  /**
   * Start meal break timer
   * @returns {Promise<MealBreak>} - Created meal break
   */
  async startMealBreak() {
    if (this.activeMealBreak) {
      throw new MealBreakAlreadyActiveError('A meal break is already active');
    }

    // Create new meal break
    this.activeMealBreak = new MealBreak({
      startTime: new Date(),
      endTime: null
    });

    // Start meal break ticks
    this.startMealBreakTicks();

    // Save to storage
    await this.saveActiveMealBreak();

    // Emit event
    this.emit('mealBreakStarted', this.activeMealBreak.toJSON());

    return this.activeMealBreak;
  }

  /**
   * Stop meal break timer
   * @returns {Promise<MealBreak>} - Completed meal break
   */
  async stopMealBreak() {
    if (!this.activeMealBreak) {
      throw new NoActiveMealBreakError('No active meal break to stop');
    }

    // Stop the meal break
    const completedMealBreak = this.activeMealBreak.end();
    this.stopMealBreakTicks();

    // Save completed meal break
    await this.saveCompletedMealBreak(completedMealBreak);

    // Clear active meal break
    this.activeMealBreak = null;

    // Emit event
    this.emit('mealBreakStopped', completedMealBreak.toJSON());

    return completedMealBreak;
  }

  /**
   * Set maximum timer duration
   * @param {number} duration - Duration in milliseconds
   */
  setMaxDuration(duration) {
    if (typeof duration !== 'number' || duration <= 0) {
      throw new ValidationError('Max duration must be a positive number');
    }
    this.maxDuration = duration;
  }

  /**
   * Start timer tick events
   */
  startTimerTicks() {
    if (this.timerInterval) return; // Already running

    this.timerInterval = setInterval(() => {
      if (!this.activeTimer) {
        this.stopTimerTicks();
        return;
      }

      const elapsed = this.activeTimer.getElapsedTime();

      // Check for max duration exceeded
      if (elapsed > this.maxDuration) {
        this.autoStopTimer('Maximum duration exceeded');
        return;
      }

      // Emit tick event
      this.emit('timerTick', {
        taskId: this.activeTimer.taskId,
        elapsed: elapsed
      });
    }, this.tickInterval);
  }

  /**
   * Stop timer tick events
   */
  stopTimerTicks() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Start meal break tick events
   */
  startMealBreakTicks() {
    if (this.mealBreakInterval) return; // Already running

    this.mealBreakInterval = setInterval(() => {
      if (!this.activeMealBreak) {
        this.stopMealBreakTicks();
        return;
      }

      // Check for reasonable meal break duration (3 hours max)
      const elapsed = this.activeMealBreak.getElapsedTime();
      if (elapsed > 3 * 60 * 60 * 1000) {
        // 3 hours
        this.autoStopMealBreak('Meal break too long');
        return;
      }
    }, this.tickInterval);
  }

  /**
   * Stop meal break tick events
   */
  stopMealBreakTicks() {
    if (this.mealBreakInterval) {
      clearInterval(this.mealBreakInterval);
      this.mealBreakInterval = null;
    }
  }

  /**
   * Auto-stop timer due to max duration
   * @param {string} reason - Reason for auto-stop
   */
  async autoStopTimer(reason) {
    if (!this.activeTimer) return;

    const taskId = this.activeTimer.taskId;
    const completedEntry = await this.stopTimer();

    // Emit auto-stop event
    this.emit('timerAutoStopped', {
      taskId,
      timeEntry: completedEntry.toJSON(),
      reason
    });
  }

  /**
   * Auto-stop meal break
   * @param {string} reason - Reason for auto-stop
   */
  async autoStopMealBreak() {
    if (!this.activeMealBreak) return;

    await this.stopMealBreak();
    // Note: Could emit a specific auto-stop event for meal breaks if needed
  }

  /**
   * Save active timer to storage
   */
  async saveActiveTimer() {
    if (!this.dataService || !this.activeTimer) return;

    try {
      const data = this.dataService.loadData() || { timeEntries: [] };

      // Remove any existing active timer
      data.timeEntries = data.timeEntries.filter((entry) => entry.endTime !== null);

      // Add current active timer
      data.timeEntries.push(this.activeTimer.toJSON());

      await this.dataService.saveData(data);
    } catch (error) {
      this.emit('storageError', error);
    }
  }

  /**
   * Save completed timer to storage
   */
  async saveCompletedTimer(completedEntry) {
    if (!this.dataService) return;

    try {
      const data = this.dataService.loadData() || { timeEntries: [] };

      // Find and update the entry
      const entryIndex = data.timeEntries.findIndex((e) => e.id === completedEntry.id);
      if (entryIndex >= 0) {
        data.timeEntries[entryIndex] = completedEntry.toJSON();
      } else {
        data.timeEntries.push(completedEntry.toJSON());
      }

      await this.dataService.saveData(data);
    } catch (error) {
      this.emit('storageError', error);
    }
  }

  /**
   * Save active meal break to storage
   */
  async saveActiveMealBreak() {
    if (!this.dataService || !this.activeMealBreak) return;

    try {
      const data = this.dataService.loadData() || { mealBreaks: [] };
      if (!data.mealBreaks) data.mealBreaks = [];

      // Remove any existing active meal break
      data.mealBreaks = data.mealBreaks.filter((mb) => mb.endTime !== null);

      // Add current active meal break
      data.mealBreaks.push(this.activeMealBreak.toJSON());

      await this.dataService.saveData(data);
    } catch (error) {
      this.emit('storageError', error);
    }
  }

  /**
   * Save completed meal break to storage
   */
  async saveCompletedMealBreak(completedMealBreak) {
    if (!this.dataService) return;

    try {
      const data = this.dataService.loadData() || { mealBreaks: [] };
      if (!data.mealBreaks) data.mealBreaks = [];

      // Find and update the meal break
      const mbIndex = data.mealBreaks.findIndex((mb) => mb.id === completedMealBreak.id);
      if (mbIndex >= 0) {
        data.mealBreaks[mbIndex] = completedMealBreak.toJSON();
      } else {
        data.mealBreaks.push(completedMealBreak.toJSON());
      }

      await this.dataService.saveData(data);
    } catch (error) {
      this.emit('storageError', error);
    }
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
    this.stopTimerTicks();
    this.stopMealBreakTicks();
    this.eventListeners.clear();
    this.activeTimer = null;
    this.activeMealBreak = null;
  }
}

// Custom error classes
export class TaskNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TaskNotFoundError';
  }
}

export class TimerAlreadyActiveError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimerAlreadyActiveError';
  }
}

export class NoActiveTimerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NoActiveTimerError';
  }
}

export class TimeEntryNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeEntryNotFoundError';
  }
}

export class InvalidDurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidDurationError';
  }
}

export class MealBreakAlreadyActiveError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MealBreakAlreadyActiveError';
  }
}

export class NoActiveMealBreakError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NoActiveMealBreakError';
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
