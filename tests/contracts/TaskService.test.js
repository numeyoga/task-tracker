import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskService, ValidationError, TaskNotFoundError, DuplicateTaskNameError, ActiveTaskDeleteError } from '../../src/services/TaskService.js';

describe('TaskService Contract Tests', () => {
  let taskService;
  let mockDataService;

  beforeEach(() => {
    // Create a mock DataService
    mockDataService = {
      data: { tasks: [], timeEntries: [] },
      loadData() {
        return this.data;
      },
      async saveData(data) {
        this.data = { ...data };
      }
    };

    taskService = new TaskService(mockDataService);
  });

  afterEach(() => {
    taskService.destroy?.();
  });

  describe('createTask method', () => {
    it('should create new task and return Promise<Task>', async () => {
      const taskData = {
        name: 'Development Work',
        color: 'primary'
      };

      const result = await taskService.createTask(taskData.name, taskData.color);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', taskData.name);
      expect(result).toHaveProperty('color', taskData.color);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('isActive', false);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(typeof result.id).toBe('string');
    });

    it('should throw ValidationError for empty task name', async () => {
      await expect(taskService.createTask('', 'primary')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for task name longer than 100 characters', async () => {
      const longName = 'a'.repeat(101);

      await expect(taskService.createTask(longName, 'primary')).rejects.toThrow(ValidationError);
    });

    it('should throw DuplicateTaskNameError for duplicate task names', async () => {
      await taskService.createTask('Test Task', 'primary');

      await expect(taskService.createTask('Test Task', 'secondary')).rejects.toThrow(
        DuplicateTaskNameError
      );
    });
  });

  describe('updateTask method', () => {
    it('should update existing task and return Promise<Task>', async () => {
      const task = await taskService.createTask('Original Task', 'primary');
      const updates = { name: 'Updated Task', color: 'secondary' };

      const result = await taskService.updateTask(task.id, updates);

      expect(result).toHaveProperty('id', task.id);
      expect(result).toHaveProperty('name', 'Updated Task');
      expect(result).toHaveProperty('color', 'secondary');
      expect(result).toHaveProperty('updatedAt');
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw TaskNotFoundError for invalid task ID', async () => {
      await expect(taskService.updateTask('invalid-id', { name: 'Test' })).rejects.toThrow(
        TaskNotFoundError
      );
    });

    it('should throw ValidationError for invalid updates', async () => {
      const task = await taskService.createTask('Test Task', 'primary');

      await expect(taskService.updateTask(task.id, { name: '' })).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('deleteTask method', () => {
    it('should soft delete task and return Promise<boolean>', async () => {
      const task = await taskService.createTask('To Delete', 'primary');

      const result = await taskService.deleteTask(task.id);

      expect(result).toBe(true);

      // Verify task is not in active tasks
      const allTasks = taskService.getAllTasks();
      expect(allTasks.find((t) => t.id === task.id)).toBeUndefined();
    });

    it('should throw TaskNotFoundError for invalid task ID', async () => {
      await expect(taskService.deleteTask('invalid-id')).rejects.toThrow(TaskNotFoundError);
    });

    it('should throw ActiveTaskDeleteError when trying to delete active task', async () => {
      const task = await taskService.createTask('Active Task', 'primary');
      await taskService.setActiveTask(task.id);

      await expect(taskService.deleteTask(task.id)).rejects.toThrow(ActiveTaskDeleteError);
    });
  });

  describe('getAllTasks method', () => {
    it('should return array of all active tasks', () => {
      const result = taskService.getAllTasks();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should return all created tasks except deleted ones', async () => {
      const task1 = await taskService.createTask('Task 1', 'primary');
      const task2 = await taskService.createTask('Task 2', 'secondary');
      await taskService.deleteTask(task1.id);

      const result = taskService.getAllTasks();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', task2.id);
      expect(result[0]).toHaveProperty('name', 'Task 2');
    });
  });

  describe('getActiveTask method', () => {
    it('should return null when no task is active', () => {
      const result = taskService.getActiveTask();
      expect(result).toBeNull();
    });

    it('should return active task when one is set', async () => {
      const task = await taskService.createTask('Active Task', 'primary');
      await taskService.setActiveTask(task.id);

      const result = taskService.getActiveTask();

      expect(result).toHaveProperty('id', task.id);
      expect(result).toHaveProperty('isActive', true);
    });
  });

  describe('setActiveTask method', () => {
    it('should set task as active and return Promise<Task>', async () => {
      const task = await taskService.createTask('To Activate', 'primary');

      const result = await taskService.setActiveTask(task.id);

      expect(result).toHaveProperty('id', task.id);
      expect(result).toHaveProperty('isActive', true);
      expect(result).toHaveProperty('activatedAt');
      expect(result.activatedAt).toBeInstanceOf(Date);
    });

    it('should deactivate previous active task when setting new one', async () => {
      const task1 = await taskService.createTask('First', 'primary');
      const task2 = await taskService.createTask('Second', 'secondary');

      await taskService.setActiveTask(task1.id);
      await taskService.setActiveTask(task2.id);

      const activeTask = taskService.getActiveTask();
      expect(activeTask.id).toBe(task2.id);

      // Verify first task is no longer active
      const allTasks = taskService.getAllTasks();
      const firstTask = allTasks.find((t) => t.id === task1.id);
      expect(firstTask.isActive).toBe(false);
    });

    it('should throw TaskNotFoundError for invalid task ID', async () => {
      await expect(taskService.setActiveTask('invalid-id')).rejects.toThrow(TaskNotFoundError);
    });
  });

  describe('getTaskStats method', () => {
    it('should return TaskStats for specified task and date range', async () => {
      const task = await taskService.createTask('Stats Task', 'primary');
      const dateRange = {
        start: new Date('2023-09-01'),
        end: new Date('2023-09-07')
      };

      const result = await taskService.getTaskStats(task.id, dateRange);

      expect(result).toHaveProperty('taskId', task.id);
      expect(result).toHaveProperty('totalTime');
      expect(result).toHaveProperty('averagePerDay');
      expect(result).toHaveProperty('entriesCount');
      expect(result).toHaveProperty('dateRange');
      expect(typeof result.totalTime).toBe('number');
      expect(typeof result.averagePerDay).toBe('number');
      expect(typeof result.entriesCount).toBe('number');
    });

    it('should throw TaskNotFoundError for invalid task ID', async () => {
      const dateRange = {
        start: new Date('2023-09-01'),
        end: new Date('2023-09-07')
      };

      await expect(taskService.getTaskStats('invalid-id', dateRange)).rejects.toThrow(
        TaskNotFoundError
      );
    });
  });

  describe('events', () => {
    it('should emit taskCreated event when task is created', async () => {
      let eventPayload = null;
      taskService.on('taskCreated', (task) => {
        eventPayload = task;
      });

      const task = await taskService.createTask('Event Test', 'primary');

      expect(eventPayload).toEqual(task);
      expect(eventPayload).toHaveProperty('id');
      expect(eventPayload).toHaveProperty('name', 'Event Test');
    });

    it('should emit taskUpdated event when task is updated', async () => {
      let eventPayload = null;
      taskService.on('taskUpdated', (payload) => {
        eventPayload = payload;
      });

      const task = await taskService.createTask('Update Test', 'primary');
      await taskService.updateTask(task.id, { name: 'Updated Name' });

      expect(eventPayload).toHaveProperty('task');
      expect(eventPayload).toHaveProperty('changes');
      expect(eventPayload.task).toHaveProperty('name', 'Updated Name');
      expect(Array.isArray(eventPayload.changes)).toBe(true);
      expect(eventPayload.changes).toContain('name');
    });

    it('should emit taskDeleted event when task is deleted', async () => {
      let eventPayload = null;
      taskService.on('taskDeleted', (payload) => {
        eventPayload = payload;
      });

      const task = await taskService.createTask('Delete Test', 'primary');
      await taskService.deleteTask(task.id);

      expect(eventPayload).toHaveProperty('taskId', task.id);
      expect(eventPayload).toHaveProperty('name', 'Delete Test');
    });

    it('should emit taskActivated event when task is activated', async () => {
      let eventPayload = null;
      taskService.on('taskActivated', (task) => {
        eventPayload = task;
      });

      const task = await taskService.createTask('Activate Test', 'primary');
      await taskService.setActiveTask(task.id);

      expect(eventPayload).toHaveProperty('id', task.id);
      expect(eventPayload).toHaveProperty('isActive', true);
    });
  });
});
