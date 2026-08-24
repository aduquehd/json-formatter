import { describe, expect, it } from 'vitest';
import {
  collectExpandablePaths,
  defaultExpandedPaths,
  entriesOf,
  formatPath,
  formatSegment,
  getAtPath,
  isPathPrefix,
  type PathSegment,
  parsePath,
  pathsEqual,
  remapExpandedAfterRename,
  renameKeyInObject,
  setAtPath,
} from './jsonPath';
import { MAX_JSON_DEPTH, nestDeeply, runDepthGuarded } from './jsonWalk';

describe('formatPath / parsePath', () => {
  const roundTrip = (segments: PathSegment[]) => {
    const formatted = formatPath(segments);
    expect(parsePath(formatted)).toEqual(segments);
    return formatted;
  };

  it('renders identifier keys in dot form and everything else in bracket form', () => {
    expect(formatPath(['a', 'b'])).toBe('root.a.b');
    expect(formatPath(['$ref', '_id'])).toBe('root.$ref._id');
    expect(formatPath(['a.b'])).toBe('root["a.b"]');
    expect(formatPath([0, 'a', 12])).toBe('root[0].a[12]');
    expect(formatPath([])).toBe('root');
  });

  it('round-trips keys containing path punctuation', () => {
    roundTrip(['a.b']);
    roundTrip(['a[0]']);
    roundTrip(['a]b[c']);
    roundTrip(['root.a']);
    roundTrip(['.']);
    roundTrip(['[', ']', '.']);
    roundTrip(['a', 'b.c', 0, 'd[1]']);
  });

  it('round-trips keys containing quotes, escapes, whitespace and unicode', () => {
    roundTrip(['he said "hi"']);
    roundTrip(['back\\slash']);
    roundTrip(['line\nbreak\ttab']);
    roundTrip(['']);
    roundTrip([' ']);
    roundTrip(['clé-unicode-日本語-😀']);
    roundTrip(['__proto__', 'constructor', 'prototype']);
  });

  it('keeps array indices and numeric-looking object keys apart', () => {
    expect(formatSegment(0)).toBe('[0]');
    expect(formatSegment('0')).toBe('["0"]');
    expect(formatPath([0])).not.toBe(formatPath(['0']));
    expect(parsePath('root[0]')).toEqual([0]);
    expect(parsePath('root["0"]')).toEqual(['0']);
  });

  it('does not collide {"a.b": 1} with {"a": {"b": 1}} — the BUG 3 case', () => {
    const dotted = formatPath(['a.b']);
    const nested = formatPath(['a', 'b']);

    expect(dotted).not.toBe(nested);
    expect(parsePath(dotted)).toEqual(['a.b']);
    expect(parsePath(nested)).toEqual(['a', 'b']);
  });

  it('returns null for malformed path strings instead of guessing', () => {
    expect(parsePath('root.')).toBeNull();
    expect(parsePath('root[')).toBeNull();
    expect(parsePath('root[]')).toBeNull();
    expect(parsePath('root[01]')).toBeNull();
    expect(parsePath('root[-1]')).toBeNull();
    expect(parsePath('root[1.5]')).toBeNull();
    expect(parsePath('root["unterminated]')).toBeNull();
    expect(parsePath('root["a"')).toBeNull();
    expect(parsePath('root.a-b')).toBeNull();
    expect(parsePath('elsewhere.a')).toBeNull();
    expect(parsePath('rootless.a')).toBeNull();
  });
});

describe('path comparisons', () => {
  it('compares paths segment-wise, not as strings', () => {
    expect(pathsEqual(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(pathsEqual(['a.b'], ['a', 'b'])).toBe(false);
    expect(pathsEqual([0], ['0'])).toBe(false);
  });

  it('treats a path as a prefix of itself and of its descendants only', () => {
    expect(isPathPrefix(['a'], ['a', 'b'])).toBe(true);
    expect(isPathPrefix(['a'], ['a'])).toBe(true);
    expect(isPathPrefix(['a'], ['ab'])).toBe(false);
    expect(isPathPrefix(['a', 'b'], ['a'])).toBe(false);
  });
});

describe('entriesOf', () => {
  it('yields numeric segments for arrays and string segments for objects', () => {
    expect(entriesOf(['x', 'y'])).toEqual([
      [0, 'x'],
      [1, 'y'],
    ]);
    expect(entriesOf({ a: 1 })).toEqual([['a', 1]]);
    expect(entriesOf(42)).toEqual([]);
    expect(entriesOf(null)).toEqual([]);
  });
});

describe('getAtPath', () => {
  it('reads nested values through both object and array segments', () => {
    const doc = { a: { b: [10, { c: 'x' }] } };
    expect(getAtPath(doc, ['a', 'b', 1, 'c'])).toBe('x');
    expect(getAtPath(doc, [])).toBe(doc);
  });

  it('distinguishes a dotted key from a nested object', () => {
    const doc = { 'a.b': 1, a: { b: 2 } };
    expect(getAtPath(doc, ['a.b'])).toBe(1);
    expect(getAtPath(doc, ['a', 'b'])).toBe(2);
  });

  it('never reaches through the prototype chain', () => {
    expect(getAtPath({}, ['toString'])).toBeUndefined();
    expect(getAtPath({}, ['constructor', 'name'])).toBeUndefined();
    expect(getAtPath([1, 2], [5])).toBeUndefined();
    expect(getAtPath([1, 2], ['length'])).toBeUndefined();
  });
});

describe('setAtPath', () => {
  it('writes object and array slots in place', () => {
    const doc = { a: { b: [1, 2] } };
    expect(setAtPath(doc, ['a', 'b', 0], 9)).toBe(true);
    expect(doc.a.b[0]).toBe(9);
  });

  it('refuses paths that do not address an existing slot', () => {
    const doc = { a: 1 };
    expect(setAtPath(doc, [], 2)).toBe(false);
    expect(setAtPath(doc, ['missing'], 2)).toBe(false);
    expect(setAtPath(doc, ['a', 'b'], 2)).toBe(false);
    expect(setAtPath([1], [3], 2)).toBe(false);
  });

  it('edits a dotted key without touching the same-looking nested value', () => {
    const doc = { 'a.b': 1, a: { b: 2 } };
    setAtPath(doc, ['a.b'], 99);
    expect(doc).toEqual({ 'a.b': 99, a: { b: 2 } });
  });

  it('writes a __proto__ key as an own property instead of polluting the prototype', () => {
    const doc = JSON.parse('{"__proto__": 1}');
    expect(setAtPath(doc, ['__proto__'], { polluted: true })).toBe(true);
    expect(JSON.stringify(doc)).toBe('{"__proto__":{"polluted":true}}');
    expect(Object.getPrototypeOf(doc)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('renameKeyInObject', () => {
  it('preserves key order', () => {
    const renamed = renameKeyInObject({ a: 1, b: 2, c: 3 }, 'b', 'z');
    expect(Object.keys(renamed)).toEqual(['a', 'z', 'c']);
    expect(renamed.z).toBe(2);
  });

  it('round-trips a __proto__ key through clone → rename → stringify', () => {
    const source = JSON.parse('{"a": 1, "b": 2}');
    const clone = structuredClone(source);
    const renamed = renameKeyInObject(clone, 'b', '__proto__');

    expect(JSON.stringify(renamed)).toBe('{"a":1,"__proto__":2}');
    expect(Object.getPrototypeOf(renamed)).toBe(Object.prototype);
    expect(Object.hasOwn(renamed, '__proto__')).toBe(true);
  });

  it('renames away from a __proto__ key too', () => {
    const clone = structuredClone(JSON.parse('{"__proto__": {"a": 1}, "b": 2}'));
    const renamed = renameKeyInObject(clone, '__proto__', 'safe');
    expect(JSON.stringify(renamed)).toBe('{"safe":{"a":1},"b":2}');
  });
});

describe('defaultExpandedPaths', () => {
  it('uses array syntax for a root-level array so the rendered rows match', () => {
    const paths = defaultExpandedPaths([{ a: 1 }, [1, 2], 'leaf']);
    expect(paths.has('root[0]')).toBe(true);
    expect(paths.has('root[1]')).toBe(true);
    // Leaves are not expandable, so they are never pre-expanded.
    expect(paths.has('root[2]')).toBe(false);
    expect(paths.has('root.0')).toBe(false);
  });

  it('expands the first ten top-level containers only', () => {
    const doc = Object.fromEntries(
      Array.from({ length: 12 }, (_, index) => [`k${index}`, { nested: true }])
    );
    const paths = defaultExpandedPaths(doc);
    expect(paths.has('root.k9')).toBe(true);
    expect(paths.has('root.k10')).toBe(false);
  });

  it('escapes second-level keys that contain path punctuation', () => {
    const paths = defaultExpandedPaths({ a: { 'b.c': { deep: 1 } } });
    expect(paths.has('root.a')).toBe(true);
    expect(paths.has('root.a["b.c"]')).toBe(true);
    expect(paths.has('root.a.b.c')).toBe(false);
  });
});

describe('collectExpandablePaths', () => {
  it('collects every container path and nothing else', () => {
    const paths = collectExpandablePaths({ a: { b: [{ c: 1 }] }, d: 5 });
    expect([...paths].sort()).toEqual(['root.a', 'root.a.b', 'root.a.b[0]']);
  });

  it('collects containers inside a root-level array', () => {
    const paths = collectExpandablePaths([{ a: 1 }, 2]);
    expect([...paths]).toEqual(['root[0]']);
  });
});

describe('remapExpandedAfterRename', () => {
  it('rewrites the renamed node and its descendants, leaving siblings alone', () => {
    const paths = new Set(['root.a', 'root.a.b', 'root.a.b[0]', 'root.ab', 'root.z']);
    const remapped = remapExpandedAfterRename(paths, [], 'a', 'renamed');

    expect([...remapped].sort()).toEqual([
      'root.ab',
      'root.renamed',
      'root.renamed.b',
      'root.renamed.b[0]',
      'root.z',
    ]);
  });

  it('only rewrites below the parent that owns the renamed key', () => {
    const paths = new Set(['root.x.a', 'root.y.a']);
    const remapped = remapExpandedAfterRename(paths, ['x'], 'a', 'b');
    expect([...remapped].sort()).toEqual(['root.x.b', 'root.y.a']);
  });

  it('escapes a new key that contains path punctuation', () => {
    const remapped = remapExpandedAfterRename(new Set(['root.a', 'root.a.b']), [], 'a', 'a.b');
    expect([...remapped].sort()).toEqual(['root["a.b"]', 'root["a.b"].b']);
  });

  it('passes through entries it cannot parse', () => {
    const remapped = remapExpandedAfterRename(new Set(['not-a-path']), [], 'a', 'b');
    expect([...remapped]).toEqual(['not-a-path']);
  });
});

describe('collectExpandablePaths - depth guard', () => {
  it('reports a 100,000-level document instead of throwing RangeError', () => {
    expect(runDepthGuarded(() => collectExpandablePaths(nestDeeply(100_000, 'object')))).toEqual({
      ok: false,
      reason: 'too-deep',
      limit: MAX_JSON_DEPTH,
    });
  });

  it('collects every container in an ordinary document', () => {
    expect(collectExpandablePaths({ a: { b: [1, { c: 2 }] } })).toEqual(
      new Set(['root.a', 'root.a.b', 'root.a.b[1]'])
    );
  });

  it('leaves wide-but-shallow documents alone', () => {
    const wide = Array.from({ length: 1_000 }, () => ({}));
    expect(collectExpandablePaths(wide).size).toBe(1_000);
  });
});
