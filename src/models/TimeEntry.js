/**
 * TimeEntry Entity Model
 * Records time spent on a specific task during a specific period.
 */

export class TimeEntry {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.taskId = data.taskId || null;
    this.startTime = data.startTime ? new Date(data.startTime) : new Date();
    this.endTime = data.endTime ? new Date(data.endTime) : null;
    this.duration = data.duration || 0;
    this.date = data.date || this.startTime.toISOString().split('T')[0];
    this.isManuallyAdjusted = data.isManuallyAdjusted || false;
    this.adjustmentNote = data.adjustmentNote || '';
    this.adjustmentTimestamp = data.adjustmentTimestamp ? new Date(data.adjustmentTimestamp) : null;

    // Calculate duration if endTime exists but duration is 0
    if (this.endTime && this.duration === 0) {
      this.duration = this.endTime.getTime() - this.startTime.getTime();
    }

    this.validate();
  }

  generateId() {
    return 'entry-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  validate() {
    const errors = [];

    // ID validation
    if (typeof this.id !== 'string' || this.id.length === 0) {
      errors.push('TimeEntry ID must be a non-empty string');
    }

    // TaskId validation
    if (typeof this.taskId !== 'string' || this.taskId.length === 0) {
      errors.push('Task ID must be a non-empty string');
    }

    // Start time validation
    if (!(this.startTime instanceof Date) || isNaN(this.startTime)) {
      errors.push('Start time must be a valid Date');
    }

    // End time validation
    if (this.endTime !== null) {
      if (!(this.endTime instanceof Date) || isNaN(this.endTime)) {
        errors.push('End time must be a valid Date or null');
      } else if (this.endTime <= this.startTime) {
        errors.push('End time must be after start time');
      }
    }

    // Duration validation
    if (typeof this.duration !== 'number' || this.duration < 0) {
      errors.push('Duration must be a non-negative number');
    }

    // Duration consistency check
    if (this.endTime && this.duration > 0) {
      const calculatedDuration = this.endTime.getTime() - this.startTime.getTime();
      if (Math.abs(calculatedDuration - this.duration) > 1000) {
        // Allow 1 second tolerance
        errors.push('Duration must match calculated endTime - startTime');
      }
    }

    // Maximum duration check (12 hours = 43200000ms)
    const MAX_DURATION = 12 * 60 * 60 * 1000;
    if (this.duration > MAX_DURATION) {
      errors.push('Duration cannot exceed 12 hours (auto-stop protection)');
    }

    // Date validation (ISO format YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(this.date)) {
      errors.push('Date must be in ISO format (YYYY-MM-DD)');
    }

    // Manual adjustment validations
    if (typeof this.isManuallyAdjusted !== 'boolean') {
      errors.push('isManuallyAdjusted must be a boolean');
    }

    if (typeof this.adjustmentNote !== 'string') {
      errors.push('adjustmentNote must be a string');
    }

    if (
      this.adjustmentTimestamp &&
      (!(this.adjustmentTimestamp instanceof Date) || isNaN(this.adjustmentTimestamp))
    ) {
      errors.push('adjustmentTimestamp must be a valid Date or null');
    }

    // If manually adjusted, should have note and timestamp
    if (this.isManuallyAdjusted && (!this.adjustmentNote || !this.adjustmentTimestamp)) {
      errors.push('Manually adjusted entries must have adjustment note and timestamp');
    }

    if (errors.length > 0) {
      throw new ValidationError(`TimeEntry validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Stop the timer (set end time and calculate duration)
   * @param {Date} endTime - Optional end time, defaults to now
   */
  stop(endTime = new Date()) {
    if (this.endTime !== null) {
      throw new ValidationError('Timer is already stopped');
    }

    this.endTime = endTime;
    this.duration = this.endTime.getTime() - this.startTime.getTime();
    this.validate();
    return this;
  }

  /**
   * Check if timer is currently running
   */
  isRunning() {
    return this.endTime === null;
  }

  /**
   * Get current elapsed time (for running timers)
   */
  getElapsedTime() {
    if (!this.isRunning()) {
      return this.duration;
    }
    return new Date().getTime() - this.startTime.getTime();
  }

  /**
   * Manually adjust the duration
   * @param {number} newDuration - New duration in milliseconds
   * @param {string} note - Reason for adjustment
   */
  adjustTime(newDuration, note) {
    if (typeof newDuration !== 'number' || newDuration < 0) {
      throw new ValidationError('New duration must be a non-negative number');
    }

    if (typeof note !== 'string' || note.trim().length === 0) {
      throw new ValidationError('Adjustment note is required');
    }

    const MAX_DURATION = 12 * 60 * 60 * 1000; // 12 hours
    if (newDuration > MAX_DURATION) {
      throw new ValidationError('Duration cannot exceed 12 hours');
    }

    this.duration = newDuration;
    this.isManuallyAdjusted = true;
    this.adjustmentNote = note.trim();
    this.adjustmentTimestamp = new Date();

    // Recalculate end time based on new duration
    if (this.endTime) {
      this.endTime = new Date(this.startTime.getTime() + newDuration);
    }

    this.validate();
    return this;
  }

  /**
   * Get formatted duration as hh:mm:ss
   */
  getFormattedDuration() {
    const duration = this.isRunning() ? this.getElapsedTime() : this.duration;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get formatted duration as hh:mm (for summaries)
   */
  getFormattedDurationHM() {
    const duration = this.isRunning() ? this.getElapsedTime() : this.duration;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Check if this entry is for today
   */
  isToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.date === today;
  }

  /**
   * Convert to plain object for storage
   */
  toJSON() {
    return {
      id: this.id,
      taskId: this.taskId,
      startTime: this.startTime.toISOString(),
      endTime: this.endTime?.toISOString() || null,
      duration: this.duration,
      date: this.date,
      isManuallyAdjusted: this.isManuallyAdjusted,
      adjustmentNote: this.adjustmentNote,
      adjustmentTimestamp: this.adjustmentTimestamp?.toISOString() || null
    };
  }

  /**
   * Create TimeEntry instance from plain object
   * @param {Object} data - Plain object data
   * @returns {TimeEntry} - New TimeEntry instance
   */
  static fromJSON(data) {
    return new TimeEntry(data);
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
