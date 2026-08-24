/**
 * The document walk behind the Stats view.
 *
 * Extracted from `StatsView.tsx` unchanged so it can be unit tested: the vitest
 * environment is `node`, so nothing inside a component is reachable from a test,
 * and this is one of the recursive walkers a deeply nested document kills.
 *
 * The component keeps only the derivation and the rendering.
 */

import { assertJsonDepth } from './jsonWalk';

/** How big and how deep a document is — the two numbers the status bar shows. */
export interface JsonShape {
  /** Every value in the document, containers included. */
  nodes: number;
  /** Deepest nesting level reached. The root is level 0. */
  depth: number;
}

/**
 * Count values and measure nesting in one pass.
 *
 * Deliberately a leaner walk than {@link analyzeJSON}, which produces the same
 * two numbers as `totalValues` and `maxDepth`. The status bar runs on every
 * document the user opens, whichever tab is showing, and `analyzeJSON` allocates
 * a `Set` of every distinct key plus a frequency `Map` beside it — storage sized
 * to the document, for two numbers that need none of it. `jsonStats.test.ts`
 * asserts the two walks agree, so keeping them separate cannot let them drift.
 *
 * Throws `JsonDepthLimitError` past `MAX_JSON_DEPTH`. StatusBar runs it inside
 * `runDepthGuarded` and drops the two metrics rather than crashing — it renders
 * outside every error boundary, so an unguarded walk there takes the whole app
 * down and the user's document with it.
 */
export function measureShape(
  data: any,
  depth = 0,
  shape: JsonShape = { nodes: 0, depth: 0 }
): JsonShape {
  assertJsonDepth(depth);
  shape.nodes++;
  if (depth > shape.depth) shape.depth = depth;

  if (data !== null && typeof data === 'object') {
    const children = Array.isArray(data) ? data : Object.values(data);
    for (const child of children) measureShape(child, depth + 1, shape);
  }

  return shape;
}

export interface JSONStats {
  totalKeys: number;
  totalValues: number;
  maxDepth: number;
  typeDistribution: Map<string, number>;
  arrayStats: { count: number; minLength: number; maxLength: number; sumLength: number };
  keyAnalysis: { uniqueKeys: Set<string>; keyFrequency: Map<string, number>; longestKey: string };
  depthMap: Map<number, number>;
}

/**
 * Count keys, values, types, array sizes and nesting in one pass.
 *
 * `stats` is the accumulator threaded through the recursion; callers pass only
 * `data`. Throws `JsonDepthLimitError` past `MAX_JSON_DEPTH`; StatsView runs it
 * inside `runDepthGuarded` and shows the "nested too deeply" panel instead.
 */
export function analyzeJSON(data: any, depth = 0, stats?: JSONStats): JSONStats {
  assertJsonDepth(depth);
  if (!stats) {
    stats = {
      totalKeys: 0,
      totalValues: 0,
      maxDepth: 0,
      typeDistribution: new Map(),
      arrayStats: { count: 0, minLength: Infinity, maxLength: 0, sumLength: 0 },
      keyAnalysis: { uniqueKeys: new Set(), keyFrequency: new Map(), longestKey: '' },
      depthMap: new Map(),
    };
  }

  stats.maxDepth = Math.max(stats.maxDepth, depth);
  stats.depthMap.set(depth, (stats.depthMap.get(depth) || 0) + 1);

  const type = data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data;
  stats.typeDistribution.set(type, (stats.typeDistribution.get(type) || 0) + 1);
  stats.totalValues++;

  if (Array.isArray(data)) {
    stats.arrayStats.count++;
    stats.arrayStats.minLength = Math.min(stats.arrayStats.minLength, data.length);
    stats.arrayStats.maxLength = Math.max(stats.arrayStats.maxLength, data.length);
    stats.arrayStats.sumLength += data.length;
    // Wrapped, never `data.map(analyzeJSON)`: `map` supplies the element index,
    // which this signature would read as a depth.
    data.forEach((item) => analyzeJSON(item, depth + 1, stats));
  } else if (typeof data === 'object' && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      stats!.totalKeys++;
      stats!.keyAnalysis.uniqueKeys.add(key);
      stats!.keyAnalysis.keyFrequency.set(key, (stats!.keyAnalysis.keyFrequency.get(key) || 0) + 1);
      if (key.length > stats!.keyAnalysis.longestKey.length) stats!.keyAnalysis.longestKey = key;
      analyzeJSON(value, depth + 1, stats);
    });
  }

  return stats;
}
