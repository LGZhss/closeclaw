import { describe, it, expect } from 'vitest';
import { execAsync } from '../src/utils/utils.js';

describe('execAsync', () => {
  it('should parse standard unquoted tokens', async () => {
    const result = await execAsync('node -e "console.log(\'hello\')"');
    expect(result.stdout.trim()).toBe('hello');
  });

  it('should parse double quoted strings correctly', async () => {
    const result = await execAsync('node -e "console.log(\\"hello world\\")"');
    expect(result.stdout.trim()).toBe('hello world');
  });

  it('should parse single quoted strings correctly', async () => {
    const result = await execAsync("node -e 'console.log(\"single quotes\")'");
    expect(result.stdout.trim()).toBe('single quotes');
  });

  it('should parse explicitly empty strings properly', async () => {
    const result = await execAsync('node -e "console.log(process.argv[1] === \\"\\" ? \\"empty\\" : \\"not\\")" ""');
    expect(result.stdout.trim()).toBe('empty');
  });

  it('should process backslash escapes', async () => {
    // Escaping backslashes for node script needs multiple slashes
    // Node script to print esc\aped is console.log('esc\\aped')
    // We want the parsed argument to exactly match console.log('esc\\aped')
    // So the command is node -e "console.log('esc\\\\aped')"
    const result = await execAsync('node -e "console.log(\'esc\\\\\\\\aped\')"');
    expect(result.stdout.trim()).toBe('esc\\aped');
  });

  it('should reject empty command', async () => {
    await expect(execAsync('')).rejects.toThrow('Empty command');
  });
});
