/**
 * Timer Store
 * Manages current timer state and elapsed time
 */

import { writable, derived, get } from 'svelte/store';
import { getTimerService } from '../services/index.js';

/**
 * Timer state store
 */
export const timerState = writable({
  isRunning: false,
  taskId: null,
  taskName: null,
  startTime: null,
  elapsed: 0,
  formattedElapsed: '00:00:00'
});

/**
 * Meal break state store
 */
export const mealBreakState = writable({
  isRunning: false,
  startTime: null,
  elapsed: 0,
  formattedElapsed: '00:00:00'
});

/**
 * Timer error state
 */
export const timerError = writable(null);

/**
 * Derived store for combined timer status
 */
export const timerStatus = derived(
  [timerState, mealBreakState],
  ([$timerState, $mealBreakState]) => ({
    hasActiveTimer: $timerState.isRunning,
    hasActiveMealBreak: $mealBreakState.isRunning,
    currentTaskId: $timerState.taskId,
    currentTaskName: $timerState.taskName,
    totalElapsed: $timerState.elapsed,
    mealElapsed: $mealBreakState.elapsed,
    formattedElapsed: $timerState.formattedElapsed,
    formattedMealElapsed: $mealBreakState.formattedElapsed
  })
);

/**
 * Timer actions - functions that interact with TimerService
 */
export const timerActions = {
  /**
   * Initialize timer store with service
   */
  async initialize() {
    try {
      const timerService = getTimerService();

      // Set up event listeners
      timerService.on('timerStarted', (data) => {
        timerState.update((state) => ({
          ...state,
          isRunning: true,
          taskId: data.taskId,
          taskName: data.taskName || 'Unknown Task',
          startTime: new Date(data.timeEntry.startTime),
          elapsed: 0,
          formattedElapsed: '00:00:00'
        }));
        timerError.set(null);
      });

      timerService.on('timerStopped', (data) => {
        timerState.update((state) => ({
          ...state,
          isRunning: false,
          taskId: null,
          taskName: null,
          startTime: null,
          elapsed: 0,
          formattedElapsed: '00:00:00'
        }));
      });

      timerService.on('timerTick', (data) => {
        const formattedElapsed = this.formatDuration(data.elapsed);
        timerState.update((state) => ({
          ...state,
          elapsed: data.elapsed,
          formattedElapsed
        }));
      });

      timerService.on('timerAutoStopped', (data) => {
        timerState.update((state) => ({
          ...state,
          isRunning: false,
          taskId: null,
          taskName: null,
          startTime: null,
          elapsed: 0,
          formattedElapsed: '00:00:00'
        }));
        timerError.set(`Timer auto-stopped: ${data.reason}`);
      });

      timerService.on('mealBreakStarted', (data) => {
        mealBreakState.update((state) => ({
          ...state,
          isRunning: true,
          startTime: new Date(data.startTime),
          elapsed: 0,
          formattedElapsed: '00:00:00'
        }));
      });

      timerService.on('mealBreakStopped', (data) => {
        mealBreakState.update((state) => ({
          ...state,
          isRunning: false,
          startTime: null,
          elapsed: 0,
          formattedElapsed: '00:00:00'
        }));
      });

      // Load current timer state
      const currentTimer = timerService.getCurrentTimer();
      if (currentTimer) {
        timerState.set({
          isRunning: true,
          taskId: currentTimer.taskId,
          taskName: currentTimer.taskName || 'Unknown Task',
          startTime: new Date(currentTimer.startTime),
          elapsed: currentTimer.elapsed,
          formattedElapsed: currentTimer.formattedElapsed
        });
      }

      // Set up meal break tick updates
      this.setupMealBreakTicks(timerService);
    } catch (error) {
      console.error('Error initializing timer store:', error);
      timerError.set(`Initialization failed: ${error.message}`);
    }
  },

  /**
   * Start timer for specific task
   */
  async startTimer(taskId, taskName) {
    try {
      const timerService = getTimerService();
      await timerService.startTimer(taskId);
      timerError.set(null);
    } catch (error) {
      console.error('Error starting timer:', error);
      timerError.set(`Failed to start timer: ${error.message}`);
    }
  },

  /**
   * Stop current timer
   */
  async stopTimer() {
    try {
      const timerService = getTimerService();
      await timerService.stopTimer();
      timerError.set(null);
    } catch (error) {
      console.error('Error stopping timer:', error);
      timerError.set(`Failed to stop timer: ${error.message}`);
    }
  },

  /**
   * Switch to different task
   */
  async switchTask(newTaskId, newTaskName) {
    try {
      const timerService = getTimerService();
      await timerService.switchTask(newTaskId);
      timerError.set(null);
    } catch (error) {
      console.error('Error switching task:', error);
      timerError.set(`Failed to switch task: ${error.message}`);
    }
  },

  /**
   * Start meal break
   */
  async startMealBreak() {
    try {
      const timerService = getTimerService();
      await timerService.startMealBreak();
      timerError.set(null);
    } catch (error) {
      console.error('Error starting meal break:', error);
      timerError.set(`Failed to start meal break: ${error.message}`);
    }
  },

  /**
   * Stop meal break
   */
  async stopMealBreak() {
    try {
      const timerService = getTimerService();
      await timerService.stopMealBreak();
      timerError.set(null);
    } catch (error) {
      console.error('Error stopping meal break:', error);
      timerError.set(`Failed to stop meal break: ${error.message}`);
    }
  },

  /**
   * Adjust time for specific entry
   */
  async adjustTime(entryId, newDuration, note) {
    try {
      const timerService = getTimerService();
      await timerService.adjustTime(entryId, newDuration, note);
      timerError.set(null);
    } catch (error) {
      console.error('Error adjusting time:', error);
      timerError.set(`Failed to adjust time: ${error.message}`);
    }
  },

  /**
   * Clear timer error
   */
  clearError() {
    timerError.set(null);
  },

  /**
   * Format duration from milliseconds to hh:mm:ss
   */
  formatDuration(milliseconds) {
    if (typeof milliseconds !== 'number' || milliseconds < 0) {
      return '00:00:00';
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  /**
   * Set up meal break tick updates (since meal break might not emit regular ticks)
   */
  setupMealBreakTicks(timerService) {
    setInterval(() => {
      const currentMealBreak = get(mealBreakState);
      if (currentMealBreak.isRunning && currentMealBreak.startTime) {
        const elapsed = Date.now() - currentMealBreak.startTime.getTime();
        const formattedElapsed = this.formatDuration(elapsed);

        mealBreakState.update((state) => ({
          ...state,
          elapsed,
          formattedElapsed
        }));
      }
    }, 1000);
  }
};

/**
 * Utility functions for timer calculations
 */
export const timerUtils = {
  /**
   * Parse duration string (hh:mm:ss) to milliseconds
   */
  parseDuration(durationString) {
    if (typeof durationString !== 'string') return 0;

    const parts = durationString.split(':');
    if (parts.length !== 3) return 0;

    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;

    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  },

  /**
   * Get elapsed time since start
   */
  getElapsedSince(startTime) {
    if (!startTime) return 0;
    return (
      Date.now() - (startTime instanceof Date ? startTime.getTime() : new Date(startTime).getTime())
    );
  },

  /**
   * Check if timer is running long (over specified duration)
   */
  isRunningLong(startTime, maxDuration = 8 * 60 * 60 * 1000) {
    if (!startTime) return false;
    const elapsed = this.getElapsedSince(startTime);
    return elapsed > maxDuration;
  }
};
