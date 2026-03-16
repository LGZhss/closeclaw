import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../src/db.js';

describe('Database', () => {
  beforeAll(() => {
    // 初始化数据库
    db.init();
  });

  afterAll(() => {
    // 清理测试数据
    db.close();
  });

  it('should create tables successfully', () => {
    // 测试表创建
    expect(db.isInitialized).toBe(true);
  });

  it('should insert and query messages', () => {
    // 测试消息操作
    const messageId = db.insertMessage({
      content: 'Test message',
      sender: 'test-sender',
      channel: 'test-channel',
      timestamp: new Date().toISOString()
    });
    
    expect(messageId).toBeGreaterThan(0);
    
    const messages = db.getMessages();
    expect(messages.length).toBeGreaterThan(0);
  });

  it('should handle errors gracefully', () => {
    // 测试错误处理
    expect(() => db.insertMessage({})).not.toThrow();
  });
});