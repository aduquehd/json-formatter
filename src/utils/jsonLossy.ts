/**
 * What Format is about to change about the user's data.
 *
 * Format (and Compact) are `JSON.parse` followed by `JSON.stringify`, and that
 * round trip is not faithful: every JSON number becomes an IEEE-754 double, and
 * every JSON object becomes a JS object, whose keys are unique by definition.
 * Measured against this codebase, a valid document is silently rewritten in
 * these ways:
 *
 *   {"id": 12345678901234567890}  ->  12345678901234567000   digits lost
 *   {"big": 9007199254740993}     ->  9007199254740992       digits lost
 *   {"p": 0.1234567890123456789}  ->  0.12345678901234568    rounded
 *   {"tiny": 1e-999}              ->  0                      rounded to zero
 *   {"huge": 1e999}               ->  null                   overflowed
 *   {"neg": -0}                   ->  0                      sign lost
 *   {"dup": 1, "dup": 2}          ->  {"dup": 2}             member dropped
 *   {"x": 1.0}                    ->  1                      re-spelled
 *   {"e": "\ud83d\ude00"}       ->  the emoji itself       re-spelled
 *
 * The last two are re-spellings, not losses: `1.0` and `1` denote the same JSON
 * number, and an escape sequence and the character it denotes are the same JSON
 * string. This module reports the first seven and deliberately says nothing
 * about the other two — warning about a change that preserves the value is how
 * a warning gets ignored.
 *
 * A genuinely lossless formatter needs its own number type and its own
 * serialiser, which is a much larger piece of work. This is the cheaper and
 * more honest half of it: scan the text the user actually typed, *before* it is
 * overwritten, and say what the round trip is going to do to it.
 *
 * Two properties this scan deliberately has:
 *
 *  - It never guesses. A numeric run it cannot read as a JSON number (`+1`,
 *    `.5`, `01`, `0x1f`, `1.2.3`) produces no claim at all, because a warning
 *    the user can see is wrong costs more than a miss they never notice.
 *  - It is tolerant, not a parser. Format runs the repair pipeline first, so the
 *    text handed here is frequently *not* valid JSON — trailing commas, comments,
 *    single quotes, unquoted keys. The scanner tracks string boundaries and
 *    bracket nesting and skips whatever else it meets, so it keeps working on
 *    the documents Format is most useful for.
 *
 * One property that falls out of the design and is worth relying on: text that
 * `JSON.stringify` produced always scans clean, because everything the round
 * trip could change it has already changed. That is what makes it safe to run
 * this scan on every action that rewrites the document — the user is warned
 * once, and re-formatting, re-indenting or sorting keys afterwards is silent.
 * `jsonLossy.test.ts` pins it.
 *
 * The known limitation of tolerance is duplicate keys: the repair pipeline can
 * restructure objects (`{{"a":1,"a":2}}` collapses two brace pairs into one), so
 * the object boundaries seen here are the ones the user wrote, not necessarily
 * the ones `JSON.parse` sees. `jsonLossy.test.ts` pins the cases that do and do
 * not survive that. Number literals are unaffected — a literal is the same
 * literal before and after repair.
 */

/* ------------------------------------------------------------------ *
 * Exact decimal values
 * ------------------------------------------------------------------ */

/**
 * A JSON number literal as an exact value: `(negative ? -1 : 1) * digits * 10^exponent`.
 *
 * Exact is the point. Deciding whether `JSON.parse` changed a literal by
 * comparing doubles is circular — both sides are already the same double. The
 * only way to see the difference is to compare the literal the user wrote with
 * the literal `JSON.stringify` will emit, as mathematical values, with no
 * floating point anywhere in the comparison.
 */
export interface ExactDecimal {
  negative: boolean;
  /** Integer significand with no leading or trailing zeros. Empty means zero. */
  digits: string;
  /** Power of ten applied to `digits`. Meaningless when `digits` is empty. */
  exponent: number;
}

/** The JSON grammar for a number, exactly. */
const JSON_NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

/**
 * Read a JSON number literal as an exact value, or `null` if the text is not one.
 *
 * Returning `null` rather than a best guess is what keeps the scanner quiet
 * about `+1`, `.5`, `1.`, `01` and hex: they are not JSON numbers, so this
 * module has nothing trustworthy to say about them.
 */
export function exactDecimal(literal: string): ExactDecimal | null {
  if (!JSON_NUMBER.test(literal)) return null;

  const negative = literal.charCodeAt(0) === 45; // '-'
  const body = negative ? literal.slice(1) : literal;

  const e = body.search(/[eE]/);
  const mantissa = e === -1 ? body : body.slice(0, e);
  const exponentText = e === -1 ? '0' : body.slice(e + 1);

  const dot = mantissa.indexOf('.');
  const integerPart = dot === -1 ? mantissa : mantissa.slice(0, dot);
  const fractionPart = dot === -1 ? '' : mantissa.slice(dot + 1);

  let digits = integerPart + fractionPart;
  let exponent = Number(exponentText) - fractionPart.length;

  // Normalise so that equal values have identical representations.
  let first = 0;
  while (first < digits.length && digits[first] === '0') first++;
  digits = digits.slice(first);

  let last = digits.length;
  while (last > 0 && digits[last - 1] === '0') {
    last--;
    exponent++;
  }
  digits = digits.slice(0, last);

  // Zero has no significand, so its exponent carries no information; pinning it
  // makes the representation canonical, so equal values compare equal by shape.
  return { negative, digits, exponent: digits === '' ? 0 : exponent };
}

/**
 * Do two exact decimals denote the same value?
 *
 * Zero compares by sign as well, so `-0` and `0` are *not* the same value here.
 * They are not the same value in JavaScript either (`Object.is(-0, 0)` is false,
 * and `1/-0` is `-Infinity`), and losing the sign is one of the rewrites this
 * module exists to report.
 */
export function sameExactValue(a: ExactDecimal, b: ExactDecimal): boolean {
  const aZero = a.digits === '';
  const bZero = b.digits === '';
  if (aZero || bZero) return aZero && bZero && a.negative === b.negative;
  return a.negative === b.negative && a.digits === b.digits && a.exponent === b.exponent;
}

/* ------------------------------------------------------------------ *
 * Classifying one literal
 * ------------------------------------------------------------------ */

export type LossyChangeKind =
  | 'unsafe-integer'
  | 'precision'
  | 'overflow'
  | 'negative-zero'
  | 'duplicate-key';

export interface NumberVerdict {
  kind: Exclude<LossyChangeKind, 'duplicate-key'>;
  /** The literal `JSON.stringify` will emit in place of the original. */
  becomes: string;
}

/**
 * What the round trip does to one number literal — or `null` when it survives
 * unchanged, and also `null` when the text is not a JSON number at all.
 *
 * `String(n)` is used rather than `JSON.stringify(n)` because they agree for
 * every finite number, and the non-finite case is handled above it: an overflow
 * reaches `JSON.stringify` as `Infinity` and comes back as `null`.
 */
export function classifyNumberLiteral(literal: string): NumberVerdict | null {
  const exact = exactDecimal(literal);
  if (exact === null) return null;

  const parsed = Number(literal);
  if (!Number.isFinite(parsed)) return { kind: 'overflow', becomes: 'null' };

  const becomes = String(parsed);
  const round = exactDecimal(becomes);
  // `String` of a finite number is always a JSON number; this only guards the
  // engine surprising us.
  if (round === null) return null;
  if (sameExactValue(exact, round)) return null;

  if (exact.digits === '') return { kind: 'negative-zero', becomes };
  // A non-negative exponent means the value is a whole number, so the digits
  // that changed are integer digits past `Number.MAX_SAFE_INTEGER`.
  return { kind: exact.exponent >= 0 ? 'unsafe-integer' : 'precision', becomes };
}

/* ------------------------------------------------------------------ *
 * Scanning a document
 * ------------------------------------------------------------------ */

export interface LossyChange {
  kind: LossyChangeKind;
  /** The literal, or the duplicated key name, as it appears in the source. */
  text: string;
  /** What the round trip produces. Absent for a duplicate key, which is dropped. */
  becomes?: string;
  /** 0-based offset of `text` within the scanned source. */
  index: number;
}

export interface LossyScan {
  /** Every change found, capped at the scan's limit. Empty when nothing changes. */
  changes: LossyChange[];
  /** Distinct kinds present, in first-seen order. Never capped. */
  kinds: LossyChangeKind[];
}

/**
 * How many individual changes a scan collects. The kinds list is complete
 * regardless; this only bounds how much detail is kept for a document where
 * thousands of literals change.
 */
export const DEFAULT_LOSSY_CHANGE_LIMIT = 20;

/** Opening quote -> the characters that can close it. */
const STRING_DELIMITERS: Record<string, string> = {
  '"': '"',
  "'": "'",
  '“': '“”',
  '”': '“”',
  '‘': '‘’',
  '’': '‘’',
};

const SIMPLE_ESCAPES: Record<string, string> = {
  '"': '"',
  "'": "'",
  '\\': '\\',
  '/': '/',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
};

function isSpace(ch: string): boolean {
  return ch <= ' ' || ch === '\u00a0' || ch === '\ufeff';
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isNumberChar(ch: string): boolean {
  return isDigit(ch) || ch === '-' || ch === '+' || ch === '.' || ch === 'e' || ch === 'E';
}

/**
 * Characters that begin a numeric run. `+` and `.` are included even though JSON
 * allows neither, so that `+1` and `.5` are read as one run and rejected whole,
 * rather than having their leading character skipped and the rest mistaken for a
 * well-formed literal.
 */
function startsNumber(ch: string): boolean {
  return isDigit(ch) || ch === '-' || ch === '+' || ch === '.';
}

function isIdentStart(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$';
}

function isIdentPart(ch: string): boolean {
  return isIdentStart(ch) || isDigit(ch);
}

/**
 * Read a string literal and return its *decoded* content.
 *
 * Decoding matters for key identity: `"ab"` and `"ab"` are the same member
 * name after parsing, and comparing the raw spellings would miss that they
 * collide. An unterminated string simply runs to the end of the input.
 */
function readString(
  source: string,
  start: number,
  closers: string
): { text: string; next: number } {
  let out = '';
  let i = start + 1;

  while (i < source.length) {
    const ch = source[i];

    if (ch === '\\') {
      const escaped = source[i + 1];
      if (escaped === undefined) return { text: out, next: source.length };
      if (escaped === 'u' && /^[0-9a-fA-F]{4}$/.test(source.slice(i + 2, i + 6))) {
        out += String.fromCharCode(parseInt(source.slice(i + 2, i + 6), 16));
        i += 6;
        continue;
      }
      out += SIMPLE_ESCAPES[escaped] ?? escaped;
      i += 2;
      continue;
    }

    if (closers.includes(ch)) return { text: out, next: i + 1 };
    out += ch;
    i++;
  }

  return { text: out, next: i };
}

interface Frame {
  isObject: boolean;
  /** Member names already seen in this object. Unused for arrays. */
  keys: Set<string>;
  /** True while the next string or bare word would be a member name. */
  awaitingKey: boolean;
}

/**
 * A member's value has just ended, so the next token in an object is a name
 * again. Tracking this — rather than waiting for a comma — is what lets the scan
 * see the duplicate in `{"a": 1 "a": 2}`, which the repair pipeline turns into a
 * genuine object with one member.
 */
function valueEnded(stack: Frame[]): void {
  const frame = stack[stack.length - 1];
  if (frame?.isObject === true) frame.awaitingKey = true;
}

/**
 * Find everything `JSON.parse` -> `JSON.stringify` will change about `source`.
 *
 * Pure and allocation-light: one left-to-right pass, holding only the bracket
 * stack and the member names of the objects currently open.
 */
export function scanLossyRewrites(
  source: string,
  limit: number = DEFAULT_LOSSY_CHANGE_LIMIT
): LossyScan {
  const changes: LossyChange[] = [];
  const kinds: LossyChangeKind[] = [];

  const record = (change: LossyChange): void => {
    if (!kinds.includes(change.kind)) kinds.push(change.kind);
    if (changes.length < limit) changes.push(change);
  };

  const stack: Frame[] = [];
  const len = source.length;
  let i = 0;

  /** Handle a string or bare word. Returns true when it was a member name. */
  const noteWord = (name: string, index: number): boolean => {
    const frame = stack[stack.length - 1];
    if (frame === undefined || !frame.isObject || !frame.awaitingKey) return false;
    frame.awaitingKey = false;
    if (frame.keys.has(name)) {
      record({ kind: 'duplicate-key', text: name, index });
      return true;
    }
    frame.keys.add(name);
    return true;
  };

  while (i < len) {
    const ch = source[i];

    if (isSpace(ch)) {
      i++;
      continue;
    }

    // Comments: the repair pipeline strips them, so a number inside one is not
    // part of the document and must not be reported.
    if (ch === '/' && source[i + 1] === '/') {
      i += 2;
      while (i < len && source[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < len && !(source[i] === '*' && source[i + 1] === '/')) i++;
      i = Math.min(i + 2, len);
      continue;
    }

    const closers = STRING_DELIMITERS[ch];
    if (closers !== undefined) {
      const start = i;
      const read = readString(source, i, closers);
      i = read.next;
      if (!noteWord(read.text, start)) valueEnded(stack);
      continue;
    }

    if (ch === '{' || ch === '[') {
      stack.push({ isObject: ch === '{', keys: new Set(), awaitingKey: ch === '{' });
      i++;
      continue;
    }

    if (ch === '}' || ch === ']') {
      stack.pop();
      // The container that just closed was itself a member value.
      valueEnded(stack);
      i++;
      continue;
    }

    if (ch === ',') {
      const frame = stack[stack.length - 1];
      if (frame !== undefined) frame.awaitingKey = frame.isObject;
      i++;
      continue;
    }

    if (ch === ':') {
      const frame = stack[stack.length - 1];
      if (frame !== undefined) frame.awaitingKey = false;
      i++;
      continue;
    }

    if (startsNumber(ch)) {
      const start = i;
      while (i < len && isNumberChar(source[i])) i++;
      const literal = source.slice(start, i);
      const frame = stack[stack.length - 1];
      // A number can never be a member name, so a run in key position is
      // malformed and gets no claim. Neither does a run that runs straight into
      // a word (`12abc`, `0x1f`): that is a bare token the repair pipeline will
      // quote, not a number.
      const inKeyPosition = frame?.isObject === true && frame.awaitingKey;
      const runsIntoWord = i < len && isIdentStart(source[i]);
      if (!inKeyPosition && !runsIntoWord) {
        const verdict = classifyNumberLiteral(literal);
        if (verdict !== null) {
          record({ kind: verdict.kind, text: literal, becomes: verdict.becomes, index: start });
        }
      }
      if (!inKeyPosition) valueEnded(stack);
      continue;
    }

    if (isIdentStart(ch)) {
      const start = i;
      while (i < len && isIdentPart(source[i])) i++;
      if (!noteWord(source.slice(start, i), start)) valueEnded(stack);
      continue;
    }

    i++;
  }

  return { changes, kinds };
}

/* ------------------------------------------------------------------ *
 * Describing a scan to the user
 * ------------------------------------------------------------------ */

/** Translation key and English default for each kind of change. */
export const LOSSY_KIND_TEXT: Record<LossyChangeKind, { key: string; fallback: string }> = {
  'unsafe-integer': {
    key: 'format.lossy.unsafeInteger',
    fallback: 'large whole numbers lost digits',
  },
  precision: {
    key: 'format.lossy.precision',
    fallback: 'decimal numbers were rounded',
  },
  overflow: {
    key: 'format.lossy.overflow',
    fallback: 'numbers too large for JavaScript became null',
  },
  'negative-zero': {
    key: 'format.lossy.negativeZero',
    fallback: 'minus zero became zero',
  },
  'duplicate-key': {
    key: 'format.lossy.duplicateKey',
    fallback: 'duplicate keys were merged, keeping the last value',
  },
};

/** Longest literal shown in the example; longer ones are elided in the middle. */
const EXAMPLE_MAX_LENGTH = 24;

function elide(text: string): string {
  if (text.length <= EXAMPLE_MAX_LENGTH) return text;
  return `${text.slice(0, EXAMPLE_MAX_LENGTH - 1)}…`;
}

/**
 * Turn a scan into one sentence fragment for the toast, or `null` when the
 * document survives Format untouched.
 *
 * `translate` is passed in rather than imported so this stays pure and testable:
 * the component supplies i18next, the tests supply the English defaults.
 */
export function describeLossyScan(
  scan: LossyScan,
  translate: (key: string, fallback: string) => string
): string | null {
  if (scan.kinds.length === 0) return null;

  const phrases = scan.kinds.map((kind) => {
    const text = LOSSY_KIND_TEXT[kind];
    return translate(text.key, text.fallback);
  });

  // One concrete before/after does more than any amount of prose. Duplicate keys
  // have no "after" to show, so the example comes from the first number change.
  const example = scan.changes.find((change) => change.becomes !== undefined);
  const detail = phrases.join(', ');
  if (example === undefined) return detail;
  return `${detail} (${elide(example.text)} → ${elide(example.becomes as string)})`;
}
