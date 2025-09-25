import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimerService } from '../../src/services/TimerService.js';

describe('TimerService Contract Tests', () => {
  let timerService;

  beforeEach(() => {
    vi.useFakeTimers();
    timerService = new TimerService();
  });

  afterEach(() => {
    vi.useRealTimers();
    timerService.destroy?.();
  });

  describe('startTimer method', () => {
    it('should start timer for specified task and return Promise<TimeEntry>', async () => {
      const taskId = 'task-1';

      const result = await timerService.startTimer(taskId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('taskId', taskId);
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime', null);
      expect(result.startTime).toBeInstanceOf(Date);
    });

    it('should throw TaskNotFoundError for invalid task ID', async () => {
      await expect(timerService.startTimer('invalid-task')).rejects.toThrow('TaskNotFoundError');
    });

    it('should throw TimerAlreadyActiveError when timer is already running', async () => {
      await timerService.startTimer('task-1');

      await expect(timerService.startTimer('task-2')).rejects.toThrow('TimerAlreadyActiveError');
    });
  });

  describe('stopTimer method', () => {
    it('should stop active timer and return Promise<TimeEntry>', async () => {
      await timerService.startTimer('task-1');
      vi.advanceTimersByTime(5000); // 5 seconds

      const result = await timerService.stopTimer();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('taskId', 'task-1');
      expect(result).toHaveProperty('endTime');
      expect(result).toHaveProperty('duration');
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThanOrEqual(5000);
    });

    it('should throw NoActiveTimerError when no timer is running', async () => {
      await expect(timerService.stopTimer()).rejects.toThrow('NoActiveTimerError');
    });
  });

  describe('getCurrentTimer method', () => {
    it('should return TimerStatus when timer is active', async () => {
      await timerService.startTimer('task-1');
      vi.advanceTimersByTime(3000);

      const result = timerService.getCurrentTimer();

      expect(result).toHaveProperty('taskId', 'task-1');
      expect(result).toHaveProperty('elapsed');
      expect(result).toHaveProperty('startTime');
      expect(result.elapsed).toBeGreaterThanOrEqual(3000);
    });

    it('should return null when no timer is active', () => {
      const result = timerService.getCurrentTimer();
      expect(result).toBeNull();
    });
  });

  describe('switchTask method', () => {
    it('should switch timer to new task and return stopped/started entries', async () => {
      await timerService.startTimer('task-1');
      vi.advanceTimersByTime(2000);

      const result = await timerService.switchTask('task-2');

      expect(result).toHaveProperty('stopped');
      expect(result).toHaveProperty('started');
      expect(result.stopped.taskId).toBe('task-1');
      expect(result.stopped.endTime).toBeInstanceOf(Date);
      expect(result.started.taskId).toBe('task-2');
      expect(result.started.startTime).toBeInstanceOf(Date);
    });

    it('should throw TaskNotFoundError for invalid new task', async () => {
      await timerService.startTimer('task-1');

      await expect(timerService.switchTask('invalid-task')).rejects.toThrow('TaskNotFoundError');
    });
  });

  describe('adjustTime method', () => {
    it('should adjust time entry duration and return updated entry', async () => {
      const entry = await timerService.startTimer('task-1');
      await timerService.stopTimer();

      const result = await timerService.adjustTime(entry.id, 10000, 'Manual correction');

      expect(result).toHaveProperty('id', entry.id);
      expect(result).toHaveProperty('duration', 10000);
      expect(result).toHaveProperty('adjustmentNote', 'Manual correction');
      expect(result).toHaveProperty('isManuallyAdjusted', true);
    });

    it('should throw TimeEntryNotFoundError for invalid entry ID', async () => {
      await expect(timerService.adjustTime('invalid-id', 5000, 'test')).rejects.toThrow(
        'TimeEntryNotFoundError'
      );
    });

    it('should throw InvalidDurationError for negative duration', async () => {
      const entry = await timerService.startTimer('task-1');
      await timerService.stopTimer();

      await expect(timerService.adjustTime(entry.id, -1000, 'test')).rejects.toThrow(
        'InvalidDurationError'
      );
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

        await expect(timerService.startMealBreak()).rejects.toThrow('MealBreakAlreadyActiveError');
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
        await expect(timerService.stopMealBreak()).rejects.toThrow('NoActiveMealBreakError');
      });
    });
  });

  describe('events', () => {
    it('should emit timerStarted event when timer starts', async () => {
      let eventPayload = null;
      timerService.on('timerStarted', (payload) => {
        eventPayload = payload;
      });

      await timerService.startTimer('task-1');

      expect(eventPayload).toHaveProperty('taskId', 'task-1');
      expect(eventPayload).toHaveProperty('timeEntry');
      expect(eventPayload.timeEntry).toHaveProperty('id');
    });

    it('should emit timerStopped event when timer stops', async () => {
      let eventPayload = null;
      timerService.on('timerStopped', (payload) => {
        eventPayload = payload;
      });

      await timerService.startTimer('task-1');
      await timerService.stopTimer();

      expect(eventPayload).toHaveProperty('taskId', 'task-1');
      expect(eventPayload).toHaveProperty('timeEntry');
      expect(eventPayload.timeEntry).toHaveProperty('endTime');
    });

    it('should emit timerTick events every second', async () => {
      const tickEvents = [];
      timerService.on('timerTick', (payload) => {
        tickEvents.push(payload);
      });

      await timerService.startTimer('task-1');
      vi.advanceTimersByTime(3000);

      expect(tickEvents.length).toBeGreaterThanOrEqual(3);
      expect(tickEvents[0]).toHaveProperty('taskId', 'task-1');
      expect(tickEvents[0]).toHaveProperty('elapsed');
      expect(typeof tickEvents[0].elapsed).toBe('number');
    });

    it('should emit timerAutoStopped event when timer hits maximum duration', async () => {
      let eventPayload = null;
      timerService.on('timerAutoStopped', (payload) => {
        eventPayload = payload;
      });

      await timerService.startTimer('task-1');
      // Simulate maximum duration reached (12 hours = 43200000ms)
      vi.advanceTimersByTime(43200001);

      expect(eventPayload).toHaveProperty('taskId', 'task-1');
      expect(eventPayload).toHaveProperty('timeEntry');
      expect(eventPayload).toHaveProperty('reason');
      expect(eventPayload.reason).toContain('maximum duration');
    });

    it('should emit mealBreakStarted and mealBreakStopped events', async () => {
      let startEvent = null;
      let stopEvent = null;

      timerService.on('mealBreakStarted', (payload) => {
        startEvent = payload;
      });
      timerService.on('mealBreakStopped', (payload) => {
        stopEvent = payload;
      });

      await timerService.startMealBreak();
      expect(startEvent).toHaveProperty('id');
      expect(startEvent).toHaveProperty('startTime');

      await timerService.stopMealBreak();
      expect(stopEvent).toHaveProperty('id');
      expect(stopEvent).toHaveProperty('endTime');
      expect(stopEvent).toHaveProperty('duration');
    });
  });
});
