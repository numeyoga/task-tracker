/**
 * Settings Entity Model
 * User configuration and preferences.
 */

const VALID_THEMES = [
  'bumblebee',
  'light',
  'dark',
  'cupcake',
  'emerald',
  'corporate',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'black',
  'luxury',
  'dracula',
  'cmyk',
  'autumn',
  'business',
  'acid',
  'lemonade',
  'night',
  'coffee',
  'winter'
];

export class Settings {
  constructor(data = {}) {
    // Time settings (in milliseconds)
    this.requiredDailyPresence = data.requiredDailyPresence || 8 * 60 * 60 * 1000; // 8 hours
    this.timerMaxDuration = data.timerMaxDuration || 12 * 60 * 60 * 1000; // 12 hours
    this.autoSaveInterval = data.autoSaveInterval || 30000; // 30 seconds

    // UI settings
    this.theme = data.theme || 'bumblebee';
    this.timeFormat24h = data.timeFormat24h !== undefined ? data.timeFormat24h : true;

    // Data settings
    this.dataRetentionWeeks = data.dataRetentionWeeks || 5;

    // Notification settings
    this.enableNotifications =
      data.enableNotifications !== undefined ? data.enableNotifications : false;
    this.notifyOnAutoStop = data.notifyOnAutoStop !== undefined ? data.notifyOnAutoStop : true;
    this.notifyOnLongBreak = data.notifyOnLongBreak !== undefined ? data.notifyOnLongBreak : true;

    // Advanced settings
    this.enableSounds = data.enableSounds !== undefined ? data.enableSounds : false;
    this.confirmOnTaskDelete =
      data.confirmOnTaskDelete !== undefined ? data.confirmOnTaskDelete : true;
    this.showSecondsInTimer =
      data.showSecondsInTimer !== undefined ? data.showSecondsInTimer : true;

    // User preferences
    this.defaultTaskColor = data.defaultTaskColor || 'primary';
    this.startDayAutomatically =
      data.startDayAutomatically !== undefined ? data.startDayAutomatically : false;

    // Metadata
    this.lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : new Date();
    this.version = data.version || '1.0.0';

    this.validate();
  }

  validate() {
    const errors = [];

    // Required daily presence validation (1-16 hours)
    const MIN_DAILY_PRESENCE = 1 * 60 * 60 * 1000; // 1 hour
    const MAX_DAILY_PRESENCE = 16 * 60 * 60 * 1000; // 16 hours
    if (
      typeof this.requiredDailyPresence !== 'number' ||
      this.requiredDailyPresence < MIN_DAILY_PRESENCE ||
      this.requiredDailyPresence > MAX_DAILY_PRESENCE
    ) {
      errors.push('Required daily presence must be between 1 and 16 hours');
    }

    // Timer max duration validation (1-24 hours)
    const MIN_TIMER_DURATION = 1 * 60 * 60 * 1000; // 1 hour
    const MAX_TIMER_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    if (
      typeof this.timerMaxDuration !== 'number' ||
      this.timerMaxDuration < MIN_TIMER_DURATION ||
      this.timerMaxDuration > MAX_TIMER_DURATION
    ) {
      errors.push('Timer max duration must be between 1 and 24 hours');
    }

    // Auto save interval validation (1-300 seconds)
    const MIN_AUTOSAVE = 1000; // 1 second
    const MAX_AUTOSAVE = 300000; // 5 minutes
    if (
      typeof this.autoSaveInterval !== 'number' ||
      this.autoSaveInterval < MIN_AUTOSAVE ||
      this.autoSaveInterval > MAX_AUTOSAVE
    ) {
      errors.push('Auto save interval must be between 1 and 300 seconds');
    }

    // Theme validation
    if (!VALID_THEMES.includes(this.theme)) {
      errors.push(`Theme must be one of: ${VALID_THEMES.join(', ')}`);
    }

    // Data retention validation (1-52 weeks)
    if (
      typeof this.dataRetentionWeeks !== 'number' ||
      this.dataRetentionWeeks < 1 ||
      this.dataRetentionWeeks > 52
    ) {
      errors.push('Data retention must be between 1 and 52 weeks');
    }

    // Boolean validations
    const booleanFields = [
      'timeFormat24h',
      'enableNotifications',
      'notifyOnAutoStop',
      'notifyOnLongBreak',
      'enableSounds',
      'confirmOnTaskDelete',
      'showSecondsInTimer',
      'startDayAutomatically'
    ];

    for (const field of booleanFields) {
      if (typeof this[field] !== 'boolean') {
        errors.push(`${field} must be a boolean`);
      }
    }

    // Default task color validation
    const VALID_COLORS = [
      'primary',
      'secondary',
      'accent',
      'neutral',
      'info',
      'success',
      'warning',
      'error'
    ];
    if (!VALID_COLORS.includes(this.defaultTaskColor)) {
      errors.push(`Default task color must be one of: ${VALID_COLORS.join(', ')}`);
    }

    // Version validation
    if (typeof this.version !== 'string' || this.version.length === 0) {
      errors.push('Version must be a non-empty string');
    }

    // Last updated validation
    if (!(this.lastUpdated instanceof Date) || isNaN(this.lastUpdated)) {
      errors.push('Last updated must be a valid Date');
    }

    if (errors.length > 0) {
      throw new ValidationError(`Settings validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Update settings
   * @param {Object} updates - Settings to update
   */
  update(updates) {
    const allowedFields = [
      'requiredDailyPresence',
      'timerMaxDuration',
      'autoSaveInterval',
      'theme',
      'timeFormat24h',
      'dataRetentionWeeks',
      'enableNotifications',
      'notifyOnAutoStop',
      'notifyOnLongBreak',
      'enableSounds',
      'confirmOnTaskDelete',
      'showSecondsInTimer',
      'defaultTaskColor',
      'startDayAutomatically'
    ];

    let hasChanges = false;

    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field) && this[field] !== value) {
        this[field] = value;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.lastUpdated = new Date();
      this.validate();
    }

    return this;
  }

  /**
   * Get required daily presence in hours
   */
  getRequiredDailyPresenceHours() {
    return this.requiredDailyPresence / (60 * 60 * 1000);
  }

  /**
   * Set required daily presence from hours
   * @param {number} hours - Hours (can be decimal)
   */
  setRequiredDailyPresenceHours(hours) {
    if (typeof hours !== 'number' || hours < 1 || hours > 16) {
      throw new ValidationError('Hours must be between 1 and 16');
    }

    this.requiredDailyPresence = hours * 60 * 60 * 1000;
    this.lastUpdated = new Date();
    this.validate();
    return this;
  }

  /**
   * Get timer max duration in hours
   */
  getTimerMaxDurationHours() {
    return this.timerMaxDuration / (60 * 60 * 1000);
  }

  /**
   * Set timer max duration from hours
   * @param {number} hours - Hours (can be decimal)
   */
  setTimerMaxDurationHours(hours) {
    if (typeof hours !== 'number' || hours < 1 || hours > 24) {
      throw new ValidationError('Hours must be between 1 and 24');
    }

    this.timerMaxDuration = hours * 60 * 60 * 1000;
    this.lastUpdated = new Date();
    this.validate();
    return this;
  }

  /**
   * Get auto save interval in seconds
   */
  getAutoSaveIntervalSeconds() {
    return this.autoSaveInterval / 1000;
  }

  /**
   * Set auto save interval from seconds
   * @param {number} seconds - Seconds
   */
  setAutoSaveIntervalSeconds(seconds) {
    if (typeof seconds !== 'number' || seconds < 1 || seconds > 300) {
      throw new ValidationError('Seconds must be between 1 and 300');
    }

    this.autoSaveInterval = seconds * 1000;
    this.lastUpdated = new Date();
    this.validate();
    return this;
  }

  /**
   * Reset to default settings
   */
  resetToDefaults() {
    const defaults = new Settings();
    const fields = Object.keys(defaults);

    for (const field of fields) {
      if (field !== 'lastUpdated' && field !== 'version') {
        this[field] = defaults[field];
      }
    }

    this.lastUpdated = new Date();
    this.validate();
    return this;
  }

  /**
   * Export settings for backup
   */
  export() {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  /**
   * Import settings from backup
   * @param {string} jsonString - JSON string of settings
   */
  importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const importedSettings = new Settings(data);

      // Copy all valid settings
      const fields = Object.keys(importedSettings);
      for (const field of fields) {
        if (field !== 'version') {
          // Keep current version
          this[field] = importedSettings[field];
        }
      }

      this.lastUpdated = new Date();
      this.validate();
      return this;
    } catch (error) {
      throw new ValidationError(`Failed to import settings: ${error.message}`);
    }
  }

  /**
   * Convert to plain object for storage
   */
  toJSON() {
    return {
      requiredDailyPresence: this.requiredDailyPresence,
      timerMaxDuration: this.timerMaxDuration,
      autoSaveInterval: this.autoSaveInterval,
      theme: this.theme,
      timeFormat24h: this.timeFormat24h,
      dataRetentionWeeks: this.dataRetentionWeeks,
      enableNotifications: this.enableNotifications,
      notifyOnAutoStop: this.notifyOnAutoStop,
      notifyOnLongBreak: this.notifyOnLongBreak,
      enableSounds: this.enableSounds,
      confirmOnTaskDelete: this.confirmOnTaskDelete,
      showSecondsInTimer: this.showSecondsInTimer,
      defaultTaskColor: this.defaultTaskColor,
      startDayAutomatically: this.startDayAutomatically,
      lastUpdated: this.lastUpdated.toISOString(),
      version: this.version
    };
  }

  /**
   * Create Settings instance from plain object
   * @param {Object} data - Plain object data
   * @returns {Settings} - New Settings instance
   */
  static fromJSON(data) {
    return new Settings(data);
  }

  /**
   * Get valid themes
   */
  static getValidThemes() {
    return [...VALID_THEMES];
  }

  /**
   * Get default settings
   */
  static getDefaults() {
    return new Settings();
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
