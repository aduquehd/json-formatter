import { describe, expect, it } from 'vitest';
import { analyzeJSON, measureShape } from './jsonStats';
import { MAX_JSON_DEPTH, nestDeeply, runDepthGuarded } from './jsonWalk';

describe('analyzeJSON', () => {
  it('counts keys, values, types and nesting in one pass', () => {
    const stats = analyzeJSON({ name: 'ada', tags: ['a', 'b'], meta: { ok: true, note: null } });

    expect(stats.totalKeys).toBe(5);
    expect(stats.maxDepth).toBe(2);
    expect(stats.typeDistribution.get('string')).toBe(3);
    expect(stats.typeDistribution.get('object')).toBe(2);
    expect(stats.typeDistribution.get('array')).toBe(1);
    expect(stats.typeDistribution.get('boolean')).toBe(1);
    expect(stats.typeDistribution.get('null')).toBe(1);
    expect(stats.keyAnalysis.uniqueKeys).toEqual(new Set(['name', 'tags', 'meta', 'ok', 'note']));
    expect(stats.keyAnalysis.longestKey).toBe('name');
  });

  it('measures array lengths', () => {
    const stats = analyzeJSON({ a: [1, 2, 3], b: [], c: [1] });
    expect(stats.arrayStats).toEqual({ count: 3, minLength: 0, maxLength: 3, sumLength: 4 });
  });

  it('records how many values sit at each level', () => {
    const stats = analyzeJSON({ a: { b: 1 }, c: 2 });
    expect(Array.from(stats.depthMap.entries()).sort()).toEqual([
      [0, 1],
      [1, 2],
      [2, 1],
    ]);
  });
});

describe('analyzeJSON - depth guard', () => {
  it('reports a 100,000-level document instead of throwing RangeError', () => {
    // `JSON.parse` accepts this document; recursion without a guard does not.
    const deep = nestDeeply(100_000, 'array');
    expect(runDepthGuarded(() => analyzeJSON(deep))).toEqual({
      ok: false,
      reason: 'too-deep',
      limit: MAX_JSON_DEPTH,
    });
  });

  it('analyses a document that sits exactly on the limit', () => {
    const atLimit = nestDeeply(MAX_JSON_DEPTH, 'object');
    const result = runDepthGuarded(() => analyzeJSON(atLimit));
    expect(result.ok).toBe(true);
    expect(result.ok && result.value.maxDepth).toBe(MAX_JSON_DEPTH);
  });

  it('leaves wide-but-shallow documents alone', () => {
    // The index-as-depth hazard would reject this at the 513th element.
    const wide = Array.from({ length: MAX_JSON_DEPTH * 3 }, (_, i) => ({ id: i }));
    const stats = analyzeJSON(wide);
    expect(stats.totalKeys).toBe(MAX_JSON_DEPTH * 3);
    expect(stats.maxDepth).toBe(2);
  });

  it('does not change results for ordinary data', () => {
    const guarded = analyzeJSON({ a: { b: [1, 'two', null] } });
    expect(guarded.totalKeys).toBe(2);
    expect(guarded.totalValues).toBe(6);
    expect(guarded.maxDepth).toBe(3);
  });
});

describe('measureShape', () => {
  it('counts every value and the deepest level', () => {
    expect(measureShape({ a: { b: [1, 'two', null] } })).toEqual({ nodes: 6, depth: 3 });
    expect(measureShape([])).toEqual({ nodes: 1, depth: 0 });
    expect(measureShape({})).toEqual({ nodes: 1, depth: 0 });
  });

  it('counts falsy scalars as the documents they are', () => {
    // `0`, `false`, `""` and `null` are one-node documents, not empty ones.
    for (const document of [0, false, '', null]) {
      expect(measureShape(document)).toEqual({ nodes: 1, depth: 0 });
    }
  });

  it('agrees with analyzeJSON on both numbers', () => {
    // The two walks are kept separate for cost, not for behaviour: analyzeJSON
    // allocates a key Set and frequency Map that the status bar has no use for.
    // This is the assertion that stops them drifting apart.
    const documents: unknown[] = [
      null,
      0,
      false,
      '',
      { a: { b: [1, 'two', null] } },
      [[[{ x: [1, 2, 3] }]]],
      {
        users: [
          { id: 1, tags: ['a'] },
          { id: 2, tags: [] },
        ],
        meta: { ok: true },
      },
      Array.from({ length: 50 }, (_, i) => ({ id: i, nested: { deep: [i] } })),
    ];

    for (const document of documents) {
      const stats = analyzeJSON(document);
      expect(measureShape(document)).toEqual({
        nodes: stats.totalValues,
        depth: stats.maxDepth,
      });
    }
  });

  it('leaves wide-but-shallow documents alone', () => {
    const wide = Array.from({ length: MAX_JSON_DEPTH * 3 }, (_, i) => ({ id: i }));
    expect(measureShape(wide)).toEqual({ nodes: MAX_JSON_DEPTH * 6 + 1, depth: 2 });
  });

  it('measures a document that sits exactly on the limit', () => {
    const atLimit = nestDeeply(MAX_JSON_DEPTH, 'object');
    const result = runDepthGuarded(() => measureShape(atLimit));
    expect(result.ok).toBe(true);
    expect(result.ok && result.value.depth).toBe(MAX_JSON_DEPTH);
  });

  it('reports a 100,000-level document instead of throwing RangeError', () => {
    // The status bar renders outside every ErrorBoundary, so before the guard
    // this walk unmounted the whole app — taking the user's editor content with
    // it — at somewhere north of 5,000 levels. Now it declines at 512 and the
    // status bar simply omits the two metrics.
    const deep = nestDeeply(100_000, 'array');
    expect(runDepthGuarded(() => measureShape(deep))).toEqual({
      ok: false,
      reason: 'too-deep',
      limit: MAX_JSON_DEPTH,
    });
  });

  it('declines one level past the limit and accepts one level short of it', () => {
    expect(runDepthGuarded(() => measureShape(nestDeeply(MAX_JSON_DEPTH + 1, 'array'))).ok).toBe(
      false
    );
    expect(runDepthGuarded(() => measureShape(nestDeeply(MAX_JSON_DEPTH - 1, 'array'))).ok).toBe(
      true
    );
  });
});
