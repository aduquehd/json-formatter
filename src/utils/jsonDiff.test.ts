import { describe, expect, it } from 'vitest';
import {
  charDiff,
  compareStructured,
  computeLineDiff,
  type DiffBlock,
  lineStats,
  MAX_ARRAY_ALIGN_ITEMS,
  MAX_LCS_CELLS,
  normalize,
  sortKeysDeep,
} from './jsonDiff';
import { JsonDepthLimitError, MAX_JSON_DEPTH, nestDeeply, runDepthGuarded } from './jsonWalk';

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
    const blocks = computeLineDiff(text, text).blocks;
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ kind: 'equal' });
    if (blocks[0].kind === 'equal') {
      expect(blocks[0].rows).toHaveLength(3);
    }
  });

  it('detects a modified middle line', () => {
    const left = '{\n  "name": "Alice"\n}';
    const right = '{\n  "name": "Bob"\n}';
    const blocks = computeLineDiff(left, right).blocks;

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
    const blocks = computeLineDiff(left, right).blocks;
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
    const blocks = computeLineDiff('a\nb\nc', 'a\nB\nc\nd').blocks;
    const stats = lineStats(blocks);
    expect(stats.hunks).toBeGreaterThanOrEqual(1);
    expect(stats.additions).toBeGreaterThan(0);
    expect(stats.deletions).toBeGreaterThan(0);
  });

  it('returns zeros for identical documents', () => {
    const blocks = computeLineDiff('same', 'same').blocks;
    expect(lineStats(blocks)).toEqual({ additions: 0, deletions: 0, hunks: 0 });
  });
});

describe('compareStructured', () => {
  it('returns no diffs for equal values (including NaN via Object.is)', () => {
    expect(compareStructured({ a: 1 }, { a: 1 }).diffs).toEqual([]);
    expect(compareStructured(null, null).diffs).toEqual([]);
  });

  it('reports modified leaves', () => {
    const diffs = compareStructured({ a: 1 }, { a: 2 }).diffs;
    expect(diffs).toEqual([{ path: '$.a', type: 'modified', leftValue: 1, rightValue: 2 }]);
  });

  it('reports added and removed object keys', () => {
    const diffs = compareStructured({ a: 1, b: 2 }, { a: 1, c: 3 }).diffs;
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
    expect(compareStructured(left, right).diffs).toEqual([]);
  });

  it('reports type changes', () => {
    expect(compareStructured({ a: 1 }, { a: '1' }).diffs).toEqual([
      { path: '$.a', type: 'type-changed', leftValue: 1, rightValue: '1' },
    ]);
  });

  it('diffs arrays by index', () => {
    const diffs = compareStructured([1, 2], [1, 3, 4]).diffs;
    expect(diffs).toEqual(
      expect.arrayContaining([
        { path: '$[1]', type: 'modified', leftValue: 2, rightValue: 3 },
        { path: '$[2]', type: 'added', rightValue: 4 },
      ])
    );
  });

  it('quotes non-identifier keys in paths', () => {
    const diffs = compareStructured({ 'a-b': 1 }, { 'a-b': 2 }).diffs;
    expect(diffs[0]?.path).toBe('$["a-b"]');
  });
});

/* ------------------------------------------------------------------ *
 * Prototype-key safety
 * ------------------------------------------------------------------ */

describe('prototype-named keys', () => {
  it('sortKeysDeep keeps a JSON "__proto__" key as an own property', () => {
    const input = JSON.parse('{"z": 1, "__proto__": {"polluted": true}}');
    const out = sortKeysDeep(input);

    expect(Object.hasOwn(out, '__proto__')).toBe(true);
    expect(Object.getOwnPropertyDescriptor(out, '__proto__')?.value).toEqual({ polluted: true });
    // The prototype must be untouched — plain assignment would have swapped it.
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.keys(out)).toEqual(['__proto__', 'z']);
  });

  it('normalize keeps a "__proto__" key in the pretty-printed output', () => {
    const input = JSON.parse('{"b": 1, "__proto__": {"x": 2}}');
    expect(normalize(input, true)).toBe(`{
  "__proto__": {
    "x": 2
  },
  "b": 1
}`);
  });

  it('compareStructured treats an inherited key as absent, not as an existing one', () => {
    // `'constructor' in {}` is true; Object.hasOwn is what this must ask.
    expect(compareStructured({}, { constructor: 1 }).diffs).toEqual([
      { path: '$.constructor', type: 'added', rightValue: 1 },
    ]);
    expect(compareStructured({ constructor: 1 }, {}).diffs).toEqual([
      { path: '$.constructor', type: 'removed', leftValue: 1 },
    ]);
  });

  it('reports every prototype-named key on either side', () => {
    const right = { toString: 'x', hasOwnProperty: 1, valueOf: [2] };
    const diffs = compareStructured({}, right).diffs;
    expect(diffs).toEqual(
      expect.arrayContaining([
        { path: '$.toString', type: 'added', rightValue: 'x' },
        { path: '$.hasOwnProperty', type: 'added', rightValue: 1 },
        { path: '$.valueOf', type: 'added', rightValue: [2] },
      ])
    );
    expect(diffs).toHaveLength(3);

    const removed = compareStructured(right, {}).diffs;
    expect(removed.map((d) => d.type)).toEqual(['removed', 'removed', 'removed']);
  });

  it('handles an own "__proto__" key parsed out of JSON', () => {
    const withProto = JSON.parse('{"__proto__": 1}');
    expect(compareStructured({}, withProto).diffs).toEqual([
      { path: '$.__proto__', type: 'added', rightValue: 1 },
    ]);
    expect(compareStructured(withProto, JSON.parse('{"__proto__": 2}')).diffs).toEqual([
      { path: '$.__proto__', type: 'modified', leftValue: 1, rightValue: 2 },
    ]);
  });

  it('never reports an inherited function as a diff value', () => {
    // CompareWorkspace runs JSON.stringify(...).toLowerCase() over these; a
    // function stringifies to undefined and used to throw on the first keypress.
    const diffs = compareStructured({}, { constructor: 1, toString: 2, valueOf: 3 }).diffs;
    for (const d of diffs) {
      expect(typeof d.leftValue).not.toBe('function');
      expect(typeof d.rightValue).not.toBe('function');
      if (d.rightValue !== undefined) expect(JSON.stringify(d.rightValue)).toBeTypeOf('string');
      if (d.leftValue !== undefined) expect(JSON.stringify(d.leftValue)).toBeTypeOf('string');
    }
  });
});

/* ------------------------------------------------------------------ *
 * Path escaping
 * ------------------------------------------------------------------ */

describe('structural diff paths', () => {
  it('escapes quotes and backslashes in quoted key paths', () => {
    expect(compareStructured({ 'a"b': 1 }, { 'a"b': 2 }).diffs[0]?.path).toBe('$["a\\"b"]');
    expect(compareStructured({ 'a\\b': 1 }, { 'a\\b': 2 }).diffs[0]?.path).toBe('$["a\\\\b"]');
    expect(compareStructured({ 'a\nb': 1 }, { 'a\nb': 2 }).diffs[0]?.path).toBe('$["a\\nb"]');
  });

  it('produces a quoted segment that parses back to the original key', () => {
    const key = 'we"ird\\key';
    const path = compareStructured({ [key]: 1 }, { [key]: 2 }).diffs[0]?.path ?? '';
    const quoted = path.slice('$['.length, -']'.length);
    expect(JSON.parse(quoted)).toBe(key);
  });

  it('still uses dot notation for identifier-shaped keys', () => {
    expect(compareStructured({ $a_1: 1 }, { $a_1: 2 }).diffs[0]?.path).toBe('$.$a_1');
  });
});

/* ------------------------------------------------------------------ *
 * Array alignment
 * ------------------------------------------------------------------ */

describe('compareStructured arrays', () => {
  it('reports a front insertion as one addition, not a cascade of modifications', () => {
    expect(compareStructured([1, 2, 3], [0, 1, 2, 3]).diffs).toEqual([
      { path: '$[0]', type: 'added', rightValue: 0 },
    ]);
  });

  it('reports a middle insertion as one addition', () => {
    expect(compareStructured(['a', 'b'], ['a', 'x', 'b']).diffs).toEqual([
      { path: '$[1]', type: 'added', rightValue: 'x' },
    ]);
  });

  it('reports a front removal as one removal', () => {
    expect(compareStructured([0, 1, 2, 3], [1, 2, 3]).diffs).toEqual([
      { path: '$[0]', type: 'removed', leftValue: 0 },
    ]);
  });

  it('aligns arrays of objects across an insertion', () => {
    const left = [
      { id: 1, v: 'a' },
      { id: 2, v: 'b' },
    ];
    const right = [
      { id: 0, v: 'z' },
      { id: 1, v: 'a' },
      { id: 2, v: 'b' },
    ];
    expect(compareStructured(left, right).diffs).toEqual([
      { path: '$[0]', type: 'added', rightValue: { id: 0, v: 'z' } },
    ]);
  });

  it('pairs an edited item at its right-hand index after an insertion', () => {
    // $[2] is where the edited item lives in the updated document.
    const diffs = compareStructured([{ a: 1 }, { a: 2 }], [{ a: 0 }, { a: 1 }, { a: 99 }]).diffs;
    expect(diffs).toEqual([
      { path: '$[0]', type: 'added', rightValue: { a: 0 } },
      { path: '$[2].a', type: 'modified', leftValue: 2, rightValue: 99 },
    ]);
  });

  it('reports a removed tail by left index', () => {
    expect(compareStructured([1, 2, 3], [1]).diffs).toEqual([
      { path: '$[1]', type: 'removed', leftValue: 2 },
      { path: '$[2]', type: 'removed', leftValue: 3 },
    ]);
  });

  it('walks nested arrays of objects down to the changed leaf', () => {
    const left = { rows: [{ cells: [1, 2] }, { cells: [3, 4] }] };
    const right = { rows: [{ cells: [1, 2] }, { cells: [3, 5] }] };
    expect(compareStructured(left, right).diffs).toEqual([
      { path: '$.rows[1].cells[1]', type: 'modified', leftValue: 4, rightValue: 5 },
    ]);
  });

  it('keeps item alignment stable when keys are reordered', () => {
    expect(compareStructured([{ a: 1, b: 2 }], [{ b: 2, a: 1 }]).diffs).toEqual([]);
  });

  it('reuses an index across a pair and a leftover removal in the same run', () => {
    // Aligned array paths are per-side hints, not unique ids: the pair lands on
    // the right index ($[2] = 'X') and the leftover removal keeps its left one
    // (also 2). Consumers must not key rows by path alone.
    expect(compareStructured(['K', 'A', 'B'], ['N', 'K', 'X']).diffs).toEqual([
      { path: '$[0]', type: 'added', rightValue: 'N' },
      { path: '$[2]', type: 'modified', leftValue: 'A', rightValue: 'X' },
      { path: '$[2]', type: 'removed', leftValue: 'B' },
    ]);
  });

  it('falls back to positional comparison above MAX_ARRAY_ALIGN_ITEMS', () => {
    const n = MAX_ARRAY_ALIGN_ITEMS + 1;
    const left = Array.from({ length: n }, (_, i) => i + 1);
    const right = Array.from({ length: n + 1 }, (_, i) => i);

    const { diffs, positionalArrays } = compareStructured(left, right);
    // Positional: every index shifted by the front insertion reads as modified.
    expect(diffs).toHaveLength(n + 1);
    expect(diffs.filter((d) => d.type === 'modified')).toHaveLength(n);
    expect(diffs[diffs.length - 1]).toEqual({
      path: `$[${n}]`,
      type: 'added',
      rightValue: n,
    });
    // ...and the result says so, so the view can disclose it rather than
    // presenting 2001 phantom edits as the answer.
    expect(positionalArrays).toEqual(['$']);
  });

  it('reports the path of a nested array that degraded, not just the root', () => {
    // The signal has to survive the recursion: the walk that gives up is two
    // levels below the call that builds the result.
    const n = MAX_ARRAY_ALIGN_ITEMS + 1;
    const rows = (offset: number) => Array.from({ length: n }, (_, i) => i + offset);
    const { diffs, positionalArrays } = compareStructured(
      { meta: { name: 'a' }, table: { rows: rows(0) } },
      { meta: { name: 'b' }, table: { rows: rows(1) } }
    );

    expect(positionalArrays).toEqual(['$.table.rows']);
    expect(diffs[0]).toEqual({
      path: '$.meta.name',
      type: 'modified',
      leftValue: 'a',
      rightValue: 'b',
    });
  });

  it('degrades when either side alone is over the cap', () => {
    // The guard is on both lengths, so a long array compared against a short
    // one is positional too — and that is exactly the shape (a truncated list)
    // where the answer looks most wrong.
    const long = Array.from({ length: MAX_ARRAY_ALIGN_ITEMS + 1 }, (_, i) => i);
    expect(compareStructured(long, [0, 1, 2]).positionalArrays).toEqual(['$']);
    expect(compareStructured([0, 1, 2], long).positionalArrays).toEqual(['$']);
  });

  it('lists each degraded array once, in the order it was reached', () => {
    const big = (offset: number) =>
      Array.from({ length: MAX_ARRAY_ALIGN_ITEMS + 1 }, (_, i) => i + offset);
    const { positionalArrays } = compareStructured(
      { a: big(0), b: big(0) },
      { a: big(1), b: big(1) }
    );
    expect(positionalArrays).toEqual(['$.a', '$.b']);
  });

  it('reports no degradation for arrays under the cap', () => {
    expect(compareStructured([1, 2, 3], [1, 9, 3]).positionalArrays).toEqual([]);
    expect(compareStructured({ a: 1 }, { a: 2 }).positionalArrays).toEqual([]);
  });

  it('still aligns arrays of a realistic size', () => {
    // The bound has to leave room for ordinary record arrays: at 500 items a
    // front insertion must stay one addition, not 501 modifications. The last
    // size puts the inserted-into side exactly on the bound, which is inclusive.
    for (const n of [100, 500, MAX_ARRAY_ALIGN_ITEMS - 1]) {
      const row = (i: number) => ({ id: i, name: `n${i}`, meta: { x: i } });
      const left = Array.from({ length: n }, (_, i) => row(i));
      const right = [row(-1), ...left];
      const { diffs, positionalArrays } = compareStructured(left, right);
      expect(diffs, `n=${n}`).toEqual([{ path: '$[0]', type: 'added', rightValue: row(-1) }]);
      expect(positionalArrays, `n=${n}`).toEqual([]);
    }
  });

  it('does not spread a large sub-result onto the argument stack', () => {
    // `diffs.push(...subDiffs)` throws RangeError once one node produces more
    // diffs than the engine's argument limit; the walk pushes into a shared
    // accumulator instead. 200k leaves under one key is the smallest shape that
    // reliably trips the old form.
    const size = 200_000;
    const left = { rows: Object.fromEntries(Array.from({ length: size }, (_, i) => [i, 1])) };
    const right = { rows: Object.fromEntries(Array.from({ length: size }, (_, i) => [i, 2])) };
    expect(compareStructured(left, right).diffs).toHaveLength(size);
  });
});

/* ------------------------------------------------------------------ *
 * Structural edge cases
 * ------------------------------------------------------------------ */

describe('compareStructured edge cases', () => {
  it('reports null vs {} and {} vs [] as type changes', () => {
    expect(compareStructured(null, {}).diffs).toEqual([
      { path: '$', type: 'type-changed', leftValue: null, rightValue: {} },
    ]);
    expect(compareStructured({}, null).diffs).toEqual([
      { path: '$', type: 'type-changed', leftValue: {}, rightValue: null },
    ]);
    expect(compareStructured({}, []).diffs).toEqual([
      { path: '$', type: 'type-changed', leftValue: {}, rightValue: [] },
    ]);
    expect(compareStructured([], {}).diffs).toEqual([
      { path: '$', type: 'type-changed', leftValue: [], rightValue: {} },
    ]);
  });

  it('finds no diffs between two empty containers of the same kind', () => {
    expect(compareStructured({}, {}).diffs).toEqual([]);
    expect(compareStructured([], []).diffs).toEqual([]);
  });

  it('distinguishes empty and whitespace-only strings', () => {
    expect(compareStructured('', '').diffs).toEqual([]);
    expect(compareStructured({ a: '' }, { a: ' ' }).diffs).toEqual([
      { path: '$.a', type: 'modified', leftValue: '', rightValue: ' ' },
    ]);
    expect(compareStructured({ a: ' ' }, { a: '  ' }).diffs).toEqual([
      { path: '$.a', type: 'modified', leftValue: ' ', rightValue: '  ' },
    ]);
  });
});

/* ------------------------------------------------------------------ *
 * Line diff edge cases
 * ------------------------------------------------------------------ */

describe('computeLineDiff edge cases', () => {
  it('numbers the common suffix from each side when the sides differ in length', () => {
    // Two lines are inserted on the right, so the shared trailing line is line 3
    // on the left and line 5 on the right.
    const blocks = computeLineDiff('head\nkeep\ntail', 'head\nkeep\nnew1\nnew2\ntail').blocks;
    const rows = blocks.flatMap((b) => (b.kind === 'equal' ? b.rows : []));
    expect(rows).toEqual([
      { leftNo: 1, rightNo: 1, text: 'head' },
      { leftNo: 2, rightNo: 2, text: 'keep' },
      { leftNo: 3, rightNo: 5, text: 'tail' },
    ]);
    expect(lineStats(blocks)).toEqual({ additions: 2, deletions: 0, hunks: 1 });
  });

  it('numbers the common suffix when the left side is the longer one', () => {
    const blocks = computeLineDiff('head\ngone1\ngone2\ntail', 'head\ntail').blocks;
    const rows = blocks.flatMap((b) => (b.kind === 'equal' ? b.rows : []));
    expect(rows).toEqual([
      { leftNo: 1, rightNo: 1, text: 'head' },
      { leftNo: 4, rightNo: 2, text: 'tail' },
    ]);
  });

  it('treats two empty documents as one equal row', () => {
    expect(computeLineDiff('', '').blocks).toEqual([
      { kind: 'equal', rows: [{ leftNo: 1, rightNo: 1, text: '' }] },
    ]);
    expect(lineStats(computeLineDiff('', '').blocks)).toEqual({
      additions: 0,
      deletions: 0,
      hunks: 0,
    });
  });

  it('diffs an empty document against a non-empty one', () => {
    const blocks = computeLineDiff('', 'a\nb').blocks;
    expect(lineStats(blocks)).toEqual({ additions: 2, deletions: 1, hunks: 1 });
    const change = blocks.find((b) => b.kind === 'change');
    if (change?.kind === 'change') {
      expect(change.removed).toEqual([{ no: 1, text: '' }]);
      expect(change.added).toEqual([
        { no: 1, text: 'a' },
        { no: 2, text: 'b' },
      ]);
    }
  });

  it('treats whitespace-only lines as content', () => {
    expect(lineStats(computeLineDiff('   ', '').blocks)).toEqual({
      additions: 1,
      deletions: 1,
      hunks: 1,
    });
    expect(computeLineDiff('  ', '  ').blocks).toEqual([
      { kind: 'equal', rows: [{ leftNo: 1, rightNo: 1, text: '  ' }] },
    ]);
    // Blank lines inside a document are ordinary equal rows.
    const blocks = computeLineDiff('a\n\nb', 'a\n\nc').blocks;
    expect(lineStats(blocks)).toEqual({ additions: 1, deletions: 1, hunks: 1 });
  });

  it('falls back to a block replace when the LCS table would exceed MAX_LCS_CELLS', () => {
    const n = Math.ceil(Math.sqrt(MAX_LCS_CELLS)) + 1;
    expect(n * n).toBeGreaterThan(MAX_LCS_CELLS);
    const left = Array.from({ length: n }, (_, i) => `left-${i}`).join('\n');
    const right = Array.from({ length: n }, (_, i) => `right-${i}`).join('\n');

    const { blocks, lcsFallback } = computeLineDiff(left, right);
    // The blocks below are a block replace, not the minimal edit script, so the
    // result has to flag itself — the view cannot tell from the blocks alone.
    expect(lcsFallback).toBe(true);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe('change');
    if (blocks[0].kind === 'change') {
      expect(blocks[0].removed).toHaveLength(n);
      expect(blocks[0].added).toHaveLength(n);
      expect(blocks[0].removed[0]).toEqual({ no: 1, text: 'left-0' });
      expect(blocks[0].removed[n - 1]).toEqual({ no: n, text: `left-${n - 1}` });
      expect(blocks[0].added[0]).toEqual({ no: 1, text: 'right-0' });
      expect(blocks[0].added[n - 1]).toEqual({ no: n, text: `right-${n - 1}` });
    }
  });

  it('keeps the untouched prefix and suffix out of the oversized fallback', () => {
    const n = Math.ceil(Math.sqrt(MAX_LCS_CELLS)) + 1;
    const mid = (tag: string) => Array.from({ length: n }, (_, i) => `${tag}-${i}`).join('\n');
    const { blocks, lcsFallback } = computeLineDiff(
      `head\n${mid('left')}\ntail`,
      `head\n${mid('right')}\ntail`
    );
    expect(lcsFallback).toBe(true);
    expect(blocks.map((b) => b.kind)).toEqual(['equal', 'change', 'equal']);
    const last = blocks[2];
    if (last.kind === 'equal') {
      expect(last.rows).toEqual([{ leftNo: n + 2, rightNo: n + 2, text: 'tail' }]);
    }
  });

  it('reports no fallback for a diff the LCS table can hold', () => {
    expect(computeLineDiff('a\nb\nc', 'a\nB\nc').lcsFallback).toBe(false);
    expect(computeLineDiff('same', 'same').lcsFallback).toBe(false);
    expect(computeLineDiff('', '').lcsFallback).toBe(false);
    // One side empty is a whole-document add, but it is still the exact answer:
    // an empty sequence needs no table, so nothing degraded.
    expect(computeLineDiff('', 'a\nb').lcsFallback).toBe(false);
  });
});

describe('charDiff prefix/suffix overlap', () => {
  it('marks only the appended tail when one line is a strict prefix of the other', () => {
    const { left, right } = charDiff('aa', 'aaa');
    expect(left).toEqual([{ text: 'aa', changed: false }]);
    expect(right).toEqual([
      { text: 'aa', changed: false },
      { text: 'a', changed: true },
    ]);
  });

  it('marks only the removed tail in the other direction', () => {
    const { left, right } = charDiff('aaa', 'aa');
    expect(left).toEqual([
      { text: 'aa', changed: false },
      { text: 'a', changed: true },
    ]);
    expect(right).toEqual([{ text: 'aa', changed: false }]);
  });

  it('never double-counts a shared region as both prefix and suffix', () => {
    for (const [a, b] of [
      ['aa', 'aaa'],
      ['aaa', 'aa'],
      ['', 'abc'],
      ['abc', ''],
      ['ab', 'ba'],
    ]) {
      const { left, right } = charDiff(a, b);
      expect(left.map((s) => s.text).join('')).toBe(a);
      expect(right.map((s) => s.text).join('')).toBe(b);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Randomized invariants for the line diff
 * ------------------------------------------------------------------ */

// Independent reference: plain forward DP, only the LCS *length*, so it shares
// no code path with the engine's backward table.
function lcsLength(a: string[], b: string[]): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function reconstruct(blocks: DiffBlock[]) {
  const left: string[] = [];
  const right: string[] = [];
  const leftNos: number[] = [];
  const rightNos: number[] = [];
  for (const block of blocks) {
    if (block.kind === 'equal') {
      for (const row of block.rows) {
        left.push(row.text);
        leftNos.push(row.leftNo);
        right.push(row.text);
        rightNos.push(row.rightNo);
      }
    } else {
      for (const line of block.removed) {
        left.push(line.text);
        leftNos.push(line.no);
      }
      for (const line of block.added) {
        right.push(line.text);
        rightNos.push(line.no);
      }
    }
  }
  return { left, right, leftNos, rightNos };
}

function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe('computeLineDiff invariants (randomized)', () => {
  it('reconstructs both sides, numbers every line 1..n, and stays minimal', () => {
    const rng = makeRng(0xc0ffee);
    const alphabet = ['a', 'b', 'c', 'd'];
    for (let round = 0; round < 300; round++) {
      const gen = () =>
        Array.from(
          { length: 1 + Math.floor(rng() * 8) },
          () => alphabet[Math.floor(rng() * alphabet.length)]
        );
      const a = gen();
      const b = gen();

      const blocks = computeLineDiff(a.join('\n'), b.join('\n')).blocks;
      const { left, right, leftNos, rightNos } = reconstruct(blocks);
      const label = `${a.join('')} -> ${b.join('')}`;

      expect(left, label).toEqual(a);
      expect(right, label).toEqual(b);
      expect(leftNos, label).toEqual(a.map((_, i) => i + 1));
      expect(rightNos, label).toEqual(b.map((_, i) => i + 1));

      const stats = lineStats(blocks);
      expect(stats.additions + stats.deletions, label).toBe(
        a.length + b.length - 2 * lcsLength(a, b)
      );
      expect(stats.hunks, label).toBe(blocks.filter((block) => block.kind === 'change').length);
    }
  });

  it('reports zero changes for identical random documents', () => {
    const rng = makeRng(7);
    for (let round = 0; round < 50; round++) {
      const lines = Array.from({ length: 1 + Math.floor(rng() * 12) }, () =>
        String(Math.floor(rng() * 5))
      );
      const text = lines.join('\n');
      expect(lineStats(computeLineDiff(text, text).blocks)).toEqual({
        additions: 0,
        deletions: 0,
        hunks: 0,
      });
    }
  });
});

describe('compareStructured invariants (randomized)', () => {
  it('reports diffs exactly when the two values are not deeply equal', () => {
    const rng = makeRng(0x5eed);
    const leaf = () => {
      const pick = Math.floor(rng() * 6);
      if (pick === 0) return null;
      if (pick === 1) return rng() < 0.5;
      if (pick === 2) return Math.floor(rng() * 3);
      return ['x', 'y', 'z'][Math.floor(rng() * 3)];
    };
    const build = (depth: number): unknown => {
      const pick = rng();
      if (depth <= 0 || pick < 0.45) return leaf();
      if (pick < 0.75) {
        return Array.from({ length: Math.floor(rng() * 4) }, () => build(depth - 1));
      }
      const obj: Record<string, unknown> = {};
      for (const key of ['a', 'b', 'c']) {
        if (rng() < 0.6) obj[key] = build(depth - 1);
      }
      return obj;
    };

    for (let round = 0; round < 400; round++) {
      const left = build(2);
      const right = build(2);
      const diffs = compareStructured(left, right).diffs;
      // normalize() sorts keys, so this oracle is key-order independent — the
      // same equality compareStructured claims to implement.
      const deeplyEqual = normalize(left, true) === normalize(right, true);
      const label = `${JSON.stringify(left)} vs ${JSON.stringify(right)}`;

      expect(diffs.length === 0, label).toBe(deeplyEqual);
      for (const diff of diffs) {
        expect(diff.path.startsWith('$'), label).toBe(true);
        expect(['added', 'removed', 'modified', 'type-changed'], label).toContain(diff.type);
      }
    }
  });

  it('reports nothing for a deep copy of the same value', () => {
    const rng = makeRng(11);
    for (let round = 0; round < 100; round++) {
      const value = {
        rows: Array.from({ length: Math.floor(rng() * 6) }, (_, i) => ({
          id: i,
          tag: String(Math.floor(rng() * 4)),
        })),
      };
      expect(compareStructured(value, JSON.parse(JSON.stringify(value))).diffs).toEqual([]);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Depth safety
 * ------------------------------------------------------------------ */

describe('depth guard', () => {
  it('reports a 100,000-level document instead of throwing RangeError', () => {
    // `JSON.parse` accepts this shape happily; plain recursion does not survive it.
    const deep = nestDeeply(100_000, 'array');

    expect(runDepthGuarded(() => sortKeysDeep(deep))).toEqual({
      ok: false,
      reason: 'too-deep',
      limit: MAX_JSON_DEPTH,
    });
    expect(runDepthGuarded(() => normalize(deep, true))).toEqual({
      ok: false,
      reason: 'too-deep',
      limit: MAX_JSON_DEPTH,
    });
    expect(runDepthGuarded(() => compareStructured(deep, nestDeeply(100_000, 'array')))).toEqual({
      ok: false,
      reason: 'too-deep',
      limit: MAX_JSON_DEPTH,
    });
  });

  it('walks a document that sits exactly on the limit', () => {
    const atLimit = nestDeeply(MAX_JSON_DEPTH, 'object');
    expect(() => sortKeysDeep(atLimit)).not.toThrow();
    expect(compareStructured(atLimit, atLimit).diffs).toEqual([]);
  });

  it('throws one level past the limit', () => {
    const overLimit = nestDeeply(MAX_JSON_DEPTH + 1, 'object');
    expect(() => sortKeysDeep(overLimit)).toThrow(JsonDepthLimitError);
    // Two distinct values of the same shape, so the walk actually descends
    // rather than reporting a type change at the root and stopping.
    expect(() => compareStructured(overLimit, nestDeeply(MAX_JSON_DEPTH + 1, 'object'))).toThrow(
      JsonDepthLimitError
    );
  });

  it('counts nesting, not array position', () => {
    // `value.map(sortKeysDeep)` would pass each element's index as its depth, so
    // a flat array longer than the limit would be rejected as "too deep".
    const wide = Array.from({ length: MAX_JSON_DEPTH * 3 }, (_, i) => ({ b: i, a: i }));
    expect(() => sortKeysDeep(wide)).not.toThrow();
    expect(Object.keys(sortKeysDeep(wide)[MAX_JSON_DEPTH * 2])).toEqual(['a', 'b']);
  });

  it('aligns long arrays without the item index leaking into the depth', () => {
    // compareArrayAligned serialises every item; that map has the same hazard.
    const left = Array.from({ length: 1_000 }, (_, i) => ({ id: i }));
    const right = left.map((item) => ({ ...item }));
    right[900] = { id: -1 };
    const diffs = compareStructured(left, right).diffs;
    expect(diffs).toEqual([
      { path: '$[900].id', type: 'modified', leftValue: 900, rightValue: -1 },
    ]);
  });

  it('leaves ordinary documents byte-for-byte unchanged', () => {
    const value = { b: [3, { d: 4, c: [5, 6] }], a: { z: 1, y: null } };
    expect(normalize(value, true)).toBe(
      JSON.stringify({ a: { y: null, z: 1 }, b: [3, { c: [5, 6], d: 4 }] }, null, 2)
    );
  });
});
