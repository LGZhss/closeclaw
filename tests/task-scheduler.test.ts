import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateNextRun, validateCronExpression } from '../src/task-scheduler.js';
import { ScheduledTask } from '../src/types.js';

describe('Task Scheduler', () => {
  describe('calculateNextRun', () => {
    it('should correctly calculate next run for cron schedule', () => {
      const task: ScheduledTask = {
        id: 1,
        group_folder: 'test',
        prompt: 'test',
        schedule_type: 'cron',
        schedule_value: '0 * * * *', // every hour
        is_paused: false,
        created_at: new Date().toISOString(),
      };

      const nextRun = calculateNextRun(task);
      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun?.getMinutes()).toBe(0);
    });

    it('should correctly calculate next run for interval schedule', () => {
      const intervalMs = 60000; // 1 minute
      const task: ScheduledTask = {
        id: 2,
        group_folder: 'test',
        prompt: 'test',
        schedule_type: 'interval',
        schedule_value: intervalMs.toString(),
        is_paused: false,
        created_at: new Date().toISOString(),
      };

      const now = Date.now();
      const nextRun = calculateNextRun(task);

      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun?.getTime()).toBeGreaterThanOrEqual(now + intervalMs - 100);
      expect(nextRun?.getTime()).toBeLessThanOrEqual(now + intervalMs + 100);
    });

    it('should correctly calculate next run for once schedule', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
      const task: ScheduledTask = {
        id: 3,
        group_folder: 'test',
        prompt: 'test',
        schedule_type: 'once',
        schedule_value: futureDate,
        is_paused: false,
        created_at: new Date().toISOString(),
      };

      const nextRun = calculateNextRun(task);
      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun?.toISOString()).toBe(futureDate);
    });

    it('should return null for invalid cron expression', () => {
      const task: ScheduledTask = {
        id: 4,
        group_folder: 'test',
        prompt: 'test',
        schedule_type: 'cron',
        schedule_value: 'invalid-cron',
        is_paused: false,
        created_at: new Date().toISOString(),
      };

      const nextRun = calculateNextRun(task);
      expect(nextRun).toBeNull();
    });

    it('should return null for unknown schedule type', () => {
      const task = {
        id: 5,
        group_folder: 'test',
        prompt: 'test',
        schedule_type: 'unknown',
        schedule_value: 'test',
        is_paused: false,
        created_at: new Date().toISOString(),
      } as ScheduledTask;

      const nextRun = calculateNextRun(task);
      expect(nextRun).toBeNull();
    });
  });

  describe('validateCronExpression', () => {
    it('should return true for valid cron expression', () => {
      expect(validateCronExpression('0 * * * *')).toBe(true);
    });

    it('should return false for invalid cron expression', () => {
      expect(validateCronExpression('invalid-cron')).toBe(false);
    });
  });
});
