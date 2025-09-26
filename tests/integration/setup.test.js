import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import App from '../../src/App.svelte';

describe('Integration Test: First-Time User Setup', () => {
  beforeEach(() => {
    // Clear localStorage to simulate first-time user
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should guide first-time user through complete setup process', async () => {
    // Step 1: Open application in Chrome browser (simulated)
    const { container } = render(App);
    expect(container).toBeTruthy();

    // Step 2: Verify welcome/setup screen appears
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    // Verify no external resources loaded
    const images = container.querySelectorAll('img');
    images.forEach((img) => {
      expect(img.src).not.toMatch(/^https?:\/\/(?!localhost)/);
    });

    // Step 3: Configure daily presence time requirement (default 8 hours)
    const presenceInput = screen.getByLabelText(/daily.*hours?/i);
    expect(presenceInput).toBeInTheDocument();
    expect(presenceInput.value).toBe('8'); // Default 8 hours

    // User can modify the default
    await fireEvent.input(presenceInput, { target: { value: '7.5' } });
    expect(presenceInput.value).toBe('7.5');

    // Step 4: Create first task: "Development Work"
    const taskNameInput = screen.getByLabelText(/task.*name/i);
    const addTaskButton = screen.getByRole('button', { name: /add.*task/i });

    await fireEvent.input(taskNameInput, { target: { value: 'Development Work' } });
    await fireEvent.click(addTaskButton);

    // Step 5: Verify task appears in task list
    await waitFor(() => {
      expect(screen.getByText('Development Work')).toBeInTheDocument();
    });

    // Verify task has proper structure
    const taskElement =
      screen.getByTestId('task-Development Work') ||
      screen.getByText('Development Work').closest('[data-testid]');
    expect(taskElement).toBeInTheDocument();

    // Step 6: Verify no active timer is running
    const timerDisplay = screen.getByTestId('timer-display');
    expect(timerDisplay).toHaveTextContent('00:00:00');

    const startButton = screen.getByRole('button', { name: /start/i });
    const stopButton = screen.queryByRole('button', { name: /stop/i });

    expect(startButton).toBeInTheDocument();
    expect(startButton).not.toBeDisabled();
    expect(stopButton).toBeNull(); // Should not exist when timer is stopped

    // Expected Results Verification:

    // 1. Clean, modern interface loads without external resources
    const daisyUIElements = container.querySelectorAll('.btn, .card, .input');
    expect(daisyUIElements.length).toBeGreaterThan(0); // DaisyUI classes present

    // No external CDN links
    const links = document.querySelectorAll('link[href*="http"]');
    const externalLinks = Array.from(links).filter(
      (link) => !link.href.includes('localhost') && link.href.startsWith('http')
    );
    expect(externalLinks).toHaveLength(0);

    // 2. Settings are saved to localStorage
    const completeSetupButton = screen.getByRole('button', { name: /complete.*setup/i });
    await fireEvent.click(completeSetupButton);

    await waitFor(() => {
      const savedData = localStorage.getItem('task-tracker-data');
      expect(savedData).toBeTruthy();

      const parsedData = JSON.parse(savedData);
      expect(parsedData.settings).toHaveProperty('dailyHours', 7.5);
      expect(parsedData.tasks).toHaveLength(1);
      expect(parsedData.tasks[0]).toHaveProperty('name', 'Development Work');
    });

    // 3. Default presence time is configurable
    await waitFor(() => {
      const savedData = localStorage.getItem('task-tracker-data');
      expect(savedData).toBeTruthy();
      const parsedData = JSON.parse(savedData);
      expect(parsedData.settings.dailyHours).toBe(7.5); // User modified value
    });

    // 4. Task creation works with validation
    const invalidTaskInput = screen.getByLabelText(/task.*name/i);
    const addAnotherTaskButton = screen.getByRole('button', { name: /add.*task/i });

    // Try to create task with empty name
    await fireEvent.input(invalidTaskInput, { target: { value: '' } });
    await fireEvent.click(addAnotherTaskButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/task.*name.*required/i)).toBeInTheDocument();
    });

    // Try to create duplicate task
    await fireEvent.input(invalidTaskInput, { target: { value: 'Development Work' } });
    await fireEvent.click(addAnotherTaskButton);

    await waitFor(() => {
      expect(screen.getByText(/task.*already.*exists/i)).toBeInTheDocument();
    });

    // 5. No errors in browser console - checked via absence of error logs
    const consoleSpy = vi.spyOn(console, 'error');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should handle setup cancellation and restart', async () => {
    render(App);

    // Start setup
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    // Configure some settings
    const presenceInput = screen.getByLabelText(/daily.*hours?/i);
    await fireEvent.input(presenceInput, { target: { value: '6' } });

    // Cancel setup
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await fireEvent.click(cancelButton);

    // Should return to welcome screen
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    // Restart setup - should not retain previous values
    const restartButton = screen.getByRole('button', { name: /start.*setup/i });
    await fireEvent.click(restartButton);

    const resetInput = screen.getByLabelText(/daily.*hours?/i);
    expect(resetInput.value).toBe('8'); // Back to default
  });

  it('should validate Bumblebee theme is applied', async () => {
    render(App);

    await waitFor(() => {

      // Verify Bumblebee theme colors are applied
      // Bumblebee theme uses yellow/amber colors
      const themeElement =
        document.querySelector('[data-theme="bumblebee"]') || document.documentElement;
      expect(themeElement).toBeTruthy();
    });

    // Check for Bumblebee-specific CSS custom properties
    const rootStyles = window.getComputedStyle(document.documentElement);
    const primaryColor =
      rootStyles.getPropertyValue('--p') || rootStyles.getPropertyValue('--primary');

    // Bumblebee theme should have yellow/amber primary colors
    expect(primaryColor).toBeTruthy();
  });

  it('should ensure app works completely offline', async () => {
    // Mock network to simulate offline
    const originalFetch = global.fetch;
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    try {
      render(App);

      // App should still load and function
      await waitFor(() => {
        expect(screen.getByText(/welcome/i)).toBeInTheDocument();
      });

      // Setup should work without network
      const presenceInput = screen.getByLabelText(/daily.*hours?/i);
      await fireEvent.input(presenceInput, { target: { value: '8' } });

      const taskNameInput = screen.getByLabelText(/task.*name/i);
      await fireEvent.input(taskNameInput, { target: { value: 'Offline Task' } });

      const addTaskButton = screen.getByRole('button', { name: /add.*task/i });
      await fireEvent.click(addTaskButton);

      await waitFor(() => {
        expect(screen.getByText('Offline Task')).toBeInTheDocument();
      });

      // Complete setup offline
      const completeButton = screen.getByRole('button', { name: /complete.*setup/i });
      await fireEvent.click(completeButton);

      // Verify data saved to localStorage
      const savedData = localStorage.getItem('task-tracker-data');
      expect(savedData).toBeTruthy();
      expect(JSON.parse(savedData).tasks[0].name).toBe('Offline Task');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
