/**
 * DataService Implementation
 * Service for managing localStorage operations and data persistence
 */

// Models are imported for validation but may not be used directly
// import { Task } from '../models/Task.js';
// import { TimeEntry } from '../models/TimeEntry.js';
// import { WorkDay } from '../models/WorkDay.js';
// import { MealBreak } from '../models/MealBreak.js';
// import { ActivityCounter } from '../models/ActivityCounter.js';
// import { Settings } from '../models/Settings.js';

const STORAGE_KEY = 'task-tracker-data';
const CURRENT_VERSION = '1.0.0';

export class DataService {
  constructor() {
    this.eventListeners = new Map();
    this.autoSaveInterval = null;
    this.autoSaveTimer = null;
    this.pendingData = null;
    this.cleanupInterval = null;
    this.initializeStorage();
  }

  /**
   * Initialize storage with default structure if empty
   */
  initializeStorage() {
    // Only initialize if explicitly requested, not on constructor
  }

  /**
   * Save all application data to localStorage
   * @param {Object} data - Complete application state
   * @returns {Promise<boolean>} - Success status
   */
  async saveData(data) {
    try {
      // Validate data structure
      this.validateAppData(data);

      const saveData = {
        version: CURRENT_VERSION,
        lastUpdated: new Date().toISOString(),
        ...data
      };

      const jsonString = JSON.stringify(saveData);

      // Check storage quota (estimate)
      if (jsonString.length > 5 * 1024 * 1024) {
        // 5MB limit estimate
        throw new StorageQuotaExceededError('Data size exceeds storage quota');
      }

      localStorage.setItem(STORAGE_KEY, jsonString);

      // Emit success event
      this.emit('dataSaved', {
        timestamp: new Date(),
        size: jsonString.length
      });

      return true;
    } catch (error) {
      this.emit('storageError', error);

      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        throw new StorageQuotaExceededError('localStorage quota exceeded');
      }
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new Error(`Failed to save data: ${error.message}`);
    }
  }

  /**
   * Load application data from localStorage
   * @returns {Object|null} - Application state or null if not found
   */
  loadData() {
    try {
      const jsonString = localStorage.getItem(STORAGE_KEY);

      if (!jsonString) {
        return null;
      }

      const data = JSON.parse(jsonString);

      // Validate and migrate data if needed
      const validatedData = this.validateAndMigrateData(data);

      // Emit load event
      this.emit('dataLoaded', validatedData);

      return validatedData;
    } catch (error) {
      this.emit('storageError', error);

      if (error instanceof SyntaxError) {
        throw new SyntaxError('Invalid JSON data in localStorage');
      }
      if (error.name === 'SecurityError') {
        throw new SecurityError('Access to localStorage denied');
      }
      throw new Error(`Failed to load data: ${error.message}`);
    }
  }

  /**
   * Clear all application data from localStorage
   * @returns {Promise<boolean>} - Success status
   */
  async clearData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      this.emit('storageError', error);
      if (error.name === 'SecurityError') {
        throw new SecurityError('Access to localStorage denied');
      }
      throw new Error(`Failed to clear data: ${error.message}`);
    }
  }

  /**
   * Export data as JSON for backup
   * @returns {string} - JSON representation of all data
   */
  exportData() {
    try {
      const data = this.loadData();
      if (!data) {
        return '{}';
      }

      // Create export-friendly format
      const exportData = {
        version: data.version,
        exportedAt: new Date().toISOString(),
        ...data
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      this.emit('storageError', error);
      if (error.name === 'SecurityError') {
        throw new SecurityError('Access to localStorage denied');
      }
      throw new Error(`Failed to export data: ${error.message}`);
    }
  }

  /**
   * Import data from JSON backup
   * @param {string} jsonData - JSON data to import
   * @returns {Promise<boolean>} - Success status
   */
  async importData(jsonData) {
    try {
      if (typeof jsonData !== 'string') {
        throw new ValidationError('Import data must be a string');
      }

      const parsedData = JSON.parse(jsonData);

      // Validate imported data structure
      this.validateAppData(parsedData);

      // Save the imported data
      await this.saveData(parsedData);

      return true;
    } catch (error) {
      this.emit('storageError', error);

      if (error instanceof SyntaxError) {
        throw new SyntaxError('Invalid JSON format in import data');
      }
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to import data: ${error.message}`);
    }
  }

  /**
   * Validate application data structure
   * @param {Object} data - Data to validate
   */
  validateAppData(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Data must be an object');
    }

    // Validate arrays if present
    const arrayProps = ['tasks', 'timeEntries', 'workDays', 'mealBreaks', 'activityCounters'];
    for (const prop of arrayProps) {
      if (data[prop] && !Array.isArray(data[prop])) {
        throw new ValidationError(`${prop} must be an array`);
      }
    }

    // Validate settings object if present
    if (data.settings && typeof data.settings !== 'object') {
      throw new ValidationError('Settings must be an object');
    }
  }

  /**
   * Validate and migrate data from older versions
   * @param {Object} data - Raw data from storage
   * @returns {Object} - Validated and migrated data
   */
  validateAndMigrateData(data) {
    // Add version if missing
    if (!data.version) {
      data.version = CURRENT_VERSION;
    }

    // Migrate data if needed (for future versions)
    if (data.version !== CURRENT_VERSION) {
      data = this.migrateData(data);
    }

    return data;
  }

  /**
   * Migrate data from older versions
   * @param {Object} data - Data to migrate
   * @returns {Object} - Migrated data
   */
  migrateData(data) {
    // Placeholder for future migrations
    // For now, just update version
    data.version = CURRENT_VERSION;
    data.lastUpdated = new Date().toISOString();
    return data;
  }

  /**
   * Get storage usage statistics
   * @returns {Object} - Storage statistics
   */
  getStorageStats() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const sizeInBytes = data ? new Blob([data]).size : 0;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

      return {
        sizeInBytes,
        sizeInKB: parseFloat(sizeInKB),
        sizeInMB: parseFloat(sizeInMB),
        isEmpty: sizeInBytes === 0
      };
    } catch (error) {
      this.emit('storageError', error);
      return { sizeInBytes: 0, sizeInKB: 0, sizeInMB: 0, isEmpty: true };
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
   * Start auto-save with specified interval
   * @param {number} intervalMs - Interval in milliseconds (default: 30000 = 30 seconds)
   */
  startAutoSave(intervalMs = 30000) {
    this.stopAutoSave(); // Stop any existing auto-save

    this.autoSaveInterval = intervalMs;
    console.log(`Auto-save started with ${intervalMs}ms interval`);
  }

  /**
   * Stop auto-save
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    // Save any pending data
    if (this.pendingData) {
      this.saveData(this.pendingData).catch((error) => {
        console.error('Failed to save pending data on auto-save stop:', error);
      });
    }

    console.log('Auto-save stopped');
  }

  /**
   * Schedule auto-save for data
   * @param {Object} data - Data to save
   */
  scheduleAutoSave(data) {
    this.pendingData = data;

    // Clear existing timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    // Schedule new save
    if (this.autoSaveInterval) {
      this.autoSaveTimer = setTimeout(async () => {
        try {
          await this.saveData(this.pendingData);
          this.pendingData = null;
          console.log('Auto-save completed');
          this.emit('autoSaveCompleted');
        } catch (error) {
          console.error('Auto-save failed:', error);
          this.emit('autoSaveError', error);
        }
      }, this.autoSaveInterval);
    }
  }

  /**
   * Manually trigger auto-save for pending data
   */
  async autoSave() {
    if (this.pendingData) {
      try {
        await this.saveData(this.pendingData);
        this.pendingData = null;

        // Clear scheduled timer since we saved manually
        if (this.autoSaveTimer) {
          clearTimeout(this.autoSaveTimer);
          this.autoSaveTimer = null;
        }

        console.log('Manual auto-save completed');
        this.emit('autoSaveCompleted');
        return true;
      } catch (error) {
        console.error('Manual auto-save failed:', error);
        this.emit('autoSaveError', error);
        throw error;
      }
    }
    return false;
  }

  /**
   * Clean up old data based on retention settings
   * @param {number} retentionWeeks - Number of weeks to retain data (default: 5)
   * @returns {Promise<Object>} - Cleanup statistics
   */
  async cleanupOldData(retentionWeeks = 5) {
    try {
      const data = this.loadData();
      if (!data) {
        return { deleted: 0, retained: 0, message: 'No data to clean up' };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (retentionWeeks * 7));

      let deletedCount = 0;
      let retainedCount = 0;

      // Clean up time entries
      if (data.timeEntries && Array.isArray(data.timeEntries)) {
        data.timeEntries = data.timeEntries.filter((entry) => {
          const entryDate = new Date(entry.date || entry.startTime);
          if (entryDate < cutoffDate) {
            deletedCount++;
            return false;
          }
          retainedCount++;
          return true;
        });
      }

      // Clean up work days
      if (data.workDays && Array.isArray(data.workDays)) {
        data.workDays = data.workDays.filter((workDay) => {
          const workDate = new Date(workDay.date);
          if (workDate < cutoffDate) {
            deletedCount++;
            return false;
          }
          retainedCount++;
          return true;
        });
      }

      // Clean up meal breaks
      if (data.mealBreaks && Array.isArray(data.mealBreaks)) {
        data.mealBreaks = data.mealBreaks.filter((mealBreak) => {
          const mealDate = new Date(mealBreak.date || mealBreak.startTime);
          if (mealDate < cutoffDate) {
            deletedCount++;
            return false;
          }
          retainedCount++;
          return true;
        });
      }

      // Clean up activity counters
      if (data.activityCounters && Array.isArray(data.activityCounters)) {
        data.activityCounters = data.activityCounters.filter((counter) => {
          const counterDate = new Date(counter.date);
          if (counterDate < cutoffDate) {
            deletedCount++;
            return false;
          }
          retainedCount++;
          return true;
        });
      }

      // Save cleaned data
      if (deletedCount > 0) {
        await this.saveData(data);
        this.emit('dataCleanupCompleted', {
          deleted: deletedCount,
          retained: retainedCount,
          cutoffDate: cutoffDate.toISOString(),
          retentionWeeks
        });
      }

      return {
        deleted: deletedCount,
        retained: retainedCount,
        cutoffDate: cutoffDate.toISOString(),
        message: deletedCount > 0
          ? `Cleaned up ${deletedCount} old records, retained ${retainedCount} recent records`
          : 'No old data found to clean up'
      };
    } catch (error) {
      this.emit('storageError', error);
      throw new Error(`Failed to clean up old data: ${error.message}`);
    }
  }

  /**
   * Schedule automatic data cleanup
   * @param {number} retentionWeeks - Number of weeks to retain data
   * @param {number} intervalHours - How often to run cleanup (in hours, default: 24)
   */
  startAutoCleanup(retentionWeeks = 5, intervalHours = 24) {
    // Stop any existing cleanup
    this.stopAutoCleanup();

    const intervalMs = intervalHours * 60 * 60 * 1000; // Convert hours to milliseconds

    this.cleanupInterval = setInterval(async () => {
      try {
        console.log('Running scheduled data cleanup...');
        const result = await this.cleanupOldData(retentionWeeks);
        console.log('Auto cleanup completed:', result.message);

        this.emit('autoCleanupCompleted', result);
      } catch (error) {
        console.error('Auto cleanup failed:', error);
        this.emit('autoCleanupError', error);
      }
    }, intervalMs);

    console.log(`Auto cleanup scheduled every ${intervalHours} hours with ${retentionWeeks} weeks retention`);

    // Run initial cleanup
    this.cleanupOldData(retentionWeeks).catch((error) => {
      console.error('Initial cleanup failed:', error);
    });
  }

  /**
   * Stop automatic data cleanup
   */
  stopAutoCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Auto cleanup stopped');
    }
  }

  /**
   * Get data usage statistics by age
   * @param {number} retentionWeeks - Retention period to analyze
   * @returns {Object} - Usage statistics
   */
  getDataAgeStats(retentionWeeks = 5) {
    try {
      const data = this.loadData();
      if (!data) {
        return { total: 0, withinRetention: 0, beyondRetention: 0 };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (retentionWeeks * 7));

      let total = 0;
      let withinRetention = 0;
      let beyondRetention = 0;

      // Count time entries
      if (data.timeEntries && Array.isArray(data.timeEntries)) {
        data.timeEntries.forEach((entry) => {
          total++;
          const entryDate = new Date(entry.date || entry.startTime);
          if (entryDate >= cutoffDate) {
            withinRetention++;
          } else {
            beyondRetention++;
          }
        });
      }

      // Count other data types
      const dataTypes = ['workDays', 'mealBreaks', 'activityCounters'];
      dataTypes.forEach((type) => {
        if (data[type] && Array.isArray(data[type])) {
          data[type].forEach((item) => {
            total++;
            const itemDate = new Date(item.date || item.startTime);
            if (itemDate >= cutoffDate) {
              withinRetention++;
            } else {
              beyondRetention++;
            }
          });
        }
      });

      return {
        total,
        withinRetention,
        beyondRetention,
        retentionWeeks,
        cutoffDate: cutoffDate.toISOString(),
        needsCleanup: beyondRetention > 0
      };
    } catch (error) {
      this.emit('storageError', error);
      return { total: 0, withinRetention: 0, beyondRetention: 0, error: error.message };
    }
  }

  /**
   * Destroy service and clean up
   */
  destroy() {
    this.stopAutoSave();
    this.stopAutoCleanup();
    this.eventListeners.clear();
  }
}

// Custom error classes
export class StorageQuotaExceededError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StorageQuotaExceededError';
  }
}

export class SecurityError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
