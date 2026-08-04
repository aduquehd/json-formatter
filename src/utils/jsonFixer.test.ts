import { describe, expect, it } from 'vitest';
import { JSONFixer } from './jsonFixer';

describe('JSONFixer.parseWithFixInfo', () => {
  it('returns Empty input for blank strings', () => {
    expect(JSONFixer.parseWithFixInfo('')).toEqual({
      data: null,
      wasFixed: false,
      error: 'Empty input',
    });
    expect(JSONFixer.parseWithFixInfo('   ')).toMatchObject({
      data: null,
      wasFixed: false,
      error: 'Empty input',
    });
  });

  it('parses strict JSON without marking as fixed', () => {
    const result = JSONFixer.parseWithFixInfo('{"a":1,"b":true,"c":null}');
    expect(result).toEqual({
      data: { a: 1, b: true, c: null },
      wasFixed: false,
    });
  });

  it('fixes trailing commas', () => {
    const result = JSONFixer.parseWithFixInfo('{"a": 1, "b": 2,}');
    expect(result.wasFixed).toBe(true);
    expect(result.data).toEqual({ a: 1, b: 2 });
    expect(result.fixes).toContain('trailing commas');
  });

  it('fixes single quotes to double quotes', () => {
    const result = JSONFixer.parseWithFixInfo("{'name': 'value'}");
    expect(result.wasFixed).toBe(true);
    expect(result.data).toEqual({ name: 'value' });
    expect(result.fixes?.some((f) => f.includes('single quotes'))).toBe(true);
  });

  it('fixes unquoted property names (JS object literal style)', () => {
    const result = JSONFixer.parseWithFixInfo('{foo: 1, bar: 2}');
    expect(result.wasFixed).toBe(true);
    expect(result.data).toEqual({ foo: 1, bar: 2 });
    expect(result.fixes).toContain('unquoted property names');
  });

  it('strips single-line and multi-line comments', () => {
    const input = `{
      // a comment
      "a": 1, /* block */
      "b": 2
    }`;
    const result = JSONFixer.parseWithFixInfo(input);
    expect(result.wasFixed).toBe(true);
    expect(result.data).toEqual({ a: 1, b: 2 });
  });

  it('adds missing closing braces', () => {
    const result = JSONFixer.parseWithFixInfo('{"a":1');
    expect(result.wasFixed).toBe(true);
    expect(result.data).toEqual({ a: 1 });
    expect(result.fixes?.some((f) => f.includes('closing brace'))).toBe(true);
  });

  it('returns an error for unrecoverable input', () => {
    const result = JSONFixer.parseWithFixInfo('definitely not { json');
    expect(result.data).toBeNull();
    expect(result.wasFixed).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('JSONFixer.tryFixJSONWithDetails', () => {
  it('accepts JSON with a leading BOM (trimmed away by String#trim)', () => {
    // U+FEFF is WhiteSpace, so trim() strips it before the explicit BOM branch.
    // The important behaviour: BOM-prefixed input still parses cleanly.
    const withBom = `\uFEFF{"ok":true}`;
    const result = JSONFixer.parseWithFixInfo(withBom);
    expect(result.data).toEqual({ ok: true });
    expect(result.error).toBeUndefined();
  });

  it('normalizes smart quotes', () => {
    const input = `{\u201Chello\u201D: \u201Cworld\u201D}`;
    const { fixed, fixes } = JSONFixer.tryFixJSONWithDetails(input);
    expect(fixes).toContain('smart double quotes');
    expect(JSON.parse(fixed)).toEqual({ hello: 'world' });
  });

  it('collapses multiple consecutive commas', () => {
    const { fixed, fixes } = JSONFixer.tryFixJSONWithDetails('{"a":1,,,"b":2}');
    expect(fixes).toContain('multiple consecutive commas');
    expect(JSON.parse(fixed)).toEqual({ a: 1, b: 2 });
  });
});

describe('JSONFixer.parseWithFix', () => {
  it('returns parsed data for valid JSON', () => {
    expect(JSONFixer.parseWithFix('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('returns parsed data after applying fixes', () => {
    expect(JSONFixer.parseWithFix('{a:1,}')).toEqual({ a: 1 });
  });

  it('throws the original parse error when fix fails', () => {
    expect(() => JSONFixer.parseWithFix('@@@')).toThrow();
  });
});
