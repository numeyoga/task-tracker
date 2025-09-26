/**
 * ReportService Implementation
 * Service for generating reports and analytics
 */

// Models imported for type checking but not used directly
// import { WorkDay } from '../models/WorkDay.js';
// import { TimeEntry } from '../models/TimeEntry.js';
// import { MealBreak } from '../models/MealBreak.js';

export class ReportService {
  constructor(dataService = null) {
    this.dataService = dataService;
    this.eventListeners = new Map();
  }

  /**
   * Generate daily work report
   * @param {string} date - ISO date string (YYYY-MM-DD)
   * @returns {Object} - Daily statistics and breakdown
   */
  async getDailyReport(date) {
    if (!this.isValidDateString(date)) {
      throw new InvalidDateError('Date must be in YYYY-MM-DD format');
    }

    const startTime = performance.now();

    try {
      const data = this.loadData();

      // Get time entries for this date
      const timeEntries = this.getTimeEntriesForDate(data, date);
      const mealBreaks = this.getMealBreaksForDate(data, date);
      const workDay = this.getOrCalculateWorkDay(data, date, timeEntries, mealBreaks);

      // Group time entries by task
      const taskBreakdown = await this.calculateTaskBreakdown(data, timeEntries);

      // Calculate totals
      const totalTaskTime = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
      const totalMealTime = mealBreaks.reduce((sum, mb) => sum + (mb.duration || 0), 0);

      const report = {
        date,
        arrivalTime: workDay.arrivalTime,
        departureTime: workDay.departureTime,
        totalPresenceTime: workDay.totalPresenceTime,
        totalWorkTime: totalTaskTime,
        mealBreakTime: totalMealTime,
        workingTime: workDay.totalPresenceTime - totalMealTime,
        efficiency:
          totalTaskTime > 0
            ? Math.round((totalTaskTime / (workDay.totalPresenceTime - totalMealTime)) * 100)
            : 0,
        taskBreakdown,
        activityCounters: workDay.activityCounters || {},
        timeEntries: timeEntries.map((entry) => ({
          id: entry.id,
          taskId: entry.taskId,
          taskName: taskBreakdown.find((t) => t.taskId === entry.taskId)?.taskName || 'Unknown',
          startTime: entry.startTime,
          endTime: entry.endTime,
          duration: entry.duration,
          isManual: entry.isManual || false,
          note: entry.note || ''
        })),
        mealBreaks: mealBreaks.map((mb) => ({
          id: mb.id,
          startTime: mb.startTime,
          endTime: mb.endTime,
          duration: mb.duration
        }))
      };

      // Emit event
      this.emit('reportGenerated', {
        type: 'daily',
        date,
        duration: performance.now() - startTime
      });

      return report;
    } catch (error) {
      console.error('Error generating daily report:', error);
      throw error;
    }
  }

  /**
   * Generate weekly work report (Monday-Friday)
   * @param {string} weekStart - Monday date (YYYY-MM-DD)
   * @returns {Object} - Weekly statistics and task breakdown
   */
  async getWeeklyReport(weekStart) {
    if (!this.isValidDateString(weekStart)) {
      throw new InvalidDateError('Week start date must be in YYYY-MM-DD format');
    }

    // Verify it's a Monday
    const startDate = new Date(weekStart + 'T00:00:00');
    if (startDate.getDay() !== 1) {
      throw new InvalidDateError('Week start date must be a Monday');
    }

    const startTime = performance.now();

    try {
      this.loadData();
      const weekDates = this.getWeekDates(weekStart);
      const dailyReports = [];

      // Generate daily reports for Monday-Friday
      for (const date of weekDates) {
        try {
          const dailyReport = await this.getDailyReport(date);
          dailyReports.push(dailyReport);
        } catch {
          // If daily report fails, create empty report for that day
          dailyReports.push(this.createEmptyDailyReport(date));
        }
      }

      // Calculate weekly totals
      const weeklyTotals = {
        totalPresenceTime: 0,
        totalTaskTime: 0,
        totalMealTime: 0,
        totalWorkingTime: 0
      };

      const taskTotals = new Map();
      const activityTotals = {};

      dailyReports.forEach((report) => {
        weeklyTotals.totalPresenceTime += report.totalPresenceTime || 0;
        weeklyTotals.totalTaskTime += report.totalWorkTime || 0;
        weeklyTotals.totalMealTime += report.mealBreakTime || 0;
        weeklyTotals.totalWorkingTime += report.workingTime || 0;

        // Aggregate task breakdown
        report.taskBreakdown.forEach((task) => {
          if (!taskTotals.has(task.taskId)) {
            taskTotals.set(task.taskId, {
              taskId: task.taskId,
              taskName: task.taskName,
              totalTime: 0,
              sessionCount: 0,
              averageSession: 0
            });
          }
          const taskTotal = taskTotals.get(task.taskId);
          taskTotal.totalTime += task.totalTime;
          taskTotal.sessionCount += task.sessionCount;
        });

        // Aggregate activity counters
        Object.entries(report.activityCounters || {}).forEach(([activity, count]) => {
          activityTotals[activity] = (activityTotals[activity] || 0) + count;
        });
      });

      // Calculate averages for tasks
      Array.from(taskTotals.values()).forEach((task) => {
        task.averageSession = task.sessionCount > 0 ? task.totalTime / task.sessionCount : 0;
      });

      const weekEnd = weekDates[weekDates.length - 1];
      const weeklyEfficiency =
        weeklyTotals.totalWorkingTime > 0
          ? Math.round((weeklyTotals.totalTaskTime / weeklyTotals.totalWorkingTime) * 100)
          : 0;

      const report = {
        weekStart,
        weekEnd,
        weekDates,
        totalWorkTime: weeklyTotals.totalTaskTime,
        totalPresenceTime: weeklyTotals.totalPresenceTime,
        dailyBreakdown: dailyReports.map(day => ({
          ...day,
          workTime: day.totalWorkTime,
          presenceTime: day.totalPresenceTime,
          dayOfWeek: new Date(day.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'long' })
        })),
        taskSummary: Array.from(taskTotals.values()).sort((a, b) => b.totalTime - a.totalTime),
        efficiency: weeklyEfficiency,
        activityTotals,
        averagePerDay: {
          dailyPresence: weeklyTotals.totalPresenceTime / weekDates.length,
          dailyTaskTime: weeklyTotals.totalTaskTime / weekDates.length,
          dailyWorkingTime: weeklyTotals.totalWorkingTime / weekDates.length
        }
      };

      // Emit event
      this.emit('reportGenerated', {
        type: 'weekly',
        date: weekStart,
        duration: performance.now() - startTime
      });

      return report;
    } catch (error) {
      console.error('Error generating weekly report:', error);
      throw error;
    }
  }

  /**
   * Get list of weeks with data for dropdown selection
   * @returns {Array} - Array of week options
   */
  async getAvailableWeeks() {
    try {
      const data = this.loadData();
      if (!data || !data.timeEntries || data.timeEntries.length === 0) {
        return [];
      }

      // Get all unique dates from time entries
      const dates = [...new Set(data.timeEntries.map((entry) => entry.date))];
      if (dates.length === 0) return [];

      // Convert to week starts (Mondays)
      const weekStarts = new Set();
      dates.forEach((dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        const monday = this.getMonday(date);
        weekStarts.add(monday.toISOString().split('T')[0]);
      });

      // Convert to sorted array of week options
      return Array.from(weekStarts)
        .sort((a, b) => new Date(b) - new Date(a))
        .map((weekStart) => {
          const startDate = new Date(weekStart + 'T00:00:00');
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 4); // Friday

          return {
            value: weekStart,
            label: `Week of ${this.formatDate(startDate)} - ${this.formatDate(endDate)}`,
            startDate: weekStart,
            endDate: endDate.toISOString().split('T')[0]
          };
        });
    } catch (error) {
      console.error('Error getting available weeks:', error);
      return [];
    }
  }

  /**
   * Get all historical data for audit view
   * @param {Object} dateRange - Optional date range filter
   * @returns {Object} - Complete historical data
   */
  async getAuditData(dateRange = null) {
    const data = this.loadData();

    let timeEntries = data?.timeEntries || [];
    let mealBreaks = data?.mealBreaks || [];
    let workDays = data?.workDays || [];
    let tasks = data?.tasks || [];

    // Apply date range filter if provided
    if (dateRange && dateRange.start && dateRange.end) {
      if (!this.isValidDateRange(dateRange)) {
        throw new InvalidDateRangeError('Invalid date range provided');
      }

      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      timeEntries = timeEntries.filter((entry) => {
        const entryDate = new Date(entry.date || entry.startTime);
        return entryDate >= startDate && entryDate <= endDate;
      });

      mealBreaks = mealBreaks.filter((mb) => {
        const mbDate = new Date(mb.date || mb.startTime);
        return mbDate >= startDate && mbDate <= endDate;
      });

      workDays = workDays.filter((wd) => {
        const wdDate = new Date(wd.date);
        return wdDate >= startDate && wdDate <= endDate;
      });
    }

    // Enrich time entries with task names
    const enrichedTimeEntries = timeEntries.map((entry) => {
      const task = tasks.find((t) => t.id === entry.taskId);
      return {
        ...entry,
        taskName: task?.name || 'Unknown Task',
        taskColor: task?.color || 'primary'
      };
    });

    // Sort by date descending
    enrichedTimeEntries.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    mealBreaks.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    workDays.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      entries: enrichedTimeEntries,
      timeEntries: enrichedTimeEntries,
      mealBreaks,
      workDays,
      tasks,
      dateRange,
      totalEntries: enrichedTimeEntries.length,
      totalMealBreaks: mealBreaks.length,
      totalWorkDays: workDays.length,
      summary: {
        totalTime: enrichedTimeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0),
        totalSessions: enrichedTimeEntries.length,
        uniqueTasks: new Set(enrichedTimeEntries.map(e => e.taskId)).size,
        dateRange: dateRange
      }
    };
  }

  /**
   * Calculate presence time for specific date
   * @param {string} date - ISO date string
   * @returns {Object} - Presence time breakdown
   */
  async calculatePresenceTime(date) {
    if (!this.isValidDateString(date)) {
      throw new InvalidDateError('Date must be in YYYY-MM-DD format');
    }

    try {
      const data = this.loadData();
      const timeEntries = this.getTimeEntriesForDate(data, date);
      const mealBreaks = this.getMealBreaksForDate(data, date);

      if (timeEntries.length === 0) {
        return {
          date,
          hasData: false,
          arrivalTime: null,
          departureTime: null,
          totalPresence: 0,
          workTime: 0,
          mealBreaks: [],
          otherBreaks: [],
          idleTime: 0
        };
      }

      // Calculate arrival and departure times
      const arrivalTime = new Date(Math.min(...timeEntries.map((e) => new Date(e.startTime))));
      const departureTime = new Date(
        Math.max(...timeEntries.map((e) => new Date(e.endTime || e.startTime)))
      );

      const totalPresenceTime = departureTime - arrivalTime;
      const totalMealTime = mealBreaks.reduce((sum, mb) => sum + (mb.duration || 0), 0);
      const workingTime = totalPresenceTime - totalMealTime;

      return {
        date,
        hasData: true,
        arrivalTime,
        departureTime,
        totalPresence: totalPresenceTime,
        workTime: workingTime,
        mealBreaks: mealBreaks,
        otherBreaks: [],
        idleTime: Math.max(0, workingTime - timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)),
        entries: timeEntries.length
      };
    } catch (error) {
      console.error('Error calculating presence time:', error);
      throw error;
    }
  }

  /**
   * Export weekly data in format for external systems
   * @param {string} weekStart - Monday date (YYYY-MM-DD)
   * @param {string} format - Export format (json|csv|text)
   * @returns {string} - Formatted export data
   */
  async exportWeeklyData(weekStart, format = 'json') {
    if (!this.isValidDateString(weekStart)) {
      throw new InvalidDateError('Week start date must be in YYYY-MM-DD format');
    }

    if (!['json', 'csv', 'text'].includes(format)) {
      throw new UnsupportedFormatError(
        `Format '${format}' is not supported. Use: json, csv, or text`
      );
    }

    try {
      const weeklyReport = await this.getWeeklyReport(weekStart);
      let exportData;

      switch (format) {
        case 'json':
          exportData = JSON.stringify({
            weekStart: weeklyReport.weekStart,
            weekEnd: weeklyReport.weekEnd,
            tasks: weeklyReport.taskSummary,
            dailyTotals: weeklyReport.dailyBreakdown,
            totals: {
              totalWorkTime: weeklyReport.totalWorkTime,
              totalPresenceTime: weeklyReport.totalPresenceTime
            },
            efficiency: weeklyReport.efficiency,
            averagePerDay: weeklyReport.averagePerDay
          }, null, 2);
          break;
        case 'csv':
          exportData = this.formatAsCSV(weeklyReport);
          break;
        case 'text':
          exportData = this.formatAsText(weeklyReport);
          break;
      }

      // Emit event
      this.emit('dataExported', {
        format,
        size: exportData.length
      });

      return exportData;
    } catch (error) {
      console.error('Error exporting weekly data:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */

  loadData() {
    if (!this.dataService) {
      return {};
    }
    return this.dataService.loadData() || {};
  }

  isValidDateString(dateString) {
    if (typeof dateString !== 'string') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    // Parse date parts to avoid timezone issues
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // Validate ranges
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Use Date.UTC to avoid timezone issues
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
           date.getUTCMonth() === month - 1 &&
           date.getUTCDate() === day;
  }

  isValidDateRange(dateRange) {
    if (!dateRange || !dateRange.start || !dateRange.end) return false;
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    return start <= end;
  }

  getTimeEntriesForDate(data, date) {
    if (!data.timeEntries) return [];
    return data.timeEntries.filter((entry) => {
      return entry.date === date || (entry.startTime && entry.startTime.startsWith(date));
    });
  }

  getMealBreaksForDate(data, date) {
    if (!data.mealBreaks) return [];
    return data.mealBreaks.filter((mb) => {
      return mb.date === date || (mb.startTime && mb.startTime.startsWith(date));
    });
  }

  getOrCalculateWorkDay(data, date, timeEntries, mealBreaks) {
    // Try to find existing work day
    const existingWorkDay = data.workDays?.find((wd) => wd.date === date);
    if (existingWorkDay) {
      return existingWorkDay;
    }

    // Calculate work day from entries
    if (timeEntries.length === 0) {
      return {
        date,
        arrivalTime: null,
        departureTime: null,
        totalPresenceTime: 0,
        totalTaskTime: 0,
        mealBreakTime: 0,
        workingTime: 0,
        activityCounters: {}
      };
    }

    const arrivalTime = new Date(Math.min(...timeEntries.map((e) => new Date(e.startTime))));
    const departureTime = new Date(
      Math.max(...timeEntries.map((e) => new Date(e.endTime || e.startTime)))
    );
    const totalPresenceTime = departureTime - arrivalTime;
    const totalTaskTime = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const mealBreakTime = mealBreaks.reduce((sum, mb) => sum + (mb.duration || 0), 0);

    return {
      date,
      arrivalTime,
      departureTime,
      totalPresenceTime,
      totalTaskTime,
      mealBreakTime,
      workingTime: totalPresenceTime - mealBreakTime,
      activityCounters: {}
    };
  }

  async calculateTaskBreakdown(data, timeEntries) {
    const taskTotals = new Map();
    const tasks = data.tasks || [];

    timeEntries.forEach((entry) => {
      if (!taskTotals.has(entry.taskId)) {
        const task = tasks.find((t) => t.id === entry.taskId);
        taskTotals.set(entry.taskId, {
          taskId: entry.taskId,
          taskName: task?.name || 'Unknown Task',
          taskColor: task?.color || 'primary',
          totalTime: 0,
          sessionCount: 0,
          averageSession: 0
        });
      }

      const taskTotal = taskTotals.get(entry.taskId);
      taskTotal.totalTime += entry.duration || 0;
      taskTotal.sessionCount += 1;
    });

    // Calculate averages
    Array.from(taskTotals.values()).forEach((task) => {
      task.averageSession = task.sessionCount > 0 ? task.totalTime / task.sessionCount : 0;
    });

    return Array.from(taskTotals.values()).sort((a, b) => b.totalTime - a.totalTime);
  }

  getWeekDates(weekStart) {
    const dates = [];
    const startDate = new Date(weekStart + 'T00:00:00');

    for (let i = 0; i < 5; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  }

  getMonday(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  formatDate(date) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  createEmptyDailyReport(date) {
    return {
      date,
      arrivalTime: null,
      departureTime: null,
      totalPresenceTime: 0,
      totalTaskTime: 0,
      totalMealTime: 0,
      workingTime: 0,
      efficiency: 0,
      taskBreakdown: [],
      activityCounters: {},
      timeEntries: [],
      mealBreaks: []
    };
  }

  formatAsCSV(weeklyReport) {
    const lines = [];

    // Create task-by-day matrix
    lines.push('Task,Monday,Tuesday,Wednesday,Thursday,Friday,Total');

    // Get all tasks and create a matrix of time per day
    weeklyReport.taskSummary.forEach((task) => {
      const taskRow = [task.taskName];

      // Add time for each day of the week
      weeklyReport.dailyBreakdown.forEach((day) => {
        const taskTimeForDay = day.taskBreakdown?.find(t => t.taskId === task.taskId)?.totalTime || 0;
        const hours = (taskTimeForDay / (1000 * 60 * 60)).toFixed(1);
        taskRow.push(hours);
      });

      // Add total for the task
      const totalHours = (task.totalTime / (1000 * 60 * 60)).toFixed(1);
      taskRow.push(totalHours);

      lines.push(taskRow.join(','));
    });

    return lines.join('\n');
  }

  formatAsText(weeklyReport) {
    const lines = [];
    lines.push(`Week of ${weeklyReport.weekStart} to ${weeklyReport.weekEnd}`);
    lines.push('='.repeat(50));
    lines.push('');

    lines.push('Daily Summary:');
    weeklyReport.dailyBreakdown.forEach((report) => {
      const presenceHours = (report.totalPresenceTime / (1000 * 60 * 60)).toFixed(1);
      const taskHours = (report.totalWorkTime / (1000 * 60 * 60)).toFixed(1);
      lines.push(
        `${report.date}: ${presenceHours}h presence, ${taskHours}h tasks, ${report.efficiency}% efficiency`
      );
    });

    lines.push('');
    lines.push('Total:');
    const totalPresenceHours = (weeklyReport.totalPresenceTime / (1000 * 60 * 60)).toFixed(1);
    const totalTaskHours = (weeklyReport.totalWorkTime / (1000 * 60 * 60)).toFixed(1);
    lines.push(`Total Presence: ${totalPresenceHours} hours`);
    lines.push(`Total Task Time: ${totalTaskHours} hours`);
    lines.push(`Overall Efficiency: ${weeklyReport.efficiency}%`);

    lines.push('');
    lines.push('Task Breakdown:');
    weeklyReport.taskSummary.forEach((task) => {
      const hours = (task.totalTime / (1000 * 60 * 60)).toFixed(1);
      lines.push(`${task.taskName}: ${hours}h (${task.sessionCount} sessions)`);
    });

    return lines.join('\n');
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
  }
}

// Custom error classes
export class InvalidDateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidDateError';
  }
}

export class InvalidDateRangeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidDateRangeError';
  }
}

export class UnsupportedFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnsupportedFormatError';
  }
}
