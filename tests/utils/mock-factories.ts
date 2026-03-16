/**
 * tests/utils/mock-factories.ts
 * 测试数据工厂（提案 015）
 * 为测试提供标准化的模拟数据，减少重复代码
 * 实施主体: Verdent (Claude Sonnet 4.6)
 */

import type { DbMessage, RegisteredGroup, ScheduledTask, Session } from '../../src/types.js';

let _msgIdCounter = 1;
let _taskIdCounter = 1;

/** 创建模拟消息（可覆盖任意字段） */
export function makeMessage(overrides: Partial<DbMessage> = {}): DbMessage {
  return {
    id: _msgIdCounter++,
    channel: 'test-channel',
    chat_jid: 'test-group@g.us',
    sender_jid: 'user1@s.whatsapp.net',
    sender_name: '测试用户',
    text: '你好，这是一条测试消息',
    timestamp: Date.now(),
    is_group: 1,
    group_name: '测试群组',
    processed: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/** 创建模拟已注册群组 */
export function makeGroup(overrides: Partial<RegisteredGroup> = {}): RegisteredGroup {
  return {
    jid: `test-${Date.now()}@g.us`,
    name: '测试群组',
    folder: 'test-group',
    channel: 'test-channel',
    ...overrides,
  };
}

/** 创建模拟定时任务 */
export function makeTask(overrides: Partial<ScheduledTask> = {}): ScheduledTask {
  return {
    id: `task-${_taskIdCounter++}`,
    name: '测试定时任务',
    cron_expression: '0 * * * *',
    interval_ms: null,
    next_run: Date.now() + 3600_000,
    last_run: null,
    is_active: 1,
    task_type: 'recurring',
    payload: null,
    ...overrides,
  };
}

/** 创建模拟 Session */
export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: `session-${Date.now()}`,
    channel: 'test-channel',
    chat_jid: 'test-group@g.us',
    agent_session_id: null,
    context: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/** 重置 ID 计数器（在 beforeEach 中调用） */
export function resetFactoryCounters(): void {
  _msgIdCounter = 1;
  _taskIdCounter = 1;
}
