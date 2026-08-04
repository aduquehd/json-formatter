import { describe, expect, it } from 'vitest';
import { compactJSON, formatJSON, isValidJSON } from './jsonUtils';

describe('formatJSON', () => {
  it('returns empty string for empty or whitespace input', () => {
    expect(formatJSON('')).toBe('');
    expect(formatJSON('   \n\t  ')).toBe('');
  });

  it('pretty-prints valid minified JSON with 2-space indent', () => {
    expect(formatJSON('{"a":1,"b":[2,3]}')).toBe(`{
  "a": 1,
  "b": [
    2,
    3
  ]
}`);
  });

  it('auto-fixes trailing commas and formats the result', () => {
    expect(formatJSON('{"a": 1,}')).toBe(`{
  "a": 1
}`);
  });

  it('throws on unfixable input', () => {
    expect(() => formatJSON('{not json at all!!!')).toThrow(/Invalid JSON|JSON/i);
  });
});

describe('compactJSON', () => {
  it('returns empty string for empty input', () => {
    expect(compactJSON('')).toBe('');
    expect(compactJSON('  ')).toBe('');
  });

  it('minifies pretty-printed JSON', () => {
    const pretty = `{
  "hello": "world",
  "n": 42
}`;
    expect(compactJSON(pretty)).toBe('{"hello":"world","n":42}');
  });

  it('auto-fixes then minifies', () => {
    expect(compactJSON("{name: 'alice',}")).toBe('{"name":"alice"}');
  });

  it('throws on unfixable input', () => {
    // Pure non-JSON text that no heuristic can turn into a value.
    expect(() => compactJSON('@@@ not json @@@')).toThrow();
  });
});

describe('isValidJSON', () => {
  it('returns false for empty input', () => {
    expect(isValidJSON('')).toBe(false);
    expect(isValidJSON('   ')).toBe(false);
  });

  it('returns true for strict valid JSON', () => {
    expect(isValidJSON('{"ok":true}')).toBe(true);
    expect(isValidJSON('[1,2,null]')).toBe(true);
    expect(isValidJSON('"string"')).toBe(true);
    expect(isValidJSON('42')).toBe(true);
  });

  it('returns true when auto-fix can recover the document', () => {
    // Trailing comma is invalid JSON but JSONFixer recovers it.
    expect(isValidJSON('{"a":1,}')).toBe(true);
    // A lone `{` is closed into `{}` by the missing-bracket fixer.
    expect(isValidJSON('{')).toBe(true);
  });

  it('returns false for unrecoverable garbage', () => {
    expect(isValidJSON('not-json')).toBe(false);
    expect(isValidJSON('@@@')).toBe(false);
  });
});
