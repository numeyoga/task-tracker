import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import App from '../../src/App.svelte';

describe('Integration Test: Task Switching', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should handle complete task switching workflow', async () => {
    // Setup: Create app with two tasks
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [
        {
          id: 'task-1',
          name: 'Development Work',
          color: 'primary',
          isActive: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'task-2',
          name: 'Meeting Preparation',
          color: 'secondary',
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
      expect(screen.getByText('Meeting Preparation')).toBeInTheDocument();
    });

    // Step 1: Create second task (already done in setup)
    // Step 2: Start timer on "Development Work"
    const developmentTask = screen.getByText('Development Work').closest('[data-testid*="task"]');
    const selectDevButton = within(developmentTask).getByRole('button', {
      name: /select|activate/i
    });
    await fireEvent.click(selectDevButton);

    const startButton = screen.getByRole('button', { name: /start/i });
    await fireEvent.click(startButton);

    // Verify timer started
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
      expect(screen.getByTestId('active-task')).toHaveTextContent('Development Work');
    });

    // Step 3: Wait 10 seconds
    vi.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:00:10');
    });

    // Step 4: Switch to "Meeting Preparation" task
    const meetingTask = screen.getByText('Meeting Preparation').closest('[data-testid*="task"]');
    const selectMeetingButton = within(meetingTask).getByRole('button', {
      name: /select|activate/i
    });
    await fireEvent.click(selectMeetingButton);

    // Step 5: Verify previous timer stops and new timer starts
    await waitFor(() => {
      expect(screen.getByTestId('active-task')).toHaveTextContent('Meeting Preparation');
      // Timer should reset for new task
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:00:00');
      // But timer should still be running
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    });

    // Step 6: Stop second timer
    const stopButton = screen.getByRole('button', { name: /stop/i });
    await fireEvent.click(stopButton);

    // Step 7: Verify both tasks have accumulated time
    await waitFor(() => {
      // Check that both tasks show time
      const developmentTime = within(developmentTask).getByTestId(/time/i);
      const meetingTime = within(meetingTask).getByTestId(/time/i);

      expect(developmentTime).not.toHaveTextContent('00:00');
      expect(meetingTime).not.toHaveTextContent('00:00');
    });

    // Expected Results Verification:

    // 1. Previous timer stops automatically when switching
    const savedData = JSON.parse(localStorage.getItem('task-tracker-data'));
    expect(savedData.timeEntries).toHaveLength(2);

    const firstEntry = savedData.timeEntries.find((entry) => entry.taskId === 'task-1');
    const secondEntry = savedData.timeEntries.find((entry) => entry.taskId === 'task-2');

    expect(firstEntry).toBeTruthy();
    expect(firstEntry.endTime).toBeTruthy(); // Should be stopped
    expect(firstEntry.duration).toBe(10000); // 10 seconds

    // 2. New timer starts immediately
    expect(secondEntry).toBeTruthy();
    expect(secondEntry.endTime).toBeTruthy(); // Should also be stopped now

    // 3. Time is correctly allocated to each task
    expect(firstEntry.taskId).toBe('task-1');
    expect(secondEntry.taskId).toBe('task-2');

    // 4. Quick task switching works smoothly
    // Verify timing precision - there should be minimal gap between stop and start
    const firstEndTime = new Date(firstEntry.endTime).getTime();
    const secondStartTime = new Date(secondEntry.startTime).getTime();
    const gap = secondStartTime - firstEndTime;
    expect(gap).toBeLessThan(1000); // Less than 1 second gap

    // 5. No time overlap between tasks
    expect(firstEndTime).toBeLessThanOrEqual(secondStartTime);
  });

  it('should handle rapid task switching', async () => {
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [
        { id: 'task-1', name: 'Task A', color: 'primary', isActive: false },
        { id: 'task-2', name: 'Task B', color: 'secondary', isActive: false },
        { id: 'task-3', name: 'Task C', color: 'accent', isActive: false }
      ],
      timeEntries: []
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    // Start with Task A
    await fireEvent.click(
      within(screen.getByText('Task A').closest('[data-testid*="task"]')).getByRole('button')
    );
    await fireEvent.click(screen.getByRole('button', { name: /start/i }));
    vi.advanceTimersByTime(1000); // 1 second

    // Switch to Task B
    await fireEvent.click(
      within(screen.getByText('Task B').closest('[data-testid*="task"]')).getByRole('button')
    );
    vi.advanceTimersByTime(500); // 0.5 seconds

    // Switch to Task C
    await fireEvent.click(
      within(screen.getByText('Task C').closest('[data-testid*="task"]')).getByRole('button')
    );
    vi.advanceTimersByTime(2000); // 2 seconds

    // Stop timer
    await fireEvent.click(screen.getByRole('button', { name: /stop/i }));

    // Verify all tasks got their correct time
    const savedData = JSON.parse(localStorage.getItem('task-tracker-data'));
    expect(savedData.timeEntries).toHaveLength(3);

    const taskAEntry = savedData.timeEntries.find((e) => e.taskId === 'task-1');
    const taskBEntry = savedData.timeEntries.find((e) => e.taskId === 'task-2');
    const taskCEntry = savedData.timeEntries.find((e) => e.taskId === 'task-3');

    expect(taskAEntry.duration).toBeGreaterThanOrEqual(1000);
    expect(taskBEntry.duration).toBeGreaterThanOrEqual(500);
    expect(taskCEntry.duration).toBeGreaterThanOrEqual(2000);
  });

  it('should show visual feedback during task switching', async () => {
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [
        { id: 'task-1', name: 'Visual Test A', color: 'primary', isActive: false },
        { id: 'task-2', name: 'Visual Test B', color: 'secondary', isActive: false }
      ],
      timeEntries: []
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    const taskA = screen.getByText('Visual Test A').closest('[data-testid*="task"]');
    const taskB = screen.getByText('Visual Test B').closest('[data-testid*="task"]');

    // Initially no task should be active
    expect(taskA).not.toHaveClass('active');
    expect(taskB).not.toHaveClass('active');

    // Activate Task A
    await fireEvent.click(within(taskA).getByRole('button'));

    await waitFor(() => {
      expect(taskA).toHaveClass('active');
      expect(taskB).not.toHaveClass('active');
      expect(screen.getByTestId('active-task')).toHaveTextContent('Visual Test A');
    });

    // Switch to Task B
    await fireEvent.click(within(taskB).getByRole('button'));

    await waitFor(() => {
      expect(taskA).not.toHaveClass('active');
      expect(taskB).toHaveClass('active');
      expect(screen.getByTestId('active-task')).toHaveTextContent('Visual Test B');
    });
  });

  it('should maintain task switch history', async () => {
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [
        { id: 'task-1', name: 'History A', color: 'primary', isActive: false },
        { id: 'task-2', name: 'History B', color: 'secondary', isActive: false }
      ],
      timeEntries: []
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    // Perform multiple switches with timing
    await fireEvent.click(
      within(screen.getByText('History A').closest('[data-testid*="task"]')).getByRole('button')
    );
    await fireEvent.click(screen.getByRole('button', { name: /start/i }));
    vi.advanceTimersByTime(3000);

    await fireEvent.click(
      within(screen.getByText('History B').closest('[data-testid*="task"]')).getByRole('button')
    );
    vi.advanceTimersByTime(2000);

    await fireEvent.click(
      within(screen.getByText('History A').closest('[data-testid*="task"]')).getByRole('button')
    );
    vi.advanceTimersByTime(1000);

    await fireEvent.click(screen.getByRole('button', { name: /stop/i }));

    // Check that time entries are recorded chronologically
    const savedData = JSON.parse(localStorage.getItem('task-tracker-data'));
    expect(savedData.timeEntries).toHaveLength(3);

    const entries = savedData.timeEntries.sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );

    expect(entries[0].taskId).toBe('task-1'); // First History A session
    expect(entries[1].taskId).toBe('task-2'); // History B session
    expect(entries[2].taskId).toBe('task-1'); // Second History A session

    expect(entries[0].duration).toBeGreaterThanOrEqual(3000);
    expect(entries[1].duration).toBeGreaterThanOrEqual(2000);
    expect(entries[2].duration).toBeGreaterThanOrEqual(1000);
  });

  it('should handle task switching with deleted tasks', async () => {
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [
        { id: 'task-1', name: 'Keep Task', color: 'primary', isActive: true },
        { id: 'task-2', name: 'Delete Task', color: 'secondary', isActive: false }
      ],
      timeEntries: []
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    // Start timer on active task
    await fireEvent.click(screen.getByRole('button', { name: /start/i }));
    vi.advanceTimersByTime(1000);

    // Delete the non-active task (should be allowed)
    const deleteButton = within(
      screen.getByText('Delete Task').closest('[data-testid*="task"]')
    ).getByRole('button', { name: /delete/i });
    await fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm.*delete/i });
    await fireEvent.click(confirmButton);

    // Timer should continue running on the remaining task
    await waitFor(() => {
      expect(screen.getByTestId('timer-display')).not.toHaveTextContent('00:00:00');
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    });

    // Try to delete the active task (should be prevented)
    const keepTaskDeleteButton = within(
      screen.getByText('Keep Task').closest('[data-testid*="task"]')
    ).queryByRole('button', { name: /delete/i });
    expect(keepTaskDeleteButton).toBeNull(); // Delete button should be disabled/hidden
  });
});
