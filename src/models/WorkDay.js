/**
 * WorkDay Entity Model
 * Daily summary containing all activities and presence calculations.
 */

export class WorkDay {
  constructor(data = {}) {
    this.date = data.date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    this.arrivalTime = data.arrivalTime ? new Date(data.arrivalTime) : null;
    this.departureTime = data.departureTime ? new Date(data.departureTime) : null;
    this.totalPresenceTime = data.totalPresenceTime || 0;
    this.totalTaskTime = data.totalTaskTime || 0;
    this.mealBreakTime = data.mealBreakTime || 0;
    this.workingTime = data.workingTime || 0;
    this.activityCounters = data.activityCounters || {};

    // Calculate working time if not provided
    if (this.workingTime === 0 && this.totalPresenceTime > 0) {
      this.workingTime = this.totalPresenceTime - this.mealBreakTime;
    }

    this.validate();
  }

  validate() {
    const errors = [];

    // Date validation (ISO format YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(this.date)) {
      errors.push('Date must be in ISO format (YYYY-MM-DD)');
    }

    // Time validations (must be non-negative numbers)
    if (typeof this.totalPresenceTime !== 'number' || this.totalPresenceTime < 0) {
      errors.push('Total presence time must be a non-negative number');
    }

    if (typeof this.totalTaskTime !== 'number' || this.totalTaskTime < 0) {
      errors.push('Total task time must be a non-negative number');
    }

    if (typeof this.mealBreakTime !== 'number' || this.mealBreakTime < 0) {
      errors.push('Meal break time must be a non-negative number');
    }

    if (typeof this.workingTime !== 'number' || this.workingTime < 0) {
      errors.push('Working time must be a non-negative number');
    }

    // Arrival/departure time validations
    if (this.arrivalTime !== null) {
      if (!(this.arrivalTime instanceof Date) || isNaN(this.arrivalTime)) {
        errors.push('Arrival time must be a valid Date or null');
      }
    }

    if (this.departureTime !== null) {
      if (!(this.departureTime instanceof Date) || isNaN(this.departureTime)) {
        errors.push('Departure time must be a valid Date or null');
      }
    }

    // Departure must be after arrival
    if (this.arrivalTime && this.departureTime && this.departureTime <= this.arrivalTime) {
      errors.push('Departure time must be after arrival time');
    }

    // Business logic validations
    if (this.totalTaskTime > this.workingTime) {
      errors.push('Total task time cannot exceed working time');
    }

    // Activity counters validation
    if (typeof this.activityCounters !== 'object' || this.activityCounters === null) {
      errors.push('Activity counters must be an object');
    } else {
      for (const [activity, count] of Object.entries(this.activityCounters)) {
        if (typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
          errors.push(`Activity counter for ${activity} must be a non-negative integer`);
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(`WorkDay validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Set arrival time (first activity of the day)
   * @param {Date} time - Arrival time
   */
  setArrivalTime(time = new Date()) {
    if (!(time instanceof Date) || isNaN(time)) {
      throw new ValidationError('Arrival time must be a valid Date');
    }

    // Only set if not already set or if this is earlier
    if (!this.arrivalTime || time < this.arrivalTime) {
      this.arrivalTime = time;
    }

    this.updatePresenceTime();
    this.validate();
    return this;
  }

  /**
   * Set departure time (last activity of the day)
   * @param {Date} time - Departure time
   */
  setDepartureTime(time = new Date()) {
    if (!(time instanceof Date) || isNaN(time)) {
      throw new ValidationError('Departure time must be a valid Date');
    }

    // Only set if not already set or if this is later
    if (!this.departureTime || time > this.departureTime) {
      this.departureTime = time;
    }

    this.updatePresenceTime();
    this.validate();
    return this;
  }

  /**
   * Update presence time based on arrival/departure
   */
  updatePresenceTime() {
    if (this.arrivalTime && this.departureTime) {
      this.totalPresenceTime = this.departureTime.getTime() - this.arrivalTime.getTime();
      this.workingTime = this.totalPresenceTime - this.mealBreakTime;
    }
    return this;
  }

  /**
   * Add task time to the daily total
   * @param {number} duration - Duration in milliseconds
   */
  addTaskTime(duration) {
    if (typeof duration !== 'number' || duration < 0) {
      throw new ValidationError('Duration must be a non-negative number');
    }

    this.totalTaskTime += duration;
    this.validate();
    return this;
  }

  /**
   * Add meal break time
   * @param {number} duration - Duration in milliseconds
   */
  addMealBreakTime(duration) {
    if (typeof duration !== 'number' || duration < 0) {
      throw new ValidationError('Duration must be a non-negative number');
    }

    this.mealBreakTime += duration;
    this.workingTime = this.totalPresenceTime - this.mealBreakTime;
    this.validate();
    return this;
  }

  /**
   * Increment activity counter
   * @param {string} activityType - Type of activity (coffee, break, etc.)
   * @param {number} increment - Amount to increment (default 1)
   */
  incrementActivity(activityType, increment = 1) {
    if (typeof activityType !== 'string' || activityType.trim().length === 0) {
      throw new ValidationError('Activity type must be a non-empty string');
    }

    if (typeof increment !== 'number' || increment < 0 || !Number.isInteger(increment)) {
      throw new ValidationError('Increment must be a non-negative integer');
    }

    const activity = activityType.trim().toLowerCase();
    this.activityCounters[activity] = (this.activityCounters[activity] || 0) + increment;
    this.validate();
    return this;
  }

  /**
   * Calculate efficiency (task time / working time)
   */
  getEfficiency() {
    if (this.workingTime === 0) return 0;
    return (this.totalTaskTime / this.workingTime) * 100;
  }

  /**
   * Check if this is today's work day
   */
  isToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.date === today;
  }

  /**
   * Get formatted presence time as hh:mm
   */
  getFormattedPresenceTime() {
    const hours = Math.floor(this.totalPresenceTime / (1000 * 60 * 60));
    const minutes = Math.floor((this.totalPresenceTime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Get formatted working time as hh:mm
   */
  getFormattedWorkingTime() {
    const hours = Math.floor(this.workingTime / (1000 * 60 * 60));
    const minutes = Math.floor((this.workingTime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Get formatted task time as hh:mm
   */
  getFormattedTaskTime() {
    const hours = Math.floor(this.totalTaskTime / (1000 * 60 * 60));
    const minutes = Math.floor((this.totalTaskTime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Get formatted meal break time as hh:mm
   */
  getFormattedMealBreakTime() {
    const hours = Math.floor(this.mealBreakTime / (1000 * 60 * 60));
    const minutes = Math.floor((this.mealBreakTime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Convert to plain object for storage
   */
  toJSON() {
    return {
      date: this.date,
      arrivalTime: this.arrivalTime?.toISOString() || null,
      departureTime: this.departureTime?.toISOString() || null,
      totalPresenceTime: this.totalPresenceTime,
      totalTaskTime: this.totalTaskTime,
      mealBreakTime: this.mealBreakTime,
      workingTime: this.workingTime,
      activityCounters: { ...this.activityCounters }
    };
  }

  /**
   * Create WorkDay instance from plain object
   * @param {Object} data - Plain object data
   * @returns {WorkDay} - New WorkDay instance
   */
  static fromJSON(data) {
    return new WorkDay(data);
  }

  /**
   * Get valid activity types
   */
  static getValidActivityTypes() {
    return ['coffee', 'break', 'bathroom', 'water', 'phone', 'meeting'];
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
