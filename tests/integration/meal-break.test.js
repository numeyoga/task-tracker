import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import App from '../../src/App.svelte';

describe('Integration Test: Meal Break Tracking', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should handle complete meal break workflow', async () => {
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [
        {
          id: 'task-1',
          name: 'Work Task',
          color: 'primary',
          isActive: true
        }
      ],
      timeEntries: [],
      workDays: [
        {
          date: new Date().toISOString().split('T')[0],
          arrivalTime: new Date().toISOString(),
          mealBreaks: []
        }
      ]
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    // Step 1: Start work timer on any task
    await fireEvent.click(screen.getByRole('button', { name: /start/i }));
    vi.advanceTimersByTime(2000); // Work for 2 seconds

    // Step 2: Start meal break timer
    const mealBreakButton = screen.getByRole('button', { name: /meal.*break|lunch/i });
    await fireEvent.click(mealBreakButton);

    // Step 3: Verify meal break timer runs independently
    await waitFor(() => {
      const mealTimer = screen.getByTestId('meal-break-timer');
      expect(mealTimer).toBeInTheDocument();
      expect(mealTimer).toHaveTextContent('00:00:00');

      // Work timer should still be running
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:00:02');
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    });

    // Advance meal break time
    vi.advanceTimersByTime(1800000); // 30 minutes

    await waitFor(() => {
      expect(screen.getByTestId('meal-break-timer')).toHaveTextContent('30:00');
    });

    // Step 4: Stop meal break after test period
    const stopMealButton = screen.getByRole('button', { name: /stop.*meal|end.*lunch/i });
    await fireEvent.click(stopMealButton);

    // Step 5: Stop work timer
    await fireEvent.click(screen.getByRole('button', { name: /stop/i }));

    // Step 6: Verify meal time is deducted from presence time
    // Step 7: Check daily summary shows correct working time
    const dailySummary = screen.getByTestId('daily-summary');
    const presenceTime = screen.getByTestId('presence-time');
    const workTime = screen.getByTestId('work-time');
    const mealTime = screen.getByTestId('meal-time');

    await waitFor(() => {
      // Meal time should be recorded
      expect(mealTime).toHaveTextContent('30:00'); // 30 minutes

      // Presence time should include meal break
      // Work time should not include meal break
      expect(workTime).not.toEqual(presenceTime);
    });

    // Expected Results Verification:
    const savedData = JSON.parse(localStorage.getItem('task-tracker-data'));

    // 1. Meal break timer works independently of task timers
    expect(savedData.workDays[0].mealBreaks).toHaveLength(1);
    expect(savedData.workDays[0].mealBreaks[0]).toHaveProperty('duration', 1800000); // 30 minutes

    // 2. Manual start/stop control for meal breaks
    expect(savedData.workDays[0].mealBreaks[0]).toHaveProperty('startTime');
    expect(savedData.workDays[0].mealBreaks[0]).toHaveProperty('endTime');

    // 3. Meal time correctly deducted from presence calculation
    // 4. Daily summary shows: presence time, meal time, working time
    const workDay = savedData.workDays[0];
    const totalPresence = new Date(workDay.departureTime) - new Date(workDay.arrivalTime);
    const totalMealTime = workDay.mealBreaks.reduce((sum, mb) => sum + mb.duration, 0);
    const netWorkTime = totalPresence - totalMealTime;

    expect(totalMealTime).toBe(1800000); // 30 minutes meal break
    expect(netWorkTime).toBeLessThan(totalPresence);
  });

  it('should prevent overlapping meal breaks', async () => {
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [{ id: 'task-1', name: 'Test', isActive: true }],
      workDays: [{ date: new Date().toISOString().split('T')[0], mealBreaks: [] }]
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    // Start first meal break
    const mealBreakButton = screen.getByRole('button', { name: /meal.*break/i });
    await fireEvent.click(mealBreakButton);

    // Try to start second meal break
    await expect(async () => {
      await fireEvent.click(mealBreakButton);
    }).rejects.toThrow(); // Should throw error or be disabled

    // Verify only one meal break is active
    expect(screen.getAllByTestId('meal-break-timer')).toHaveLength(1);
  });

  it('should handle multiple meal breaks in one day', async () => {
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [{ id: 'task-1', name: 'Test', isActive: true }],
      workDays: [{ date: new Date().toISOString().split('T')[0], mealBreaks: [] }]
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    // First meal break
    await fireEvent.click(screen.getByRole('button', { name: /meal.*break/i }));
    vi.advanceTimersByTime(1800000); // 30 minutes
    await fireEvent.click(screen.getByRole('button', { name: /stop.*meal/i }));

    // Second meal break
    await fireEvent.click(screen.getByRole('button', { name: /meal.*break/i }));
    vi.advanceTimersByTime(900000); // 15 minutes
    await fireEvent.click(screen.getByRole('button', { name: /stop.*meal/i }));

    // Verify both breaks are recorded
    const savedData = JSON.parse(localStorage.getItem('task-tracker-data'));
    expect(savedData.workDays[0].mealBreaks).toHaveLength(2);

    const totalMealTime = savedData.workDays[0].mealBreaks.reduce(
      (sum, mb) => sum + mb.duration,
      0
    );
    expect(totalMealTime).toBe(2700000); // 45 minutes total
  });

  it('should show meal break in daily summary', async () => {
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [{ id: 'task-1', name: 'Test', isActive: true }],
      workDays: [
        {
          date: new Date().toISOString().split('T')[0],
          arrivalTime: new Date().toISOString(),
          mealBreaks: [
            {
              startTime: new Date().toISOString(),
              endTime: new Date(Date.now() + 1800000).toISOString(),
              duration: 1800000
            }
          ]
        }
      ]
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    // Check daily summary shows meal break
    const mealTimeDisplay = screen.getByTestId('meal-time');
    expect(mealTimeDisplay).toHaveTextContent('30:00'); // 30 minutes formatted
  });
});
