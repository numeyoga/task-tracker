import { describe, it, expect, beforeEach, afterEach, vi, waitFor } from 'vitest';
import { TimerService, TaskNotFoundError, TimerAlreadyActiveError, NoActiveTimerError, TimeEntryNotFoundError, InvalidDurationError, MealBreakAlreadyActiveError, NoActiveMealBreakError } from '../../src/services/TimerService.js';
import { TaskService } from '../../src/services/TaskService.js';

describe('TimerService Contract Tests', () => {
  let timerService;
  let taskService;
  let mockDataService;
  let testTaskId;

  beforeEach(async () => {
    vi.useFakeTimers();

    // Create a mock DataService
    mockDataService = {
      data: { tasks: [], timeEntries: [], workDays: [], mealBreaks: [] },
      loadData() {
        return this.data;
      },
      async saveData(data) {
        this.data = { ...data };
      }
    };

    // Create TaskService with mock DataService
    taskService = new TaskService(mockDataService);

    // Create test tasks for the timer tests
    const task1 = await taskService.createTask('Test Task 1', 'primary');
    const task2 = await taskService.createTask('Test Task 2', 'secondary');
    testTaskId = task1.id;

    timerService = new TimerService(mockDataService, taskService);
  });

  afterEach(() => {
    vi.useRealTimers();
    timerService.destroy?.();
  });

  describe('startTimer method', () => {
    it('should start timer for specified task and return Promise<TimeEntry>', async () => {
      const result = await timerService.startTimer(testTaskId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('taskId', testTaskId);
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime', null);
      expect(result.startTime).toBeInstanceOf(Date);
    });

    it('should throw TaskNotFoundError for invalid task ID', async () => {
      await expect(timerService.startTimer('invalid-task')).rejects.toThrow(TaskNotFoundError);
    });

    it('should throw TimerAlreadyActiveError when timer is already running', async () => {
      await timerService.startTimer(testTaskId);

      await expect(timerService.startTimer(testTaskId)).rejects.toThrow(TimerAlreadyActiveError);
    });
  });

  describe('stopTimer method', () => {
    it('should stop active timer and return Promise<TimeEntry>', async () => {
      await timerService.startTimer(testTaskId);
      vi.advanceTimersByTime(5000); // 5 seconds

      const result = await timerService.stopTimer();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('taskId', testTaskId);
      expect(result).toHaveProperty('endTime');
      expect(result).toHaveProperty('duration');
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThanOrEqual(5000);
    });

    it('should throw NoActiveTimerError when no timer is running', async () => {
      await expect(timerService.stopTimer()).rejects.toThrow(NoActiveTimerError);
    });
  });

  describe('getCurrentTimer method', () => {
    it('should return TimerStatus when timer is active', async () => {
      await timerService.startTimer(testTaskId);

      const result = timerService.getCurrentTimer();

      expect(result).toHaveProperty('isActive', true);
      expect(result).toHaveProperty('taskId', testTaskId);
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('elapsedTime');
      expect(typeof result.elapsedTime).toBe('number');
    });

    it('should return null when no timer is active', () => {
      const result = timerService.getCurrentTimer();
      expect(result).toBeNull();
    });
  });

  describe('switchTask method', () => {
    it('should switch timer to new task and return stopped/started entries', async () => {
      const tasks = taskService.getAllTasks();
      const task2Id = tasks[1].id;

      await timerService.startTimer(testTaskId);
      vi.advanceTimersByTime(3000);

      const result = await timerService.switchTask(task2Id);

      expect(result).toHaveProperty('stopped');
      expect(result).toHaveProperty('started');
      expect(result.stopped).toHaveProperty('taskId', testTaskId);
      expect(result.started).toHaveProperty('taskId', task2Id);
      expect(result.stopped.endTime).toBeInstanceOf(Date);
      expect(result.started.startTime).toBeInstanceOf(Date);
    });

    it('should throw TaskNotFoundError for invalid new task', async () => {
      await timerService.startTimer(testTaskId);

      await expect(timerService.switchTask('invalid-task')).rejects.toThrow(TaskNotFoundError);
    });
  });

  describe('adjustTime method', () => {
    it('should adjust time entry duration and return updated entry', async () => {
      await timerService.startTimer(testTaskId);
      vi.advanceTimersByTime(5000);
      const entry = await timerService.stopTimer();

      const newDuration = 10000; // 10 seconds
      const result = await timerService.adjustTime(entry.id, newDuration, 'Manual adjustment');

      expect(result).toHaveProperty('id', entry.id);
      expect(result).toHaveProperty('duration', newDuration);
      expect(result).toHaveProperty('isManuallyAdjusted', true);
      expect(result).toHaveProperty('adjustmentNote', 'Manual adjustment');
    });

    it('should throw TimeEntryNotFoundError for invalid entry ID', async () => {
      await expect(timerService.adjustTime('invalid-id', 5000, 'test')).rejects.toThrow(TimeEntryNotFoundError);
    });

    it('should throw InvalidDurationError for negative duration', async () => {
      await timerService.startTimer(testTaskId);
      vi.advanceTimersByTime(5000);
      const entry = await timerService.stopTimer();

      await expect(timerService.adjustTime(entry.id, -1000, 'test')).rejects.toThrow(InvalidDurationError);
    });
  });

  describe('meal break methods', () => {
    describe('startMealBreak', () => {
      it('should start meal break timer and return Promise<MealBreak>', async () => {
        const result = await timerService.startMealBreak();

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('startTime');
        expect(result).toHaveProperty('endTime', null);
        expect(result.startTime).toBeInstanceOf(Date);
      });

      it('should throw MealBreakAlreadyActiveError when meal break is active', async () => {
        await timerService.startMealBreak();

        await expect(timerService.startMealBreak()).rejects.toThrow(MealBreakAlreadyActiveError);
      });
    });

    describe('stopMealBreak', () => {
      it('should stop meal break and return Promise<MealBreak>', async () => {
        await timerService.startMealBreak();
        vi.advanceTimersByTime(1800000); // 30 minutes

        const result = await timerService.stopMealBreak();

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('endTime');
        expect(result).toHaveProperty('duration');
        expect(result.endTime).toBeInstanceOf(Date);
        expect(result.duration).toBeGreaterThanOrEqual(1800000);
      });

      it('should throw NoActiveMealBreakError when no meal break is active', async () => {
        await expect(timerService.stopMealBreak()).rejects.toThrow(NoActiveMealBreakError);
      });
    });
  });

  describe('events', () => {
    it('should emit timerStarted event when timer starts', async () => {
      let eventPayload = null;
      timerService.on('timerStarted', (payload) => {
        eventPayload = payload;
      });

      await timerService.startTimer(testTaskId);

      expect(eventPayload).toHaveProperty('taskId', testTaskId);
      expect(eventPayload).toHaveProperty('startTime');
    });

    it('should emit timerStopped event when timer stops', async () => {
      let eventPayload = null;
      timerService.on('timerStopped', (payload) => {
        eventPayload = payload;
      });

      await timerService.startTimer(testTaskId);
      vi.advanceTimersByTime(5000);
      await timerService.stopTimer();

      expect(eventPayload).toHaveProperty('taskId', testTaskId);
      expect(eventPayload).toHaveProperty('duration');
      expect(typeof eventPayload.duration).toBe('number');
    });

    it('should emit timerTick events every second', async () => {
      let tickCount = 0;
      timerService.on('timerTick', () => {
        tickCount++;
      });

      await timerService.startTimer(testTaskId);
      vi.advanceTimersByTime(3000);

      expect(tickCount).toBeGreaterThanOrEqual(3);
    });

    it('should emit timerAutoStopped event when timer hits maximum duration', async () => {
      let eventPayload = null;
      timerService.on('timerAutoStopped', (payload) => {
        eventPayload = payload;
      });

      const startTime = Date.now();
      await timerService.startTimer(testTaskId);

      // Advance system time before stopping to avoid validation error
      vi.setSystemTime(startTime + 1000);

      // Directly trigger auto-stop to test the event emission
      await timerService.autoStopTimer('Maximum duration exceeded');

      expect(eventPayload).toBeTruthy();
      expect(eventPayload).toHaveProperty('taskId', testTaskId);
      expect(eventPayload).toHaveProperty('reason', 'Maximum duration exceeded');
    });

    it('should emit mealBreakStarted and mealBreakStopped events', async () => {
      let startEventPayload = null;
      let stopEventPayload = null;

      timerService.on('mealBreakStarted', (payload) => {
        startEventPayload = payload;
      });

      timerService.on('mealBreakStopped', (payload) => {
        stopEventPayload = payload;
      });

      await timerService.startMealBreak();
      vi.advanceTimersByTime(1800000); // 30 minutes
      await timerService.stopMealBreak();

      expect(startEventPayload).toHaveProperty('id');
      expect(startEventPayload).toHaveProperty('startTime');

      expect(stopEventPayload).toHaveProperty('id');
      expect(stopEventPayload).toHaveProperty('duration');
    });
  });
});