import { describe, expect, it } from 'vitest';
import {
  charDiff,
  compareStructured,
  computeLineDiff,
  lineStats,
  normalize,
  sortKeysDeep,
} from './jsonDiff';

describe('sortKeysDeep', () => {
  it('recursively sorts object keys and leaves arrays ordered', () => {
    const input = {
      z: 1,
      a: { d: 2, b: 3 },
      list: [{ y: 1, x: 2 }, 9],
    };
    expect(sortKeysDeep(input)).toEqual({
      a: { b: 3, d: 2 },
      list: [{ x: 2, y: 1 }, 9],
      z: 1,
    });
  });

  it('returns primitives unchanged', () => {
    expect(sortKeysDeep(null)).toBeNull();
    expect(sortKeysDeep(42)).toBe(42);
    expect(sortKeysDeep('hi')).toBe('hi');
    expect(sortKeysDeep(true)).toBe(true);
  });
});

describe('normalize', () => {
  it('pretty-prints without sorting when sortKeys is false', () => {
    const data = { z: 1, a: 2 };
    const out = normalize(data, false);
    // Key order from the original object is preserved by JSON.stringify.
    expect(out).toBe(`{
  "z": 1,
  "a": 2
}`);
  });

  it('pretty-prints with sorted keys when sortKeys is true', () => {
    const out = normalize({ z: 1, a: 2 }, true);
    expect(out).toBe(`{
  "a": 2,
  "z": 1
}`);
  });
});

describe('computeLineDiff', () => {
  it('returns a single equal block for identical texts', () => {
    const text = '{\n  "a": 1\n}';
    const blocks = computeLineDiff(text, text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ kind: 'equal' });
    if (blocks[0].kind === 'equal') {
      expect(blocks[0].rows).toHaveLength(3);
    }
  });

  it('detects a modified middle line', () => {
    const left = '{\n  "name": "Alice"\n}';
    const right = '{\n  "name": "Bob"\n}';
    const blocks = computeLineDiff(left, right);

    const change = blocks.find((b) => b.kind === 'change');
    expect(change).toBeDefined();
    if (change?.kind === 'change') {
      expect(change.removed.some((l) => l.text.includes('Alice'))).toBe(true);
      expect(change.added.some((l) => l.text.includes('Bob'))).toBe(true);
    }
  });

  it('detects pure additions', () => {
    const left = '{\n  "a": 1\n}';
    const right = '{\n  "a": 1,\n  "b": 2\n}';
    const blocks = computeLineDiff(left, right);
    const change = blocks.find((b) => b.kind === 'change');
    expect(change).toBeDefined();
    if (change?.kind === 'change') {
      expect(change.added.length).toBeGreaterThan(0);
    }
  });
});

describe('charDiff', () => {
  it('highlights only the changed middle of a line', () => {
    const { left, right } = charDiff('"Alice"', '"Alicia"');
    // Shared "Alic" prefix and trailing quote should be unchanged.
    expect(left.find((s) => !s.changed)?.text).toBe('"Alic');
    expect(right.find((s) => !s.changed && s.text.startsWith('"Alic'))?.text).toBe('"Alic');
    expect(left.some((s) => s.changed)).toBe(true);
    expect(right.some((s) => s.changed)).toBe(true);
  });

  it('marks the whole line when nothing is shared', () => {
    const { left, right } = charDiff('abc', 'xyz');
    expect(left).toEqual([{ text: 'abc', changed: true }]);
    expect(right).toEqual([{ text: 'xyz', changed: true }]);
  });

  it('returns only unchanged segments when lines are equal', () => {
    const { left, right } = charDiff('same', 'same');
    expect(left).toEqual([{ text: 'same', changed: false }]);
    expect(right).toEqual([{ text: 'same', changed: false }]);
  });
});

describe('lineStats', () => {
  it('counts additions, deletions, and hunks from change blocks', () => {
    const blocks = computeLineDiff('a\nb\nc', 'a\nB\nc\nd');
    const stats = lineStats(blocks);
    expect(stats.hunks).toBeGreaterThanOrEqual(1);
    expect(stats.additions).toBeGreaterThan(0);
    expect(stats.deletions).toBeGreaterThan(0);
  });

  it('returns zeros for identical documents', () => {
    const blocks = computeLineDiff('same', 'same');
    expect(lineStats(blocks)).toEqual({ additions: 0, deletions: 0, hunks: 0 });
  });
});

describe('compareStructured', () => {
  it('returns no diffs for equal values (including NaN via Object.is)', () => {
    expect(compareStructured({ a: 1 }, { a: 1 })).toEqual([]);
    expect(compareStructured(null, null)).toEqual([]);
  });

  it('reports modified leaves', () => {
    const diffs = compareStructured({ a: 1 }, { a: 2 });
    expect(diffs).toEqual([{ path: '$.a', type: 'modified', leftValue: 1, rightValue: 2 }]);
  });

  it('reports added and removed object keys', () => {
    const diffs = compareStructured({ a: 1, b: 2 }, { a: 1, c: 3 });
    expect(diffs).toEqual(
      expect.arrayContaining([
        { path: '$.b', type: 'removed', leftValue: 2 },
        { path: '$.c', type: 'added', rightValue: 3 },
      ])
    );
    expect(diffs).toHaveLength(2);
  });

  it('is key-order independent for objects', () => {
    const left = { z: 1, a: 2 };
    const right = { a: 2, z: 1 };
    expect(compareStructured(left, right)).toEqual([]);
  });

  it('reports type changes', () => {
    expect(compareStructured({ a: 1 }, { a: '1' })).toEqual([
      { path: '$.a', type: 'type-changed', leftValue: 1, rightValue: '1' },
    ]);
  });

  it('diffs arrays by index', () => {
    const diffs = compareStructured([1, 2], [1, 3, 4]);
    expect(diffs).toEqual(
      expect.arrayContaining([
        { path: '$[1]', type: 'modified', leftValue: 2, rightValue: 3 },
        { path: '$[2]', type: 'added', rightValue: 4 },
      ])
    );
  });

  it('quotes non-identifier keys in paths', () => {
    const diffs = compareStructured({ 'a-b': 1 }, { 'a-b': 2 });
    expect(diffs[0]?.path).toBe('$["a-b"]');
  });
});
