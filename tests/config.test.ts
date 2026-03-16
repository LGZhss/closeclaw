import { describe, it, expect } from 'vitest';
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
});
