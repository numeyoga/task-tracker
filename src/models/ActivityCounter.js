/**
 * ActivityCounter Entity Model
 * Tracks non-task activities like coffee breaks, bathroom breaks, etc.
 */

const PREDEFINED_ACTIVITIES = [
  'coffee',
  'break',
  'bathroom',
  'water',
  'phone',
  'meeting',
  'interruption',
  'discussion'
];

export class ActivityCounter {
  constructor(data = {}) {
    this.date = data.date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    this.activityType = data.activityType || '';
    this.count = data.count || 0;
    this.lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : new Date();

    this.validate();
  }

  validate() {
    const errors = [];

    // Date validation (ISO format YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(this.date)) {
      errors.push('Date must be in ISO format (YYYY-MM-DD)');
    }

    // Activity type validation
    if (typeof this.activityType !== 'string' || this.activityType.trim().length === 0) {
      errors.push('Activity type must be a non-empty string');
    } else if (this.activityType.length > 50) {
      errors.push('Activity type must be 50 characters or less');
    }

    // Count validation
    if (typeof this.count !== 'number' || this.count < 0 || !Number.isInteger(this.count)) {
      errors.push('Count must be a non-negative integer');
    }

    // Count reasonable limits (prevent accidental massive increments)
    if (this.count > 1000) {
      errors.push('Count cannot exceed 1000 (reasonable daily limit)');
    }

    // Last updated validation
    if (!(this.lastUpdated instanceof Date) || isNaN(this.lastUpdated)) {
      errors.push('Last updated must be a valid Date');
    }

    if (errors.length > 0) {
      throw new ValidationError(`ActivityCounter validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Increment the counter
   * @param {number} amount - Amount to increment (default 1)
   */
  increment(amount = 1) {
    if (typeof amount !== 'number' || amount < 0 || !Number.isInteger(amount)) {
      throw new ValidationError('Increment amount must be a non-negative integer');
    }

    this.count += amount;
    this.lastUpdated = new Date();
    this.validate();
    return this;
  }

  /**
   * Decrement the counter (with minimum of 0)
   * @param {number} amount - Amount to decrement (default 1)
   */
  decrement(amount = 1) {
    if (typeof amount !== 'number' || amount < 0 || !Number.isInteger(amount)) {
      throw new ValidationError('Decrement amount must be a non-negative integer');
    }

    this.count = Math.max(0, this.count - amount);
    this.lastUpdated = new Date();
    this.validate();
    return this;
  }

  /**
   * Reset counter to zero
   */
  reset() {
    this.count = 0;
    this.lastUpdated = new Date();
    this.validate();
    return this;
  }

  /**
   * Set count to specific value
   * @param {number} newCount - New count value
   */
  setCount(newCount) {
    if (typeof newCount !== 'number' || newCount < 0 || !Number.isInteger(newCount)) {
      throw new ValidationError('Count must be a non-negative integer');
    }

    this.count = newCount;
    this.lastUpdated = new Date();
    this.validate();
    return this;
  }

  /**
   * Check if this is today's counter
   */
  isToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.date === today;
  }

  /**
   * Check if activity type is predefined
   */
  isPredefined() {
    return PREDEFINED_ACTIVITIES.includes(this.activityType.toLowerCase());
  }

  /**
   * Get display name for activity type
   */
  getDisplayName() {
    const type = this.activityType.toLowerCase();

    const displayNames = {
      coffee: 'Coffee Break',
      break: 'General Break',
      bathroom: 'Bathroom Break',
      water: 'Water Break',
      phone: 'Phone Call',
      meeting: 'Impromptu Meeting',
      interruption: 'Interruption',
      discussion: 'Discussion'
    };

    return (
      displayNames[type] || this.activityType.charAt(0).toUpperCase() + this.activityType.slice(1)
    );
  }

  /**
   * Get icon for activity type (emoji or CSS class)
   */
  getIcon() {
    const type = this.activityType.toLowerCase();

    const icons = {
      coffee: '☕',
      break: '⏸️',
      bathroom: '🚻',
      water: '💧',
      phone: '📞',
      meeting: '👥',
      interruption: '⚠️',
      discussion: '💬'
    };

    return icons[type] || '📊';
  }

  /**
   * Get color class for activity type (DaisyUI)
   */
  getColorClass() {
    const type = this.activityType.toLowerCase();

    const colors = {
      coffee: 'warning',
      break: 'info',
      bathroom: 'neutral',
      water: 'info',
      phone: 'primary',
      meeting: 'secondary',
      interruption: 'error',
      discussion: 'accent'
    };

    return colors[type] || 'neutral';
  }

  /**
   * Get unique key for this counter (date + activityType)
   */
  getUniqueKey() {
    return `${this.date}-${this.activityType.toLowerCase()}`;
  }

  /**
   * Convert to plain object for storage
   */
  toJSON() {
    return {
      date: this.date,
      activityType: this.activityType,
      count: this.count,
      lastUpdated: this.lastUpdated.toISOString()
    };
  }

  /**
   * Create ActivityCounter instance from plain object
   * @param {Object} data - Plain object data
   * @returns {ActivityCounter} - New ActivityCounter instance
   */
  static fromJSON(data) {
    return new ActivityCounter(data);
  }

  /**
   * Get predefined activity types
   */
  static getPredefinedActivities() {
    return [...PREDEFINED_ACTIVITIES];
  }

  /**
   * Create unique key from date and activity type
   * @param {string} date - ISO date string
   * @param {string} activityType - Activity type
   */
  static createUniqueKey(date, activityType) {
    return `${date}-${activityType.toLowerCase()}`;
  }

  /**
   * Validate uniqueness constraint for date + activityType
   * @param {ActivityCounter[]} existingCounters - Array of existing counters
   * @param {string} date - Date to check
   * @param {string} activityType - Activity type to check
   * @param {string} excludeId - ID to exclude from check (for updates)
   */
  static validateUniqueness(existingCounters, date, activityType, excludeId = null) {
    const key = ActivityCounter.createUniqueKey(date, activityType);
    const duplicates = existingCounters.filter(
      (counter) => counter.getUniqueKey() === key && (!excludeId || counter.id !== excludeId)
    );

    if (duplicates.length > 0) {
      throw new ValidationError(`Activity counter for ${activityType} on ${date} already exists`);
    }

    return true;
  }

  /**
   * Get summary statistics for an array of counters
   * @param {ActivityCounter[]} counters - Array of counters
   */
  static getSummaryStats(counters) {
    const totalCount = counters.reduce((sum, counter) => sum + counter.count, 0);
    const uniqueActivities = [...new Set(counters.map((c) => c.activityType))].length;
    const mostActive = counters.reduce(
      (max, counter) => (counter.count > max.count ? counter : max),
      counters[0] || { count: 0, activityType: 'none' }
    );

    return {
      totalCount,
      uniqueActivities,
      mostActive: mostActive.count > 0 ? mostActive : null,
      averagePerActivity: uniqueActivities > 0 ? totalCount / uniqueActivities : 0
    };
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
