/**
 * Reports Store
 * Manages daily and weekly data reporting
 */

import { writable, derived } from 'svelte/store';
import { getReportService } from '../services/index.js';

/**
 * Current daily report data
 */
export const dailyReport = writable(null);

/**
 * Current weekly report data
 */
export const weeklyReport = writable(null);

/**
 * Available weeks for dropdown selection
 */
export const availableWeeks = writable([]);

/**
 * Audit data for complete history view
 */
export const auditData = writable(null);

/**
 * Selected date for daily reports
 */
export const selectedDate = writable(new Date().toISOString().split('T')[0]);

/**
 * Selected week start for weekly reports
 */
export const selectedWeekStart = writable(null);

/**
 * Reports loading states
 */
export const reportsLoading = writable({
  daily: false,
  weekly: false,
  audit: false,
  availableWeeks: false
});

/**
 * Reports error state
 */
export const reportsError = writable(null);

/**
 * Date range filter for audit view
 */
export const auditDateRange = writable({
  start: null,
  end: null
});

/**
 * Derived store for formatted daily report
 */
export const formattedDailyReport = derived([dailyReport], ([$dailyReport]) => {
  if (!$dailyReport) return null;

  return {
    ...$dailyReport,
    formattedArrivalTime: $dailyReport.arrivalTime
      ? new Date($dailyReport.arrivalTime).toLocaleTimeString('en-US', { hour12: false })
      : null,
    formattedDepartureTime: $dailyReport.departureTime
      ? new Date($dailyReport.departureTime).toLocaleTimeString('en-US', { hour12: false })
      : null,
    formattedTotalPresence: reportUtils.formatDuration($dailyReport.totalPresenceTime),
    formattedTotalTask: reportUtils.formatDuration($dailyReport.totalTaskTime),
    formattedTotalMeal: reportUtils.formatDuration($dailyReport.totalMealTime),
    formattedWorkingTime: reportUtils.formatDuration($dailyReport.workingTime),
    efficiencyColor: reportUtils.getEfficiencyColor($dailyReport.efficiency)
  };
});

/**
 * Derived store for formatted weekly report
 */
export const formattedWeeklyReport = derived([weeklyReport], ([$weeklyReport]) => {
  if (!$weeklyReport) return null;

  return {
    ...$weeklyReport,
    formattedTotals: {
      totalPresence: reportUtils.formatDuration($weeklyReport.totals.totalPresenceTime),
      totalTask: reportUtils.formatDuration($weeklyReport.totals.totalTaskTime),
      totalMeal: reportUtils.formatDuration($weeklyReport.totals.totalMealTime),
      totalWorking: reportUtils.formatDuration($weeklyReport.totals.totalWorkingTime)
    },
    formattedAverages: {
      dailyPresence: reportUtils.formatDuration($weeklyReport.averages.dailyPresence),
      dailyTask: reportUtils.formatDuration($weeklyReport.averages.dailyTaskTime),
      dailyWorking: reportUtils.formatDuration($weeklyReport.averages.dailyWorkingTime)
    },
    dailyReportsFormatted: $weeklyReport.dailyReports.map((daily) => ({
      ...daily,
      formattedTotalPresence: reportUtils.formatDuration(daily.totalPresenceTime),
      formattedTotalTask: reportUtils.formatDuration(daily.totalTaskTime),
      formattedWorkingTime: reportUtils.formatDuration(daily.workingTime),
      efficiencyColor: reportUtils.getEfficiencyColor(daily.efficiency)
    })),
    taskBreakdownFormatted: $weeklyReport.taskBreakdown.map((task) => ({
      ...task,
      formattedTotalTime: reportUtils.formatDuration(task.totalTime),
      formattedAverageSession: reportUtils.formatDuration(task.averageSession)
    }))
  };
});

/**
 * Derived store for weekly summary stats
 */
export const weeklySummaryStats = derived([weeklyReport], ([$weeklyReport]) => {
  if (!$weeklyReport) return null;

  const totals = $weeklyReport.totals;
  const daysWithData = $weeklyReport.dailyReports.filter((d) => d.totalPresenceTime > 0).length;

  return {
    daysWorked: daysWithData,
    totalDays: 5, // Monday-Friday
    completionRate: Math.round((daysWithData / 5) * 100),
    avgDailyPresence: daysWithData > 0 ? totals.totalPresenceTime / daysWithData : 0,
    avgDailyEfficiency:
      daysWithData > 0
        ? $weeklyReport.dailyReports.reduce((sum, d) => sum + d.efficiency, 0) / daysWithData
        : 0,
    topTask: $weeklyReport.taskBreakdown.length > 0 ? $weeklyReport.taskBreakdown[0] : null
  };
});

/**
 * Reports actions - functions that interact with ReportService
 */
export const reportActions = {
  /**
   * Initialize reports store
   */
  async initialize() {
    try {
      const reportService = getReportService();

      // Set up event listeners
      reportService.on('reportGenerated', (data) => {
        console.log(`Report generated: ${data.type} in ${data.duration}ms`);
      });

      reportService.on('dataExported', (data) => {
        console.log(`Data exported: ${data.format}, ${data.size} bytes`);
      });

      // Load initial data
      await this.loadAvailableWeeks();
      await this.loadDailyReport(); // Today's report

      // Set current week as selected week
      const currentWeekStart = reportUtils.getCurrentWeekStart();
      selectedWeekStart.set(currentWeekStart);
      await this.loadWeeklyReport(currentWeekStart);
    } catch (error) {
      console.error('Error initializing reports store:', error);
      reportsError.set(`Initialization failed: ${error.message}`);
    }
  },

  /**
   * Load daily report for specific date
   */
  async loadDailyReport(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      reportsLoading.update((loading) => ({ ...loading, daily: true }));

      const reportService = getReportService();
      const report = await reportService.getDailyReport(targetDate);

      dailyReport.set(report);
      selectedDate.set(targetDate);
      reportsError.set(null);

      return report;
    } catch (error) {
      console.error('Error loading daily report:', error);
      reportsError.set(`Failed to load daily report: ${error.message}`);
      dailyReport.set(null);
    } finally {
      reportsLoading.update((loading) => ({ ...loading, daily: false }));
    }
  },

  /**
   * Load weekly report for specific week start
   */
  async loadWeeklyReport(weekStart = null) {
    const targetWeekStart = weekStart || reportUtils.getCurrentWeekStart();

    try {
      reportsLoading.update((loading) => ({ ...loading, weekly: true }));

      const reportService = getReportService();
      const report = await reportService.getWeeklyReport(targetWeekStart);

      weeklyReport.set(report);
      selectedWeekStart.set(targetWeekStart);
      reportsError.set(null);

      return report;
    } catch (error) {
      console.error('Error loading weekly report:', error);
      reportsError.set(`Failed to load weekly report: ${error.message}`);
      weeklyReport.set(null);
    } finally {
      reportsLoading.update((loading) => ({ ...loading, weekly: false }));
    }
  },

  /**
   * Load available weeks for dropdown
   */
  async loadAvailableWeeks() {
    try {
      reportsLoading.update((loading) => ({ ...loading, availableWeeks: true }));

      const reportService = getReportService();
      const weeks = await reportService.getAvailableWeeks();

      availableWeeks.set(weeks);
      reportsError.set(null);

      return weeks;
    } catch (error) {
      console.error('Error loading available weeks:', error);
      reportsError.set(`Failed to load available weeks: ${error.message}`);
      availableWeeks.set([]);
    } finally {
      reportsLoading.update((loading) => ({ ...loading, availableWeeks: false }));
    }
  },

  /**
   * Load audit data with optional date range filter
   */
  async loadAuditData(dateRange = null) {
    try {
      reportsLoading.update((loading) => ({ ...loading, audit: true }));

      const reportService = getReportService();
      const data = await reportService.getAuditData(dateRange);

      auditData.set(data);
      if (dateRange) {
        auditDateRange.set(dateRange);
      }
      reportsError.set(null);

      return data;
    } catch (error) {
      console.error('Error loading audit data:', error);
      reportsError.set(`Failed to load audit data: ${error.message}`);
      auditData.set(null);
    } finally {
      reportsLoading.update((loading) => ({ ...loading, audit: false }));
    }
  },

  /**
   * Export weekly report data
   */
  async exportWeeklyData(weekStart, format = 'json') {
    try {
      const reportService = getReportService();
      const exportData = await reportService.exportWeeklyData(weekStart, format);

      reportsError.set(null);
      return exportData;
    } catch (error) {
      console.error('Error exporting weekly data:', error);
      reportsError.set(`Failed to export data: ${error.message}`);
      throw error;
    }
  },

  /**
   * Download weekly report as file
   */
  async downloadWeeklyReport(weekStart, format = 'json') {
    try {
      const exportData = await this.exportWeeklyData(weekStart, format);

      // Create blob and download
      const blob = new Blob([exportData], {
        type: format === 'json' ? 'application/json' : 'text/plain'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `work-report-${weekStart}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error downloading report:', error);
      reportsError.set(`Failed to download report: ${error.message}`);
      return false;
    }
  },

  /**
   * Calculate presence time for specific date
   */
  async calculatePresenceTime(date) {
    try {
      const reportService = getReportService();
      const calculation = await reportService.calculatePresenceTime(date);

      reportsError.set(null);
      return calculation;
    } catch (error) {
      console.error('Error calculating presence time:', error);
      reportsError.set(`Failed to calculate presence time: ${error.message}`);
      throw error;
    }
  },

  /**
   * Refresh current reports
   */
  async refreshCurrentReports() {
    const promises = [];

    // Refresh daily report if date is selected
    if (selectedDate.subscribe) {
      selectedDate.subscribe((date) => {
        if (date) {
          promises.push(this.loadDailyReport(date));
        }
      })();
    }

    // Refresh weekly report if week is selected
    if (selectedWeekStart.subscribe) {
      selectedWeekStart.subscribe((weekStart) => {
        if (weekStart) {
          promises.push(this.loadWeeklyReport(weekStart));
        }
      })();
    }

    try {
      await Promise.all(promises);
      await this.loadAvailableWeeks(); // Refresh available weeks
    } catch (error) {
      console.error('Error refreshing reports:', error);
    }
  },

  /**
   * Navigate to previous day/week
   */
  async navigatePrevious(reportType = 'daily') {
    if (reportType === 'daily') {
      selectedDate.subscribe((currentDate) => {
        if (currentDate) {
          const prevDate = new Date(currentDate);
          prevDate.setDate(prevDate.getDate() - 1);
          const prevDateStr = prevDate.toISOString().split('T')[0];
          this.loadDailyReport(prevDateStr);
        }
      })();
    } else if (reportType === 'weekly') {
      selectedWeekStart.subscribe((currentWeek) => {
        if (currentWeek) {
          const prevWeek = new Date(currentWeek);
          prevWeek.setDate(prevWeek.getDate() - 7);
          const prevWeekStr = reportUtils.getWeekStart(prevWeek);
          this.loadWeeklyReport(prevWeekStr);
        }
      })();
    }
  },

  /**
   * Navigate to next day/week
   */
  async navigateNext(reportType = 'daily') {
    if (reportType === 'daily') {
      selectedDate.subscribe((currentDate) => {
        if (currentDate) {
          const nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 1);
          const nextDateStr = nextDate.toISOString().split('T')[0];
          this.loadDailyReport(nextDateStr);
        }
      })();
    } else if (reportType === 'weekly') {
      selectedWeekStart.subscribe((currentWeek) => {
        if (currentWeek) {
          const nextWeek = new Date(currentWeek);
          nextWeek.setDate(nextWeek.getDate() + 7);
          const nextWeekStr = reportUtils.getWeekStart(nextWeek);
          this.loadWeeklyReport(nextWeekStr);
        }
      })();
    }
  },

  /**
   * Clear reports error
   */
  clearError() {
    reportsError.set(null);
  },

  /**
   * Set audit date range filter
   */
  setAuditDateRange(startDate, endDate) {
    const dateRange = { start: startDate, end: endDate };
    auditDateRange.set(dateRange);
    return this.loadAuditData(dateRange);
  },

  /**
   * Clear audit date range filter
   */
  clearAuditDateRange() {
    auditDateRange.set({ start: null, end: null });
    return this.loadAuditData();
  }
};

/**
 * Report utility functions
 */
export const reportUtils = {
  /**
   * Format duration from milliseconds to human readable
   */
  formatDuration(milliseconds, format = 'hm') {
    if (typeof milliseconds !== 'number' || milliseconds < 0) {
      return '0h 0m';
    }

    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    switch (format) {
      case 'hm': // "8h 30m"
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      case 'hms': // "8:30:00"
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      case 'decimal': // "8.5h"
        const decimalHours = milliseconds / (1000 * 60 * 60);
        return `${Math.round(decimalHours * 100) / 100}h`;
      default:
        return `${hours}h ${minutes}m`;
    }
  },

  /**
   * Get efficiency color based on percentage
   */
  getEfficiencyColor(efficiency) {
    if (efficiency >= 90) return 'success';
    if (efficiency >= 75) return 'warning';
    if (efficiency >= 50) return 'info';
    return 'error';
  },

  /**
   * Get current week start (Monday)
   */
  getCurrentWeekStart() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    return monday.toISOString().split('T')[0];
  },

  /**
   * Get week start for any date (Monday)
   */
  getWeekStart(date) {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    d.setDate(d.getDate() + daysToMonday);
    return d.toISOString().split('T')[0];
  },

  /**
   * Format date for display
   */
  formatDate(dateString, format = 'short') {
    const date = new Date(dateString);

    switch (format) {
      case 'short': // "Jan 15"
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'long': // "January 15, 2025"
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'weekday': // "Mon, Jan 15"
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
      default:
        return dateString;
    }
  },

  /**
   * Calculate working days between dates
   */
  getWorkingDaysBetween(startDate, endDate) {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Monday-Friday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  },

  /**
   * Generate date range for week
   */
  getWeekDateRange(weekStart) {
    const start = new Date(weekStart);
    const dates = [];

    for (let i = 0; i < 5; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  },

  /**
   * Validate date string format
   */
  isValidDateString(dateString) {
    if (typeof dateString !== 'string') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString + 'T00:00:00');
    return date.toISOString().split('T')[0] === dateString;
  },

  /**
   * Get time of day classification
   */
  getTimeOfDayClass(time) {
    const hour = new Date(time).getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }
};
