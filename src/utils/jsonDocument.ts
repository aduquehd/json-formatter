/**
 * Pure helpers for the workbench document: parsing it for validity, measuring
 * it, describing its size, and sorting its keys.
 *
 * These live outside the components so the decisions they encode can be
 * unit-tested without a DOM, and so the hot path (every keystroke) is made of
 * functions whose cost is obvious at the call site.
 */

import { assertJsonDepth } from './jsonWalk';

/** Above this the editor warns that things may get slow. */
export const LARGE_DOCUMENT_CHARS = 2 * 1024 * 1024; // ~2MB
/** Hard cap for content arriving from outside the editor (file, drop, clipboard button). */
export const MAX_DOCUMENT_CHARS = 10 * 1024 * 1024; // ~10MB

export type DocumentSize = 'normal' | 'large' | 'over-max';

/**
 * Bucket a document by length. Character count is a deliberate proxy for byte
 * size: it is O(1), and the thresholds are advisory.
 */
export function describeDocumentSize(length: number): DocumentSize {
  if (length > MAX_DOCUMENT_CHARS) return 'over-max';
  if (length > LARGE_DOCUMENT_CHARS) return 'large';
  return 'normal';
}

export interface ParsedDocument {
  /** Whether the text is valid JSON. Never infer this from `data`. */
  isValid: boolean;
  /** The parsed value when `isValid`, otherwise `null`. */
  data: any;
  /** Parser message when invalid. */
  error?: string;
}

/**
 * Strict parse — `JSON.parse` and nothing else.
 *
 * This is what the live/debounced validation path uses. Running the repair
 * pipeline here would run it on every keystroke, since a document being typed
 * is invalid for as long as it is unfinished, and repair is super-linear on
 * large input. Repair belongs on explicit actions (Format, Paste, Open).
 */
export function parseJsonStrict(text: string): ParsedDocument {
  if (isBlankDocument(text)) {
    return { isValid: false, data: null, error: 'Empty input' };
  }
  try {
    return { isValid: true, data: JSON.parse(text) };
  } catch (error) {
    return {
      isValid: false,
      data: null,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

/**
 * Did a parse succeed? Decided by the absence of an error, never by the
 * truthiness of the value: `0`, `false`, `null` and `""` are all valid JSON
 * documents, and testing the value reports every one of them as invalid.
 */
export function isParseSuccess(result: { error?: string }): boolean {
  return result.error === undefined;
}

export type DocumentStatus = 'empty' | 'valid' | 'invalid';

/**
 * What the status pill should say. Emptiness wins over validity so a blank
 * editor reads "Ready" rather than "Invalid JSON".
 */
export function documentStatus(content: string, isValid: boolean): DocumentStatus {
  if (isBlankDocument(content)) return 'empty';
  return isValid ? 'valid' : 'invalid';
}

/**
 * Is the document empty or whitespace-only? Anchored so a non-blank document
 * bails at the first character instead of allocating a trimmed copy of what may
 * be megabytes of text.
 */
export function isBlankDocument(content: string): boolean {
  return content.length === 0 || /^\s*$/.test(content);
}

/**
 * Recursively sort object keys A→Z. Arrays keep their order; their elements are
 * sorted in place.
 *
 * Built with `Object.fromEntries`, which defines each member with
 * CreateDataProperty semantics. Plain assignment (`acc[key] = …`) instead
 * invokes the inherited `__proto__` *setter* for a member literally named
 * `__proto__`: the member is silently dropped from the output and the result's
 * prototype is replaced by user-supplied data.
 *
 * Throws `JsonDepthLimitError` past `MAX_JSON_DEPTH`. Callers run it inside
 * `runDepthGuarded` and report that the document is too deeply nested to sort.
 */
export function sortObjectKeysDeep<T>(value: T, depth = 0): T {
  assertJsonDepth(depth);
  if (Array.isArray(value)) {
    return value.map((item) => sortObjectKeysDeep(item, depth + 1)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(source)
        .sort()
        .map((key) => [key, sortObjectKeysDeep(source[key], depth + 1)])
    ) as unknown as T;
  }
  return value;
}

export interface DocumentMetrics {
  /** UTF-8 length, identical to `new TextEncoder().encode(content).length`. */
  bytes: number;
  /** Line count, identical to `content.split('\n').length`. */
  lines: number;
}

/**
 * Measure the document in a single pass, allocating nothing.
 *
 * The status bar re-measures on every keystroke, so the obvious spelling
 * (`new TextEncoder().encode(content).length` plus `content.split('\n').length`)
 * allocates a full byte copy of the document *and* an array holding every line,
 * per keystroke. This walks the string once instead.
 */
export function measureDocument(content: string): DocumentMetrics {
  const len = content.length;
  let bytes = 0;
  let newlines = 0;

  for (let i = 0; i < len; i++) {
    const code = content.charCodeAt(i);
    if (code === 10) newlines++;

    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      // High surrogate: a complete pair is one 4-byte code point; a lone
      // surrogate is encoded as U+FFFD (3 bytes), matching TextEncoder.
      const next = i + 1 < len ? content.charCodeAt(i + 1) : 0;
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        i++;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }

  return { bytes, lines: newlines + 1 };
}

/** Human-readable byte size for the status bar. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
