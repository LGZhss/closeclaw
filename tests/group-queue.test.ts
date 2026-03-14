import { describe, it, expect } from 'vitest';
import { groupQueue } from '../src/group-queue.js';

describe('Group Queue', () => {
  it('should add tasks to queue', () => {
    // 测试添加任务
    const taskId = groupQueue.addTask({
      type: 'test',
      data: { test: 'data' },
      priority: 1
    });
    
    expect(taskId).toBeTruthy();
  });

  it('should process tasks', () => {
    // 测试处理任务
    let processed = false;
    
    groupQueue.addTask({
      type: 'test',
      data: { test: 'data' },
      priority: 1,
      callback: () => {
        processed = true;
      }
    });
    
    groupQueue.processNext();
    expect(processed).toBe(true);
  });

  it('should handle task prioritization', () => {
    // 测试任务优先级
    const results: string[] = [];
    
    groupQueue.addTask({
      type: 'low',
      data: { test: 'low' },
      priority: 1,
      callback: () => results.push('low')
    });
    
    groupQueue.addTask({
      type: 'high',
      data: { test: 'high' },
      priority: 5,
      callback: () => results.push('high')
    });
    
    groupQueue.processNext();
    expect(results[0]).toBe('high');
  });
});