import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerAdapter, clearRegistry } from '../src/adapters/registry.js';
import { LLMAdapter, ChatParams, ChatResponse } from '../src/adapters/base.js';
import { SandboxRunner } from '../src/agent/sandbox-runner.js';
import { ExecutionContext } from '../src/agent/runner.js';

// Mock LLM Adapter that simulates real LLM behavior
class TestLLMAdapter extends LLMAdapter {
  async chat(params: ChatParams): Promise<ChatResponse> {
    // Simulate processing the prompt
    const prompt = typeof params.message === 'string' 
      ? params.message 
      : params.message.map(p => p.text).join('\n');
    
    return {
      text: `I received your message: "${prompt}". How can I help you?`,
      functionCall: undefined
    };
  }
}

describe('Phase 1: End-to-End Acceptance Tests', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('should process a message through the complete chain', async () => {
    // Setup: Register test adapter
    registerAdapter('test', () => new TestLLMAdapter());
    
    // Create runner
    const runner = new SandboxRunner('test');
    
    // Create mock channel
    const mockChannel = {
      name: 'test-channel',
      sendMessage: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      isConnected: vi.fn(() => true),
      ownsJid: vi.fn(() => true)
    };
    
    // Build execution context
    const context: ExecutionContext = {
      groupFolder: 'test-group',
      prompt: 'Hello, can you help me?',
      channel: mockChannel as any,
      history: []
    };
    
    // Execute
    const response = await runner.execute(context);
    
    // Verify response
    expect(response).toContain('I received your message');
    expect(response).toContain('Hello, can you help me?');
    
    // Cleanup
    await runner.close();
  });

  it('should handle errors gracefully', async () => {
    // Create runner with non-existent adapter
    const runner = new SandboxRunner('nonexistent');
    
    const context: ExecutionContext = {
      groupFolder: 'test-group',
      prompt: 'Test prompt',
      channel: {} as any,
      history: []
    };
    
    // Execute should return error message, not throw
    const response = await runner.execute(context);
    expect(response).toContain('Error');
    expect(response).toContain('No LLM adapter available');
  });

  it('should pass history to LLM adapter', async () => {
    let capturedParams: ChatParams | null = null;
    
    class HistoryCapturingAdapter extends LLMAdapter {
      async chat(params: ChatParams): Promise<ChatResponse> {
        capturedParams = params;
        return { text: 'Response' };
      }
    }
    
    registerAdapter('history-test', () => new HistoryCapturingAdapter());
    
    const runner = new SandboxRunner('history-test');
    const context: ExecutionContext = {
      groupFolder: 'test',
      prompt: 'Current message',
      channel: {} as any,
      history: [
        { role: 'user', parts: [{ text: 'Previous message' }] },
        { role: 'model', parts: [{ text: 'Previous response' }] }
      ]
    };
    
    await runner.execute(context);
    
    expect(capturedParams).not.toBeNull();
    expect(capturedParams!.history).toHaveLength(2);
    expect(capturedParams!.message).toBe('Current message');
  });

  it('should use system instruction', async () => {
    let capturedParams: ChatParams | null = null;
    
    class InstructionCapturingAdapter extends LLMAdapter {
      async chat(params: ChatParams): Promise<ChatResponse> {
        capturedParams = params;
        return { text: 'Response' };
      }
    }
    
    registerAdapter('instruction-test', () => new InstructionCapturingAdapter());
    
    const runner = new SandboxRunner('instruction-test');
    const context: ExecutionContext = {
      groupFolder: 'test',
      prompt: 'Test',
      channel: {} as any,
      history: []
    };
    
    await runner.execute(context);
    
    expect(capturedParams).not.toBeNull();
    expect(capturedParams!.systemInstruction).toBe('You are a helpful assistant.');
  });
});
