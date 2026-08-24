/**
 * Best-effort repair of almost-JSON documents.
 *
 * The repair is a single left-to-right scan that always knows whether it is
 * standing inside a string literal. Every rewrite (comment stripping, comma
 * surgery, quote normalisation, bracket balancing) happens ONLY in code
 * position; the bytes of a string literal are copied through untouched. That
 * is the whole point of the scanner: the previous implementation was a stack
 * of global regexes run over the raw text, so a block-comment opener in one
 * string and a closer in another looked like a comment and everything between
 * them was deleted, and any `https://` URL was eaten as a line comment.
 *
 * Two consequences worth knowing:
 *  - The scan is O(n). The old block-comment regex was O(n^2).
 *  - The repaired text is emitted token by token, so it comes back minified.
 *    Nothing outside this module's tests consumes the repaired *string*; the
 *    app consumes `parseWithFixInfo().data` and re-serialises it itself.
 *
 * When a construct is ambiguous the scanner deliberately copies it through
 * unrepaired so `JSON.parse` fails and the caller reports "invalid" — that is
 * always better than handing back silently wrong data.
 */

export interface JSONFixResult {
  data: any;
  wasFixed: boolean;
  fixes?: string[];
  error?: string;
}

type Bracket = '{' | '[';

/** What the scanner emitted last, in code position. Drives comma insertion. */
type LastToken = 'none' | 'open' | 'close' | 'colon' | 'value';

const SMART_DOUBLE_QUOTES = '“”';
const SMART_SINGLE_QUOTES = '‘’';

const JSON_LITERALS = new Set(['true', 'false', 'null']);
const PYTHON_LITERALS: Record<string, string> = { True: 'true', False: 'false', None: 'null' };
/** Bare words that must never be turned into strings — they mean "invalid". */
const NEVER_QUOTED = new Set(['undefined', 'NaN', 'Infinity']);

function isSpace(ch: string | undefined): boolean {
  return ch !== undefined && (ch <= ' ' || ch === '\u00a0' || ch === '\ufeff');
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isIdentStart(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$';
}

function isIdentPart(ch: string): boolean {
  return isIdentStart(ch) || isDigit(ch);
}

function isNumberPart(ch: string): boolean {
  return isDigit(ch) || ch === '+' || ch === '-' || ch === '.' || ch === 'e' || ch === 'E';
}

/**
 * Index just past the closing `"` of the JSON string starting at `start`,
 * or -1 when the string is never closed.
 */
function endOfDoubleQuoted(src: string, start: number): number {
  for (let i = start + 1; i < src.length; i++) {
    const ch = src[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === '"') return i + 1;
  }
  return -1;
}

/** Index just past a `//` or block comment starting at `start`. */
function endOfComment(src: string, start: number): number {
  if (src[start + 1] === '/') {
    let i = start + 2;
    while (i < src.length && src[i] !== '\n' && src[i] !== '\r') i++;
    return i;
  }
  const end = src.indexOf('*/', start + 2);
  return end === -1 ? src.length : end + 2;
}

function isCommentStart(src: string, i: number): boolean {
  return src[i] === '/' && (src[i + 1] === '/' || src[i + 1] === '*');
}

function scanDocument(input: string): { fixed: string; fixes: string[] } {
  const fixes = new Set<string>();
  let src = input;
  if (src.charCodeAt(0) === 0xfeff) {
    src = src.slice(1);
    fixes.add('BOM character');
  }

  const n = src.length;
  const out: string[] = [];
  const stack: Bracket[] = [];
  // Positions in `out` of closers that had nothing open to close.
  const strayCurly: number[] = [];
  const straySquare: number[] = [];
  let last: LastToken = 'none';
  let pendingComma = false;
  let sawCurlyOpen = false;
  let sawSquareOpen = false;
  let topLevelColon = false;
  let i = 0;

  const nextSignificant = (from: number): string => {
    let j = from;
    while (j < n && isSpace(src[j])) j++;
    return j < n ? src[j] : '';
  };

  /** Emits whatever separator belongs before the value/opener about to be written. */
  const beforeValue = (): void => {
    if (pendingComma) {
      pendingComma = false;
      if (last === 'open' || last === 'none') {
        fixes.add('leading commas');
      } else {
        out.push(',');
      }
      return;
    }
    if (last !== 'value' && last !== 'close') return;
    if (stack.length > 0) {
      out.push(',');
      fixes.add('missing commas between properties');
      return;
    }
    // Two values side by side at the top level is not a document we can repair
    // (`1 2`); keep them apart so they cannot fuse into a single valid token.
    out.push(' ');
  };

  /**
   * Re-encodes a string that is not delimited by plain double quotes
   * (single-quoted or curly-quoted) into a real JSON string.
   */
  const readAlienString = (start: number, closers: string): { text: string; next: number } => {
    let body = '';
    let j = start + 1;
    let terminated = false;
    while (j < n) {
      const ch = src[j];
      if (ch === '\\') {
        const escaped = src[j + 1];
        if (escaped === undefined) {
          body += '\\\\';
          j += 1;
          break;
        }
        if (escaped === '"') body += '\\"';
        else if (closers.includes(escaped)) body += escaped;
        else body += ch + escaped;
        j += 2;
        continue;
      }
      if (closers.includes(ch)) {
        terminated = true;
        j += 1;
        break;
      }
      body += ch === '"' ? '\\"' : ch;
      j += 1;
    }
    if (!terminated) fixes.add('unterminated string');
    return { text: `"${body}"`, next: j };
  };

  while (i < n) {
    const ch = src[i];

    if (isSpace(ch)) {
      i++;
      continue;
    }

    if (isCommentStart(src, i)) {
      fixes.add(src[i + 1] === '/' ? 'single-line comments' : 'multi-line comments');
      i = endOfComment(src, i);
      continue;
    }

    // Plain JSON string: copied through byte for byte.
    if (ch === '"') {
      beforeValue();
      const end = endOfDoubleQuoted(src, i);
      if (end === -1) {
        out.push(`${src.slice(i)}"`);
        fixes.add('unterminated string');
        i = n;
      } else {
        out.push(src.slice(i, end));
        i = end;
      }
      last = 'value';
      continue;
    }

    if (ch === "'" || SMART_SINGLE_QUOTES.includes(ch)) {
      beforeValue();
      const smart = ch !== "'";
      const { text, next } = readAlienString(i, smart ? `${SMART_SINGLE_QUOTES}'` : "'");
      out.push(text);
      fixes.add(smart ? 'smart quotes' : 'single quotes to double quotes');
      i = next;
      last = 'value';
      continue;
    }

    if (SMART_DOUBLE_QUOTES.includes(ch)) {
      beforeValue();
      const { text, next } = readAlienString(i, `${SMART_DOUBLE_QUOTES}"`);
      out.push(text);
      fixes.add('smart double quotes');
      i = next;
      last = 'value';
      continue;
    }

    if (ch === '{' || ch === '[') {
      beforeValue();
      i++;
      // `{{` can never open a valid document (an object key must be a string),
      // so a doubled opening brace at the start is a typo worth collapsing.
      // `[[` is left alone — it is how every nested array legitimately starts.
      if (ch === '{' && out.length === 0) {
        let j = i;
        while (j < n && isSpace(src[j])) j++;
        while (src[j] === '{') {
          fixes.add('multiple opening braces');
          j++;
          while (j < n && isSpace(src[j])) j++;
        }
        i = j;
      }
      out.push(ch);
      stack.push(ch);
      if (ch === '{') sawCurlyOpen = true;
      else sawSquareOpen = true;
      last = 'open';
      continue;
    }

    if (ch === '}' || ch === ']') {
      if (pendingComma) {
        pendingComma = false;
        fixes.add('trailing commas');
      }
      const opener: Bracket = ch === '}' ? '{' : '[';
      if (stack.length === 0) {
        (ch === '}' ? strayCurly : straySquare).push(out.length);
      } else if (stack[stack.length - 1] === opener) {
        stack.pop();
      }
      // A closer that does not match what is open is emitted as-is: guessing
      // which container the author meant to close would invent structure.
      out.push(ch);
      last = 'close';
      i++;
      continue;
    }

    if (ch === ',') {
      if (pendingComma) fixes.add('multiple consecutive commas');
      pendingComma = true;
      i++;
      continue;
    }

    if (ch === ':') {
      if (pendingComma) {
        pendingComma = false;
        out.push(',');
      }
      if (stack.length === 0) topLevelColon = true;
      out.push(':');
      last = 'colon';
      i++;
      continue;
    }

    if (isDigit(ch) || ch === '-' || ch === '+' || ch === '.') {
      beforeValue();
      let j = i;
      while (j < n && isNumberPart(src[j])) j++;
      out.push(src.slice(i, j));
      i = j;
      last = 'value';
      continue;
    }

    if (isIdentStart(ch)) {
      let j = i;
      while (j < n && (isIdentPart(src[j]) || (src[j] === '.' && isIdentStart(src[j + 1] ?? '')))) {
        j++;
      }
      const word = src.slice(i, j);
      const after = nextSignificant(j);
      // Only repair a bare word sitting where a key or value belongs. Prose
      // (`hello world`, `Note: see below`) must stay unrepairable.
      const inSlot = pendingComma || last === 'open' || last === 'colon';
      i = j;
      beforeValue();
      last = 'value';

      if (inSlot && after === ':') {
        out.push(JSON.stringify(word));
        fixes.add('unquoted property names');
        continue;
      }
      if (JSON_LITERALS.has(word)) {
        out.push(word);
        continue;
      }
      const python = PYTHON_LITERALS[word];
      if (python !== undefined) {
        out.push(python);
        fixes.add('Python literals');
        continue;
      }
      const closesValue = after === ',' || after === '}' || after === ']' || after === '';
      if (inSlot && closesValue && !NEVER_QUOTED.has(word)) {
        out.push(JSON.stringify(word));
        fixes.add('unquoted string values');
        continue;
      }
      // NaN / Infinity / undefined / anything else: copy it through so the
      // document fails to parse instead of becoming the string "NaN".
      out.push(word);
      continue;
    }

    // Unknown character in code position — keep it so the parse fails loudly.
    beforeValue();
    out.push(ch);
    last = 'value';
    i++;
  }

  if (pendingComma) fixes.add('trailing commas');

  while (stack.length > 0) {
    const opener = stack.pop();
    if (opener === '{') {
      out.push('}');
      fixes.add('closing brace }');
    } else {
      out.push(']');
      fixes.add('closing bracket ]');
    }
  }

  // Every repair below invents a container, which is only honest when there is
  // something to put in it: `"a":1}` really is a missing `{`. A document that is
  // nothing but structure (`}`, `]`, `}{`, `{}}`) has no content to rescue, so
  // "repairing" it to `{}` would hand back a value the user never wrote — and
  // Format writes that straight into their editor. Erroring is the honest answer.
  const hasValueContent = out.some((piece) => /[^\s{}[\],:]/.test(piece));

  // Unmatched closers mean either a missing opener or a duplicated closer.
  if (hasValueContent && strayCurly.length > 0) {
    if (sawCurlyOpen) {
      for (const idx of strayCurly) out[idx] = '';
      fixes.add('multiple closing braces');
    } else {
      out.unshift('{'.repeat(strayCurly.length));
      fixes.add('opening brace {');
    }
  }
  if (hasValueContent && straySquare.length > 0) {
    if (sawSquareOpen) {
      for (const idx of straySquare) out[idx] = '';
      fixes.add('multiple closing brackets');
    } else {
      out.unshift('['.repeat(straySquare.length));
      fixes.add('opening bracket [');
    }
  }

  // `"a":1, "b":2` — members pasted without the object around them.
  if (topLevelColon && !sawCurlyOpen && strayCurly.length === 0) {
    out.unshift('{');
    out.push('}');
    fixes.add('opening brace {');
    fixes.add('closing brace }');
  }

  return { fixed: out.join(''), fixes: [...fixes] };
}

function tryFixJSONWithDetails(jsonString: string): { fixed: string; fixes: string[] } {
  return scanDocument(jsonString);
}

function tryFixJSON(jsonString: string): string {
  return scanDocument(jsonString).fixed;
}

/**
 * Balances brackets without touching anything else, preserving the original
 * formatting. String- and comment-aware, so braces inside `"{"` or `// {` do
 * not count.
 */
function fixMissingBracketsWithDetails(str: string): { fixed: string; fixes: string[] } {
  const fixes: string[] = [];
  const stack: Bracket[] = [];
  let extraCurly = 0;
  let extraSquare = 0;
  let sawCurlyOpen = false;
  let sawSquareOpen = false;
  let topLevelColon = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"') {
      const end = endOfDoubleQuoted(str, i);
      i = (end === -1 ? str.length : end) - 1;
      continue;
    }
    if (isCommentStart(str, i)) {
      i = endOfComment(str, i) - 1;
      continue;
    }
    if (ch === '{' || ch === '[') {
      stack.push(ch);
      if (ch === '{') sawCurlyOpen = true;
      else sawSquareOpen = true;
      continue;
    }
    if (ch === '}' || ch === ']') {
      const opener: Bracket = ch === '}' ? '{' : '[';
      if (stack[stack.length - 1] === opener) stack.pop();
      else if (stack.length === 0 && ch === '}') extraCurly++;
      else if (stack.length === 0) extraSquare++;
      continue;
    }
    if (ch === ':' && stack.length === 0) topLevelColon = true;
  }

  let fixed = str;
  const needsWrap = topLevelColon && !sawCurlyOpen && extraCurly === 0;

  if (extraCurly > 0 && !sawCurlyOpen) {
    fixed = '{'.repeat(extraCurly) + fixed;
    fixes.push(`${extraCurly} opening brace${extraCurly > 1 ? 's' : ''} {`);
  }
  if (extraSquare > 0 && !sawSquareOpen) {
    fixed = '['.repeat(extraSquare) + fixed;
    fixes.push(`${extraSquare} opening bracket${extraSquare > 1 ? 's' : ''} [`);
  }
  if (needsWrap) {
    fixed = `{${fixed}`;
    fixes.push('opening brace {');
  }

  if (stack.length > 0 || needsWrap) {
    fixed = fixed.replace(/[\s,]+$/, '');
    while (stack.length > 0) {
      const opener = stack.pop();
      if (opener === '{') {
        fixed += '}';
        fixes.push('closing brace }');
      } else {
        fixed += ']';
        fixes.push('closing bracket ]');
      }
    }
    if (needsWrap) {
      fixed += '}';
      fixes.push('closing brace }');
    }
  }

  return { fixed, fixes };
}

function fixMissingBrackets(str: string): string {
  return fixMissingBracketsWithDetails(str).fixed;
}

/**
 * Quotes bare identifiers used as values (`{"a": bar}` -> `{"a": "bar"}`),
 * leaving strings, comments and JSON literals alone. Formatting is preserved.
 */
function fixUnquotedValues(str: string, fixes: string[]): string {
  const n = str.length;
  let out = '';
  let quotedAny = false;
  let i = 0;

  while (i < n) {
    const ch = str[i];
    if (ch === '"') {
      const end = endOfDoubleQuoted(str, i);
      const stop = end === -1 ? n : end;
      out += str.slice(i, stop);
      i = stop;
      continue;
    }
    if (isCommentStart(str, i)) {
      const stop = endOfComment(str, i);
      out += str.slice(i, stop);
      i = stop;
      continue;
    }

    out += ch;
    i++;
    if (ch !== ':' && ch !== '[' && ch !== ',') continue;

    let start = i;
    while (start < n && isSpace(str[start])) start++;
    if (start >= n || !isIdentStart(str[start])) continue;

    let end = start;
    while (
      end < n &&
      (isIdentPart(str[end]) || (str[end] === '.' && isIdentStart(str[end + 1] ?? '')))
    ) {
      end++;
    }
    const word = str.slice(start, end);

    let after = end;
    while (after < n && isSpace(str[after])) after++;
    const delimiter = after < n ? str[after] : '';
    if (delimiter !== ',' && delimiter !== ']' && delimiter !== '}') continue;
    if (JSON_LITERALS.has(word) || NEVER_QUOTED.has(word)) continue;

    out += str.slice(i, start) + JSON.stringify(word);
    i = end;
    quotedAny = true;
  }

  if (quotedAny) fixes.push('unquoted string values');
  return out;
}

function parseWithFix(jsonString: string): any {
  try {
    return JSON.parse(jsonString);
  } catch (firstError) {
    try {
      return JSON.parse(tryFixJSON(jsonString));
    } catch {
      // The original error describes the user's document; the error from the
      // repaired text describes our guess at it, which is less useful.
      throw firstError;
    }
  }
}

function parseWithFixInfo(jsonString: string): JSONFixResult {
  if (!jsonString || jsonString.trim() === '') {
    return {
      data: null,
      wasFixed: false,
      error: 'Empty input',
    };
  }

  try {
    return { data: JSON.parse(jsonString), wasFixed: false };
  } catch (firstError) {
    try {
      const fixResult = tryFixJSONWithDetails(jsonString);
      const data = JSON.parse(fixResult.fixed);
      return {
        data,
        wasFixed: true,
        fixes: fixResult.fixes,
      };
    } catch {
      return {
        data: null,
        wasFixed: false,
        error: firstError instanceof Error ? firstError.message : 'Invalid JSON',
      };
    }
  }
}

export const JSONFixer = {
  tryFixJSON,
  tryFixJSONWithDetails,
  fixMissingBrackets,
  fixMissingBracketsWithDetails,
  fixUnquotedValues,
  parseWithFix,
  parseWithFixInfo,
};
