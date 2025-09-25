/**
 * Settings Store
 * Manages user configuration and preferences
 */

import { writable, derived } from 'svelte/store';
import { getSettingsService } from '../services/index.js';

/**
 * Current settings store
 */
export const currentSettings = writable({
  requiredDailyPresence: 8 * 60 * 60 * 1000, // 8 hours
  timerMaxDuration: 12 * 60 * 60 * 1000, // 12 hours
  theme: 'bumblebee',
  timeFormat24h: true,
  autoSaveInterval: 30000, // 30 seconds
  dataRetentionWeeks: 5
});

/**
 * Settings loading state
 */
export const settingsLoading = writable(false);

/**
 * Settings error state
 */
export const settingsError = writable(null);

/**
 * Available themes store
 */
export const availableThemes = writable([
  { value: 'light', label: 'Light', description: 'Clean light theme' },
  { value: 'dark', label: 'Dark', description: 'Dark theme for low light' },
  { value: 'cupcake', label: 'Cupcake', description: 'Sweet pink theme' },
  { value: 'bumblebee', label: 'Bumblebee', description: 'Yellow and black theme (default)' },
  { value: 'emerald', label: 'Emerald', description: 'Green nature theme' },
  { value: 'corporate', label: 'Corporate', description: 'Professional blue theme' },
  { value: 'synthwave', label: 'Synthwave', description: 'Retro neon theme' },
  { value: 'retro', label: 'Retro', description: 'Vintage style theme' },
  { value: 'cyberpunk', label: 'Cyberpunk', description: 'Futuristic yellow theme' },
  { value: 'valentine', label: 'Valentine', description: 'Romantic pink theme' },
  { value: 'halloween', label: 'Halloween', description: 'Spooky orange theme' },
  { value: 'garden', label: 'Garden', description: 'Natural green theme' },
  { value: 'forest', label: 'Forest', description: 'Deep forest theme' },
  { value: 'aqua', label: 'Aqua', description: 'Blue water theme' },
  { value: 'lofi', label: 'Lofi', description: 'Calm pastel theme' },
  { value: 'pastel', label: 'Pastel', description: 'Soft color theme' },
  { value: 'fantasy', label: 'Fantasy', description: 'Magical purple theme' },
  { value: 'wireframe', label: 'Wireframe', description: 'Minimal wireframe theme' }
]);

/**
 * Derived stores for formatted settings
 */
export const formattedSettings = derived([currentSettings], ([$currentSettings]) => ({
  ...$currentSettings,
  requiredDailyPresenceHours: $currentSettings.requiredDailyPresence / (1000 * 60 * 60),
  timerMaxDurationHours: $currentSettings.timerMaxDuration / (1000 * 60 * 60),
  autoSaveIntervalSeconds: $currentSettings.autoSaveInterval / 1000,
  formattedRequiredPresence: settingsUtils.formatDuration($currentSettings.requiredDailyPresence),
  formattedTimerMaxDuration: settingsUtils.formatDuration($currentSettings.timerMaxDuration)
}));

/**
 * Derived store for theme information
 */
export const currentThemeInfo = derived(
  [currentSettings, availableThemes],
  ([$currentSettings, $availableThemes]) => {
    return (
      $availableThemes.find((theme) => theme.value === $currentSettings.theme) || {
        value: 'bumblebee',
        label: 'Bumblebee',
        description: 'Default theme'
      }
    );
  }
);

/**
 * Settings actions - functions that interact with SettingsService
 */
export const settingsActions = {
  /**
   * Initialize settings store with service
   */
  async initialize() {
    try {
      const settingsService = getSettingsService();

      // Set up event listeners
      settingsService.on('settingsChanged', (data) => {
        currentSettings.set(data.settings);
        settingsError.set(null);

        // Apply theme change immediately
        if (data.changes.includes('theme')) {
          this.applyTheme(data.settings.theme);
        }
      });

      settingsService.on('settingsReset', (data) => {
        currentSettings.set(data.settings);
        this.applyTheme(data.settings.theme);
        settingsError.set(null);
      });

      settingsService.on('settingsImported', (data) => {
        currentSettings.set(data.settings);
        this.applyTheme(data.settings.theme);
        settingsError.set(null);
      });

      // Load initial settings
      await this.loadSettings();
    } catch (error) {
      console.error('Error initializing settings store:', error);
      settingsError.set(`Initialization failed: ${error.message}`);
    }
  },

  /**
   * Load settings from service
   */
  async loadSettings() {
    try {
      settingsLoading.set(true);
      const settingsService = getSettingsService();

      const settings = await settingsService.getSettings();
      const settingsData = settings.toJSON();

      currentSettings.set(settingsData);
      this.applyTheme(settingsData.theme);

      settingsError.set(null);
    } catch (error) {
      console.error('Error loading settings:', error);
      settingsError.set(`Failed to load settings: ${error.message}`);
    } finally {
      settingsLoading.set(false);
    }
  },

  /**
   * Update specific settings
   */
  async updateSettings(updates) {
    try {
      settingsLoading.set(true);
      const settingsService = getSettingsService();

      const updatedSettings = await settingsService.updateSettings(updates);
      settingsError.set(null);

      return updatedSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      settingsError.set(`Failed to update settings: ${error.message}`);
      throw error;
    } finally {
      settingsLoading.set(false);
    }
  },

  /**
   * Update individual setting
   */
  async updateSetting(key, value) {
    try {
      const settingsService = getSettingsService();

      const updatedSettings = await settingsService.setSetting(key, value);
      settingsError.set(null);

      return updatedSettings;
    } catch (error) {
      console.error('Error updating setting:', error);
      settingsError.set(`Failed to update ${key}: ${error.message}`);
      throw error;
    }
  },

  /**
   * Reset settings to defaults
   */
  async resetToDefaults() {
    try {
      settingsLoading.set(true);
      const settingsService = getSettingsService();

      const defaultSettings = await settingsService.resetToDefaults();
      settingsError.set(null);

      return defaultSettings;
    } catch (error) {
      console.error('Error resetting settings:', error);
      settingsError.set(`Failed to reset settings: ${error.message}`);
      throw error;
    } finally {
      settingsLoading.set(false);
    }
  },

  /**
   * Export settings for backup
   */
  async exportSettings() {
    try {
      const settingsService = getSettingsService();

      const exportedData = await settingsService.exportSettings();
      settingsError.set(null);

      return exportedData;
    } catch (error) {
      console.error('Error exporting settings:', error);
      settingsError.set(`Failed to export settings: ${error.message}`);
      throw error;
    }
  },

  /**
   * Import settings from backup
   */
  async importSettings(settingsData) {
    try {
      settingsLoading.set(true);
      const settingsService = getSettingsService();

      const importedSettings = await settingsService.importSettings(settingsData);
      settingsError.set(null);

      return importedSettings;
    } catch (error) {
      console.error('Error importing settings:', error);
      settingsError.set(`Failed to import settings: ${error.message}`);
      throw error;
    } finally {
      settingsLoading.set(false);
    }
  },

  /**
   * Apply theme to document
   */
  applyTheme(themeName) {
    try {
      // Set data-theme attribute on html element for DaisyUI
      document.documentElement.setAttribute('data-theme', themeName);

      // Store theme preference in localStorage as backup
      localStorage.setItem('app-theme', themeName);

      console.log(`Theme applied: ${themeName}`);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  },

  /**
   * Get current theme from DOM (fallback)
   */
  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'bumblebee';
  },

  /**
   * Validate settings before saving
   */
  validateSettings(settings) {
    const errors = [];

    if (settings.requiredDailyPresence) {
      if (settings.requiredDailyPresence < 3600000 || settings.requiredDailyPresence > 57600000) {
        errors.push('Daily presence must be between 1 and 16 hours');
      }
    }

    if (settings.timerMaxDuration) {
      if (settings.timerMaxDuration < 3600000 || settings.timerMaxDuration > 86400000) {
        errors.push('Timer max duration must be between 1 and 24 hours');
      }
    }

    if (settings.autoSaveInterval) {
      if (settings.autoSaveInterval < 1000 || settings.autoSaveInterval > 300000) {
        errors.push('Auto-save interval must be between 1 and 300 seconds');
      }
    }

    if (settings.dataRetentionWeeks) {
      if (settings.dataRetentionWeeks < 1 || settings.dataRetentionWeeks > 52) {
        errors.push('Data retention must be between 1 and 52 weeks');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Clear settings error
   */
  clearError() {
    settingsError.set(null);
  },

  /**
   * Get formatted time based on user preference
   */
  async formatTime(date) {
    try {
      const settingsService = getSettingsService();
      return await settingsService.formatTime(date);
    } catch (error) {
      console.error('Error formatting time:', error);
      return date.toLocaleTimeString();
    }
  }
};

/**
 * Settings utility functions
 */
export const settingsUtils = {
  /**
   * Convert hours to milliseconds
   */
  hoursToMilliseconds(hours) {
    return hours * 60 * 60 * 1000;
  },

  /**
   * Convert milliseconds to hours
   */
  millisecondsToHours(milliseconds) {
    return milliseconds / (1000 * 60 * 60);
  },

  /**
   * Convert seconds to milliseconds
   */
  secondsToMilliseconds(seconds) {
    return seconds * 1000;
  },

  /**
   * Convert milliseconds to seconds
   */
  millisecondsToSeconds(milliseconds) {
    return milliseconds / 1000;
  },

  /**
   * Format duration for display
   */
  formatDuration(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },

  /**
   * Format duration as decimal hours
   */
  formatAsDecimalHours(milliseconds) {
    const hours = milliseconds / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100; // 2 decimal places
  },

  /**
   * Get theme CSS variables for custom styling
   */
  getThemeVariables(themeName) {
    const themeVariables = {
      bumblebee: {
        '--primary': '#f59e0b',
        '--secondary': '#a3a3a3',
        '--accent': '#eab308',
        '--neutral': '#1f2937'
      },
      dark: {
        '--primary': '#6366f1',
        '--secondary': '#a78bfa',
        '--accent': '#f472b6',
        '--neutral': '#2d3748'
      },
      light: {
        '--primary': '#6366f1',
        '--secondary': '#a78bfa',
        '--accent': '#f472b6',
        '--neutral': '#1f2937'
      }
    };

    return themeVariables[themeName] || themeVariables['bumblebee'];
  },

  /**
   * Validate individual setting values
   */
  validateSetting(key, value) {
    switch (key) {
      case 'requiredDailyPresence':
        return value >= 3600000 && value <= 57600000;
      case 'timerMaxDuration':
        return value >= 3600000 && value <= 86400000;
      case 'autoSaveInterval':
        return value >= 1000 && value <= 300000;
      case 'dataRetentionWeeks':
        return value >= 1 && value <= 52;
      case 'timeFormat24h':
        return typeof value === 'boolean';
      case 'theme':
        return typeof value === 'string' && value.trim().length > 0;
      default:
        return true;
    }
  },

  /**
   * Get setting display name
   */
  getSettingDisplayName(key) {
    const displayNames = {
      requiredDailyPresence: 'Required Daily Presence',
      timerMaxDuration: 'Maximum Timer Duration',
      theme: 'Application Theme',
      timeFormat24h: '24-Hour Time Format',
      autoSaveInterval: 'Auto-Save Interval',
      dataRetentionWeeks: 'Data Retention Period'
    };

    return displayNames[key] || key;
  },

  /**
   * Get setting description
   */
  getSettingDescription(key) {
    const descriptions = {
      requiredDailyPresence: 'Target number of hours to be present at work each day',
      timerMaxDuration: 'Maximum time a timer can run before auto-stopping',
      theme: 'Visual theme for the application interface',
      timeFormat24h: 'Use 24-hour format (e.g., 14:30) instead of 12-hour format (e.g., 2:30 PM)',
      autoSaveInterval: 'How often to automatically save data to prevent loss',
      dataRetentionWeeks: 'Number of weeks to keep historical data before cleanup'
    };

    return descriptions[key] || '';
  }
};
