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

// ---------------------------------------------------------------------------
// Regression suite: the fixer must never rewrite the inside of a string.
// Every case below corrupted user data with the old regex pipeline.
// ---------------------------------------------------------------------------

/** Turns a valid JSON document into an invalid one by appending a trailing comma. */
function withTrailingComma(validDoc: string): string {
  return `${validDoc.slice(0, -1)},${validDoc.slice(-1)}`;
}

const HAZARD_VALUES: Record<string, string> = {
  lineComment: 'a value with // inside it',
  blockOpen: 'src/*.js',
  blockClose: '*/ trailing',
  bothCommentMarkers: '/* not a comment */',
  url: 'https://example.com/a/b?x=1&y=2#frag',
  protocolRelative: '//cdn.example.com/lib.js',
  commaThenKey: 'text, key: value',
  colonThenWord: ': word,',
  brackets: '{ } [ ] {"nested":[1,2]}',
  escapedQuote: 'she said "hi" loudly',
  backslash: 'C:\\path\\to\\file',
  trailingBackslash: 'ends with a backslash \\',
  smartQuotes: '\u201Ccurly\u201D and \u2018single\u2019',
  pythonWords: 'True False None',
  apostrophe: "it's a 'quoted' word",
  newlineEscape: 'line1\nline2\ttabbed',
  unicodeEscape: 'snowman \u2603 and emoji \u{1f600}',
  emptyish: '',
};

describe('string literals survive a fix pass byte-identically', () => {
  for (const [name, value] of Object.entries(HAZARD_VALUES)) {
    it(`preserves a value containing ${name}`, () => {
      const valid = JSON.stringify({ v: value });
      const { fixed } = JSONFixer.tryFixJSONWithDetails(withTrailingComma(valid));
      expect(fixed).toBe(valid);
      expect(JSON.parse(fixed).v).toBe(value);
    });

    it(`preserves a key containing ${name}`, () => {
      const valid = JSON.stringify({ [value]: 1 });
      const { fixed } = JSONFixer.tryFixJSONWithDetails(withTrailingComma(valid));
      expect(fixed).toBe(valid);
      expect(JSON.parse(fixed)).toEqual({ [value]: 1 });
    });
  }

  it('preserves every hazard at once in one document', () => {
    const valid = JSON.stringify(HAZARD_VALUES);
    const result = JSONFixer.parseWithFixInfo(withTrailingComma(valid));
    expect(result.error).toBeUndefined();
    expect(result.wasFixed).toBe(true);
    expect(result.data).toEqual(HAZARD_VALUES);
  });

  it('preserves hazards nested in arrays and sub-objects', () => {
    const doc = {
      list: ['src/*.js', '// not a comment', 'https://x.dev'],
      nested: { 'a/*b': { 'c*/d': ['*/', '/*'] } },
    };
    const valid = JSON.stringify(doc);
    const result = JSONFixer.parseWithFixInfo(withTrailingComma(valid));
    expect(result.data).toEqual(doc);
  });
});

describe('reported corruption reproductions', () => {
  it('repairs a trailing comma without eating text between /* and */ in two strings', () => {
    const result = JSONFixer.parseWithFixInfo('{"glob": "src/*.js", "other": "*/x", "b": 1,}');
    expect(result.error).toBeUndefined();
    expect(result.wasFixed).toBe(true);
    expect(result.data).toEqual({ glob: 'src/*.js', other: '*/x', b: 1 });
  });

  it('repairs a trailing comma in a document containing a URL', () => {
    const result = JSONFixer.parseWithFixInfo('{"url":"https://example.com/a","b":1,}');
    expect(result.error).toBeUndefined();
    expect(result.wasFixed).toBe(true);
    expect(result.data).toEqual({ url: 'https://example.com/a', b: 1 });
  });

  it('does not flatten a nested array that starts with [[', () => {
    const result = JSONFixer.parseWithFixInfo('[[1,2],[3,4],]');
    expect(result.error).toBeUndefined();
    expect(result.data).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('does not treat a quote inside a string as a string boundary', () => {
    const result = JSONFixer.parseWithFixInfo('{"a":"say \\"hi\\"","b":2,}');
    expect(result.data).toEqual({ a: 'say "hi"', b: 2 });
  });
});

describe('valid scalars are returned untouched', () => {
  const scalars: Array<[string, unknown]> = [
    ['0', 0],
    ['false', false],
    ['null', null],
    ['""', ''],
    ['1e10', 1e10],
    ['-1.5e-3', -1.5e-3],
    ['"just a string"', 'just a string'],
    ['[]', []],
    ['{}', {}],
  ];

  it.each(scalars)('parses %s with wasFixed false', (input, expected) => {
    const result = JSONFixer.parseWithFixInfo(input);
    expect(result).toEqual({ data: expected, wasFixed: false });
  });

  it('parses -0 without marking it fixed', () => {
    const result = JSONFixer.parseWithFixInfo('-0');
    expect(result.wasFixed).toBe(false);
    expect(Object.is(result.data, -0)).toBe(true);
  });
});

describe('supported repairs', () => {
  it('strips a line comment containing quotes and comment markers', () => {
    const input = '{\n  "a": 1 // don\'t "quote" me /* ok */\n}';
    const result = JSONFixer.parseWithFixInfo(input);
    expect(result.data).toEqual({ a: 1 });
    expect(result.fixes).toContain('single-line comments');
  });

  it('strips a block comment that spans lines', () => {
    const result = JSONFixer.parseWithFixInfo('{/* one\ntwo */"a":1}');
    expect(result.data).toEqual({ a: 1 });
    expect(result.fixes).toContain('multi-line comments');
  });

  it('tolerates an unterminated block comment', () => {
    const result = JSONFixer.parseWithFixInfo('{"a":1 /* oops');
    expect(result.data).toEqual({ a: 1 });
  });

  it('removes trailing commas in arrays and nested objects', () => {
    const result = JSONFixer.parseWithFixInfo('{"a":[1,2,],"b":{"c":3,},}');
    expect(result.data).toEqual({ a: [1, 2], b: { c: 3 } });
    expect(result.fixes).toContain('trailing commas');
  });

  it('removes leading commas', () => {
    const result = JSONFixer.parseWithFixInfo('{,"a":1}');
    expect(result.data).toEqual({ a: 1 });
    expect(result.fixes).toContain('leading commas');
  });

  it('quotes unquoted keys and values', () => {
    const result = JSONFixer.parseWithFixInfo('{name: alice, age: 30, ok: true, tags: [a, b]}');
    expect(result.data).toEqual({ name: 'alice', age: 30, ok: true, tags: ['a', 'b'] });
    expect(result.fixes).toContain('unquoted property names');
    expect(result.fixes).toContain('unquoted string values');
  });

  it('converts single-quoted strings, escaping embedded double quotes', () => {
    const result = JSONFixer.parseWithFixInfo("{'msg': 'say \"hi\"', 'it': 'it\\'s'}");
    expect(result.data).toEqual({ msg: 'say "hi"', it: "it's" });
  });

  it('converts smart double quotes into string delimiters', () => {
    const result = JSONFixer.parseWithFixInfo('{\u201Ca\u201D: \u201Cb // c\u201D}');
    expect(result.data).toEqual({ a: 'b // c' });
    expect(result.fixes).toContain('smart double quotes');
  });

  it('converts smart single quotes into string delimiters', () => {
    const result = JSONFixer.parseWithFixInfo('{\u2018a\u2019: \u2018b\u2019}');
    expect(result.data).toEqual({ a: 'b' });
    expect(result.fixes).toContain('smart quotes');
  });

  it('converts Python literals into JSON literals', () => {
    const result = JSONFixer.parseWithFixInfo('{"a": True, "b": False, "c": None, "d": [True]}');
    expect(result.data).toEqual({ a: true, b: false, c: null, d: [true] });
  });

  it('keeps Python-looking words that are object keys as strings', () => {
    const result = JSONFixer.parseWithFixInfo('{True: 1,}');
    expect(result.data).toEqual({ True: 1 });
  });

  it('adds missing closing brackets of both kinds', () => {
    const result = JSONFixer.parseWithFixInfo('{"a":[1,2,{"b":3');
    expect(result.data).toEqual({ a: [1, 2, { b: 3 }] });
    expect(result.fixes?.some((f) => f.includes('closing bracket'))).toBe(true);
  });

  it('does not count brackets that live inside strings', () => {
    const result = JSONFixer.parseWithFixInfo('{"a":"{[(", "b":"]}",}');
    expect(result.data).toEqual({ a: '{[(', b: ']}' });
  });

  it('drops extra closing braces without leaving stray whitespace behind', () => {
    expect(JSONFixer.parseWithFixInfo('{"a":1}}').data).toEqual({ a: 1 });
    expect(JSONFixer.parseWithFixInfo('[1,2]]').data).toEqual([1, 2]);
    expect(JSONFixer.tryFixJSON('{"a":1}}')).toBe('{"a":1}');
    expect(JSONFixer.tryFixJSON('[1,2]]')).toBe('[1,2]');
  });

  it('collapses a doubled opening brace at the start', () => {
    const result = JSONFixer.parseWithFixInfo('{{"a":1}');
    expect(result.data).toEqual({ a: 1 });
  });

  it('adds a missing opening brace or bracket', () => {
    expect(JSONFixer.parseWithFixInfo('"a":1}').data).toEqual({ a: 1 });
    expect(JSONFixer.parseWithFixInfo('"a":1,"b":2').data).toEqual({ a: 1, b: 2 });
    expect(JSONFixer.parseWithFixInfo('1,2]').data).toEqual([1, 2]);
  });

  it('inserts missing commas between members', () => {
    const result = JSONFixer.parseWithFixInfo('{"a":1\n"b":2 "c":[1 2]}');
    expect(result.data).toEqual({ a: 1, b: 2, c: [1, 2] });
    expect(result.fixes).toContain('missing commas between properties');
  });

  it('closes an unterminated string at end of input', () => {
    const result = JSONFixer.parseWithFixInfo('{"a":"abc');
    expect(result.data).toEqual({ a: 'abc' });
  });

  it('repairs a realistic JS-object-literal blob in one pass', () => {
    const input = `{
      // config
      name: 'my-app',        /* the app */
      entry: "src/*.js",
      urls: ['https://a.dev//x', "//cdn.b.dev",],
      flags: { debug: True, verbose: False, extra: None, },
    }`;
    const result = JSONFixer.parseWithFixInfo(input);
    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({
      name: 'my-app',
      entry: 'src/*.js',
      urls: ['https://a.dev//x', '//cdn.b.dev'],
      flags: { debug: true, verbose: false, extra: null },
    });
  });
});

describe('unrepairable input reports an error instead of wrong data', () => {
  const broken: Array<[string, string]> = [
    ['garbage punctuation', '@@@'],
    ['prose with a brace', 'definitely not { json'],
    ['a bare hyphenated word', 'not-json'],
    ['a bare word', 'hello'],
    ['two top-level numbers', '1 2'],
    ['html', '<html><body>hi</body></html>'],
    ['three values for one key', '{"a": 1 2 3}'],
    ['NaN', '{"a": NaN}'],
    ['Infinity', '{"a": Infinity}'],
    ['undefined', '{"a": undefined}'],
    ['a raw newline inside a string', '{"a": "raw\nnewline in string"}'],
  ];

  it.each(broken)('reports %s as invalid', (_name, input) => {
    const result = JSONFixer.parseWithFixInfo(input);
    expect(result.data).toBeNull();
    expect(result.wasFixed).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('performance', () => {
  const PERF_BUDGET_MS = 500;

  function elapsed(fn: () => void): number {
    const start = performance.now();
    fn();
    return performance.now() - start;
  }

  // Sizing note: the regex this replaced was quadratic in the number of `/*`
  // occurrences (measured on this machine: 100KB 82ms, 200KB 328ms, 400KB
  // 1309ms, 800KB 5385ms — 4x per doubling). 400KB therefore blows the budget
  // on the old implementation while the single-pass scanner needs a few ms.
  it('handles ~400KB of unclosed /* inside string values quickly', () => {
    const chunk = '/* segment ';
    const payload = chunk.repeat(Math.ceil(400_000 / chunk.length));
    const input = `{"a":"${payload}","b":1,}`;
    let result: ReturnType<typeof JSONFixer.parseWithFixInfo> | undefined;
    const ms = elapsed(() => {
      result = JSONFixer.parseWithFixInfo(input);
    });
    expect(result?.data).toEqual({ a: payload, b: 1 });
    expect(ms).toBeLessThan(PERF_BUDGET_MS);
  });

  it('handles ~200KB of unclosed /* in code position quickly', () => {
    const chunk = '/* note ';
    const payload = chunk.repeat(Math.ceil(200_000 / chunk.length));
    const input = `{"a":1, ${payload}`;
    let result: ReturnType<typeof JSONFixer.parseWithFixInfo> | undefined;
    const ms = elapsed(() => {
      result = JSONFixer.parseWithFixInfo(input);
    });
    expect(result?.data).toEqual({ a: 1 });
    expect(ms).toBeLessThan(PERF_BUDGET_MS);
  });

  it('handles ~200KB of closed block comments in code position quickly', () => {
    const chunk = '/* c */ ';
    const count = Math.ceil(200_000 / (chunk.length + 12));
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      parts.push(`${chunk}"k${i}": ${i},`);
    }
    const input = `{${parts.join('')}}`;
    let result: ReturnType<typeof JSONFixer.parseWithFixInfo> | undefined;
    const ms = elapsed(() => {
      result = JSONFixer.parseWithFixInfo(input);
    });
    expect(result?.data?.k0).toBe(0);
    expect(ms).toBeLessThan(PERF_BUDGET_MS);
  });

  it('handles a large well-formed document quickly', () => {
    const rows = Array.from({ length: 5000 }, (_, i) => ({
      id: i,
      url: `https://example.com/item/${i}`,
      note: 'src/*.js // keep',
    }));
    const input = withTrailingComma(JSON.stringify({ rows }));
    let result: ReturnType<typeof JSONFixer.parseWithFixInfo> | undefined;
    const ms = elapsed(() => {
      result = JSONFixer.parseWithFixInfo(input);
    });
    expect(result?.data).toEqual({ rows });
    expect(ms).toBeLessThan(PERF_BUDGET_MS);
  });
});

describe('JSONFixer.fixMissingBracketsWithDetails', () => {
  it('appends the closers that are missing', () => {
    const { fixed, fixes } = JSONFixer.fixMissingBracketsWithDetails('{"a":[1,2');
    expect(fixed).toBe('{"a":[1,2]}');
    expect(fixes.length).toBeGreaterThan(0);
  });

  it('leaves balanced input alone', () => {
    expect(JSONFixer.fixMissingBracketsWithDetails('{"a":1}')).toEqual({
      fixed: '{"a":1}',
      fixes: [],
    });
  });

  it('ignores brackets inside string literals', () => {
    expect(JSONFixer.fixMissingBracketsWithDetails('{"a":"}"}')).toEqual({
      fixed: '{"a":"}"}',
      fixes: [],
    });
    expect(JSONFixer.fixMissingBracketsWithDetails('{"a":"{[("}')).toEqual({
      fixed: '{"a":"{[("}',
      fixes: [],
    });
  });

  it('ignores brackets inside comments', () => {
    expect(JSONFixer.fixMissingBrackets('{"a":1} // }')).toBe('{"a":1} // }');
  });

  it('does not add an opening brace because of a colon inside a string', () => {
    // The document is `["a\":b"]` — a one-element array whose string contains `":`.
    const input = '["a\\":b"]';
    expect(JSONFixer.fixMissingBrackets(input)).toBe(input);
  });
});

describe('JSONFixer.fixUnquotedValues', () => {
  it('quotes bare identifiers used as values', () => {
    const fixes: string[] = [];
    expect(JSONFixer.fixUnquotedValues('{"a": bar}', fixes)).toBe('{"a": "bar"}');
    expect(fixes).toContain('unquoted string values');
  });

  it('leaves JSON literals alone', () => {
    const fixes: string[] = [];
    expect(JSONFixer.fixUnquotedValues('{"a": true, "b": null}', fixes)).toBe(
      '{"a": true, "b": null}'
    );
    expect(fixes).toEqual([]);
  });

  it('never rewrites the inside of a string', () => {
    const fixes: string[] = [];
    const input = '{"a": ": word,", "b": "x, key: value"}';
    expect(JSONFixer.fixUnquotedValues(input, fixes)).toBe(input);
    expect(fixes).toEqual([]);
  });

  describe('structure-only garbage is not invented into a value', () => {
    // Regression: the stray-closer repair used to prepend an opener even when the
    // document had nothing in it, so Format replaced the user's text with a value
    // they never wrote — `}{` came back as `{}`, `}` as `{}`, `]` as `[]`.
    it.each(['}{', '}', ']', '{}}', '[]]', '}]', '  }  '])(
      'rejects %j instead of inventing an empty container',
      (input) => {
        const result = JSONFixer.parseWithFixInfo(input);
        expect(result.error).toBeDefined();
        expect(result.data).toBeNull();
      }
    );

    it('still repairs a missing opener when there IS content to rescue', () => {
      expect(JSONFixer.parseWithFixInfo('"a": 1}').data).toEqual({ a: 1 });
      expect(JSONFixer.parseWithFixInfo('1, 2]').data).toEqual([1, 2]);
    });
  });
});
