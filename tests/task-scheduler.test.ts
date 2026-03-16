import { describe, it, expect, vi, afterEach } from 'vitest';
import { taskScheduler } from '../src/task-scheduler.js';

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
});