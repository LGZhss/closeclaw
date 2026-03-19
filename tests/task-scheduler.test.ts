import { describe, it, expect, vi, afterEach } from 'vitest';
import { taskScheduler, calculateNextRun, validateCronExpression } from '../src/task-scheduler.js';
import { logger } from '../src/logger.js';
import { ScheduledTask } from '../src/types.js';

vi.mock('cron-parser', async () => {
  const actual = await vi.importActual<any>('cron-parser');
  return {
    default: {
      parseExpression: actual.parseExpression || actual.default?.parseExpression || actual.CronExpressionParser?.parse,
    },
  };
});

vi.mock('../src/logger.js', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }
}));

describe('Task Scheduler', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should schedule tasks', () => {
    // 测试任务调度
    const mockFn = vi.fn();
    
    const taskId = taskScheduler.scheduleTask({
      name: 'test-task',
      interval: 1000,
      callback: mockFn
    });
    
    expect(taskId).toBeTruthy();
  });

  it('should execute scheduled tasks', () => {
    // 测试任务执行
    const mockFn = vi.fn();
    
    taskScheduler.scheduleTask({
      name: 'test-task',
      interval: 100,
      callback: mockFn
    });
    
    // 等待定时器执行
    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalled();
  });

  it('should cancel scheduled tasks', () => {
    // 测试取消任务
    const mockFn = vi.fn();
    
    const taskId = taskScheduler.scheduleTask({
      name: 'test-task',
      interval: 100,
      callback: mockFn
    });
    
    taskScheduler.cancelTask(taskId);
    vi.advanceTimersByTime(100);
    expect(mockFn).not.toHaveBeenCalled();
  });

  describe('calculateNextRun', () => {
    it('should handle cron schedule type', () => {
      const task = {
        id: 1,
        schedule_type: 'cron',
        schedule_value: '* * * * *',
      } as ScheduledTask;

      const nextRun = calculateNextRun(task);
      expect(nextRun).toBeInstanceOf(Date);
      // It should be in the future
      expect(nextRun?.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle interval schedule type', () => {
      const intervalMs = 10000;
      const task = {
        id: 1,
        schedule_type: 'interval',
        schedule_value: intervalMs.toString(),
      } as ScheduledTask;

      const nextRun = calculateNextRun(task);
      expect(nextRun).toBeInstanceOf(Date);

      // Allow a small delta for execution time
      const expectedTime = Date.now() + intervalMs;
      expect(Math.abs(nextRun!.getTime() - expectedTime)).toBeLessThan(50);
    });

    it('should handle once schedule type', () => {
      const futureDate = new Date(Date.now() + 10000).toISOString();
      const task = {
        id: 1,
        schedule_type: 'once',
        schedule_value: futureDate,
      } as ScheduledTask;

      const nextRun = calculateNextRun(task);
      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun?.toISOString()).toBe(futureDate);
    });

    it('should return null and log warning for unknown schedule type', () => {
      const task = {
        id: 1,
        schedule_type: 'unknown' as any,
        schedule_value: 'test',
      } as ScheduledTask;

      const nextRun = calculateNextRun(task);
      expect(nextRun).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith('Unknown schedule type: unknown');
    });

    it('should return null and log error when parsing invalid cron expression', () => {
      const task = {
        id: 1,
        schedule_type: 'cron',
        schedule_value: 'invalid cron',
      } as ScheduledTask;

      const nextRun = calculateNextRun(task);
      expect(nextRun).toBeNull();
      expect(logger.error).toHaveBeenCalled();

      // Ensure the error message includes the task ID and error details
      const errorMessage = vi.mocked(logger.error).mock.calls[0][0];
      expect(errorMessage).toMatch(/Failed to calculate next run for task 1: Error:/);
    });
  });

  describe('validateCronExpression', () => {
    it('should return true for valid cron expression', () => {
      expect(validateCronExpression('* * * * *')).toBe(true);
      expect(validateCronExpression('0 12 * * *')).toBe(true);
    });

    it('should return false for invalid cron expression', () => {
      expect(validateCronExpression('invalid')).toBe(false);
      expect(validateCronExpression('* * * * * * *')).toBe(false); // Too many parts
    });
  });
});