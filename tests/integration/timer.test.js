import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import App from '../../src/App.svelte';

describe('Integration Test: Basic Timer Operations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should handle complete basic timer workflow', async () => {
    // Setup: Create app with existing task
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [
        {
          id: 'task-1',
          name: 'Development Work',
          color: 'primary',
          isActive: false,
          createdAt: new Date().toISOString()
        }
      ],
      timeEntries: [],
      workDays: []
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    await waitFor(() => {
      expect(screen.getByText('Development Work')).toBeInTheDocument();
    });

    // Step 1: Select "Development Work" task as active
    const taskCard = screen.getByText('Development Work').closest('[data-testid*="task"]');
    const selectTaskButton = within(taskCard).getByRole('button', { name: /select|activate/i });

    await fireEvent.click(selectTaskButton);

    // Verify task is selected as active
    await waitFor(() => {
      expect(screen.getByTestId('active-task')).toHaveTextContent('Development Work');
    });

    // Step 2: Start timer and verify it displays hh:mm:ss format
    const timerDisplay = screen.getByTestId('timer-display');
    expect(timerDisplay).toHaveTextContent('00:00:00');

    const startButton = screen.getByRole('button', { name: /start/i });
    await fireEvent.click(startButton);

    // Verify timer started
    await waitFor(() => {
      const stopButton = screen.getByRole('button', { name: /stop/i });
      expect(stopButton).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /start/i })).toBeNull();
    });

    // Step 3: Wait 5 seconds, verify timer updates correctly
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(timerDisplay).toHaveTextContent('00:00:05');
    });

    // Verify timer format is hh:mm:ss
    expect(timerDisplay.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);

    // Step 4: Stop timer and verify time is recorded
    const stopButton = screen.getByRole('button', { name: /stop/i });
    await fireEvent.click(stopButton);

    // Verify timer stopped
    await waitFor(() => {
      const startButton = screen.getByRole('button', { name: /start/i });
      expect(startButton).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /stop/i })).toBeNull();
    });

    // Step 5: Check that accumulated time updates for task
    const taskTimeDisplay = screen.getByTestId('task-total-time');
    await waitFor(() => {
      expect(taskTimeDisplay).toHaveTextContent('00:05'); // hh:mm format for accumulated time
    });

    // Step 6: Verify arrival time is recorded for the day
    const dailySummary = screen.getByTestId('daily-summary');
    const arrivalTime = within(dailySummary).getByTestId('arrival-time');
    expect(arrivalTime).not.toHaveTextContent('--:--'); // Should have actual time

    // Expected Results Verification:

    // 1. Only one task can be active at a time
    const allTasks = screen.getAllByTestId(/task-/);
    const activeTasks = allTasks.filter(
      (task) => task.classList.contains('active') || task.getAttribute('data-active') === 'true'
    );
    expect(activeTasks).toHaveLength(1);

    // 2. Timer updates every second with precision
    await fireEvent.click(screen.getByRole('button', { name: /start/i }));

    vi.advanceTimersByTime(1000);
    await waitFor(() => expect(timerDisplay).toHaveTextContent('00:00:01'));

    vi.advanceTimersByTime(1000);
    await waitFor(() => expect(timerDisplay).toHaveTextContent('00:00:02'));

    await fireEvent.click(screen.getByRole('button', { name: /stop/i }));

    // 3. Time is accumulated correctly
    const savedData = JSON.parse(localStorage.getItem('task-tracker-data'));
    expect(savedData.timeEntries).toHaveLength(2); // Two timer sessions
    expect(savedData.timeEntries[0].duration).toBe(5000); // First session: 5 seconds
    expect(savedData.timeEntries[1].duration).toBe(2000); // Second session: 2 seconds

    // 4. Daily presence tracking starts automatically
    expect(savedData.workDays).toHaveLength(1);
    expect(savedData.workDays[0]).toHaveProperty('arrivalTime');
    expect(new Date(savedData.workDays[0].arrivalTime)).toBeInstanceOf(Date);

    // 5. localStorage updates with timer data
    expect(savedData.tasks[0].id).toBe('task-1');
    expect(savedData.timeEntries[0]).toHaveProperty('taskId', 'task-1');
    expect(savedData.timeEntries[0]).toHaveProperty('startTime');
    expect(savedData.timeEntries[0]).toHaveProperty('endTime');
  });

  it('should prevent multiple simultaneous active tasks', async () => {
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [
        {
          id: 'task-1',
          name: 'Development',
          color: 'primary',
          isActive: false
        },
        {
          id: 'task-2',
          name: 'Meetings',
          color: 'secondary',
          isActive: false
        }
      ],
      timeEntries: []
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    // Activate first task
    const task1 = screen.getByText('Development').closest('[data-testid*="task"]');
    await fireEvent.click(within(task1).getByRole('button', { name: /select/i }));

    // Try to activate second task
    const task2 = screen.getByText('Meetings').closest('[data-testid*="task"]');
    await fireEvent.click(within(task2).getByRole('button', { name: /select/i }));

    // Verify only second task is active (should switch)
    await waitFor(() => {
      expect(screen.getByTestId('active-task')).toHaveTextContent('Meetings');
    });

    // Verify first task is no longer active
    expect(task1).not.toHaveClass('active');
    expect(task2).toHaveClass('active');
  });

  it('should handle timer precision during rapid operations', async () => {
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [
        {
          id: 'task-1',
          name: 'Rapid Test',
          color: 'primary',
          isActive: true
        }
      ],
      timeEntries: []
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    const startButton = screen.getByRole('button', { name: /start/i });

    // Rapid start/stop operations
    await fireEvent.click(startButton);
    vi.advanceTimersByTime(100); // 0.1 second

    await fireEvent.click(screen.getByRole('button', { name: /stop/i }));
    await fireEvent.click(screen.getByRole('button', { name: /start/i }));
    vi.advanceTimersByTime(200); // 0.2 second

    await fireEvent.click(screen.getByRole('button', { name: /stop/i }));

    // Verify precision is maintained
    const savedData = JSON.parse(localStorage.getItem('task-tracker-data'));
    expect(savedData.timeEntries).toHaveLength(2);

    // Times should be recorded accurately even for short durations
    expect(savedData.timeEntries[0].duration).toBeGreaterThanOrEqual(100);
    expect(savedData.timeEntries[0].duration).toBeLessThan(200);
    expect(savedData.timeEntries[1].duration).toBeGreaterThanOrEqual(200);
    expect(savedData.timeEntries[1].duration).toBeLessThan(300);
  });

  it('should handle computer sleep scenario', async () => {
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [
        {
          id: 'task-1',
          name: 'Sleep Test',
          color: 'primary',
          isActive: true
        }
      ],
      timeEntries: []
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    // Start timer
    const startButton = screen.getByRole('button', { name: /start/i });
    await fireEvent.click(startButton);

    // Simulate computer going to sleep for 1 hour
    vi.advanceTimersByTime(3600000); // 1 hour

    // Simulate page visibility change (computer waking up)
    const visibilityEvent = new Event('visibilitychange');
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
    document.dispatchEvent(visibilityEvent);

    // Timer should detect the gap and handle appropriately
    await waitFor(() => {
      const timerDisplay = screen.getByTestId('timer-display');
      // Should show reasonable time, not full hour
      const displayTime = timerDisplay.textContent;
      const [hours, minutes, seconds] = displayTime.split(':').map(Number);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      // Should be less than 1 hour due to sleep detection
      expect(totalSeconds).toBeLessThan(3600);
    });
  });

  it('should auto-save timer data every 30 seconds', async () => {
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [
        {
          id: 'task-1',
          name: 'Auto Save Test',
          color: 'primary',
          isActive: true
        }
      ],
      timeEntries: []
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    const localStorageSetSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(App);

    // Start timer
    await fireEvent.click(screen.getByRole('button', { name: /start/i }));

    // Advance 29 seconds - should not auto-save yet
    vi.advanceTimersByTime(29000);

    // Reset the spy to count only auto-saves, not initial saves
    localStorageSetSpy.mockClear();

    // Advance 1 more second to trigger 30-second auto-save
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(localStorageSetSpy).toHaveBeenCalledWith('task-tracker-data', expect.any(String));
    });

    // Verify another auto-save after another 30 seconds
    localStorageSetSpy.mockClear();
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(localStorageSetSpy).toHaveBeenCalled();
    });
  });
});
