/**
 * SettingsService Implementation
 * Service for managing user preferences and application settings
 */

import { Settings } from '../models/Settings.js';

export class SettingsService {
  constructor(dataService = null) {
    this.dataService = dataService;
    this.eventListeners = new Map();
    this.currentSettings = null;
    this.defaultSettings = {
      requiredDailyPresence: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
      timerMaxDuration: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
      theme: 'bumblebee',
      timeFormat24h: true,
      autoSaveInterval: 30000, // 30 seconds
      dataRetentionWeeks: 5
    };

    // Initialize settings
    this.initialize();
  }

  /**
   * Initialize settings from storage or create defaults
   */
  async initialize() {
    try {
      const settings = await this.getSettings();
      this.currentSettings = settings;
    } catch (error) {
      console.error('Error initializing settings:', error);
      this.currentSettings = new Settings(this.defaultSettings);
    }
  }

  /**
   * Get current settings
   * @returns {Promise<Settings>} - Current settings object
   */
  async getSettings() {
    if (this.currentSettings) {
      return this.currentSettings;
    }

    try {
      const data = this.loadData();
      const settingsData = data.settings;

      if (settingsData) {
        this.currentSettings = Settings.fromJSON(settingsData);
      } else {
        // Create default settings
        this.currentSettings = new Settings(this.defaultSettings);
        await this.saveSettings(this.currentSettings);
      }

      return this.currentSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      // Return default settings as fallback
      this.currentSettings = new Settings(this.defaultSettings);
      return this.currentSettings;
    }
  }

  /**
   * Update specific settings
   * @param {Object} updates - Settings to update
   * @returns {Promise<Settings>} - Updated settings object
   */
  async updateSettings(updates) {
    if (!updates || typeof updates !== 'object') {
      throw new ValidationError('Updates object is required');
    }

    const settings = await this.getSettings();
    const changes = [];

    // Validate and apply updates
    if (updates.requiredDailyPresence !== undefined) {
      this.validateDailyPresence(updates.requiredDailyPresence);
      if (settings.requiredDailyPresence !== updates.requiredDailyPresence) {
        settings.requiredDailyPresence = updates.requiredDailyPresence;
        changes.push('requiredDailyPresence');
      }
    }

    if (updates.timerMaxDuration !== undefined) {
      this.validateTimerMaxDuration(updates.timerMaxDuration);
      if (settings.timerMaxDuration !== updates.timerMaxDuration) {
        settings.timerMaxDuration = updates.timerMaxDuration;
        changes.push('timerMaxDuration');
      }
    }

    if (updates.theme !== undefined) {
      this.validateTheme(updates.theme);
      if (settings.theme !== updates.theme) {
        settings.theme = updates.theme;
        changes.push('theme');
      }
    }

    if (updates.timeFormat24h !== undefined) {
      if (typeof updates.timeFormat24h !== 'boolean') {
        throw new ValidationError('timeFormat24h must be a boolean');
      }
      if (settings.timeFormat24h !== updates.timeFormat24h) {
        settings.timeFormat24h = updates.timeFormat24h;
        changes.push('timeFormat24h');
      }
    }

    if (updates.autoSaveInterval !== undefined) {
      this.validateAutoSaveInterval(updates.autoSaveInterval);
      if (settings.autoSaveInterval !== updates.autoSaveInterval) {
        settings.autoSaveInterval = updates.autoSaveInterval;
        changes.push('autoSaveInterval');
      }
    }

    if (updates.dataRetentionWeeks !== undefined) {
      this.validateDataRetentionWeeks(updates.dataRetentionWeeks);
      if (settings.dataRetentionWeeks !== updates.dataRetentionWeeks) {
        settings.dataRetentionWeeks = updates.dataRetentionWeeks;
        changes.push('dataRetentionWeeks');
      }
    }

    // Save if there were changes
    if (changes.length > 0) {
      await this.saveSettings(settings);
      this.currentSettings = settings;

      // Emit settings changed event
      this.emit('settingsChanged', {
        settings: settings.toJSON(),
        changes
      });
    }

    return settings;
  }

  /**
   * Reset settings to defaults
   * @returns {Promise<Settings>} - Reset settings object
   */
  async resetToDefaults() {
    const defaultSettings = new Settings(this.defaultSettings);
    await this.saveSettings(defaultSettings);
    this.currentSettings = defaultSettings;

    this.emit('settingsReset', {
      settings: defaultSettings.toJSON()
    });

    return defaultSettings;
  }

  /**
   * Get setting value by key
   * @param {string} key - Setting key
   * @returns {Promise<*>} - Setting value
   */
  async getSetting(key) {
    if (typeof key !== 'string' || !key) {
      throw new ValidationError('Setting key must be a non-empty string');
    }

    const settings = await this.getSettings();

    if (!Object.prototype.hasOwnProperty.call(settings, key)) {
      throw new SettingNotFoundError(`Setting '${key}' not found`);
    }

    return settings[key];
  }

  /**
   * Set individual setting value
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @returns {Promise<Settings>} - Updated settings object
   */
  async setSetting(key, value) {
    if (typeof key !== 'string' || !key) {
      throw new ValidationError('Setting key must be a non-empty string');
    }

    const updates = {};
    updates[key] = value;

    return await this.updateSettings(updates);
  }

  /**
   * Export settings for backup
   * @returns {Promise<Object>} - Settings as JSON object
   */
  async exportSettings() {
    const settings = await this.getSettings();
    const exported = {
      ...settings.toJSON(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    this.emit('settingsExported', {
      timestamp: exported.exportedAt
    });

    return exported;
  }

  /**
   * Import settings from backup
   * @param {Object} settingsData - Settings data to import
   * @returns {Promise<Settings>} - Imported settings object
   */
  async importSettings(settingsData) {
    if (!settingsData || typeof settingsData !== 'object') {
      throw new ValidationError('Settings data must be an object');
    }

    // Validate the imported data
    const validatedData = this.validateImportData(settingsData);

    // Create settings from validated data
    const settings = new Settings(validatedData);

    // Save the imported settings
    await this.saveSettings(settings);
    this.currentSettings = settings;

    this.emit('settingsImported', {
      settings: settings.toJSON(),
      importedAt: new Date().toISOString()
    });

    return settings;
  }

  /**
   * Get formatted time string based on user preference
   * @param {Date} date - Date to format
   * @returns {Promise<string>} - Formatted time string
   */
  async formatTime(date) {
    if (!(date instanceof Date)) {
      throw new ValidationError('Date must be a Date object');
    }

    const settings = await this.getSettings();

    if (settings.timeFormat24h) {
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } else {
      return date.toLocaleTimeString('en-US', {
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  }

  /**
   * Get formatted duration string
   * @param {number} milliseconds - Duration in milliseconds
   * @returns {string} - Formatted duration (hh:mm:ss)
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
  }

  /**
   * Validation methods
   */

  validateDailyPresence(value) {
    if (typeof value !== 'number' || value < 3600000 || value > 57600000) {
      // 1-16 hours
      throw new ValidationError('Required daily presence must be between 1 and 16 hours');
    }
  }

  validateTimerMaxDuration(value) {
    if (typeof value !== 'number' || value < 3600000 || value > 86400000) {
      // 1-24 hours
      throw new ValidationError('Timer max duration must be between 1 and 24 hours');
    }
  }

  validateTheme(value) {
    const validThemes = [
      'light',
      'dark',
      'cupcake',
      'bumblebee',
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
      'wireframe'
    ];

    if (typeof value !== 'string' || !validThemes.includes(value)) {
      throw new ValidationError(`Theme must be one of: ${validThemes.join(', ')}`);
    }
  }

  validateAutoSaveInterval(value) {
    if (typeof value !== 'number' || value < 1000 || value > 300000) {
      // 1-300 seconds
      throw new ValidationError('Auto-save interval must be between 1 and 300 seconds');
    }
  }

  validateDataRetentionWeeks(value) {
    if (typeof value !== 'number' || value < 1 || value > 52) {
      // 1-52 weeks
      throw new ValidationError('Data retention must be between 1 and 52 weeks');
    }
  }

  validateImportData(data) {
    const validated = {};

    // Use defaults for missing or invalid values
    validated.requiredDailyPresence = this.isValidNumber(
      data.requiredDailyPresence,
      3600000,
      57600000
    )
      ? data.requiredDailyPresence
      : this.defaultSettings.requiredDailyPresence;

    validated.timerMaxDuration = this.isValidNumber(data.timerMaxDuration, 3600000, 86400000)
      ? data.timerMaxDuration
      : this.defaultSettings.timerMaxDuration;

    validated.theme =
      typeof data.theme === 'string' && data.theme.trim()
        ? data.theme.trim()
        : this.defaultSettings.theme;

    validated.timeFormat24h =
      typeof data.timeFormat24h === 'boolean'
        ? data.timeFormat24h
        : this.defaultSettings.timeFormat24h;

    validated.autoSaveInterval = this.isValidNumber(data.autoSaveInterval, 1000, 300000)
      ? data.autoSaveInterval
      : this.defaultSettings.autoSaveInterval;

    validated.dataRetentionWeeks = this.isValidNumber(data.dataRetentionWeeks, 1, 52)
      ? data.dataRetentionWeeks
      : this.defaultSettings.dataRetentionWeeks;

    return validated;
  }

  isValidNumber(value, min, max) {
    return typeof value === 'number' && value >= min && value <= max;
  }

  /**
   * Storage operations
   */

  loadData() {
    if (!this.dataService) {
      return {};
    }
    return this.dataService.loadData() || {};
  }

  async saveSettings(settings) {
    if (!this.dataService) {
      throw new Error('DataService not available');
    }

    try {
      const data = this.loadData();
      data.settings = settings.toJSON();
      await this.dataService.saveData(data);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
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
    this.eventListeners.clear();
    this.currentSettings = null;
  }
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SettingNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SettingNotFoundError';
  }
}
