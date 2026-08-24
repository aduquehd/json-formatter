import { describe, expect, it } from 'vitest';
import {
  assertJsonDepth,
  exceedsJsonDepth,
  isJsonDepthLimitError,
  isStackOverflow,
  isWithinJsonDepth,
  JsonDepthLimitError,
  MAX_JSON_DEPTH,
  nestDeeply,
  runDepthGuarded,
} from './jsonWalk';

/** The premise of this whole module: `JSON.parse` accepts what recursion cannot walk. */
describe('the premise', () => {
  it('JSON.parse accepts a 100,000-level document', () => {
    const text = '['.repeat(100_000) + '1' + ']'.repeat(100_000);
    expect(() => JSON.parse(text)).not.toThrow();
  });

  it('plain recursion over that same document blows the stack', () => {
    const deep = nestDeeply(100_000, 'array');
    const walk = (node: unknown): number => (Array.isArray(node) ? walk(node[0]) + 1 : 0);
    expect(() => walk(deep)).toThrow(RangeError);
  });

  it('the limit is under every engine primitive the views depend on', () => {
    // structuredClone (~2,218) is the tightest of them; see the module comment.
    expect(() => structuredClone(nestDeeply(MAX_JSON_DEPTH))).not.toThrow();
    expect(() => JSON.stringify(nestDeeply(MAX_JSON_DEPTH))).not.toThrow();
  });
});

describe('assertJsonDepth', () => {
  it('is a no-op at and below the limit', () => {
    expect(() => assertJsonDepth(0)).not.toThrow();
    expect(() => assertJsonDepth(MAX_JSON_DEPTH)).not.toThrow();
  });

  it('throws a JsonDepthLimitError one level past the limit', () => {
    expect(() => assertJsonDepth(MAX_JSON_DEPTH + 1)).toThrow(JsonDepthLimitError);
  });

  it('carries the limit it tripped on', () => {
    try {
      assertJsonDepth(11, 10);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(isJsonDepthLimitError(error)).toBe(true);
      expect((error as JsonDepthLimitError).limit).toBe(10);
    }
  });
});

describe('isWithinJsonDepth', () => {
  it('mirrors assertJsonDepth without throwing', () => {
    expect(isWithinJsonDepth(MAX_JSON_DEPTH)).toBe(true);
    expect(isWithinJsonDepth(MAX_JSON_DEPTH + 1)).toBe(false);
    expect(isWithinJsonDepth(3, 2)).toBe(false);
  });
});

describe('isStackOverflow', () => {
  it('recognises the wording of every engine, not just V8', () => {
    expect(isStackOverflow(new RangeError('Maximum call stack size exceeded'))).toBe(true);
    // SpiderMonkey throws InternalError, so the constructor must not be tested.
    expect(isStackOverflow(new Error('too much recursion'))).toBe(true);
  });

  it('does not claim unrelated RangeErrors', () => {
    expect(isStackOverflow(new RangeError('Invalid typed array length'))).toBe(false);
    expect(isStackOverflow('not an error')).toBe(false);
  });
});

describe('runDepthGuarded', () => {
  it('passes a successful walk straight through', () => {
    const result = runDepthGuarded(() => 42);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it('reports a depth overflow instead of throwing', () => {
    const result = runDepthGuarded(() => {
      assertJsonDepth(MAX_JSON_DEPTH + 1);
      return 'unreachable';
    });
    expect(result).toEqual({ ok: false, reason: 'too-deep', limit: MAX_JSON_DEPTH });
  });

  it('reports the limit the walk actually used, not the default', () => {
    const result = runDepthGuarded(() => {
      assertJsonDepth(6, 5);
      return 'unreachable';
    }, 5);
    expect(result).toEqual({ ok: false, reason: 'too-deep', limit: 5 });
  });

  it('also absorbs a real stack overflow from recursion it does not own', () => {
    const result = runDepthGuarded(() => JSON.stringify(nestDeeply(100_000)));
    expect(result).toEqual({ ok: false, reason: 'too-deep', limit: MAX_JSON_DEPTH });
  });

  it('re-throws anything that is not a depth problem', () => {
    expect(() =>
      runDepthGuarded(() => {
        throw new TypeError('a real bug');
      })
    ).toThrow(TypeError);
  });
});

describe('exceedsJsonDepth', () => {
  it('answers for a document no recursive walker could survive', () => {
    // The probe itself is iterative, which is the only reason this can be asked.
    expect(exceedsJsonDepth(nestDeeply(100_000, 'array'))).toBe(true);
    expect(exceedsJsonDepth(nestDeeply(100_000, 'object'))).toBe(true);
  });

  it('accepts a document exactly at the limit', () => {
    expect(exceedsJsonDepth(nestDeeply(MAX_JSON_DEPTH))).toBe(false);
  });

  it('rejects a document one level past it', () => {
    expect(exceedsJsonDepth(nestDeeply(MAX_JSON_DEPTH + 1))).toBe(true);
  });

  it('leaves wide-but-shallow documents alone', () => {
    const wide = Array.from({ length: 50_000 }, (_, i) => ({ id: i, tags: ['a', 'b', 'c'] }));
    expect(exceedsJsonDepth(wide)).toBe(false);
  });

  it('counts nesting, not member count', () => {
    expect(exceedsJsonDepth({ a: { b: 1 } }, 2)).toBe(false);
    expect(exceedsJsonDepth({ a: { b: 1 } }, 1)).toBe(true);
    expect(exceedsJsonDepth({ a: { b: 1 } }, 0)).toBe(true);
  });

  it('treats scalars, empty containers and null as depth 0', () => {
    expect(exceedsJsonDepth(1, 0)).toBe(false);
    expect(exceedsJsonDepth(null, 0)).toBe(false);
    expect(exceedsJsonDepth('x', 0)).toBe(false);
    expect(exceedsJsonDepth({}, 0)).toBe(false);
    expect(exceedsJsonDepth([], 0)).toBe(false);
  });

  it('finds the deep branch even when it is not the first one', () => {
    const value = { shallow: 1, deep: nestDeeply(MAX_JSON_DEPTH + 1) };
    expect(exceedsJsonDepth(value)).toBe(true);
  });
});

describe('nestDeeply', () => {
  it('builds the requested shape without recursing', () => {
    expect(nestDeeply(0)).toBe(1);
    expect(nestDeeply(2)).toEqual({ a: { a: 1 } });
    expect(nestDeeply(2, 'array')).toEqual([[1]]);
  });
});
