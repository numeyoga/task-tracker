import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import App from '../../src/App.svelte';

describe('Integration Test: Manual Time Corrections', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should handle complete manual time correction workflow', async () => {
    const timeEntry = {
      id: 'entry-1',
      taskId: 'task-1',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 5000).toISOString(),
      duration: 5000,
      isManuallyAdjusted: false
    };

    const initialData = {
      settings: { dailyHours: 8 },
      tasks: [{ id: 'task-1', name: 'Correction Test', color: 'primary' }],
      timeEntries: [timeEntry],
      workDays: [{ date: new Date().toISOString().split('T')[0], timeEntries: ['entry-1'] }]
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    // Step 1: Create time entry through normal timer use (already done)
    // Step 2: Access time correction interface
    const correctionButton = screen.getByRole('button', { name: /correct.*time|adjust.*time/i });
    await fireEvent.click(correctionButton);

    // Verify correction modal opens
    const modal = screen.getByTestId('time-correction-modal');
    expect(modal).toBeInTheDocument();

    // Step 3: Modify duration for specific time entry
    const durationInput = screen.getByLabelText(/duration|time/i);
    expect(durationInput.value).toBe('5'); // 5 seconds in some unit

    await fireEvent.input(durationInput, { target: { value: '10' } }); // Change to 10 seconds

    // Step 4: Add note explaining correction
    const noteInput = screen.getByLabelText(/note|reason|explanation/i);
    await fireEvent.input(noteInput, {
      target: { value: 'Manual correction for forgotten pause' }
    });

    // Step 5: Save correction
    const saveButton = screen.getByRole('button', { name: /save/i });
    await fireEvent.click(saveButton);

    // Step 6: Verify daily/weekly totals update
    await waitFor(() => {
      const totalTime = screen.getByTestId('task-total-time');
      expect(totalTime).toHaveTextContent('00:10'); // Updated to 10 seconds
    });

    // Step 7: Verify correction is marked as manual
    const correctedEntry = screen.getByTestId('time-entry-entry-1');
    expect(correctedEntry).toHaveClass('manually-adjusted');
    expect(within(correctedEntry).getByTestId('adjustment-indicator')).toBeInTheDocument();

    // Expected Results Verification:
    const savedData = JSON.parse(localStorage.getItem('task-tracker-data'));

    // 1. Time entries can be edited after creation
    const updatedEntry = savedData.timeEntries.find((e) => e.id === 'entry-1');
    expect(updatedEntry.duration).toBe(10000); // 10 seconds

    // 2. Manual corrections are flagged differently
    expect(updatedEntry.isManuallyAdjusted).toBe(true);

    // 3. Notes can be added to explain corrections
    expect(updatedEntry.adjustmentNote).toBe('Manual correction for forgotten pause');

    // 4. All totals recalculate correctly
    // 5. Audit trail shows manual modifications
    expect(updatedEntry.adjustmentTimestamp).toBeTruthy();
  });

  it('should validate correction inputs', async () => {
    const initialData = {
      timeEntries: [
        {
          id: 'entry-1',
          taskId: 'task-1',
          duration: 5000,
          isManuallyAdjusted: false
        }
      ],
      tasks: [{ id: 'task-1', name: 'Test' }]
    };
    localStorage.setItem('task-tracker-data', JSON.stringify(initialData));

    render(App);

    await fireEvent.click(screen.getByRole('button', { name: /correct.*time/i }));

    // Try negative duration
    const durationInput = screen.getByLabelText(/duration/i);
    await fireEvent.input(durationInput, { target: { value: '-5' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    await fireEvent.click(saveButton);

    // Should show validation error
    expect(screen.getByText(/duration.*must.*positive/i)).toBeInTheDocument();
  });
});
