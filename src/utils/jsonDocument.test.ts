import { describe, expect, it } from 'vitest';
import {
  describeDocumentSize,
  documentStatus,
  formatBytes,
  isBlankDocument,
  isParseSuccess,
  LARGE_DOCUMENT_CHARS,
  MAX_DOCUMENT_CHARS,
  measureDocument,
  parseJsonStrict,
  sortObjectKeysDeep,
} from './jsonDocument';
import { MAX_JSON_DEPTH, nestDeeply, runDepthGuarded } from './jsonWalk';

describe('parseJsonStrict', () => {
  it('accepts falsy scalars as valid documents', () => {
    // The workbench used to decide validity from the parsed value, so every one
    // of these perfectly valid documents was reported as "Invalid JSON format".
    expect(parseJsonStrict('0')).toEqual({ isValid: true, data: 0 });
    expect(parseJsonStrict('false')).toEqual({ isValid: true, data: false });
    expect(parseJsonStrict('null')).toEqual({ isValid: true, data: null });
    expect(parseJsonStrict('""')).toEqual({ isValid: true, data: '' });
  });

  it('parses objects and arrays', () => {
    expect(parseJsonStrict('{"a":1}')).toEqual({ isValid: true, data: { a: 1 } });
    expect(parseJsonStrict('[1,2]')).toEqual({ isValid: true, data: [1, 2] });
  });

  it('treats empty and whitespace-only input as invalid, not as a parse crash', () => {
    expect(parseJsonStrict('')).toEqual({ isValid: false, data: null, error: 'Empty input' });
    expect(parseJsonStrict('  \n\t ')).toEqual({
      isValid: false,
      data: null,
      error: 'Empty input',
    });
  });

  it('reports invalid input with the parser message and does NOT repair it', () => {
    // Pins the hot path: repairable-but-invalid input stays invalid here. The
    // repair pipeline is reserved for explicit actions (Format / Paste / Open).
    const unquotedKeys = parseJsonStrict('{a: 1}');
    expect(unquotedKeys.isValid).toBe(false);
    expect(unquotedKeys.data).toBeNull();
    expect(unquotedKeys.error).toBeTruthy();

    expect(parseJsonStrict('{"a":1,}').isValid).toBe(false);
    expect(parseJsonStrict('not json').isValid).toBe(false);
  });
});

describe('isParseSuccess', () => {
  it('is decided by the error, not by the truthiness of the value', () => {
    expect(isParseSuccess({ error: undefined })).toBe(true);
    expect(isParseSuccess({ error: 'Unexpected token' })).toBe(false);
  });

  it('treats falsy parsed values as successes', () => {
    // Shape mirrors JSONFixer.parseWithFixInfo's result.
    for (const data of [0, false, null, '', Number.NaN]) {
      expect(isParseSuccess({ data, wasFixed: false } as { data: unknown; error?: string })).toBe(
        true
      );
    }
  });

  it('treats a failed parse as a failure even though data is null in both cases', () => {
    expect(
      isParseSuccess({ data: null, wasFixed: false } as { data: unknown; error?: string })
    ).toBe(true);
    expect(
      isParseSuccess({ data: null, wasFixed: false, error: 'Invalid JSON' } as {
        data: unknown;
        error?: string;
      })
    ).toBe(false);
  });
});

describe('documentStatus', () => {
  it('reports an empty or whitespace-only document as empty, never invalid', () => {
    expect(documentStatus('', false)).toBe('empty');
    expect(documentStatus('   ', false)).toBe('empty');
    expect(documentStatus('\n\t ', true)).toBe('empty');
  });

  it('reports the valid document "null" as valid', () => {
    // The old status bar inferred validity as `json !== null && json !== undefined`,
    // which marked the valid document `null` invalid.
    expect(documentStatus('null', true)).toBe('valid');
    expect(documentStatus('0', true)).toBe('valid');
    expect(documentStatus('false', true)).toBe('valid');
    expect(documentStatus('""', true)).toBe('valid');
  });

  it('reports unparsed content as invalid', () => {
    expect(documentStatus('{"a":', false)).toBe('invalid');
  });
});

describe('isBlankDocument', () => {
  it('detects blank documents', () => {
    expect(isBlankDocument('')).toBe(true);
    expect(isBlankDocument('   ')).toBe(true);
    expect(isBlankDocument('\n\r\t ')).toBe(true);
  });

  it('detects non-blank documents', () => {
    expect(isBlankDocument('0')).toBe(false);
    expect(isBlankDocument('  {}  ')).toBe(false);
  });

  it('agrees with trim() on a large document without allocating a copy', () => {
    const big = `${' '.repeat(100_000)}{"a":1}${' '.repeat(100_000)}`;
    expect(isBlankDocument(big)).toBe(big.trim() === '');
    expect(isBlankDocument(' '.repeat(100_000))).toBe(true);
  });
});

describe('sortObjectKeysDeep', () => {
  it('sorts keys A→Z', () => {
    expect(Object.keys(sortObjectKeysDeep({ c: 1, a: 2, b: 3 }))).toEqual(['a', 'b', 'c']);
  });

  it('sorts nested objects', () => {
    const sorted = sortObjectKeysDeep({ b: { z: 1, y: { d: 1, c: 2 } }, a: 1 });
    expect(JSON.stringify(sorted)).toBe('{"a":1,"b":{"y":{"c":2,"d":1},"z":1}}');
  });

  it('keeps array order but sorts objects inside arrays', () => {
    const sorted = sortObjectKeysDeep({ list: [{ b: 1, a: 2 }, { d: 3, c: 4 }, 'z', 'a'] });
    expect(JSON.stringify(sorted)).toBe('{"list":[{"a":2,"b":1},{"c":4,"d":3},"z","a"]}');
  });

  it('keeps a member literally named __proto__ instead of dropping it', () => {
    // Plain `acc[key] = …` assignment invokes the inherited __proto__ setter:
    // the member vanishes from the output and the prototype is replaced by the
    // user's data. Verified failing input: {"__proto__":{"polluted":true},"a":2}
    // used to sort to {"a":2}.
    const input = JSON.parse('{"__proto__": {"polluted": true}, "a": 2}');
    const sorted = sortObjectKeysDeep(input) as Record<string, unknown>;

    expect(Object.keys(sorted)).toEqual(['__proto__', 'a']);
    expect(Object.getPrototypeOf(sorted)).toBe(Object.prototype);
    expect(JSON.stringify(sorted)).toBe('{"__proto__":{"polluted":true},"a":2}');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('keeps a nested member named __proto__', () => {
    const input = JSON.parse('{"outer": {"z": 1, "__proto__": {"polluted": true}}}');
    expect(JSON.stringify(sortObjectKeysDeep(input))).toBe(
      '{"outer":{"__proto__":{"polluted":true},"z":1}}'
    );
  });

  it('keeps other prototype-shadowing member names', () => {
    const input = JSON.parse('{"toString": 1, "constructor": 2, "hasOwnProperty": 3, "a": 4}');
    const sorted = sortObjectKeysDeep(input) as Record<string, unknown>;
    expect(Object.keys(sorted)).toEqual(['a', 'constructor', 'hasOwnProperty', 'toString']);
    expect(sorted.constructor).toBe(2);
  });

  it('passes primitives and null through unchanged', () => {
    expect(sortObjectKeysDeep(null)).toBeNull();
    expect(sortObjectKeysDeep(0)).toBe(0);
    expect(sortObjectKeysDeep(false)).toBe(false);
    expect(sortObjectKeysDeep('')).toBe('');
    expect(sortObjectKeysDeep([])).toEqual([]);
    expect(sortObjectKeysDeep({})).toEqual({});
  });

  it('does not mutate its input', () => {
    const input = { b: 1, a: { d: 2, c: 3 } };
    const sorted = sortObjectKeysDeep(input);
    expect(Object.keys(input)).toEqual(['b', 'a']);
    expect(sorted).not.toBe(input);
  });
});

describe('measureDocument', () => {
  const cases: string[] = [
    '',
    '{}',
    '{"a":1}\n',
    'line1\nline2\nline3',
    '\n\n\n',
    '{"name":"café"}',
    '{"emoji":"🚀 build"}',
    'a\ud800b', // lone high surrogate
    'a\udc00b', // lone low surrogate
    '\ud83d', // trailing lone high surrogate
    '日本語テキスト\nsecond line',
    '  x',
  ];

  it('matches TextEncoder byte length and split() line count exactly', () => {
    const encoder = new TextEncoder();
    for (const sample of cases) {
      const { bytes, lines } = measureDocument(sample);
      expect(bytes, `bytes for ${JSON.stringify(sample)}`).toBe(encoder.encode(sample).length);
      expect(lines, `lines for ${JSON.stringify(sample)}`).toBe(sample.split('\n').length);
    }
  });

  it('matches on a realistic multi-line document', () => {
    const doc = JSON.stringify(
      { users: [{ name: 'José', tag: '🚀' }, { name: 'Ann' }], total: 2 },
      null,
      2
    );
    expect(measureDocument(doc)).toEqual({
      bytes: new TextEncoder().encode(doc).length,
      lines: doc.split('\n').length,
    });
  });

  it('counts lines as newlines + 1', () => {
    expect(measureDocument('a').lines).toBe(1);
    expect(measureDocument('a\n').lines).toBe(2);
    expect(measureDocument('a\nb').lines).toBe(2);
  });
});

describe('describeDocumentSize', () => {
  it('buckets by length', () => {
    expect(describeDocumentSize(0)).toBe('normal');
    expect(describeDocumentSize(LARGE_DOCUMENT_CHARS)).toBe('normal');
    expect(describeDocumentSize(LARGE_DOCUMENT_CHARS + 1)).toBe('large');
    expect(describeDocumentSize(MAX_DOCUMENT_CHARS)).toBe('large');
    expect(describeDocumentSize(MAX_DOCUMENT_CHARS + 1)).toBe('over-max');
  });
});

describe('formatBytes', () => {
  it('scales the unit', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
  });
});

describe('sortObjectKeysDeep - depth guard', () => {
  it('reports a 100,000-level document instead of throwing RangeError', () => {
    expect(runDepthGuarded(() => sortObjectKeysDeep(nestDeeply(100_000, 'object')))).toEqual({
      ok: false,
      reason: 'too-deep',
      limit: MAX_JSON_DEPTH,
    });
  });

  it('sorts a document that sits exactly on the limit', () => {
    expect(runDepthGuarded(() => sortObjectKeysDeep(nestDeeply(MAX_JSON_DEPTH, 'object'))).ok).toBe(
      true
    );
  });

  it('counts nesting, not array position', () => {
    const wide = Array.from({ length: MAX_JSON_DEPTH * 3 }, (_, i) => ({ b: i, a: i }));
    expect(Object.keys(sortObjectKeysDeep(wide)[MAX_JSON_DEPTH * 2])).toEqual(['a', 'b']);
  });

  it('does not change results for ordinary data', () => {
    expect(sortObjectKeysDeep({ b: 1, a: { d: 2, c: 3 } })).toEqual({ a: { c: 3, d: 2 }, b: 1 });
    expect(JSON.stringify(sortObjectKeysDeep({ b: 1, a: { d: 2, c: 3 } }))).toBe(
      '{"a":{"c":3,"d":2},"b":1}'
    );
  });
});
