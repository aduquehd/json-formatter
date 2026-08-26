/**
 * Pure search engine behind SearchView.
 *
 * Everything here is side-effect free so it can be unit tested: the walker, the
 * match predicate, the structure analysis, the suggestion list and the
 * highlighter. The React component only owns state and rendering.
 *
 * ## Hostile regexes
 *
 * Regex mode hands a user-written pattern to the engine, and a backtracking
 * engine can spend exponential time on patterns that take three seconds to
 * type: `(a+)+$`, `((a+))+$`, `(a|a)*$`, `^(\w+\s?)*$`. Measured here,
 * `((a+))+$` against `'a'.repeat(n) + '!'` costs 47 ms at n=20 and 2.6 s at
 * n=28 — roughly 4x per two added characters, so hours by n=40. Nothing in this
 * module can preempt a single `RegExp.test` call: the node budget and the time
 * budget are both checked *between* matches, so once the engine is inside one
 * pathological call the tab is frozen until it returns, and the user loses the
 * document sitting in the editor.
 *
 * There is no sound in-thread defence — the real fix is a Web Worker, which is
 * terminable, and is left to the performance phase (see the follow-up note on
 * {@link compileUserRegex}). What is here instead is defence in depth, ordered
 * cheapest first. Treat it as raising the cost of an accident, not as a
 * guarantee: polynomial patterns such as `a*a*a*b` or `.*.*.*=` have no
 * quantified group for the syntactic hint to see and stay cheap at the probe's
 * ladder length, so they pass every layer below. They are slow, not hanging —
 * the exponential families are what these layers actually stop.
 *
 * 1. {@link MAX_PATTERN_LENGTH} — refuse patterns nobody types by hand.
 * 2. {@link NESTED_QUANTIFIER} — a cheap syntactic hint that catches the
 *    textbook shapes, including the deeply nested ones the probe below would be
 *    slowest to measure. It is a hint, not a proof: it cannot see across nested
 *    parentheses (`((a+))+`), across alternation (`(a|a)*`) or into brace
 *    quantifiers (`(a{2,})+`).
 * 3. {@link probeRegexCost} — actually *runs* the compiled pattern against short
 *    adversarial strings of escalating length, on an escalating clock budget,
 *    and refuses it if the cost blows up. This is the check that catches the
 *    families the syntactic hint misses, and it is empirical rather than
 *    syntactic, so it does not have to predict the shape of the attack.
 * 4. {@link REGEX_INPUT_LIMIT} — whatever gets through is only ever run against
 *    a few KB of each value, so no single match scales with document size.
 *    Note this bounds the input, NOT the cost: a polynomial pattern is still
 *    polynomial in that few KB.
 * 5. A per-value clock check in {@link searchJson} — one slow match aborts the
 *    walk instead of being repeated for every remaining value.
 *
 * Together these make the known hazards safe and the unknown ones survivable.
 * They do not make an accepted pattern *verified*: layers 2 and 3 are
 * heuristics, and the messages they produce say the pattern was not run, never
 * that the ones that are run are safe.
 */

import { isWithinJsonDepth, MAX_JSON_DEPTH } from './jsonWalk';

export type SearchMode = 'contains' | 'exact' | 'starts' | 'ends' | 'regex';
export type SearchTarget = 'both' | 'keys' | 'values';

export interface SearchResult {
  type: 'key' | 'value' | 'both';
  path: string;
  key: string;
  value: unknown;
  depth: number;
  dataType: string;
}

export interface TypeFilters {
  strings: boolean;
  numbers: boolean;
  booleans: boolean;
  objects: boolean;
  arrays: boolean;
  nulls: boolean;
}

export interface SearchOptions {
  query: string;
  mode?: SearchMode;
  target?: SearchTarget;
  caseSensitive?: boolean;
  /** -1 = unlimited */
  maxDepth?: number;
  /** 0 = no minimum. Applies to string values only. */
  minLength?: number;
  /** -1 = no maximum. Applies to string values only. */
  maxLength?: number;
  pathPattern?: string;
  excludePattern?: string;
  filters?: TypeFilters;
  /** How many results are materialised. Matches beyond this are counted, not kept. */
  resultLimit?: number;
  /** Hard ceiling on visited nodes so a huge document cannot freeze the tab. */
  nodeBudget?: number;
  /** Wall-clock ceiling, checked periodically. Pass Infinity to disable. */
  timeBudgetMs?: number;
  /**
   * Hard nesting ceiling. Not a user filter like `maxDepth` — this is the depth
   * past which recursion would blow the stack, so the walk stops and says so.
   */
  depthLimit?: number;
  /** Injectable clock, for deterministic tests. */
  now?: () => number;
}

export interface SearchOutcome {
  /** At most `resultLimit` entries. */
  results: SearchResult[];
  /** Total matches seen. A lower bound when `budgetExhausted` is true. */
  totalMatches: number;
  /** True when `totalMatches` exceeds what `results` holds. */
  truncated: boolean;
  /** True when the walk stopped early: results and counts are incomplete. */
  budgetExhausted: boolean;
  /**
   * True when some branch was nested deeper than `depthLimit` and was left
   * unsearched. Independent of `budgetExhausted`: the rest of the document was
   * still searched in full.
   */
  depthExceeded: boolean;
  /** Number of nodes visited before the walk finished or gave up. */
  visited: number;
  queryError: RegexIssue | null;
  pathPatternError: RegexIssue | null;
  excludePatternError: RegexIssue | null;
}

/** Why a user-supplied pattern was refused. */
export type RegexIssueCode =
  /** Longer than {@link MAX_PATTERN_LENGTH}. */
  | 'too-long'
  /** A quantified group that itself contains a quantifier, e.g. `(a+)+`. */
  | 'nested-quantifier'
  /** Measured as catastrophically slow by {@link probeRegexCost}. */
  | 'too-slow'
  /** The engine refused to compile it. */
  | 'invalid';

/**
 * A refused pattern, as a code plus the numbers a message needs.
 *
 * Deliberately not a sentence: this module has no locale, and the twelve
 * translations of each message live with the component that renders them.
 */
export interface RegexIssue {
  code: RegexIssueCode;
  /** The pattern's own length. Set for `too-long`. */
  length?: number;
  /** The limit the pattern broke. Set for `too-long`. */
  limit?: number;
  /**
   * The engine's own explanation, set for `invalid`. Untranslated by nature —
   * it comes from the JS runtime, not from us.
   */
  detail?: string;
}

export interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

export interface StructureAnalysis {
  /** Sampled key paths, capped at `pathLimit`. */
  paths: string[];
  pathsTruncated: boolean;
  totalKeys: number;
  totalValues: number;
  /** Deepest level reached. Never exceeds `depthLimit` — see `depthExceeded`. */
  maxDepth: number;
  /** True when the document nests deeper than `depthLimit`, so the counts are partial. */
  depthExceeded: boolean;
  dataTypes: Record<string, number>;
  wordFrequencies: WordFrequency[];
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

export const DEFAULT_RESULT_LIMIT = 500;
/** Generous enough that ordinary documents finish; the time budget is the real governor. */
export const DEFAULT_NODE_BUDGET = 500_000;
export const DEFAULT_TIME_BUDGET_MS = 1_500;
/** Longer user patterns are rejected rather than compiled. */
export const MAX_PATTERN_LENGTH = 200;
/**
 * Longest string a user-supplied regex is ever run against.
 *
 * A match found past a few KB of a single value cannot be shown usefully — the
 * result card truncates long values anyway — so the tail is worth less than the
 * time a backtracking engine can spend on it.
 */
export const REGEX_INPUT_LIMIT = 4_096;
/** How long {@link probeRegexCost} may spend before calling a pattern too slow. */
export const REGEX_PROBE_BUDGET_MS = 5;
/** Key paths kept for the sample list and the suggestion box. */
export const DEFAULT_PATH_LIMIT = 5_000;
/** Distinct words tracked by the frequency counter. */
export const DEFAULT_WORD_LIMIT = 20_000;
export const DEFAULT_TOP_WORDS = 30;
/** Words shorter than this are ignored by the frequency counter. */
export const MIN_WORD_LENGTH = 3;

const TIME_CHECK_INTERVAL = 1_024;

/**
 * Unicode-aware tokeniser. Splits on anything that is not a letter, a number or
 * a combining mark, so Devanagari, Tamil, Cyrillic and accented Latin all
 * tokenise correctly - marks matter, because dropping them would cut Indic
 * words apart at every virama and vowel sign. Scripts written without spaces
 * (Chinese, Japanese) collapse into one long token: a deliberate
 * simplification, see the note in tokenizeWords' tests.
 */
const WORD_SEPARATOR = /[^\p{L}\p{N}\p{M}]+/u;

/**
 * Cheap syntactic hint: a quantified group that itself contains a quantifier,
 * e.g. `(a+)+`, `(a*)*`, `([a-z]+\d)*`.
 *
 * A hint, not a proof. The character class cannot span nested parentheses or
 * brace quantifiers, so `((a+))+`, `(a|a)*` and `(a{2,})+` all sail past it —
 * which is exactly why it is the second line of defence and not the only one.
 * It is kept because it is free, and because it catches the deeply nested
 * shapes (`(((a+)+)+)+`) that {@link probeRegexCost} would be slowest to
 * measure. See the ReDoS note in the module docs.
 */
const NESTED_QUANTIFIER = /\([^()]*[*+][^()]*\)\s*[*+]/;

/**
 * Lengths the cost probe escalates through.
 *
 * Escalation is what keeps the probe itself cheap: catastrophic cost grows by
 * about 4x per two added characters, so the budget is spent at the first length
 * that blows up, and the step that finally exceeds it costs roughly one growth
 * factor more than the step before — tens of milliseconds, not seconds. Running
 * straight at the longest length would hand a pathological pattern the very
 * freeze this is meant to prevent.
 */
const PROBE_LENGTHS = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
/** Appended to each probe string so an anchored pattern has to fail, not match. */
const PROBE_SENTINELS = ['!', '@', '#', '~'];
/** Used when a pattern contains no literal characters to build a probe from. */
const PROBE_DEFAULT_SEED = 'a';
/** Distinct literal characters taken from the pattern to build probe strings. */
const PROBE_MAX_SEEDS = 3;

/**
 * The literal characters a probe string should be built from.
 *
 * Backtracking blows up on input the pattern *almost* matches, so the probe is
 * built out of the pattern's own literals: `(x+x+)+y` is only slow on a run of
 * x's. Escaped characters are skipped — `\d` contributes a `d` that means
 * nothing to the matcher — and `a` is the fallback for a pattern made entirely
 * of classes and metacharacters, which is what `\w`, `\s` and `.` all accept.
 */
function probeSeeds(pattern: string): string[] {
  const seeds = new Set<string>();
  for (let i = 0; i < pattern.length && seeds.size < PROBE_MAX_SEEDS; i++) {
    const char = pattern[i];
    if (char === '\\') {
      i++;
      continue;
    }
    if (/[\p{L}\p{N}]/u.test(char)) seeds.add(char);
  }
  return seeds.size > 0 ? Array.from(seeds) : [PROBE_DEFAULT_SEED];
}

/**
 * Is this pattern catastrophically slow?
 *
 * Runs the compiled pattern against short adversarial strings of escalating
 * length and gives up the moment the accumulated time passes
 * {@link REGEX_PROBE_BUDGET_MS}. Empirical rather than syntactic, so it catches
 * the whole family of ambiguous patterns without having to recognise their
 * shape: measured here it refuses `((a+))+$`, `(a|a)*$`, `(a+)+$`, `(?:a+)+$`,
 * `(a{2,})+$`, `(x+x+)+y`, `^(\w+\s?)*$` and `^(a|a?)+$`, while ordinary
 * patterns finish the whole ladder in under 0.05 ms — a hundredfold margin
 * below the budget, so a loaded machine does not start refusing real queries.
 *
 * A negative answer is not a safety proof: a pattern whose blowup needs input
 * this probe never guesses will still be accepted. {@link REGEX_INPUT_LIMIT} and
 * the per-value clock check in {@link searchJson} are what bound that case.
 */
export function probeRegexCost(
  regex: RegExp,
  pattern: string,
  now: () => number = Date.now
): boolean {
  const seeds = probeSeeds(pattern);
  const sentinel = PROBE_SENTINELS.find((char) => !pattern.includes(char)) ?? ' ';
  const mixed = seeds.join('');
  const startedAt = now();

  for (const length of PROBE_LENGTHS) {
    const runs = [
      seeds[0].repeat(length) + sentinel,
      mixed.repeat(Math.ceil(length / mixed.length)).slice(0, length) + sentinel,
    ];
    for (const run of runs) {
      regex.test(run);
      // Checked after every single call: the budget only means something if the
      // ladder can stop between two lengths, and between two strings.
      if (now() - startedAt > REGEX_PROBE_BUDGET_MS) return true;
    }
  }
  return false;
}

export const DEFAULT_TYPE_FILTERS: TypeFilters = {
  strings: true,
  numbers: true,
  booleans: true,
  objects: true,
  arrays: true,
  nulls: true,
};

export function dataTypeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      return 'object';
    default:
      return 'unknown';
  }
}

function isTypeEnabled(dataType: string, filters: TypeFilters): boolean {
  switch (dataType) {
    case 'string':
      return filters.strings;
    case 'number':
      return filters.numbers;
    case 'boolean':
      return filters.booleans;
    case 'object':
      return filters.objects;
    case 'array':
      return filters.arrays;
    case 'null':
      return filters.nulls;
    default:
      return true;
  }
}

/**
 * Compiles a user-supplied pattern, refusing shapes that are cheap to type and
 * expensive to run. Never uses the `g` flag: a global regex carries `lastIndex`
 * between `.test()` calls, so a compiled-once matcher would alternate between
 * matching and not matching the same string.
 *
 * The checks run cheapest first — length, then the syntactic hint, then
 * compilation, then the cost probe, which is the only one that has to run the
 * pattern. A refusal says the pattern was *not run*; acceptance is not a
 * verdict that the pattern is safe. See the ReDoS note in the module docs.
 *
 * Follow-up: the terminable answer is to run the walk in a Web Worker, so a
 * pattern that gets past every heuristic costs a `worker.terminate()` instead of
 * the tab. That is a structural change and belongs to the performance phase.
 */
export function compileUserRegex(
  pattern: string,
  flags: string
): { regex: RegExp | null; error: RegexIssue | null } {
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return {
      regex: null,
      error: { code: 'too-long', length: pattern.length, limit: MAX_PATTERN_LENGTH },
    };
  }
  if (NESTED_QUANTIFIER.test(pattern)) {
    return { regex: null, error: { code: 'nested-quantifier' } };
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (e) {
    return {
      regex: null,
      error: { code: 'invalid', detail: e instanceof Error ? e.message : undefined },
    };
  }

  if (probeRegexCost(regex, pattern)) return { regex: null, error: { code: 'too-slow' } };
  return { regex, error: null };
}

export interface Matcher {
  matches(text: string): boolean;
}

/**
 * Wraps a compiled user regex so it never sees more than
 * {@link REGEX_INPUT_LIMIT} characters.
 *
 * Only regexes are clamped. A truncated string would make `endsWith` silently
 * *wrong* rather than merely incomplete, so the literal modes keep the whole
 * value — they are linear anyway, and cost nothing on a long one.
 */
export function regexMatcher(regex: RegExp): Matcher {
  return {
    matches: (text) =>
      regex.test(text.length > REGEX_INPUT_LIMIT ? text.slice(0, REGEX_INPUT_LIMIT) : text),
  };
}

/**
 * Builds the match predicate once per search instead of per compared value.
 */
export function compileMatcher(
  query: string,
  mode: SearchMode,
  caseSensitive: boolean
): { matcher: Matcher | null; error: RegexIssue | null } {
  if (mode === 'regex') {
    const { regex, error } = compileUserRegex(query, caseSensitive ? '' : 'i');
    if (!regex) return { matcher: null, error };
    return { matcher: regexMatcher(regex), error: null };
  }

  const needle = caseSensitive ? query : query.toLowerCase();
  const prepare = (text: string) => (caseSensitive ? text : text.toLowerCase());

  switch (mode) {
    case 'exact':
      return { matcher: { matches: (text) => prepare(text) === needle }, error: null };
    case 'starts':
      return { matcher: { matches: (text) => prepare(text).startsWith(needle) }, error: null };
    case 'ends':
      return { matcher: { matches: (text) => prepare(text).endsWith(needle) }, error: null };
    default:
      return { matcher: { matches: (text) => prepare(text).includes(needle) }, error: null };
  }
}

function emptyOutcome(overrides: Partial<SearchOutcome> = {}): SearchOutcome {
  return {
    results: [],
    totalMatches: 0,
    truncated: false,
    budgetExhausted: false,
    depthExceeded: false,
    visited: 0,
    queryError: null,
    pathPatternError: null,
    excludePatternError: null,
    ...overrides,
  };
}

/**
 * Walks the document once and collects matches.
 *
 * Path filtering: `pathPattern` decides whether a *candidate* is kept, tested
 * against that candidate's own path - never against its container's path, which
 * would make any pattern that does not also match the empty string return zero
 * results. `excludePattern` is the only pattern that prunes, and it prunes the
 * whole subtree so excluded branches cost nothing.
 */
export function searchJson(json: unknown, options: SearchOptions): SearchOutcome {
  const {
    query,
    mode = 'contains',
    target = 'both',
    caseSensitive = false,
    maxDepth = -1,
    minLength = 0,
    maxLength = -1,
    pathPattern = '',
    excludePattern = '',
    filters = DEFAULT_TYPE_FILTERS,
    resultLimit = DEFAULT_RESULT_LIMIT,
    nodeBudget = DEFAULT_NODE_BUDGET,
    timeBudgetMs = DEFAULT_TIME_BUDGET_MS,
    depthLimit = MAX_JSON_DEPTH,
    now = Date.now,
  } = options;

  // Only an empty query short-circuits: compiling one would build a matcher
  // that matches every string. A `null`, `0`, `false` or `""` document is a
  // document, and the walk below simply finds nothing inside a scalar root —
  // bailing out here instead would swallow the pattern errors the user needs.
  if (!query.trim()) return emptyOutcome();

  const { matcher, error: queryError } = compileMatcher(query, mode, caseSensitive);
  if (!matcher) return emptyOutcome({ queryError });

  // Path filters stay case-insensitive regardless of the query's own setting.
  const path = pathPattern
    ? compileUserRegex(pathPattern, 'i')
    : { regex: null, error: null as RegexIssue | null };
  const exclude = excludePattern
    ? compileUserRegex(excludePattern, 'i')
    : { regex: null, error: null as RegexIssue | null };

  const results: SearchResult[] = [];
  let totalMatches = 0;
  let visited = 0;
  let budgetExhausted = false;
  let depthExceeded = false;
  const startedAt = now();

  // A user regex can cost more on one value than a hundred thousand literal
  // comparisons do, so the clock is read before *every* value rather than every
  // few thousand: one pathological match then aborts the walk instead of being
  // paid again for each of the values behind it. Literal modes keep the sampled
  // interval, where `now()` per node would be pure overhead.
  const timeCheckInterval =
    mode === 'regex' || pathPattern || excludePattern ? 1 : TIME_CHECK_INTERVAL;

  const consumeBudget = (): boolean => {
    visited++;
    if (visited > nodeBudget) {
      budgetExhausted = true;
      return false;
    }
    if (visited % timeCheckInterval === 0 && now() - startedAt > timeBudgetMs) {
      budgetExhausted = true;
      return false;
    }
    return true;
  };

  const matchesValue = (value: unknown, dataType: string): boolean => {
    switch (dataType) {
      case 'string': {
        const text = value as string;
        // Length filters constrain value matches only; a key match on the same
        // entry is still reported.
        if (minLength > 0 && text.length < minLength) return false;
        if (maxLength !== -1 && text.length > maxLength) return false;
        return matcher.matches(text);
      }
      case 'number':
      case 'boolean':
        return matcher.matches(String(value));
      case 'null':
        return matcher.matches('null');
      default:
        // Objects and arrays are matched through their children, not by value.
        return false;
    }
  };

  /**
   * The stack ceiling, asked once per container about the level its members
   * occupy — every member of a container sits exactly one level down, scalar
   * leaves included. Applied here rather than on entry to `walk` so it is the
   * same test `analyzeJsonStructure` applies: this walker never recurses into a
   * scalar, so an entry guard would let it report a match one level past the
   * limit while the analysis pass called the identical document too deep.
   * Asked only when there is something to skip, so an empty container sitting
   * exactly at the limit does not report a phantom skipped branch.
   */
  const membersWithinLimit = (depth: number): boolean => {
    if (isWithinJsonDepth(depth + 1, depthLimit)) return true;
    depthExceeded = true;
    return false;
  };

  const walk = (node: unknown, nodePath: string, depth: number) => {
    if (budgetExhausted) return;
    if (maxDepth !== -1 && depth > maxDepth) return;
    if (node === null || typeof node !== 'object') return;

    if (Array.isArray(node)) {
      if (node.length > 0 && !membersWithinLimit(depth)) return;
      for (let i = 0; i < node.length; i++) {
        if (!consumeBudget()) return;
        const childPath = `${nodePath}[${i}]`;
        if (exclude.regex?.test(childPath)) continue;
        walk(node[i], childPath, depth + 1);
      }
      return;
    }

    const entries = Object.entries(node);
    if (entries.length > 0 && !membersWithinLimit(depth)) return;

    for (const [key, value] of entries) {
      if (!consumeBudget()) return;
      const currentPath = nodePath ? `${nodePath}.${key}` : key;

      // Exclusion prunes early so excluded subtrees are never walked.
      if (exclude.regex?.test(currentPath)) continue;

      const dataType = dataTypeOf(value);
      const eligible =
        isTypeEnabled(dataType, filters) && (!path.regex || path.regex.test(currentPath));

      if (eligible) {
        const keyMatch = target !== 'values' && matcher.matches(key);
        const valueMatch = target !== 'keys' && matchesValue(value, dataType);

        if (keyMatch || valueMatch) {
          totalMatches++;
          if (results.length < resultLimit) {
            results.push({
              type: keyMatch && valueMatch ? 'both' : keyMatch ? 'key' : 'value',
              path: currentPath,
              key,
              value,
              depth,
              dataType,
            });
          }
        }
      }

      // Type filters hide entries from the result list; they never stop the
      // walk, otherwise unchecking "Objects" would empty every search because
      // the document root is itself an object.
      if (value && typeof value === 'object') walk(value, currentPath, depth + 1);
    }
  };

  walk(json, '', 0);

  return {
    results,
    totalMatches,
    truncated: totalMatches > results.length,
    budgetExhausted,
    depthExceeded,
    visited,
    queryError: null,
    pathPatternError: path.error,
    excludePatternError: exclude.error,
  };
}

/**
 * Unicode-aware word split. Returns lowercase tokens of at least
 * `MIN_WORD_LENGTH` characters.
 */
export function tokenizeWords(text: string): string[] {
  const tokens: string[] = [];
  for (const raw of text.split(WORD_SEPARATOR)) {
    if (raw.length >= MIN_WORD_LENGTH) tokens.push(raw.toLowerCase());
  }
  return tokens;
}

export interface AnalyzeOptions {
  pathLimit?: number;
  wordLimit?: number;
  topWords?: number;
  /** Hard nesting ceiling; deeper branches are left unvisited. */
  depthLimit?: number;
}

/**
 * Collects the insight-panel data in a single pass.
 *
 * Word counts live in a Map: a plain object inherits `constructor`, `toString`
 * and friends, so `counts[word] || 0` would read `Object` for the word
 * "constructor" and turn every later total into a string concatenation, which
 * made every percentage NaN.
 */
export function analyzeJsonStructure(
  json: unknown,
  {
    pathLimit = DEFAULT_PATH_LIMIT,
    wordLimit = DEFAULT_WORD_LIMIT,
    topWords = DEFAULT_TOP_WORDS,
    depthLimit = MAX_JSON_DEPTH,
  }: AnalyzeOptions = {}
): StructureAnalysis {
  const paths: string[] = [];
  let pathsTruncated = false;
  const words = new Map<string, number>();
  const dataTypes: Record<string, number> = {};
  let totalKeys = 0;
  let totalValues = 0;
  let maxDepth = 0;
  let depthExceeded = false;

  const countWords = (text: string) => {
    for (const word of tokenizeWords(text)) {
      const current = words.get(word);
      if (current === undefined) {
        if (words.size >= wordLimit) continue;
        words.set(word, 1);
      } else {
        words.set(word, current + 1);
      }
    }
  };

  const bump = (type: string) => {
    dataTypes[type] = (dataTypes[type] || 0) + 1;
  };

  // The same ceiling `searchJson` applies, asked at the same point: once per
  // container, about the level its members occupy, and only when the container
  // has members to skip.
  const membersWithinLimit = (depth: number): boolean => {
    if (isWithinJsonDepth(depth + 1, depthLimit)) return true;
    depthExceeded = true;
    return false;
  };

  const analyze = (node: unknown, nodePath: string, depth: number) => {
    if (depth > maxDepth) maxDepth = depth;

    if (Array.isArray(node)) {
      bump('array');
      if (node.length > 0 && !membersWithinLimit(depth)) return;
      for (let i = 0; i < node.length; i++) {
        analyze(node[i], `${nodePath}[${i}]`, depth + 1);
      }
      return;
    }

    if (!node || typeof node !== 'object') return;

    bump('object');
    const entries = Object.entries(node);
    if (entries.length > 0 && !membersWithinLimit(depth)) return;

    for (const [key, value] of entries) {
      totalKeys++;
      const currentPath = nodePath ? `${nodePath}.${key}` : key;
      if (paths.length < pathLimit) {
        paths.push(currentPath);
      } else {
        pathsTruncated = true;
      }

      countWords(key);

      const dataType = dataTypeOf(value);
      if (dataType === 'string') {
        totalValues++;
        bump('string');
        countWords(value as string);
      } else if (dataType === 'number' || dataType === 'boolean' || dataType === 'null') {
        totalValues++;
        bump(dataType);
      }

      analyze(value, currentPath, depth + 1);
    }
  };

  analyze(json, '', 0);

  let totalWords = 0;
  for (const count of words.values()) totalWords += count;

  const wordFrequencies: WordFrequency[] = Array.from(words, ([word, count]) => ({
    word,
    count,
    percentage: totalWords > 0 ? (count / totalWords) * 100 : 0,
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topWords);

  return {
    paths,
    pathsTruncated,
    totalKeys,
    totalValues,
    maxDepth,
    depthExceeded,
    dataTypes,
    wordFrequencies,
  };
}

/**
 * Autocomplete list. Stops scanning as soon as enough matches are found so a
 * long path sample does not cost a full scan on every keystroke.
 */
export function buildSuggestions(
  query: string,
  paths: string[],
  words: WordFrequency[],
  { perSource = 5, limit = 8 }: { perSource?: number; limit?: number } = {}
): string[] {
  if (!query) return [];
  const needle = query.toLowerCase();
  const suggestions = new Set<string>();

  let found = 0;
  for (const path of paths) {
    if (found >= perSource) break;
    if (path.toLowerCase().includes(needle)) {
      suggestions.add(path);
      found++;
    }
  }

  found = 0;
  for (const word of words) {
    if (found >= perSource) break;
    if (word.word.startsWith(needle)) {
      suggestions.add(word.word);
      found++;
    }
  }

  return Array.from(suggestions).slice(0, limit);
}

/**
 * Splits `text` into matched / unmatched segments for rendering, honouring both
 * the search mode and case sensitivity instead of highlighting every
 * case-insensitive substring.
 */
export function highlightSegments(
  text: string,
  query: string,
  mode: SearchMode,
  caseSensitive: boolean
): HighlightSegment[] {
  // Regex mode has no single literal to highlight.
  if (!query || mode === 'regex') return [{ text, match: false }];

  const haystack = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();

  if (mode === 'exact') {
    return haystack === needle ? [{ text, match: true }] : [{ text, match: false }];
  }

  if (mode === 'starts') {
    if (!haystack.startsWith(needle)) return [{ text, match: false }];
    const head = text.slice(0, needle.length);
    const tail = text.slice(needle.length);
    return tail
      ? [
          { text: head, match: true },
          { text: tail, match: false },
        ]
      : [{ text: head, match: true }];
  }

  if (mode === 'ends') {
    if (!haystack.endsWith(needle)) return [{ text, match: false }];
    const cut = text.length - needle.length;
    const head = text.slice(0, cut);
    const tail = text.slice(cut);
    return head
      ? [
          { text: head, match: false },
          { text: tail, match: true },
        ]
      : [{ text: tail, match: true }];
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    if (index > cursor) segments.push({ text: text.slice(cursor, index), match: false });
    segments.push({ text: text.slice(index, index + needle.length), match: true });
    cursor = index + needle.length;
    index = haystack.indexOf(needle, cursor);
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false });
  return segments.length > 0 ? segments : [{ text, match: false }];
}
