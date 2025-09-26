import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import App from '../../src/App.svelte';

describe('Integration Test: Data Persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should handle complete data persistence workflow', async () => {
    // Step 1: Start timer on any task
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [
        {
          id: 'task-1',
          name: 'Persistence Test',
          color: 'primary',
          isActive: true
        }
      ],
      timeEntries: [],
      workDays: []
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    let { unmount } = render(App);

    // Start timer
    await fireEvent.click(screen.getByRole('button', { name: /start/i }));
    vi.advanceTimersByTime(5000); // 5 seconds

    // Verify timer is running
    expect(screen.getByTestId('timer-display')).toHaveTextContent('00:00:05');

    // Step 2: Close browser tab/window (simulate by unmounting)
    unmount();

    // Step 3: Reopen application URL (render again)
    render(App);

    // Step 4: Verify all data is restored
    await waitFor(() => {
      expect(screen.getByText('Persistence Test')).toBeInTheDocument();
      expect(screen.getByTestId('active-task')).toHaveTextContent('Persistence Test');
    });

    // Step 5: Verify active task and timer state are restored
    // Timer should show the accumulated time
    expect(screen.getByTestId('timer-display')).toHaveTextContent('00:00:05');

    // Timer should still be running (start button replaced with stop button)
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start/i })).toBeNull();

    // Step 6: Continue timer and verify correct time accumulation
    vi.advanceTimersByTime(3000); // 3 more seconds

    await waitFor(() => {
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:00:08');
    });

    // Stop timer
    await fireEvent.click(screen.getByRole('button', { name: /stop/i }));

    // Expected Results Verification:
    const savedData = JSON.parse(localStorage.getItem('task-tracker-data'));

    // 1. All tasks, settings, and history restored ✓
    expect(savedData.tasks).toHaveLength(1);
    expect(savedData.tasks[0].name).toBe('Persistence Test');
    expect(savedData.settings.dailyHours).toBe(8);

    // 2. Active task state preserved ✓
    expect(savedData.tasks[0].isActive).toBe(true);

    // 3. Timer continues from where it left off ✓
    expect(savedData.timeEntries).toHaveLength(1);
    expect(savedData.timeEntries[0].duration).toBeGreaterThanOrEqual(8000);

    // 4. No data loss on browser restart ✓
    expect(savedData.timeEntries[0]).toHaveProperty('startTime');
    expect(savedData.timeEntries[0]).toHaveProperty('endTime');

    // 5. Performance remains good with accumulated data
    // Verify app loads quickly even with data
    const loadStartTime = performance.now();
    unmount();
    render(App);
    const loadEndTime = performance.now();
    expect(loadEndTime - loadStartTime).toBeLessThan(1000); // Less than 1 second
  });

  it('should handle corrupted localStorage gracefully', async () => {
    // Corrupt localStorage data
    localStorage.setItem('task-tracker-data', 'invalid-json{');

    render(App);

    // Should fall back to initial state gracefully
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    // Should not crash the application
    expect(screen.getByTestId('app-container')).toBeInTheDocument();
  });

  it('should preserve data during multiple browser sessions', async () => {
    // Session 1: Create tasks and time entries
    const session1Data = {
      settings: { dailyHours: 8 },
      tasks: [{ id: 'task-1', name: 'Session 1 Task', color: 'primary' }],
      timeEntries: [
        { id: 'e1', taskId: 'task-1', duration: 3600000 } // 1 hour
      ]
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(session1Data));

    let { unmount } = render(App);

    // Verify data loads correctly
    expect(screen.getByText('Session 1 Task')).toBeInTheDocument();

    // End session 1
    unmount();

    // Session 2: Add more data
    render(App);

    // Add new task
    const addTaskButton = screen.getByRole('button', { name: /add.*task/i });
    const taskNameInput = screen.getByLabelText(/task.*name/i);

    await fireEvent.input(taskNameInput, { target: { value: 'Session 2 Task' } });
    await fireEvent.click(addTaskButton);

    // Verify both tasks exist
    await waitFor(() => {
      expect(screen.getByText('Session 1 Task')).toBeInTheDocument();
      expect(screen.getByText('Session 2 Task')).toBeInTheDocument();
    });

    // End session 2
    unmount();

    // Session 3: Verify all data persists
    render(App);

    await waitFor(() => {
      expect(screen.getByText('Session 1 Task')).toBeInTheDocument();
      expect(screen.getByText('Session 2 Task')).toBeInTheDocument();
    });

    // Verify time entry from session 1 is still there
    const savedData = JSON.parse(localStorage.getItem('task-tracker-data'));
    expect(savedData.timeEntries).toHaveLength(1);
    expect(savedData.timeEntries[0].duration).toBe(3600000);
  });

  it('should handle localStorage quota exceeded', async () => {
    // Mock localStorage to simulate quota exceeded
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    render(App);

    // Try to create a task (which would trigger save)
    const taskNameInput = screen.getByLabelText(/task.*name/i);
    const addTaskButton = screen.getByRole('button', { name: /add.*task/i });

    await fireEvent.input(taskNameInput, { target: { value: 'Quota Test' } });
    await fireEvent.click(addTaskButton);

    // Should show error message to user
    await waitFor(() => {
      expect(screen.getByText(/storage.*full|quota.*exceeded/i)).toBeInTheDocument();
    });

    // Restore original setItem
    Storage.prototype.setItem = originalSetItem;
  });

  it('should auto-save data during timer operation', async () => {
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [{ id: 'task-1', name: 'Auto Save', isActive: true }]
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(App);

    // Start timer
    await fireEvent.click(screen.getByRole('button', { name: /start/i }));

    // Clear initial saves from setup
    setItemSpy.mockClear();

    // Advance time to trigger auto-save (every 30 seconds)
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith('task-tracker-data', expect.any(String));
    });

    // Verify the saved data contains the running timer
    const lastCall = setItemSpy.mock.calls[setItemSpy.mock.calls.length - 1];
    const savedData = JSON.parse(lastCall[1]);
    expect(savedData.timeEntries).toHaveLength(1);
    expect(savedData.timeEntries[0]).toHaveProperty('startTime');
    expect(savedData.timeEntries[0].endTime).toBeNull(); // Still running
  });
});
