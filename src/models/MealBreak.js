/**
 * MealBreak Entity Model
 * Records meal break periods that are deducted from presence time.
 */

export class MealBreak {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.date = data.date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    this.startTime = data.startTime ? new Date(data.startTime) : new Date();
    this.endTime = data.endTime ? new Date(data.endTime) : null;
    this.duration = data.duration || 0;

    // Calculate duration if endTime exists but duration is 0
    if (this.endTime && this.duration === 0) {
      this.duration = this.endTime.getTime() - this.startTime.getTime();
    }

    this.validate();
  }

  generateId() {
    return 'meal-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  validate() {
    const errors = [];

    // ID validation
    if (typeof this.id !== 'string' || this.id.length === 0) {
      errors.push('MealBreak ID must be a non-empty string');
    }

    // Date validation (ISO format YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(this.date)) {
      errors.push('Date must be in ISO format (YYYY-MM-DD)');
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

    // Maximum duration check (3 hours = 10800000ms)
    const MAX_DURATION = 3 * 60 * 60 * 1000;
    if (this.duration > MAX_DURATION) {
      errors.push('Meal break duration cannot exceed 3 hours');
    }

    // Verify the date matches the start time date
    const startTimeDate = this.startTime.toISOString().split('T')[0];
    if (this.date !== startTimeDate) {
      errors.push('Date must match the date of the start time');
    }

    if (errors.length > 0) {
      throw new ValidationError(`MealBreak validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * End the meal break
   * @param {Date} endTime - Optional end time, defaults to now
   */
  end(endTime = new Date()) {
    if (this.endTime !== null) {
      throw new ValidationError('Meal break is already ended');
    }

    if (!(endTime instanceof Date) || isNaN(endTime)) {
      throw new ValidationError('End time must be a valid Date');
    }

    this.endTime = endTime;
    this.duration = this.endTime.getTime() - this.startTime.getTime();
    this.validate();
    return this;
  }

  /**
   * Check if meal break is currently active (running)
   */
  isActive() {
    return this.endTime === null;
  }

  /**
   * Get current elapsed time (for active meal breaks)
   */
  getElapsedTime() {
    if (!this.isActive()) {
      return this.duration;
    }
    return new Date().getTime() - this.startTime.getTime();
  }

  /**
   * Get formatted duration as mm:ss for active breaks, hh:mm for completed
   */
  getFormattedDuration() {
    const duration = this.isActive() ? this.getElapsedTime() : this.duration;

    if (this.isActive()) {
      // For active meal breaks, show mm:ss
      const totalMinutes = Math.floor(duration / (1000 * 60));
      const seconds = Math.floor((duration % (1000 * 60)) / 1000);
      return `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      // For completed meal breaks, show hh:mm
      const hours = Math.floor(duration / (1000 * 60 * 60));
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Get formatted duration as hh:mm (for summaries)
   */
  getFormattedDurationHM() {
    const duration = this.isActive() ? this.getElapsedTime() : this.duration;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Check if this meal break is for today
   */
  isToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.date === today;
  }

  /**
   * Get formatted start time
   */
  getFormattedStartTime(format24h = true) {
    if (format24h) {
      return this.startTime.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return this.startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  }

  /**
   * Get formatted end time
   */
  getFormattedEndTime(format24h = true) {
    if (!this.endTime) return '--:--';

    if (format24h) {
      return this.endTime.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return this.endTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  }

  /**
   * Get meal break type based on time of day
   */
  getMealType() {
    const hour = this.startTime.getHours();

    if (hour >= 6 && hour < 10) {
      return 'breakfast';
    } else if (hour >= 11 && hour < 15) {
      return 'lunch';
    } else if (hour >= 15 && hour < 18) {
      return 'snack';
    } else if (hour >= 18 && hour < 22) {
      return 'dinner';
    } else {
      return 'meal';
    }
  }

  /**
   * Convert to plain object for storage
   */
  toJSON() {
    return {
      id: this.id,
      date: this.date,
      startTime: this.startTime.toISOString(),
      endTime: this.endTime?.toISOString() || null,
      duration: this.duration
    };
  }

  /**
   * Create MealBreak instance from plain object
   * @param {Object} data - Plain object data
   * @returns {MealBreak} - New MealBreak instance
   */
  static fromJSON(data) {
    return new MealBreak(data);
  }

  /**
   * Validate that only one meal break can be active per day
   * @param {MealBreak[]} existingMealBreaks - Array of existing meal breaks
   * @param {string} date - Date to check
   */
  static validateSingleActivePerDay(existingMealBreaks, date) {
    const activeMealBreaks = existingMealBreaks.filter((mb) => mb.date === date && mb.isActive());

    if (activeMealBreaks.length > 1) {
      throw new ValidationError('Only one meal break can be active per day');
    }

    return true;
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
