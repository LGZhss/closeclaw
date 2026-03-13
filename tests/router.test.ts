import { describe, it, expect } from 'vitest';
import { escapeXml } from '../src/router.js';

describe('escapeXml', () => {
  it('should return empty string for falsy input', () => {
    expect(escapeXml('')).toBe('');
    expect(escapeXml(null as any)).toBe('');
    expect(escapeXml(undefined as any)).toBe('');
  });

  it('should return the original string if no special characters are present', () => {
    const input = 'Hello World 123';
    expect(escapeXml(input)).toBe(input);
  });

  it('should escape & correctly', () => {
    expect(escapeXml('Mac & Cheese')).toBe('Mac &amp; Cheese');
  });

  it('should escape < and > correctly', () => {
    expect(escapeXml('<html>')).toBe('&lt;html&gt;');
  });

  it('should escape " correctly', () => {
    expect(escapeXml('"Hello"')).toBe('&quot;Hello&quot;');
  });

  it('should escape multiple occurrences of the same character', () => {
    expect(escapeXml('A & B & C')).toBe('A &amp; B &amp; C');
    expect(escapeXml('<tag></tag>')).toBe('&lt;tag&gt;&lt;/tag&gt;');
    expect(escapeXml('"""""')).toBe('&quot;&quot;&quot;&quot;&quot;');
  });

  it('should escape a mix of special characters', () => {
    const input = '<div class="content">Me & You</div>';
    const expected = '&lt;div class=&quot;content&quot;&gt;Me &amp; You&lt;/div&gt;';
    expect(escapeXml(input)).toBe(expected);
  });
});
