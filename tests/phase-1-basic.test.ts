import { describe, it, expect, beforeEach } from 'vitest';
import { registerAdapter, getAdapter, getRegisteredAdapterNames, clearRegistry } from '../src/adapters/registry.js';
import { LLMAdapter, ChatParams, ChatResponse } from '../src/adapters/base.js';
import { SandboxRunner } from '../src/agent/sandbox-runner.js';

// Mock LLM Adapter for testing
class MockAdapter extends LLMAdapter {
  async chat(params: ChatParams): Promise<ChatResponse> {
    return {
      text: `Mock response to: ${params.message}`,
      functionCall: undefined
    };
  }
}

describe('Phase 1: Agent Execution Chain', () => {
  beforeEach(() => {
    clearRegistry();
  });

  describe('Adapter Registry', () => {
    it('should register and retrieve adapters', () => {
      registerAdapter('mock', () => new MockAdapter());
      
      const adapter = getAdapter('mock');
      expect(adapter).toBeInstanceOf(MockAdapter);
    });

    it('should return null for non-existent adapters', () => {
      const adapter = getAdapter('nonexistent');
      expect(adapter).toBeNull();
    });

    it('should list registered adapter names', () => {
      registerAdapter('mock1', () => new MockAdapter());
      registerAdapter('mock2', () => new MockAdapter());
      
      const names = getRegisteredAdapterNames();
      expect(names).toContain('mock1');
      expect(names).toContain('mock2');
    });

    it('should create new instances on each getAdapter call', () => {
      registerAdapter('mock', () => new MockAdapter());
      
      const adapter1 = getAdapter('mock');
      const adapter2 = getAdapter('mock');
      
      expect(adapter1).not.toBe(adapter2);
    });
  });

  describe('SandboxRunner', () => {
    it('should execute with available adapter', async () => {
      registerAdapter('mock', () => new MockAdapter());
      
      const runner = new SandboxRunner('mock');
      const context = {
        groupFolder: 'test',
        prompt: 'Hello',
        channel: {} as any,
        history: []
      };
      
      const response = await runner.execute(context);
      expect(response).toContain('Mock response to: Hello');
    });

    it('should return error when adapter is not available', async () => {
      const runner = new SandboxRunner('nonexistent');
      const context = {
        groupFolder: 'test',
        prompt: 'Hello',
        channel: {} as any,
        history: []
      };
      
      const response = await runner.execute(context);
      expect(response).toContain('Error: No LLM adapter available');
    });

    it('should close without errors', async () => {
      registerAdapter('mock', () => new MockAdapter());
      
      const runner = new SandboxRunner('mock');
      await expect(runner.close()).resolves.toBeUndefined();
    });
  });
});
