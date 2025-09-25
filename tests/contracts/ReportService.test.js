import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReportService } from '../../src/services/ReportService.js';

describe('ReportService Contract Tests', () => {
  let reportService;

  beforeEach(() => {
    reportService = new ReportService();
  });

  afterEach(() => {
    reportService.destroy?.();
  });

  describe('getDailyReport method', () => {
    it('should generate daily report for valid date', async () => {
      const date = '2023-09-24';

      const result = await reportService.getDailyReport(date);

      expect(result).toHaveProperty('date', date);
      expect(result).toHaveProperty('totalWorkTime');
      expect(result).toHaveProperty('totalPresenceTime');
      expect(result).toHaveProperty('mealBreakTime');
      expect(result).toHaveProperty('taskBreakdown');
      expect(result).toHaveProperty('activityCounters');
      expect(result).toHaveProperty('timeEntries');

      expect(typeof result.totalWorkTime).toBe('number');
      expect(typeof result.totalPresenceTime).toBe('number');
      expect(typeof result.mealBreakTime).toBe('number');
      expect(Array.isArray(result.taskBreakdown)).toBe(true);
      expect(Array.isArray(result.timeEntries)).toBe(true);
    });

    it('should throw InvalidDateError for invalid date format', async () => {
      await expect(reportService.getDailyReport('invalid-date')).rejects.toThrow(
        'InvalidDateError'
      );
    });

    it('should return report with zero values for date with no data', async () => {
      const result = await reportService.getDailyReport('2023-01-01');

      expect(result.totalWorkTime).toBe(0);
      expect(result.totalPresenceTime).toBe(0);
      expect(result.mealBreakTime).toBe(0);
      expect(result.taskBreakdown).toEqual([]);
      expect(result.timeEntries).toEqual([]);
    });
  });

  describe('getWeeklyReport method', () => {
    it('should generate weekly report for valid Monday date', async () => {
      const weekStart = '2023-09-25'; // Monday

      const result = await reportService.getWeeklyReport(weekStart);

      expect(result).toHaveProperty('weekStart', weekStart);
      expect(result).toHaveProperty('weekEnd');
      expect(result).toHaveProperty('totalWorkTime');
      expect(result).toHaveProperty('totalPresenceTime');
      expect(result).toHaveProperty('dailyBreakdown');
      expect(result).toHaveProperty('taskSummary');
      expect(result).toHaveProperty('averagePerDay');

      expect(typeof result.totalWorkTime).toBe('number');
      expect(typeof result.totalPresenceTime).toBe('number');
      expect(Array.isArray(result.dailyBreakdown)).toBe(true);
      expect(Array.isArray(result.taskSummary)).toBe(true);
      expect(result.dailyBreakdown).toHaveLength(5); // Monday to Friday

      // Verify each day structure
      result.dailyBreakdown.forEach((day) => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('workTime');
        expect(day).toHaveProperty('presenceTime');
        expect(day).toHaveProperty('dayOfWeek');
      });
    });

    it('should throw InvalidDateError for non-Monday date', async () => {
      const tuesday = '2023-09-26';

      await expect(reportService.getWeeklyReport(tuesday)).rejects.toThrow('InvalidDateError');
    });

    it('should format task summary with hh:mm format', async () => {
      const result = await reportService.getWeeklyReport('2023-09-25');

      result.taskSummary.forEach((task) => {
        expect(task).toHaveProperty('taskId');
        expect(task).toHaveProperty('taskName');
        expect(task).toHaveProperty('totalTime');
        expect(task).toHaveProperty('formattedTime');
        expect(task.formattedTime).toMatch(/^\d{1,2}:\d{2}$/); // hh:mm format
      });
    });
  });

  describe('getAvailableWeeks method', () => {
    it('should return array of week options', () => {
      const result = reportService.getAvailableWeeks();

      expect(Array.isArray(result)).toBe(true);

      // Verify structure of week options
      result.forEach((week) => {
        expect(week).toHaveProperty('weekStart');
        expect(week).toHaveProperty('label');
        expect(week).toHaveProperty('hasData');
        expect(typeof week.hasData).toBe('boolean');
        expect(week.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
      });
    });

    it('should return weeks in reverse chronological order', () => {
      const result = reportService.getAvailableWeeks();

      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          const current = new Date(result[i].weekStart);
          const previous = new Date(result[i - 1].weekStart);
          expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
        }
      }
    });
  });

  describe('getAuditData method', () => {
    it('should return complete audit data without date filter', async () => {
      const result = await reportService.getAuditData({});

      expect(result).toHaveProperty('totalEntries');
      expect(result).toHaveProperty('dateRange');
      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('summary');

      expect(typeof result.totalEntries).toBe('number');
      expect(Array.isArray(result.entries)).toBe(true);

      // Verify entry structure
      result.entries.forEach((entry) => {
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('type'); // 'timeEntry', 'mealBreak', 'adjustment'
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('timestamp');
        expect(entry).toHaveProperty('details');
      });
    });

    it('should filter audit data by date range', async () => {
      const dateRange = {
        start: new Date('2023-09-01'),
        end: new Date('2023-09-30')
      };

      const result = await reportService.getAuditData(dateRange);

      expect(result.dateRange).toEqual(dateRange);

      // Verify all entries are within date range
      result.entries.forEach((entry) => {
        const entryDate = new Date(entry.date);
        expect(entryDate.getTime()).toBeGreaterThanOrEqual(dateRange.start.getTime());
        expect(entryDate.getTime()).toBeLessThanOrEqual(dateRange.end.getTime());
      });
    });

    it('should throw InvalidDateRangeError for invalid date range', async () => {
      const invalidRange = {
        start: new Date('2023-09-30'),
        end: new Date('2023-09-01') // end before start
      };

      await expect(reportService.getAuditData(invalidRange)).rejects.toThrow(
        'InvalidDateRangeError'
      );
    });
  });

  describe('calculatePresenceTime method', () => {
    it('should calculate presence time breakdown for date', async () => {
      const date = '2023-09-24';

      const result = await reportService.calculatePresenceTime(date);

      expect(result).toHaveProperty('date', date);
      expect(result).toHaveProperty('arrivalTime');
      expect(result).toHaveProperty('departureTime');
      expect(result).toHaveProperty('totalPresence');
      expect(result).toHaveProperty('workTime');
      expect(result).toHaveProperty('mealBreaks');
      expect(result).toHaveProperty('otherBreaks');
      expect(result).toHaveProperty('idleTime');

      expect(typeof result.totalPresence).toBe('number');
      expect(typeof result.workTime).toBe('number');
      expect(Array.isArray(result.mealBreaks)).toBe(true);
      expect(Array.isArray(result.otherBreaks)).toBe(true);

      // Verify time consistency
      const calculatedTotal =
        result.workTime +
        result.mealBreaks.reduce((sum, mb) => sum + mb.duration, 0) +
        result.idleTime;
      expect(Math.abs(calculatedTotal - result.totalPresence)).toBeLessThan(1000); // Allow 1s tolerance
    });

    it('should return null times for date with no activity', async () => {
      const result = await reportService.calculatePresenceTime('2023-01-01');

      expect(result.arrivalTime).toBeNull();
      expect(result.departureTime).toBeNull();
      expect(result.totalPresence).toBe(0);
      expect(result.workTime).toBe(0);
    });
  });

  describe('exportWeeklyData method', () => {
    it('should export weekly data in JSON format', async () => {
      const result = await reportService.exportWeeklyData('2023-09-25', 'json');

      expect(typeof result).toBe('string');

      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('weekStart');
      expect(parsed).toHaveProperty('weekEnd');
      expect(parsed).toHaveProperty('tasks');
      expect(parsed).toHaveProperty('dailyTotals');
      expect(Array.isArray(parsed.tasks)).toBe(true);
      expect(Array.isArray(parsed.dailyTotals)).toBe(true);
    });

    it('should export weekly data in CSV format', async () => {
      const result = await reportService.exportWeeklyData('2023-09-25', 'csv');

      expect(typeof result).toBe('string');
      expect(result).toContain(','); // CSV contains commas
      expect(result).toContain('Task,Monday,Tuesday,Wednesday,Thursday,Friday,Total'); // Header row
    });

    it('should export weekly data in text format', async () => {
      const result = await reportService.exportWeeklyData('2023-09-25', 'text');

      expect(typeof result).toBe('string');
      expect(result).toContain('Week of'); // Text format header
      expect(result).toContain('Total:'); // Summary line
    });

    it('should throw UnsupportedFormatError for invalid format', async () => {
      await expect(reportService.exportWeeklyData('2023-09-25', 'xml')).rejects.toThrow(
        'UnsupportedFormatError'
      );
    });
  });

  describe('events', () => {
    it('should emit reportGenerated event when generating reports', async () => {
      let eventPayload = null;
      reportService.on('reportGenerated', (payload) => {
        eventPayload = payload;
      });

      await reportService.getDailyReport('2023-09-24');

      expect(eventPayload).toHaveProperty('type', 'daily');
      expect(eventPayload).toHaveProperty('date', '2023-09-24');
      expect(eventPayload).toHaveProperty('duration');
      expect(typeof eventPayload.duration).toBe('number');
    });

    it('should emit dataExported event when exporting data', async () => {
      let eventPayload = null;
      reportService.on('dataExported', (payload) => {
        eventPayload = payload;
      });

      await reportService.exportWeeklyData('2023-09-25', 'json');

      expect(eventPayload).toHaveProperty('format', 'json');
      expect(eventPayload).toHaveProperty('size');
      expect(typeof eventPayload.size).toBe('number');
    });
  });
});
