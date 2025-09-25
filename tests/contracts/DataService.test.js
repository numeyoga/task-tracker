import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataService } from '../../src/services/DataService.js';

describe('DataService Contract Tests', () => {
  let dataService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    dataService = new DataService();
  });

  afterEach(() => {
    // Clean up after tests
    localStorage.clear();
  });

  describe('saveData method', () => {
    it('should save data to localStorage and return Promise<boolean>', async () => {
      const testData = {
        tasks: [{ id: '1', name: 'Test Task' }],
        timeEntries: [],
        settings: { dailyHours: 8 }
      };

      const result = await dataService.saveData(testData);

      expect(result).toBe(true);
      expect(typeof result).toBe('boolean');
      // Verify data was actually saved
      const savedData = localStorage.getItem('task-tracker-data');
      expect(savedData).toBeTruthy();
      expect(JSON.parse(savedData)).toEqual(testData);
    });

    it('should throw StorageQuotaExceededError when localStorage is full', async () => {
      const largeData = {
        tasks: new Array(100000).fill({
          id: '1',
          name: 'Large task with lots of data'.repeat(1000)
        })
      };

      await expect(dataService.saveData(largeData)).rejects.toThrow('StorageQuotaExceededError');
    });
  });

  describe('loadData method', () => {
    it('should load data from localStorage and return AppData', () => {
      const testData = {
        tasks: [{ id: '1', name: 'Test Task' }],
        timeEntries: [],
        settings: { dailyHours: 8 }
      };
      localStorage.setItem('task-tracker-data', JSON.stringify(testData));

      const result = dataService.loadData();

      expect(result).toEqual(testData);
      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('timeEntries');
      expect(result).toHaveProperty('settings');
    });

    it('should return null when no data exists', () => {
      const result = dataService.loadData();
      expect(result).toBeNull();
    });

    it('should throw SyntaxError for corrupted data', () => {
      localStorage.setItem('task-tracker-data', 'invalid-json{');

      expect(() => dataService.loadData()).toThrow('SyntaxError');
    });
  });

  describe('clearData method', () => {
    it('should clear all data and return Promise<boolean>', async () => {
      localStorage.setItem('task-tracker-data', '{"test": true}');

      const result = await dataService.clearData();

      expect(result).toBe(true);
      expect(localStorage.getItem('task-tracker-data')).toBeNull();
    });
  });

  describe('exportData method', () => {
    it('should export data as JSON string', () => {
      const testData = { tasks: [], timeEntries: [] };
      localStorage.setItem('task-tracker-data', JSON.stringify(testData));

      const result = dataService.exportData();

      expect(typeof result).toBe('string');
      expect(JSON.parse(result)).toEqual(testData);
    });

    it('should return empty object JSON when no data exists', () => {
      const result = dataService.exportData();
      expect(result).toBe('{}');
    });
  });

  describe('importData method', () => {
    it('should import valid JSON data and return Promise<boolean>', async () => {
      const testData = { tasks: [{ id: '1', name: 'Imported' }] };
      const jsonData = JSON.stringify(testData);

      const result = await dataService.importData(jsonData);

      expect(result).toBe(true);
      const savedData = localStorage.getItem('task-tracker-data');
      expect(JSON.parse(savedData)).toEqual(testData);
    });

    it('should throw ValidationError for invalid data structure', async () => {
      const invalidData = JSON.stringify({ invalid: 'structure' });

      await expect(dataService.importData(invalidData)).rejects.toThrow('ValidationError');
    });

    it('should throw SyntaxError for invalid JSON', async () => {
      await expect(dataService.importData('invalid-json{')).rejects.toThrow('SyntaxError');
    });
  });

  describe('events', () => {
    it('should emit dataLoaded event when data is loaded', () => {
      const testData = { tasks: [] };
      localStorage.setItem('task-tracker-data', JSON.stringify(testData));

      let eventPayload = null;
      dataService.on('dataLoaded', (data) => {
        eventPayload = data;
      });

      dataService.loadData();
      expect(eventPayload).toEqual(testData);
    });

    it('should emit dataSaved event when data is saved', async () => {
      let eventPayload = null;
      dataService.on('dataSaved', (payload) => {
        eventPayload = payload;
      });

      await dataService.saveData({ tasks: [] });

      expect(eventPayload).toHaveProperty('timestamp');
      expect(eventPayload).toHaveProperty('size');
      expect(eventPayload.timestamp).toBeInstanceOf(Date);
      expect(typeof eventPayload.size).toBe('number');
    });

    it('should emit storageError event on storage failures', async () => {
      let eventPayload = null;
      dataService.on('storageError', (error) => {
        eventPayload = error;
      });

      // Force a storage error by filling localStorage
      try {
        const largeData = { tasks: new Array(100000).fill('large') };
        await dataService.saveData(largeData);
      } catch (error) {
        // Error should be emitted as event
      }

      expect(eventPayload).toBeInstanceOf(Error);
    });
  });
});
