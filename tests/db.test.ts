import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('better-sqlite3', async () => {
  const actual = await vi.importActual<any>('better-sqlite3');
  return {
    default: function(file: string, options: any) {
      return new actual.default(':memory:', options);
    }
  };
});

import { db } from '../src/db.js';

describe('db', () => {
  beforeEach(() => {
    // Clear the tables before each test
    const tables = ['messages', 'registered_groups', 'scheduled_tasks', 'task_run_logs', 'sessions', 'router_state'];
    for (const table of tables) {
      try {
        db.exec(`DELETE FROM ${table}`);
      } catch (e) {
        // Table might not exist yet if initializeDatabase hasn't run
      }
    }
  });

  it('should create in-memory db', () => {
    expect(db.memory).toBe(true);
  });
});

import {
  insertMessage,
  getUnprocessedMessages,
  markMessagesProcessed,
  getMessagesSince,
  setRegisteredGroup,
  getRegisteredGroup,
  getRegisteredGroupByFolder,
  getAllRegisteredGroups,
  deleteRegisteredGroup,
  getMainGroup,
  insertTask,
  getDueTasks,
  updateTaskNextRun,
  getTasksByGroup,
  getAllTasks,
  getTask,
  updateTask,
  deleteTask,
  insertTaskLog,
  getTaskLogs,
  setSession,
  getSession,
  setRouterState,
  getRouterState
} from '../src/db.js';

describe('Message operations', () => {
  it('should insert and retrieve unprocessed messages', () => {
    const msgId1 = insertMessage({
      channel: 'test_channel',
      chat_jid: 'chat1',
      sender_jid: 'sender1',
      sender_name: 'Sender 1',
      text: 'Hello',
      timestamp: 1000,
      is_group: false,
      processed: false
    });

    const msgId2 = insertMessage({
      channel: 'test_channel',
      chat_jid: 'chat1',
      sender_jid: 'sender2',
      sender_name: 'Sender 2',
      text: 'World',
      timestamp: 2000,
      is_group: false,
      processed: false
    });

    expect(msgId1).toBeGreaterThan(0);
    expect(msgId2).toBeGreaterThan(msgId1);

    const unprocessed = getUnprocessedMessages(10);
    expect(unprocessed).toHaveLength(2);
    expect(unprocessed[0].text).toBe('Hello');
    expect(unprocessed[1].text).toBe('World');

    markMessagesProcessed([msgId1]);
    const unprocessedAfter = getUnprocessedMessages(10);
    expect(unprocessedAfter).toHaveLength(1);
    expect(unprocessedAfter[0].id).toBe(msgId2);
  });

  it('should handle getMessagesSince correctly', () => {
    // Setup group first
    setRegisteredGroup('group1', {
      jid: 'group1',
      name: 'Group 1',
      folder: 'folder1',
      channel: 'chan',
      isMain: false,
      added_at: new Date().toISOString()
    });

    const msgId1 = insertMessage({
      channel: 'chan',
      chat_jid: 'group1',
      sender_jid: 'sender1',
      sender_name: 'Sender 1',
      text: 'Message 1',
      timestamp: 1000,
      is_group: true,
      processed: true
    });

    const msgId2 = insertMessage({
      channel: 'chan',
      chat_jid: 'group1',
      sender_jid: 'sender2',
      sender_name: 'Sender 2',
      text: 'Message 2',
      timestamp: 2000,
      is_group: true,
      processed: true
    });

    const msgs = getMessagesSince('folder1', msgId1);
    expect(msgs).toHaveLength(1);
    expect(msgs[0].id).toBe(msgId2);
  });
});

describe('Registered group operations', () => {
  it('should insert, update, retrieve and delete registered groups', () => {
    const addedAt = new Date().toISOString();

    // Insert
    setRegisteredGroup('jid1', {
      jid: 'jid1',
      name: 'Test Group',
      folder: 'test_folder',
      channel: 'test_channel',
      isMain: true,
      added_at: addedAt,
      containerConfig: { env: { FOO: 'bar' } }
    });

    // Retrieve by jid
    let group = getRegisteredGroup('jid1');
    expect(group).not.toBeNull();
    expect(group?.name).toBe('Test Group');
    expect(group?.isMain).toBe(true);
    expect(group?.container_config?.env?.FOO).toBe('bar');

    // Retrieve by folder
    group = getRegisteredGroupByFolder('test_folder');
    expect(group).not.toBeNull();
    expect(group?.jid).toBe('jid1');

    // Update
    setRegisteredGroup('jid1', {
      jid: 'jid1',
      name: 'Updated Group',
      folder: 'test_folder',
      channel: 'test_channel',
      isMain: false,
      added_at: addedAt,
      trigger: '!'
    });

    group = getRegisteredGroup('jid1');
    expect(group?.name).toBe('Updated Group');
    expect(group?.isMain).toBe(false);
    expect(group?.trigger).toBe('!');

    // Retrieve Main Group
    expect(getMainGroup()).toBeNull(); // it was changed to false

    setRegisteredGroup('jid2', {
      jid: 'jid2',
      name: 'Main Group',
      folder: 'main_folder',
      channel: 'test_channel',
      isMain: true,
      added_at: addedAt
    });

    const mainGroup = getMainGroup();
    expect(mainGroup?.jid).toBe('jid2');

    // Get all
    const allGroups = getAllRegisteredGroups();
    expect(allGroups.length).toBeGreaterThanOrEqual(2);

    // Delete
    deleteRegisteredGroup('jid1');
    expect(getRegisteredGroup('jid1')).toBeNull();
  });
});

describe('Scheduled task operations', () => {
  it('should handle CRUD for tasks and task logs', () => {
    // Need a group for foreign key constraint
    setRegisteredGroup('task_group', {
      jid: 'task_group',
      name: 'Task Group',
      folder: 'task_folder',
      channel: 'test',
      isMain: false,
      added_at: new Date().toISOString()
    });

    const now = new Date().toISOString();

    // Insert
    const taskId = insertTask({
      group_folder: 'task_folder',
      prompt: 'Test prompt',
      schedule_type: 'cron',
      schedule_value: '* * * * *',
      is_paused: false,
      created_at: now,
      next_run_at: now
    });

    expect(taskId).toBeGreaterThan(0);

    // Get
    let task = getTask(taskId);
    expect(task).not.toBeNull();
    expect(task?.prompt).toBe('Test prompt');
    expect(task?.is_paused).toBe(false);

    // Get by group / Get all
    expect(getTasksByGroup('task_folder')).toHaveLength(1);
    expect(getAllTasks()).toHaveLength(1);

    // Update
    updateTask(taskId, { prompt: 'Updated prompt', is_paused: true });
    task = getTask(taskId);
    expect(task?.prompt).toBe('Updated prompt');
    expect(task?.is_paused).toBe(true);

    // Due tasks
    expect(getDueTasks(new Date())).toHaveLength(0); // Because it is paused

    updateTask(taskId, { is_paused: false });
    expect(getDueTasks(new Date())).toHaveLength(1);

    // Update next run
    const futureDate = new Date(Date.now() + 100000).toISOString();
    updateTaskNextRun(taskId, futureDate);
    task = getTask(taskId);
    expect(task?.next_run_at).toBe(futureDate);

    // Logs
    const logId = insertTaskLog({
      task_id: taskId,
      started_at: now,
      completed_at: now,
      result: 'Success',
    });
    expect(logId).toBeGreaterThan(0);

    const logs = getTaskLogs(taskId);
    expect(logs).toHaveLength(1);
    expect(logs[0].result).toBe('Success');

    // Delete
    deleteTask(taskId);
    expect(getTask(taskId)).toBeNull();
  });
});

describe('State operations', () => {
  it('should handle sessions', () => {
    setSession('group_folder', 'session_123');
    let session = getSession('group_folder');
    expect(session).not.toBeNull();
    expect(session?.session_id).toBe('session_123');

    setSession('group_folder', 'session_456');
    session = getSession('group_folder');
    expect(session?.session_id).toBe('session_456');
  });

  it('should handle router state', () => {
    setRouterState('group_folder', 10);
    let state = getRouterState('group_folder');
    expect(state).not.toBeNull();
    expect(state?.last_agent_message_id).toBe(10);

    setRouterState('group_folder', 20);
    state = getRouterState('group_folder');
    expect(state?.last_agent_message_id).toBe(20);
  });
});
