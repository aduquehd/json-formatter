import { describe, expect, it } from 'vitest';
import {
  classifyNumberLiteral,
  DEFAULT_LOSSY_CHANGE_LIMIT,
  describeLossyScan,
  type ExactDecimal,
  exactDecimal,
  LOSSY_KIND_TEXT,
  type LossyChangeKind,
  sameExactValue,
  scanLossyRewrites,
} from './jsonLossy';

/** Kinds found in a document, in first-seen order. */
const kindsOf = (source: string): LossyChangeKind[] => scanLossyRewrites(source).kinds;

/** The English rendering of a scan, as the toast would show it. */
const describe_ = (source: string): string | null =>
  describeLossyScan(scanLossyRewrites(source), (_key, fallback) => fallback);

/**
 * The exact integer `JSON.stringify` emits for an integer literal, as a BigInt.
 *
 * Deliberately hand-rolled here rather than imported: an oracle that shares code
 * with the thing it checks proves nothing. `JSON.stringify` switches to
 * exponential notation at 1e21, so `1e+23` is expanded back to digits.
 */
function emittedInteger(literal: string): bigint {
  const emitted = JSON.stringify(Number(literal));
  const [mantissa, exponent] = emitted.split('e');
  if (exponent === undefined) return BigInt(mantissa);
  const [whole, fraction = ''] = mantissa.split('.');
  return BigInt(whole + fraction + '0'.repeat(Number(exponent) - fraction.length));
}

describe('exactDecimal', () => {
  it('normalises equal values to identical representations', () => {
    expect(exactDecimal('1')).toEqual(exactDecimal('1.0'));
    expect(exactDecimal('1')).toEqual(exactDecimal('1.000'));
    expect(exactDecimal('1250')).toEqual(exactDecimal('1.25e3'));
    expect(exactDecimal('1250')).toEqual(exactDecimal('12500e-1'));
    expect(exactDecimal('0')).toEqual(exactDecimal('0.000'));
  });

  it('keeps the significand free of leading and trailing zeros', () => {
    expect(exactDecimal('12300')).toEqual({ negative: false, digits: '123', exponent: 2 });
    expect(exactDecimal('0.00450')).toEqual({ negative: false, digits: '45', exponent: -4 });
    expect(exactDecimal('-7')).toEqual({ negative: true, digits: '7', exponent: 0 });
  });

  it('represents zero as an empty significand, keeping its sign', () => {
    expect(exactDecimal('0')?.digits).toBe('');
    expect(exactDecimal('0')?.negative).toBe(false);
    expect(exactDecimal('-0')?.digits).toBe('');
    expect(exactDecimal('-0')?.negative).toBe(true);
    expect(exactDecimal('-0.00e5')?.negative).toBe(true);
  });

  it('refuses anything that is not a JSON number', () => {
    for (const text of [
      '+1',
      '.5',
      '1.',
      '01',
      '0x1f',
      '1.2.3',
      '1e',
      'Infinity',
      'NaN',
      '-',
      '',
      '1_000',
    ]) {
      expect(exactDecimal(text), text).toBeNull();
    }
  });

  it('survives exponents no double could hold', () => {
    expect(exactDecimal('1e999')).toEqual({ negative: false, digits: '1', exponent: 999 });
    expect(exactDecimal('1e-999')).toEqual({ negative: false, digits: '1', exponent: -999 });
  });
});

describe('sameExactValue', () => {
  /** `exactDecimal`, failing the test rather than the type checker on `null`. */
  const decimal = (literal: string): ExactDecimal => {
    const value = exactDecimal(literal);
    if (value === null) throw new Error(`not a JSON number: ${literal}`);
    return value;
  };

  it('treats minus zero and zero as different values', () => {
    expect(sameExactValue(decimal('-0'), decimal('0'))).toBe(false);
    expect(sameExactValue(decimal('0'), decimal('0'))).toBe(true);
    expect(sameExactValue(decimal('-0'), decimal('-0'))).toBe(true);
  });

  it('compares by value, not by spelling', () => {
    expect(sameExactValue(decimal('1'), decimal('1.0'))).toBe(true);
    expect(sameExactValue(decimal('1'), decimal('10e-1'))).toBe(true);
    expect(sameExactValue(decimal('1'), decimal('2'))).toBe(false);
    expect(sameExactValue(decimal('1'), decimal('1e1'))).toBe(false);
  });
});

describe('classifyNumberLiteral', () => {
  it('reports every verified way the round trip rewrites a number', () => {
    expect(classifyNumberLiteral('12345678901234567890')).toEqual({
      kind: 'unsafe-integer',
      becomes: '12345678901234567000',
    });
    expect(classifyNumberLiteral('9007199254740993')).toEqual({
      kind: 'unsafe-integer',
      becomes: '9007199254740992',
    });
    expect(classifyNumberLiteral('1e999')).toEqual({ kind: 'overflow', becomes: 'null' });
    expect(classifyNumberLiteral('-1e999')).toEqual({ kind: 'overflow', becomes: 'null' });
    expect(classifyNumberLiteral('-0')).toEqual({ kind: 'negative-zero', becomes: '0' });
    expect(classifyNumberLiteral('0.1234567890123456789')).toEqual({
      kind: 'precision',
      becomes: '0.12345678901234568',
    });
    // Underflow is a rounding, so it is reported as one.
    expect(classifyNumberLiteral('1e-999')).toEqual({ kind: 'precision', becomes: '0' });
  });

  it('stays silent about re-spellings that preserve the value', () => {
    // `1.0` and `1` are the same JSON number; the output text differs, the data
    // does not, and a warning here would train the user to ignore all of them.
    expect(classifyNumberLiteral('1.0')).toBeNull();
    expect(classifyNumberLiteral('1.000')).toBeNull();
    expect(classifyNumberLiteral('1e2')).toBeNull();
    expect(classifyNumberLiteral('-0.0e3')).not.toBeNull(); // still minus zero
  });

  it('stays silent about big integers that round-trip exactly', () => {
    // Past MAX_SAFE_INTEGER but exactly representable, so nothing is lost.
    expect(Number.isSafeInteger(1e19)).toBe(false);
    expect(classifyNumberLiteral('10000000000000000000')).toBeNull();
    expect(classifyNumberLiteral('18014398509481984')).toBeNull(); // 2^54
  });

  it('stays silent when the stored double is inexact but the text survives', () => {
    // The sharpest case for the criterion this module uses. The double behind
    // 92640008104508060 is not that integer, but it is the *nearest* one, so
    // JSON.stringify emits the shortest text that round-trips — the same digits
    // the user typed. Format changes nothing, so there is nothing to warn about.
    const literal = '92640008104508060';
    expect(Number.isSafeInteger(Number(literal))).toBe(false);
    expect(JSON.stringify(JSON.parse(literal))).toBe(literal);
    expect(classifyNumberLiteral(literal)).toBeNull();
  });

  it('makes no claim about text that is not a JSON number', () => {
    for (const text of ['+1', '.5', '1.', '01', '0x1f', '1.2.3', '-', 'e5']) {
      expect(classifyNumberLiteral(text), text).toBeNull();
    }
  });

  it('agrees with a BigInt oracle on every integer literal', () => {
    // Independent check. The question Format asks is whether the *text* changes
    // value, so the oracle compares the literal the user wrote with the literal
    // `JSON.stringify` emits, both as exact BigInts — no reuse of the decimal
    // machinery under test, and no doubles in the comparison.
    const literals = [
      '0',
      '1',
      '-1',
      '9007199254740991',
      '-9007199254740991',
      '9007199254740992',
      '9007199254740993',
      '-9007199254740993',
      '10000000000000000000',
      '12345678901234567890',
      '18014398509481984',
      '18014398509481985',
      '99999999999999999999999',
      '123456789012345678901234567890',
    ];

    for (const literal of literals) {
      const verdict = classifyNumberLiteral(literal);
      if (BigInt(literal) === emittedInteger(literal)) {
        expect(verdict, literal).toBeNull();
      } else {
        expect(verdict?.kind, literal).toBe('unsafe-integer');
      }
    }
  });

  it('agrees with a BigInt oracle on randomly generated big integers', () => {
    let seed = 0x5eed_1234;
    const nextDigit = () => {
      // xorshift, so the case list is wide but the test stays deterministic.
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return Math.abs(seed) % 10;
    };

    for (let n = 0; n < 400; n++) {
      const length = 15 + (n % 12);
      let literal = String(1 + (nextDigit() % 9));
      for (let d = 1; d < length; d++) literal += String(nextDigit());
      if (n % 3 === 0) literal = `-${literal}`;

      const changes = BigInt(literal) !== emittedInteger(literal);
      const verdict = classifyNumberLiteral(literal);
      expect(verdict === null, literal).toBe(!changes);
    }
  });
});

describe('scanLossyRewrites - the eight verified cases', () => {
  it('flags large integers that lose digits', () => {
    expect(scanLossyRewrites('{"id": 12345678901234567890}')).toEqual({
      kinds: ['unsafe-integer'],
      changes: [
        {
          kind: 'unsafe-integer',
          text: '12345678901234567890',
          becomes: '12345678901234567000',
          index: 7,
        },
      ],
    });
    expect(kindsOf('{"big": 9007199254740993}')).toEqual(['unsafe-integer']);
  });

  it('flags an overflow that becomes null', () => {
    expect(kindsOf('{"huge": 1e999}')).toEqual(['overflow']);
    expect(scanLossyRewrites('{"huge": 1e999}').changes[0].becomes).toBe('null');
  });

  it('flags minus zero', () => {
    expect(kindsOf('{"neg": -0}')).toEqual(['negative-zero']);
  });

  it('flags a duplicate key within one object', () => {
    expect(scanLossyRewrites('{"dup": 1, "dup": 2}')).toEqual({
      kinds: ['duplicate-key'],
      changes: [{ kind: 'duplicate-key', text: 'dup', index: 11 }],
    });
  });

  it('flags a decimal that loses precision', () => {
    expect(kindsOf('{"p": 0.1234567890123456789}')).toEqual(['precision']);
  });

  it('says nothing about 1.0 becoming 1', () => {
    expect(scanLossyRewrites('{"x": 1.0}')).toEqual({ kinds: [], changes: [] });
  });

  it('says nothing about a \\u escape becoming its character', () => {
    expect(scanLossyRewrites('{"e": "\\ud83d\\ude00"}')).toEqual({ kinds: [], changes: [] });
  });
});

describe('scanLossyRewrites - false positives', () => {
  it('ignores numbers inside strings', () => {
    expect(scanLossyRewrites('{"id": "12345678901234567890"}')).toEqual({
      kinds: [],
      changes: [],
    });
    expect(scanLossyRewrites('"1e999 and -0 and 9007199254740993"')).toEqual({
      kinds: [],
      changes: [],
    });
  });

  it('ignores numbers inside smart-quoted strings, which the fixer will re-quote', () => {
    expect(kindsOf('{“id”: “12345678901234567890”}')).toEqual([]);
    expect(kindsOf("{'id': '1e999'}")).toEqual([]);
  });

  it('ignores numbers inside comments, which the fixer strips', () => {
    expect(kindsOf('{"a": 1} // 12345678901234567890')).toEqual([]);
    expect(kindsOf('{"a": /* 1e999 */ 1}')).toEqual([]);
  });

  it('does not treat the same key in sibling objects as a duplicate', () => {
    expect(kindsOf('[{"a": 1}, {"a": 2}]')).toEqual([]);
    expect(kindsOf('{"o": {"a": 1}, "p": {"a": 2}}')).toEqual([]);
  });

  it('does not treat a nested key as a duplicate of its parent', () => {
    expect(kindsOf('{"a": {"a": {"a": 1}}}')).toEqual([]);
  });

  it('does not treat an array element matching a key name as a duplicate', () => {
    expect(kindsOf('{"a": ["a", "a", "a"]}')).toEqual([]);
  });

  it('leaves an ordinary document alone', () => {
    const document = JSON.stringify({
      users: [
        { id: 1, name: 'Ada', score: 99.5, active: true, note: null },
        { id: 2, name: 'Linus', score: -3.25, active: false, note: 'x' },
      ],
      totals: { sum: 96.25, count: 2 },
    });
    expect(scanLossyRewrites(document)).toEqual({ kinds: [], changes: [] });
    expect(describe_(document)).toBeNull();
  });
});

describe('scanLossyRewrites - almost-JSON input', () => {
  // Format runs the repair pipeline first, so the text scanned here is often
  // not valid JSON. The scan has to keep working on exactly those documents.

  it('finds a duplicate key written without quotes', () => {
    expect(kindsOf('{a: 1, a: 2,}')).toEqual(['duplicate-key']);
  });

  it('finds a duplicate key across a missing comma', () => {
    expect(kindsOf('{"a": 1 "a": 2}')).toEqual(['duplicate-key']);
  });

  it('finds a duplicate key through the fixer’s doubled-brace repair', () => {
    // `{{"a":1,"a":2}}` is repaired to `{"a":2}` — the inner object is where both
    // keys live either way, so raw-text scoping and parsed scoping agree.
    expect(kindsOf('{{"a": 1, "a": 2}}')).toEqual(['duplicate-key']);
  });

  it('finds a big integer in a document with trailing commas and comments', () => {
    expect(kindsOf('{\n  // note\n  "id": 12345678901234567890,\n}')).toEqual(['unsafe-integer']);
  });

  it('makes no claim about a numeric run JSON does not allow', () => {
    // The fixer may or may not recover these; either way this module has nothing
    // trustworthy to say, and a wrong warning is worse than none.
    expect(kindsOf('{"a": +12345678901234567890}')).toEqual([]);
    expect(kindsOf('{"a": 012345678901234567890}')).toEqual([]);
    expect(kindsOf('{"a": 0x1fffffffffffffff}')).toEqual([]);
  });
});

describe('scanLossyRewrites - known misses', () => {
  // Pinned rather than hidden: these are the documents where a text scan and
  // `JSON.parse` genuinely disagree.

  it('misses duplicates that only exist after the repair joins two documents', () => {
    // Two documents side by side. The scan sees two separate objects and reports
    // nothing; `JSON.parse` rejects the text outright, so Format never rewrites
    // it and the user gets the parse error instead of a silent merge.
    expect(kindsOf('{"x": 1} {"x": 2}')).toEqual([]);
  });

  it('misses everything after an unbalanced quote swallows the rest', () => {
    // A stray apostrophe in code position opens a string that never closes, so
    // the remainder is read as string content. Erring this way is deliberate:
    // it costs misses, never false positives.
    expect(kindsOf('{"a": don\'t, "b": 1e999}')).toEqual([]);
  });
});

describe('scanLossyRewrites - limits', () => {
  it('caps the collected changes but never the kinds', () => {
    const parts: string[] = [];
    for (let i = 0; i < 60; i++) parts.push(`"k${i}": 1234567890123456789${i % 10}`);
    parts.push('"z": 1e999');
    const scan = scanLossyRewrites(`{${parts.join(', ')}}`);

    expect(scan.changes).toHaveLength(DEFAULT_LOSSY_CHANGE_LIMIT);
    expect(scan.kinds).toEqual(['unsafe-integer', 'overflow']);
  });

  it('honours an explicit limit', () => {
    const scan = scanLossyRewrites('[1e999, 1e999, 1e999]', 2);
    expect(scan.changes).toHaveLength(2);
    expect(scan.kinds).toEqual(['overflow']);
  });

  it('handles an empty document', () => {
    expect(scanLossyRewrites('')).toEqual({ kinds: [], changes: [] });
    expect(describe_('')).toBeNull();
  });

  it('terminates on unbalanced and truncated input', () => {
    for (const text of ['{', '[', '}', ']', '{"a":', '{"a": -', '[1,2,', '"unterminated']) {
      expect(() => scanLossyRewrites(text), text).not.toThrow();
    }
  });
});

describe('describeLossyScan', () => {
  it('returns null when Format changes nothing', () => {
    expect(describe_('{"a": 1, "b": [2, 3.5]}')).toBeNull();
  });

  it('names the change and shows one concrete example', () => {
    expect(describe_('{"id": 12345678901234567890}')).toBe(
      'large whole numbers lost digits (12345678901234567890 → 12345678901234567000)'
    );
  });

  it('lists every kind in the order it was first seen', () => {
    expect(describe_('{"a": -0, "b": 1e999, "b": 2}')).toBe(
      'minus zero became zero, numbers too large for JavaScript became null, ' +
        'duplicate keys were merged, keeping the last value (-0 → 0)'
    );
  });

  it('omits the example when only duplicate keys changed', () => {
    expect(describe_('{"dup": 1, "dup": 2}')).toBe(
      'duplicate keys were merged, keeping the last value'
    );
  });

  it('elides an example too long to read', () => {
    const long = `1${'0'.repeat(40)}1`;
    const rendered = describe_(`{"n": ${long}}`);
    expect(rendered).toContain('…');
    expect(rendered).not.toContain(long);
  });

  it('uses the supplied translation for every kind', () => {
    const translated = describeLossyScan(
      scanLossyRewrites('{"a": -0, "b": 1e999}'),
      (key) => `<${key}>`
    );
    expect(translated).toBe('<format.lossy.negativeZero>, <format.lossy.overflow> (-0 → 0)');
  });

  it('has a translation key for every kind it can report', () => {
    const kinds: LossyChangeKind[] = [
      'unsafe-integer',
      'precision',
      'overflow',
      'negative-zero',
      'duplicate-key',
    ];
    for (const kind of kinds) {
      expect(LOSSY_KIND_TEXT[kind].key.startsWith('format.lossy.'), kind).toBe(true);
      expect(LOSSY_KIND_TEXT[kind].fallback.length, kind).toBeGreaterThan(0);
    }
  });
});

describe('scanLossyRewrites - agrees with an actual round trip', () => {
  // The end-to-end property: if the scan says nothing changed, formatting the
  // document really does preserve every value.
  const faithful = [
    '{"a": 1, "b": -2.5, "c": [0, 1e3, 1.0]}',
    '[]',
    '{}',
    'null',
    '0',
    'false',
    '""',
    '{"n": 9007199254740991}',
    '{"n": -9007199254740991}',
    '{"s": "1e999 -0 9007199254740993"}',
  ];

  for (const document of faithful) {
    it(`round-trips ${document} unchanged, and the scan agrees`, () => {
      const parsed = JSON.parse(document);
      // Same value after the round trip, so the scan must stay quiet.
      expect(JSON.parse(JSON.stringify(parsed))).toEqual(parsed);
      expect(scanLossyRewrites(document).kinds).toEqual([]);
    });
  }

  const lossy: [string, LossyChangeKind][] = [
    ['{"a": 12345678901234567890}', 'unsafe-integer'],
    ['{"a": 1e999}', 'overflow'],
    ['{"a": -0}', 'negative-zero'],
    ['{"a": 0.1234567890123456789}', 'precision'],
    ['{"a": 1, "a": 2}', 'duplicate-key'],
  ];

  for (const [document, kind] of lossy) {
    it(`reports ${kind} for ${document}, which the round trip really does change`, () => {
      // Independent confirmation that the document is genuinely rewritten.
      expect(JSON.stringify(JSON.parse(document))).not.toBe(document.replace(/\s/g, ''));
      expect(scanLossyRewrites(document).kinds).toEqual([kind]);
    });
  }

  it('finds nothing in text that JSON.stringify produced', () => {
    // The invariant the warning design rests on: `JSON.stringify` output is
    // always scan-clean, because everything it could have changed it has
    // already changed. So every one of these warns exactly once, however many
    // times the user re-formats, re-indents or toggles key sorting afterwards.
    const documents = [
      ...faithful,
      ...lossy.map(([document]) => document),
      '{"b": [1e999, -0, 12345678901234567890, 1e-999]}',
      '{"outer": {"a": 1, "a": 2}, "n": 9007199254740993}',
    ];

    for (const document of documents) {
      for (const indent of [0, 2, 4, '\t']) {
        const formatted = JSON.stringify(JSON.parse(document), null, indent);
        expect(scanLossyRewrites(formatted).kinds, formatted).toEqual([]);
      }
    }
  });
});
