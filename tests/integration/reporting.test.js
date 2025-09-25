import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import App from '../../src/App.svelte';

describe('Integration Test: Weekly Reporting', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should generate complete weekly report workflow', async () => {
    // Step 1: Work several days with different tasks (simulate data)
    const weekStart = '2023-09-25'; // Monday
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [
        { id: 'task-1', name: 'Development', color: 'primary' },
        { id: 'task-2', name: 'Meetings', color: 'secondary' },
        { id: 'task-3', name: 'Documentation', color: 'accent' }
      ],
      timeEntries: [
        // Monday
        {
          id: 'e1',
          taskId: 'task-1',
          date: '2023-09-25',
          duration: 14400000,
          startTime: '2023-09-25T09:00:00Z',
          endTime: '2023-09-25T13:00:00Z'
        }, // 4 hours
        {
          id: 'e2',
          taskId: 'task-2',
          date: '2023-09-25',
          duration: 7200000,
          startTime: '2023-09-25T14:00:00Z',
          endTime: '2023-09-25T16:00:00Z'
        }, // 2 hours
        // Tuesday
        {
          id: 'e3',
          taskId: 'task-1',
          date: '2023-09-26',
          duration: 10800000,
          startTime: '2023-09-26T09:00:00Z',
          endTime: '2023-09-26T12:00:00Z'
        }, // 3 hours
        {
          id: 'e4',
          taskId: 'task-3',
          date: '2023-09-26',
          duration: 9000000,
          startTime: '2023-09-26T13:00:00Z',
          endTime: '2023-09-26T15:30:00Z'
        }, // 2.5 hours
        // Wednesday
        {
          id: 'e5',
          taskId: 'task-2',
          date: '2023-09-27',
          duration: 18000000,
          startTime: '2023-09-27T09:00:00Z',
          endTime: '2023-09-27T14:00:00Z'
        }, // 5 hours
        // Thursday
        {
          id: 'e6',
          taskId: 'task-1',
          date: '2023-09-28',
          duration: 21600000,
          startTime: '2023-09-28T09:00:00Z',
          endTime: '2023-09-28T15:00:00Z'
        }, // 6 hours
        // Friday
        {
          id: 'e7',
          taskId: 'task-3',
          date: '2023-09-29',
          duration: 12600000,
          startTime: '2023-09-29T09:00:00Z',
          endTime: '2023-09-29T12:30:00Z'
        } // 3.5 hours
      ],
      workDays: [
        {
          date: '2023-09-25',
          arrivalTime: '2023-09-25T09:00:00Z',
          departureTime: '2023-09-25T16:00:00Z'
        },
        {
          date: '2023-09-26',
          arrivalTime: '2023-09-26T09:00:00Z',
          departureTime: '2023-09-26T15:30:00Z'
        },
        {
          date: '2023-09-27',
          arrivalTime: '2023-09-27T09:00:00Z',
          departureTime: '2023-09-27T14:00:00Z'
        },
        {
          date: '2023-09-28',
          arrivalTime: '2023-09-28T09:00:00Z',
          departureTime: '2023-09-28T15:00:00Z'
        },
        {
          date: '2023-09-29',
          arrivalTime: '2023-09-29T09:00:00Z',
          departureTime: '2023-09-29T12:30:00Z'
        }
      ]
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    // Step 2: Navigate to weekly report view
    const reportsTab = screen.getByRole('button', { name: /reports/i });
    await fireEvent.click(reportsTab);

    // Step 3: Select current week from dropdown
    const weekSelector = screen.getByTestId('week-selector');
    await fireEvent.change(weekSelector, { target: { value: weekStart } });

    // Step 4: Verify Monday-Friday summary appears
    await waitFor(() => {
      const weeklyReport = screen.getByTestId('weekly-report');
      expect(weeklyReport).toBeInTheDocument();

      // Check for all 5 weekdays
      expect(within(weeklyReport).getByText('Monday')).toBeInTheDocument();
      expect(within(weeklyReport).getByText('Tuesday')).toBeInTheDocument();
      expect(within(weeklyReport).getByText('Wednesday')).toBeInTheDocument();
      expect(within(weeklyReport).getByText('Thursday')).toBeInTheDocument();
      expect(within(weeklyReport).getByText('Friday')).toBeInTheDocument();

      // Should not show weekend days
      expect(within(weeklyReport).queryByText('Saturday')).toBeNull();
      expect(within(weeklyReport).queryByText('Sunday')).toBeNull();
    });

    // Step 5: Verify time format is hh:mm for accumulated time
    const taskSummary = screen.getByTestId('task-summary');
    const developmentTime = within(taskSummary).getByTestId('task-1-time');
    const meetingsTime = within(taskSummary).getByTestId('task-2-time');
    const documentationTime = within(taskSummary).getByTestId('task-3-time');

    // Development: 4 + 3 + 6 = 13 hours = 13:00
    expect(developmentTime).toHaveTextContent('13:00');

    // Meetings: 2 + 5 = 7 hours = 07:00
    expect(meetingsTime).toHaveTextContent('07:00');

    // Documentation: 2.5 + 3.5 = 6 hours = 06:00
    expect(documentationTime).toHaveTextContent('06:00');

    // Verify format is hh:mm (not hh:mm:ss)
    expect(developmentTime.textContent).toMatch(/^\d{2}:\d{2}$/);
    expect(meetingsTime.textContent).toMatch(/^\d{2}:\d{2}$/);
    expect(documentationTime.textContent).toMatch(/^\d{2}:\d{2}$/);

    // Step 6: Verify task breakdown shows total time per task
    const totalWeekTime = screen.getByTestId('total-week-time');
    expect(totalWeekTime).toHaveTextContent('26:00'); // 13 + 7 + 6 = 26 hours

    // Step 7: Copy data for external system input
    const exportButton = screen.getByRole('button', { name: /export|copy/i });
    await fireEvent.click(exportButton);

    // Verify export format is suitable for external systems
    const exportedData = await navigator.clipboard.readText();
    expect(exportedData).toContain('Development,13:00');
    expect(exportedData).toContain('Meetings,07:00');
    expect(exportedData).toContain('Documentation,06:00');

    // Expected Results Verification:

    // 1. Weekly view shows Monday-Friday only ✓
    // 2. Time totals formatted as hh:mm (not hh:mm:ss) ✓
    // 3. Task breakdown clearly shows time allocation ✓
    // 4. Data is easy to copy/paste for external systems ✓

    // 5. Week selection dropdown works correctly
    const weekOptions = screen.getAllByRole('option');
    expect(weekOptions.length).toBeGreaterThan(1); // Should have multiple weeks
    expect(weekOptions[0]).toHaveAttribute('value', weekStart);
  });

  it('should handle weeks with missing days', async () => {
    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [{ id: 'task-1', name: 'Partial Week', color: 'primary' }],
      timeEntries: [
        // Only Monday and Wednesday
        { id: 'e1', taskId: 'task-1', date: '2023-09-25', duration: 14400000 }, // Monday 4 hours
        { id: 'e2', taskId: 'task-1', date: '2023-09-27', duration: 10800000 } // Wednesday 3 hours
      ],
      workDays: [{ date: '2023-09-25' }, { date: '2023-09-27' }]
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    await fireEvent.click(screen.getByRole('button', { name: /reports/i }));
    await fireEvent.change(screen.getByTestId('week-selector'), {
      target: { value: '2023-09-25' }
    });

    const weeklyReport = screen.getByTestId('weekly-report');

    // Monday should show 4:00
    expect(within(weeklyReport).getByTestId('monday-time')).toHaveTextContent('04:00');

    // Tuesday should show 00:00 or be marked as no data
    expect(within(weeklyReport).getByTestId('tuesday-time')).toHaveTextContent('00:00');

    // Wednesday should show 3:00
    expect(within(weeklyReport).getByTestId('wednesday-time')).toHaveTextContent('03:00');

    // Total should still be correct
    expect(screen.getByTestId('total-week-time')).toHaveTextContent('07:00'); // 4 + 3 = 7 hours
  });

  it('should support multiple week selection and comparison', async () => {
    // Create data for multiple weeks
    const multiWeekData = {
      settings: { dailyHours: 8 },
      tasks: [{ id: 'task-1', name: 'Multi Week', color: 'primary' }],
      timeEntries: [
        // Week 1 (2023-09-25)
        { id: 'e1', taskId: 'task-1', date: '2023-09-25', duration: 14400000 },
        // Week 2 (2023-10-02)
        { id: 'e2', taskId: 'task-1', date: '2023-10-02', duration: 18000000 }
      ],
      workDays: [{ date: '2023-09-25' }, { date: '2023-10-02' }]
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(multiWeekData));

    render(App);

    await fireEvent.click(screen.getByRole('button', { name: /reports/i }));

    // Check week 1
    await fireEvent.change(screen.getByTestId('week-selector'), {
      target: { value: '2023-09-25' }
    });
    expect(screen.getByTestId('total-week-time')).toHaveTextContent('04:00');

    // Switch to week 2
    await fireEvent.change(screen.getByTestId('week-selector'), {
      target: { value: '2023-10-02' }
    });
    expect(screen.getByTestId('total-week-time')).toHaveTextContent('05:00');
  });
});
