import { describe, it, expect, vi } from 'vitest';
import { TRIGGER_PATTERN } from '../src/config.js';

describe('Config', () => {
  it('should have correct trigger pattern', () => {
    const testMessages = [
      { text: '@Andy hello', shouldMatch: true },
      { text: '@andy help', shouldMatch: true },
      { text: '@ANDY test', shouldMatch: true },
      { text: 'Hey @Andy', shouldMatch: false },
      { text: 'What\'s up?', shouldMatch: false },
      { text: '@AndyBot hello', shouldMatch: false },
    ];

    for (const { text, shouldMatch } of testMessages) {
      const matches = TRIGGER_PATTERN.test(text);
      expect(matches).toBe(shouldMatch);
    }
  });

  it('should reject invalid MAX_CONCURRENT_CONTAINERS at startup', async () => {
    const original = process.env.MAX_CONCURRENT_CONTAINERS;
    process.env.MAX_CONCURRENT_CONTAINERS = '0';
    vi.resetModules();

    await expect(import('../src/config.js')).rejects.toThrow();

    if (original === undefined) {
      delete process.env.MAX_CONCURRENT_CONTAINERS;
    } else {
      process.env.MAX_CONCURRENT_CONTAINERS = original;
    }
    vi.resetModules();
  });
});
