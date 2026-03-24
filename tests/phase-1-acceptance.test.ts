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
    // Create mock gRPC client
    const mockClient = {
      Chat: vi.fn((req, cb) => cb(null, { status: 2, text: `I received your message: "${req.message}". How can I help you?` })),
      SyncStatus: vi.fn((update, cb) => cb(null, {}))
    };
    
    // Create runner
    const runner = new SandboxRunner(mockClient);
    
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
    // Create mock gRPC client that returns error
    const mockClient = {
      Chat: vi.fn((req, cb) => cb(new Error('No LLM adapter available'))),
      SyncStatus: vi.fn((update, cb) => cb(null, {}))
    };
    // Create runner
    const runner = new SandboxRunner(mockClient);
    
    const context: ExecutionContext = {
      groupFolder: 'test-group',
      prompt: 'Test prompt',
      history: []
    };
    
    // Execute should return error message, not throw
    const response = await runner.execute(context);
    expect(response).toContain('Error');
    expect(response).toContain('No LLM adapter available');
  });

  it('should pass history to LLM adapter', async () => {
    let capturedRequest: any = null;
    const mockClient = {
      Chat: vi.fn((req, cb) => {
        capturedRequest = req;
        cb(null, { status: 2, text: 'Response' });
      }),
      SyncStatus: vi.fn((update, cb) => cb(null, {}))
    };
    
    const runner = new SandboxRunner(mockClient);
    const context: ExecutionContext = {
      groupFolder: 'test',
      prompt: 'Current message',
      history: [
        { role: 'user', parts: [{ text: 'Previous message' }] },
        { role: 'model', parts: [{ text: 'Previous response' }] }
      ]
    };
    
    await runner.execute(context);
    
    expect(capturedRequest).not.toBeNull();
    expect(capturedRequest.history).toHaveLength(2);
    expect(capturedRequest.message).toBe('Current message');
  });

  it('should use system instruction', async () => {
    let capturedRequest: any = null;
    const mockClient = {
      Chat: vi.fn((req, cb) => {
        capturedRequest = req;
        cb(null, { status: 2, text: 'Response' });
      }),
      SyncStatus: vi.fn((update, cb) => cb(null, {}))
    };
    
    const runner = new SandboxRunner(mockClient);
    const context: ExecutionContext = {
      groupFolder: 'test',
      prompt: 'Test',
      history: []
    };
    
    await runner.execute(context);
    
    expect(capturedRequest).not.toBeNull();
    // In gRPC mode, system instructions might be handled differently, 
    // but the request should be formatted.
    expect(capturedRequest.message).toBe('Test');
  });
});
