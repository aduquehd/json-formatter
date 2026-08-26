import { describe, expect, it } from 'vitest';
import {
  analyzeJsonStructure,
  buildSuggestions,
  compileMatcher,
  compileUserRegex,
  DEFAULT_TYPE_FILTERS,
  highlightSegments,
  MAX_PATTERN_LENGTH,
  probeRegexCost,
  REGEX_INPUT_LIMIT,
  REGEX_PROBE_BUDGET_MS,
  searchJson,
  tokenizeWords,
} from './jsonSearch';
import { MAX_JSON_DEPTH, nestDeeply } from './jsonWalk';

const sample = {
  user: {
    name: 'Ada Lovelace',
    nickname: 'ada',
    address: { city: 'London', name: 'home' },
  },
  admin: { name: 'Grace' },
};

describe('searchJson - path pattern filter', () => {
  it('matches the candidate path, not its container (the user\\..* case)', () => {
    const outcome = searchJson(sample, { query: 'name', pathPattern: 'user\\..*' });
    const paths = outcome.results.map((r) => r.path);
    // Before the fix the regex was tested against the container's path, which
    // is '' at the root, so this returned zero results.
    expect(paths).toContain('user.name');
    expect(paths).toContain('user.nickname');
    expect(paths).not.toContain('admin.name');
  });

  it('supports anchored patterns that can only match a leaf', () => {
    const outcome = searchJson(sample, { query: 'name', pathPattern: 'user\\.name$' });
    expect(outcome.results.map((r) => r.path)).toEqual(['user.name']);
  });

  it('finds deeply nested candidates even though no ancestor path matches', () => {
    const nested = { a: { b: { user: { name: 'Ada' } } } };
    const outcome = searchJson(nested, { query: 'name', pathPattern: 'user\\.name$' });
    // Pruning the walk on the path pattern would resurrect the original bug.
    expect(outcome.results.map((r) => r.path)).toEqual(['a.b.user.name']);
  });

  it('reports an invalid path pattern instead of silently ignoring it', () => {
    const outcome = searchJson(sample, { query: 'name', pathPattern: '([' });
    expect(outcome.pathPatternError).toBeTruthy();
  });
});

describe('searchJson - exclude pattern', () => {
  it('drops excluded candidates', () => {
    const outcome = searchJson(sample, { query: 'name', excludePattern: '^admin' });
    expect(outcome.results.map((r) => r.path)).not.toContain('admin.name');
    expect(outcome.results.map((r) => r.path)).toContain('user.name');
  });

  it('prunes the excluded subtree rather than filtering at the end', () => {
    const doc = { keep: { name: 'a' }, skip: { deep: { name: 'b', other: 'c' } } };
    const withExclude = searchJson(doc, { query: 'name', excludePattern: '^skip' });
    const withoutExclude = searchJson(doc, { query: 'name' });
    expect(withExclude.results.map((r) => r.path)).toEqual(['keep.name']);
    // The excluded branch costs nothing: fewer nodes are visited.
    expect(withExclude.visited).toBeLessThan(withoutExclude.visited);
  });

  it('prunes excluded array elements', () => {
    const doc = { items: [{ name: 'a' }, { name: 'b' }] };
    const outcome = searchJson(doc, { query: 'name', excludePattern: '\\[1\\]' });
    expect(outcome.results.map((r) => r.path)).toEqual(['items[0].name']);
  });
});

describe('searchJson - match modes', () => {
  const doc = { Title: 'Hello World', other: 'title case' };

  it('contains is case-insensitive by default and case-sensitive on request', () => {
    expect(searchJson(doc, { query: 'title' }).results.length).toBe(2);
    expect(
      searchJson(doc, { query: 'title', caseSensitive: true }).results.map((r) => r.path)
    ).toEqual(['other']);
  });

  it('exact matches whole strings only', () => {
    expect(searchJson(doc, { query: 'title', mode: 'exact' }).results.map((r) => r.path)).toEqual([
      'Title',
    ]);
    expect(
      searchJson(doc, { query: 'title', mode: 'exact', caseSensitive: true }).results
    ).toHaveLength(0);
  });

  it('starts and ends anchor to the right edge', () => {
    expect(searchJson(doc, { query: 'hello', mode: 'starts' }).results.map((r) => r.path)).toEqual([
      'Title',
    ]);
    expect(searchJson(doc, { query: 'world', mode: 'ends' }).results.map((r) => r.path)).toEqual([
      'Title',
    ]);
    expect(
      searchJson(doc, { query: 'World', mode: 'ends', caseSensitive: true }).results.map(
        (r) => r.path
      )
    ).toEqual(['Title']);
    expect(searchJson(doc, { query: 'world', mode: 'ends', caseSensitive: true }).results).toEqual(
      []
    );
  });

  it('regex mode honours case sensitivity', () => {
    expect(searchJson(doc, { query: '^hello', mode: 'regex' }).results.map((r) => r.path)).toEqual([
      'Title',
    ]);
    expect(
      searchJson(doc, { query: '^hello', mode: 'regex', caseSensitive: true }).results
    ).toEqual([]);
  });

  it('reports an invalid query regex through queryError', () => {
    const outcome = searchJson(doc, { query: '([', mode: 'regex' });
    expect(outcome.queryError).toBeTruthy();
    expect(outcome.results).toEqual([]);
  });

  it('treats a scalar root as a document, not as nothing loaded', () => {
    // `null`, `0`, `false` and `""` are all valid JSON documents. There is
    // nothing to find inside one, but a bad pattern still has to be reported
    // rather than swallowed by an early return.
    for (const document of [null, 0, false, '']) {
      expect(searchJson(document, { query: 'x' }).results).toEqual([]);
      expect(searchJson(document, { query: '([', mode: 'regex' }).queryError?.code).toBe('invalid');
    }
  });
});

describe('compileMatcher - statefulness', () => {
  it('returns the same answer when a compiled regex matcher is reused', () => {
    const { matcher } = compileMatcher('a', 'regex', false);
    // A `g` flag would carry lastIndex across calls and alternate true/false.
    expect(matcher?.matches('abc')).toBe(true);
    expect(matcher?.matches('abc')).toBe(true);
    expect(matcher?.matches('abc')).toBe(true);
  });

  it('matches every sibling key when the walker reuses one compiled regex', () => {
    const doc = { aa: 1, ab: 2, ac: 3, ad: 4 };
    const outcome = searchJson(doc, { query: '^a', mode: 'regex' });
    expect(outcome.results).toHaveLength(4);
  });
});

describe('compileUserRegex - cost guards', () => {
  it('rejects nested quantifiers that can backtrack catastrophically', () => {
    expect(compileUserRegex('(a+)+$', '').regex).toBeNull();
    expect(compileUserRegex('([a-z]+\\d)*', '').error?.code).toBe('nested-quantifier');
  });

  it('still compiles ordinary patterns', () => {
    expect(compileUserRegex('(foo|bar)+', '').regex).toBeInstanceOf(RegExp);
    expect(compileUserRegex('^user\\.\\d+$', '').regex).toBeInstanceOf(RegExp);
    expect(compileUserRegex('\\._id$', 'i').regex).toBeInstanceOf(RegExp);
    expect(compileUserRegex('[a-z]+@[a-z]+\\.[a-z]{2,}', '').regex).toBeInstanceOf(RegExp);
    expect(compileUserRegex('(\\d{1,3}\\.){3}\\d{1,3}', '').regex).toBeInstanceOf(RegExp);
    expect(compileUserRegex('(users|orders)\\[\\d+\\]\\.(id|name)$', '').regex).toBeInstanceOf(
      RegExp
    );
  });

  it('rejects absurdly long patterns', () => {
    const error = compileUserRegex('a'.repeat(500), '').error;
    expect(error?.code).toBe('too-long');
    expect(error?.length).toBe(500);
    expect(error?.limit).toBe(MAX_PATTERN_LENGTH);
  });

  it('reports an uncompilable pattern with the engine own message attached', () => {
    const error = compileUserRegex('([', '').error;
    expect(error?.code).toBe('invalid');
    expect(error?.detail).toBeTruthy();
  });

  it('measures the families the syntactic check cannot see', () => {
    // Each of these is catastrophic and each slips past NESTED_QUANTIFIER: the
    // character class in that pattern cannot span nested parentheses, cross an
    // alternation, or look inside a brace quantifier. The cost probe runs them
    // instead of reading them, so it does not have to recognise the shape.
    for (const pattern of ['((a+))+$', '(a|a)*$', '(a{2,})+$', '^(a|a?)+$']) {
      expect(compileUserRegex(pattern, '').error?.code).toBe('too-slow');
    }
  });

  it('leaves the shapes the syntactic check does catch to it', () => {
    // The cheap check runs first precisely so the probe never has to measure
    // the deeply nested shapes, which are the most expensive to measure.
    for (const pattern of ['(a+)+$', '(?:a+)+$', '(x+x+)+y', '(((a+)+)+)+$']) {
      expect(compileUserRegex(pattern, '').error?.code).toBe('nested-quantifier');
    }
  });

  it('gives up between two probe calls, not after the whole ladder', () => {
    // A clock that jumps past the budget on its second reading. The ladder has
    // fifteen lengths and two strings each; reading the clock only twice proves
    // it stopped after the very first call, which is what keeps the probe from
    // becoming the freeze it exists to prevent.
    let reads = 0;
    const now = () => (reads++ === 0 ? 0 : 10_000);
    expect(probeRegexCost(/^a+$/, '^a+$', now)).toBe(true);
    expect(reads).toBe(2);
  });

  it('costs a fraction of its own budget on ordinary patterns', () => {
    // The probe is only tolerable if it is invisible on real queries: this is
    // the margin that keeps a loaded machine from refusing them.
    const startedAt = Date.now();
    for (let i = 0; i < 20; i++) compileUserRegex('^(GET|POST)\\s/api/v\\d+/users$', 'i');
    expect(Date.now() - startedAt).toBeLessThan(20 * REGEX_PROBE_BUDGET_MS);
  });
});

describe('regex mode - hostile patterns', () => {
  // 4,000 a's followed by one character that cannot match: the shape every
  // catastrophic-backtracking demo uses, and long enough that a single
  // unguarded evaluation would not finish this decade.
  const hostileValue = `${'a'.repeat(4_000)}!`;
  const doc = { note: hostileValue, other: 'plain' };

  it.each(['((a+))+$', '(a|a)*$'])('refuses %s instead of hanging on it', (pattern) => {
    const startedAt = Date.now();
    const outcome = searchJson(doc, { query: pattern, mode: 'regex' });
    const elapsed = Date.now() - startedAt;

    // Assert the mechanism as well as the clock: if some later change makes
    // these patterns cheap for an unrelated reason, the timing alone would keep
    // passing while the guard was gone.
    expect(outcome.queryError?.code).toBe('too-slow');
    expect(outcome.results).toEqual([]);
    // Unguarded this is hours; the bound is generous so a busy CI box is fine.
    expect(elapsed).toBeLessThan(1_000);
  });

  it('runs an accepted pattern against only the first few KB of a value', () => {
    const long = { note: `${'a'.repeat(REGEX_INPUT_LIMIT)}needle` };
    // The clamp is the backstop for whatever the heuristics let through, and it
    // is a real trade-off: a match past the clamp is reported as no match. A
    // literal search still finds it, because literal modes are linear and are
    // handed the whole value.
    expect(searchJson(long, { query: 'needle', mode: 'regex' }).results).toEqual([]);
    expect(searchJson(long, { query: 'needle' }).results.map((r) => r.path)).toEqual(['note']);
  });

  it('still matches inside a value that fits under the clamp', () => {
    const short = { note: `${'a'.repeat(REGEX_INPUT_LIMIT - 10)}needle` };
    expect(
      searchJson(short, { query: 'needle$', mode: 'regex' }).results.map((r) => r.path)
    ).toEqual(['note']);
  });

  it('reads the clock before every value once a user regex is in play', () => {
    const wide = Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => [`key${i}`, `value${i}`])
    );
    // A clock that jumps past the budget on its second reading. It is only ever
    // read twice if the walker asks per value; the sampled interval would not
    // ask again for another thousand nodes, and a single pathological match
    // would then be paid ninety-nine more times.
    const jumpAfterFirstRead = () => {
      let reads = 0;
      return () => (reads++ === 0 ? 0 : 10_000);
    };

    const guarded = searchJson(wide, {
      query: 'value',
      mode: 'regex',
      timeBudgetMs: 100,
      now: jumpAfterFirstRead(),
    });
    expect(guarded.budgetExhausted).toBe(true);
    expect(guarded.visited).toBe(1);

    // Literal modes keep the sampled interval: `now()` per node would be pure
    // overhead there, so this document finishes despite the same clock.
    const literal = searchJson(wide, {
      query: 'value',
      timeBudgetMs: 100,
      now: jumpAfterFirstRead(),
    });
    expect(literal.budgetExhausted).toBe(false);
    expect(literal.results).toHaveLength(100);
  });
});

describe('searchJson - result cap', () => {
  const wide = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`key${i}`, 'value']));

  it('caps materialised results but still reports the true total', () => {
    const outcome = searchJson(wide, { query: 'key', resultLimit: 10 });
    expect(outcome.results).toHaveLength(10);
    expect(outcome.totalMatches).toBe(40);
    expect(outcome.truncated).toBe(true);
  });

  it('does not flag truncation when everything fits', () => {
    const outcome = searchJson(wide, { query: 'key', resultLimit: 100 });
    expect(outcome.results).toHaveLength(40);
    expect(outcome.truncated).toBe(false);
  });

  it('stops walking once the node budget is spent', () => {
    const outcome = searchJson(wide, { query: 'key', nodeBudget: 5 });
    expect(outcome.budgetExhausted).toBe(true);
    expect(outcome.totalMatches).toBeLessThan(40);
    expect(outcome.visited).toBeLessThanOrEqual(6);
  });
});

describe('searchJson - filters', () => {
  const doc = {
    label: 'label text',
    count: 42,
    flag: true,
    empty: null,
    nested: { label: 'inner label' },
    list: ['label item'],
  };

  it('type filters hide entries without stopping the walk', () => {
    // Before the fix, unchecking "objects" returned nothing at all because the
    // document root is itself an object.
    const outcome = searchJson(doc, {
      query: 'label',
      filters: { ...DEFAULT_TYPE_FILTERS, objects: false },
    });
    const paths = outcome.results.map((r) => r.path);
    expect(paths).toContain('nested.label');
    expect(paths).not.toContain('nested');
  });

  it('honours the numbers, booleans and nulls filters', () => {
    expect(searchJson(doc, { query: '42' }).results.map((r) => r.path)).toEqual(['count']);
    expect(
      searchJson(doc, { query: '42', filters: { ...DEFAULT_TYPE_FILTERS, numbers: false } }).results
    ).toEqual([]);
    expect(searchJson(doc, { query: 'true' }).results.map((r) => r.path)).toEqual(['flag']);
    expect(searchJson(doc, { query: 'null' }).results.map((r) => r.path)).toEqual(['empty']);
  });

  it('limits the search target to keys or values', () => {
    const keysOnly = searchJson(doc, { query: 'label', target: 'keys' });
    expect(keysOnly.results.every((r) => r.type === 'key')).toBe(true);
    expect(keysOnly.results.map((r) => r.path)).toEqual(['label', 'nested.label']);

    const valuesOnly = searchJson(doc, { query: 'label', target: 'values' });
    expect(valuesOnly.results.every((r) => r.type === 'value')).toBe(true);
  });

  it('reports the data type even when only keys are searched', () => {
    const outcome = searchJson({ label: [1, 2] }, { query: 'label', target: 'keys' });
    expect(outcome.results[0].dataType).toBe('array');
  });

  it('applies string length filters to value matches only', () => {
    const lengths = { note: 'note', other: 'a much longer note value' };
    const outcome = searchJson(lengths, { query: 'note', minLength: 10 });
    // The short value is excluded from value matching but its key still counts;
    // the long value matches by value only.
    expect(outcome.results.map((r) => [r.path, r.type])).toEqual([
      ['note', 'key'],
      ['other', 'value'],
    ]);
    expect(
      searchJson(lengths, { query: 'note', maxLength: 10 }).results.map((r) => [r.path, r.type])
    ).toEqual([['note', 'both']]);
  });

  it('stops descending past maxDepth', () => {
    const deep = { a: { label: 1, b: { label: 2 } } };
    const outcome = searchJson(deep, { query: 'label', maxDepth: 1 });
    expect(outcome.results.map((r) => r.path)).toEqual(['a.label']);
  });
});

describe('analyzeJsonStructure - word frequency', () => {
  it('counts prototype-named words as numbers, not inherited members', () => {
    // Built through JSON.parse: a `__proto__` object literal sets the prototype
    // instead of creating an own property, which would make this vacuous.
    const doc = JSON.parse(
      '{"constructor": "constructor toString", "__proto__": "hasOwnProperty", "x": "valueOf"}'
    );
    expect(Object.keys(doc)).toContain('__proto__');

    const { wordFrequencies } = analyzeJsonStructure(doc);
    const byWord = new Map(wordFrequencies.map((w) => [w.word, w]));

    expect(byWord.get('constructor')?.count).toBe(2);
    expect(byWord.get('tostring')?.count).toBe(1);
    expect(byWord.get('hasownproperty')?.count).toBe(1);
    expect(byWord.get('__proto__')).toBeUndefined(); // underscores are separators
    for (const word of wordFrequencies) {
      expect(Number.isFinite(word.percentage)).toBe(true);
      expect(typeof word.count).toBe('number');
    }
  });

  it('produces percentages that sum to 100 across all tracked words', () => {
    const { wordFrequencies } = analyzeJsonStructure({ alpha: 'beta gamma', delta: 'beta' });
    const total = wordFrequencies.reduce((sum, w) => sum + w.percentage, 0);
    expect(total).toBeCloseTo(100, 5);
  });

  it('tokenises non-ASCII scripts', () => {
    const doc = {
      es: 'año pequeño canción',
      hi: 'नमस्ते दुनिया',
      ta: 'வணக்கம் உலகம்',
    };
    const words = analyzeJsonStructure(doc).wordFrequencies.map((w) => w.word);
    // The ASCII-only tokeniser produced an empty list for every one of these.
    expect(words).toContain('año');
    expect(words).toContain('pequeño');
    expect(words).toContain('canción');
    expect(words).toContain('नमस्ते');
    expect(words).toContain('दुनिया');
    expect(words).toContain('வணக்கம்');
  });

  it('keeps space-less scripts as a single token (deliberate simplification)', () => {
    // CJK has no word separators; segmenting it properly is out of scope, so a
    // sentence stays one token rather than vanishing as it did before.
    expect(tokenizeWords('你好世界')).toEqual(['你好世界']);
  });

  it('ignores tokens shorter than three characters', () => {
    expect(tokenizeWords('a bb ccc dddd')).toEqual(['ccc', 'dddd']);
  });
});

describe('analyzeJsonStructure - structure', () => {
  it('reports keys, values, depth and type counts', () => {
    const analysis = analyzeJsonStructure({ a: 1, b: { c: 'x', d: [true, null] } });
    expect(analysis.totalKeys).toBe(4);
    expect(analysis.maxDepth).toBe(3);
    expect(analysis.dataTypes.object).toBe(2);
    expect(analysis.dataTypes.array).toBe(1);
    expect(analysis.dataTypes.string).toBe(1);
  });

  it('caps the stored path sample and says so', () => {
    const wide = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`k${i}`, i]));
    const analysis = analyzeJsonStructure(wide, { pathLimit: 10 });
    expect(analysis.paths).toHaveLength(10);
    expect(analysis.pathsTruncated).toBe(true);
    expect(analysis.totalKeys).toBe(50); // counting is unaffected by the cap
  });

  it('caps the number of distinct tracked words', () => {
    const doc = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`word${i}aaa`, 1]));
    const analysis = analyzeJsonStructure(doc, { wordLimit: 5, topWords: 100 });
    expect(analysis.wordFrequencies).toHaveLength(5);
  });
});

describe('buildSuggestions', () => {
  const paths = Array.from({ length: 100 }, (_, i) => `user.name${i}`);

  it('returns at most five path suggestions and stops scanning early', () => {
    const suggestions = buildSuggestions('name', paths, []);
    expect(suggestions).toHaveLength(5);
    expect(suggestions[0]).toBe('user.name0');
  });

  it('merges word suggestions and de-duplicates', () => {
    const suggestions = buildSuggestions(
      'nam',
      ['name'],
      [
        { word: 'name', count: 3, percentage: 1 },
        { word: 'named', count: 1, percentage: 1 },
      ]
    );
    expect(suggestions).toEqual(['name', 'named']);
  });

  it('returns nothing for an empty query', () => {
    expect(buildSuggestions('', paths, [])).toEqual([]);
  });
});

describe('highlightSegments', () => {
  it('highlights every occurrence in contains mode', () => {
    expect(highlightSegments('abcabc', 'bc', 'contains', false)).toEqual([
      { text: 'a', match: false },
      { text: 'bc', match: true },
      { text: 'a', match: false },
      { text: 'bc', match: true },
    ]);
  });

  it('respects caseSensitive', () => {
    expect(highlightSegments('Hello hello', 'hello', 'contains', true)).toEqual([
      { text: 'Hello ', match: false },
      { text: 'hello', match: true },
    ]);
    expect(
      highlightSegments('Hello hello', 'hello', 'contains', false).filter((s) => s.match)
    ).toHaveLength(2);
  });

  it('highlights nothing partial in exact mode', () => {
    expect(highlightSegments('abcdef', 'abc', 'exact', false)).toEqual([
      { text: 'abcdef', match: false },
    ]);
    expect(highlightSegments('abc', 'abc', 'exact', false)).toEqual([{ text: 'abc', match: true }]);
  });

  it('anchors starts and ends modes', () => {
    expect(highlightSegments('abcdef', 'abc', 'starts', false)).toEqual([
      { text: 'abc', match: true },
      { text: 'def', match: false },
    ]);
    expect(highlightSegments('abcdef', 'def', 'ends', false)).toEqual([
      { text: 'abc', match: false },
      { text: 'def', match: true },
    ]);
    expect(highlightSegments('abcdef', 'abc', 'ends', false)).toEqual([
      { text: 'abcdef', match: false },
    ]);
  });

  it('leaves regex mode untouched', () => {
    expect(highlightSegments('abc', 'a.c', 'regex', false)).toEqual([
      { text: 'abc', match: false },
    ]);
  });
});

/* ------------------------------------------------------------------ *
 * Depth safety
 * ------------------------------------------------------------------ */

describe('depth guard', () => {
  it('searches a 100,000-level document instead of throwing RangeError', () => {
    const deep = { shallow: 'needle', deep: nestDeeply(100_000, 'object') };
    const outcome = searchJson(deep, { query: 'needle' });

    expect(outcome.depthExceeded).toBe(true);
    // The rest of the document was still searched in full.
    expect(outcome.results.map((r) => r.path)).toEqual(['shallow']);
    expect(outcome.budgetExhausted).toBe(false);
  });

  it('analyses a 100,000-level document instead of throwing RangeError', () => {
    const analysis = analyzeJsonStructure({ top: 'value', deep: nestDeeply(100_000, 'array') });

    expect(analysis.depthExceeded).toBe(true);
    expect(analysis.maxDepth).toBeLessThanOrEqual(MAX_JSON_DEPTH);
    expect(analysis.paths).toContain('top');
  });

  it('reports nothing skipped for a document that fits', () => {
    const atLimit = nestDeeply(MAX_JSON_DEPTH - 1, 'object');
    expect(searchJson({ a: atLimit }, { query: '1' }).depthExceeded).toBe(false);
    expect(analyzeJsonStructure({ a: atLimit }).depthExceeded).toBe(false);
  });

  it('leaves wide-but-shallow documents alone', () => {
    const wide = Array.from({ length: 5_000 }, (_, i) => ({ name: `row-${i}` }));
    const outcome = searchJson(wide, { query: 'row-4999' });
    expect(outcome.depthExceeded).toBe(false);
    expect(outcome.results).toHaveLength(1);
    expect(analyzeJsonStructure(wide).depthExceeded).toBe(false);
  });

  it('does not change results for ordinary data', () => {
    const outcome = searchJson(sample, { query: 'name' });
    expect(outcome.depthExceeded).toBe(false);
    expect(outcome.results.map((r) => r.path).sort()).toEqual(
      ['admin.name', 'user.address.name', 'user.name', 'user.nickname'].sort()
    );
  });
});

describe('depth guard - the boundary both walkers stop at', () => {
  // `nestDeeply(n)` wraps the scalar `1` in n containers, so the containers
  // occupy levels 0 … n-1 and the scalar sits at level n. The ceiling is about
  // the level a container's *members* land on, which is what makes both walkers
  // agree: the search never recurses into a scalar, so a guard on entry would
  // let it report a match one level past the limit that the analysis pass, which
  // does recurse into scalars, called too deep.
  const walk = (levels: number) => {
    const doc = nestDeeply(levels, 'object');
    return { search: searchJson(doc, { query: '1' }), analysis: analyzeJsonStructure(doc) };
  };

  it('one level short of the limit: everything searched', () => {
    const { search, analysis } = walk(MAX_JSON_DEPTH - 1);
    expect(search.depthExceeded).toBe(false);
    expect(search.results).toHaveLength(1);
    expect(analysis.depthExceeded).toBe(false);
    expect(analysis.maxDepth).toBe(MAX_JSON_DEPTH - 1);
  });

  it('exactly at the limit: still everything searched', () => {
    const { search, analysis } = walk(MAX_JSON_DEPTH);
    expect(search.depthExceeded).toBe(false);
    expect(search.results).toHaveLength(1);
    expect(analysis.depthExceeded).toBe(false);
    expect(analysis.maxDepth).toBe(MAX_JSON_DEPTH);
  });

  it('one level past the limit: both stop, and both say so', () => {
    const { search, analysis } = walk(MAX_JSON_DEPTH + 1);
    // Before the fix these disagreed on this exact document: the search
    // returned results=1 with depthExceeded=false — a match one level past its
    // own stated limit, reported as though nothing had been skipped — while the
    // analysis returned maxDepth=512 with depthExceeded=true.
    expect(search.depthExceeded).toBe(true);
    expect(search.results).toEqual([]);
    expect(analysis.depthExceeded).toBe(true);
    expect(analysis.maxDepth).toBe(MAX_JSON_DEPTH);
  });

  it('reports no skipped branch for an empty container sitting at the limit', () => {
    // The innermost container is exactly at the ceiling and has no members, so
    // there is nothing below it to skip and nothing to warn about.
    let doc: unknown = {};
    for (let i = 0; i < MAX_JSON_DEPTH; i++) doc = { a: doc };
    expect(searchJson(doc, { query: 'a' }).depthExceeded).toBe(false);
    expect(analyzeJsonStructure(doc).depthExceeded).toBe(false);
  });
});
