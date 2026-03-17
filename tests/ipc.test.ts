import { describe, it, expect } from 'vitest';
import { ipc } from '../src/ipc.js';

describe('IPC', () => {
  it('should send messages', () => {
    const result = ipc.sendMessage({
      type: 'test',
      data: { test: 'data' },
      target: 'test-target'
    });
    expect(result).toBe(true);
  });

  it('should register listeners', () => {
    let receivedMessage: any = null;
    ipc.on('test', (message) => {
      receivedMessage = message;
    });
    ipc.sendMessage({
      type: 'test',
      data: { test: 'data' },
      target: 'test-target'
    });
    expect(receivedMessage).toBeTruthy();
  });
});