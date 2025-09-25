/**
 * Task Entity Model
 * Represents a work activity that can be timed and tracked.
 */

const VALID_COLORS = [
  'primary',
  'secondary',
  'accent',
  'neutral',
  'info',
  'success',
  'warning',
  'error',
  'ghost',
  'link'
];

export class Task {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.isActive = data.isActive || false;
    this.totalTime = data.totalTime || 0;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.color = data.color || 'primary';
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
    this.activatedAt = data.activatedAt ? new Date(data.activatedAt) : null;
    this.isDeleted = data.isDeleted || false;

    this.validate();
  }

  generateId() {
    return 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  validate() {
    const errors = [];

    // Name validation
    if (typeof this.name !== 'string') {
      errors.push('Task name must be a string');
    } else if (this.name.trim().length === 0) {
      errors.push('Task name is required');
    } else if (this.name.length > 100) {
      errors.push('Task name must be 100 characters or less');
    }

    // Color validation
    if (!VALID_COLORS.includes(this.color)) {
      errors.push(`Task color must be one of: ${VALID_COLORS.join(', ')}`);
    }

    // Total time validation
    if (typeof this.totalTime !== 'number' || this.totalTime < 0) {
      errors.push('Total time must be a non-negative number');
    }

    // ID validation
    if (typeof this.id !== 'string' || this.id.length === 0) {
      errors.push('Task ID must be a non-empty string');
    }

    // Boolean validations
    if (typeof this.isActive !== 'boolean') {
      errors.push('isActive must be a boolean');
    }

    if (typeof this.isDeleted !== 'boolean') {
      errors.push('isDeleted must be a boolean');
    }

    // Date validations
    if (!(this.createdAt instanceof Date) || isNaN(this.createdAt)) {
      errors.push('createdAt must be a valid Date');
    }

    if (this.updatedAt && (!(this.updatedAt instanceof Date) || isNaN(this.updatedAt))) {
      errors.push('updatedAt must be a valid Date or null');
    }

    if (this.activatedAt && (!(this.activatedAt instanceof Date) || isNaN(this.activatedAt))) {
      errors.push('activatedAt must be a valid Date or null');
    }

    if (errors.length > 0) {
      throw new ValidationError(`Task validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Update task properties
   * @param {Object} updates - Fields to update
   * @returns {Task} - Updated task instance
   */
  update(updates) {
    const allowedFields = ['name', 'color', 'isActive', 'totalTime'];
    const changes = [];

    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field) && this[field] !== value) {
        this[field] = value;
        changes.push(field);
      }
    }

    if (changes.length > 0) {
      this.updatedAt = new Date();
      this.validate();
    }

    return this;
  }

  /**
   * Activate this task (set isActive to true)
   */
  activate() {
    this.isActive = true;
    this.activatedAt = new Date();
    this.updatedAt = new Date();
    this.validate();
    return this;
  }

  /**
   * Deactivate this task (set isActive to false)
   */
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
    this.validate();
    return this;
  }

  /**
   * Soft delete this task
   */
  delete() {
    this.isDeleted = true;
    this.isActive = false; // Can't be active if deleted
    this.updatedAt = new Date();
    this.validate();
    return this;
  }

  /**
   * Add time to total time tracking
   * @param {number} duration - Duration in milliseconds
   */
  addTime(duration) {
    if (typeof duration !== 'number' || duration < 0) {
      throw new ValidationError('Duration must be a non-negative number');
    }

    this.totalTime += duration;
    this.updatedAt = new Date();
    this.validate();
    return this;
  }

  /**
   * Get formatted total time as hh:mm
   */
  getFormattedTotalTime() {
    const hours = Math.floor(this.totalTime / (1000 * 60 * 60));
    const minutes = Math.floor((this.totalTime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Convert to plain object for storage
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      isActive: this.isActive,
      totalTime: this.totalTime,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() || null,
      activatedAt: this.activatedAt?.toISOString() || null,
      color: this.color,
      isDeleted: this.isDeleted
    };
  }

  /**
   * Create Task instance from plain object
   * @param {Object} data - Plain object data
   * @returns {Task} - New Task instance
   */
  static fromJSON(data) {
    return new Task(data);
  }

  /**
   * Get valid color options
   */
  static getValidColors() {
    return [...VALID_COLORS];
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
