/**
 * Pure rules behind the tree editor's inline edits.
 *
 * The tree used to seed its input with `String(value)` and save it with
 * `JSON.parse(text)`, so the string `"123"` came back as the number `123` and
 * `"true"` as a boolean — and because saving is wired to `onBlur`, that happened
 * even when the user never typed anything. The rules below preserve the original
 * type by default and require a deliberate gesture to change it.
 */

export type ValueEditReason = 'expected-number' | 'expected-boolean' | 'invalid-json';
export type KeyRenameReason = 'empty' | 'duplicate';

export type ValueEditResult =
  | { status: 'unchanged' }
  | { status: 'ok'; value: unknown }
  | { status: 'invalid'; reason: ValueEditReason };

export type KeyRenameResult =
  | { status: 'unchanged' }
  | { status: 'ok'; key: string }
  | { status: 'invalid'; reason: KeyRenameReason };

/** Text the edit input starts with. Strings are seeded raw, not JSON-quoted. */
export function seedValueText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value) ?? '';
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

/** Permissive number parse: accepts `007`, `+5`, ` 12 `; rejects `NaN`/`Infinity`/``. */
function parseNumber(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(text: string): boolean | null {
  const trimmed = text.trim().toLowerCase();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  return null;
}

/**
 * Decide what an inline value edit should produce.
 *
 * - Text identical to the seed is a no-op, so merely focusing a value and
 *   clicking away can never rewrite the document.
 * - A string stays a string, verbatim — no parsing, so `"123"` edited to `456`
 *   is still the string `"456"`.
 * - A number stays a number and a boolean stays a boolean; text that is not one
 *   is rejected rather than silently turned into a string.
 * - `null` has no type to preserve, so it takes JSON if the text parses and a
 *   string otherwise.
 * - `asJson` (Cmd/Ctrl+Enter) is the deliberate type change: the text is parsed
 *   strictly as JSON and whatever it yields is used, so `123` really does become
 *   the number `123`.
 */
export function resolveValueEdit(
  original: unknown,
  seedText: string,
  newText: string,
  options: { asJson?: boolean } = {}
): ValueEditResult {
  if (options.asJson) {
    const parsed = parseJson(newText);
    if (!parsed.ok) return { status: 'invalid', reason: 'invalid-json' };
    if (Object.is(parsed.value, original)) return { status: 'unchanged' };
    return { status: 'ok', value: parsed.value };
  }

  if (newText === seedText) return { status: 'unchanged' };

  if (typeof original === 'string') {
    return { status: 'ok', value: newText };
  }

  if (typeof original === 'number') {
    const parsed = parseNumber(newText);
    if (parsed === null) return { status: 'invalid', reason: 'expected-number' };
    return parsed === original ? { status: 'unchanged' } : { status: 'ok', value: parsed };
  }

  if (typeof original === 'boolean') {
    const parsed = parseBoolean(newText);
    if (parsed === null) return { status: 'invalid', reason: 'expected-boolean' };
    return parsed === original ? { status: 'unchanged' } : { status: 'ok', value: parsed };
  }

  const parsed = parseJson(newText);
  if (!parsed.ok) return { status: 'ok', value: newText };
  if (Object.is(parsed.value, original)) return { status: 'unchanged' };
  return { status: 'ok', value: parsed.value };
}

/**
 * Validate a key rename before anything is mutated. The old builder assigned
 * straight into a fresh object, so renaming `a` to an existing sibling `b`
 * destroyed one of the two values with no warning; empty names were accepted too.
 */
export function resolveKeyRename(
  existingKeys: readonly string[],
  oldKey: string,
  newKey: string
): KeyRenameResult {
  if (newKey === oldKey) return { status: 'unchanged' };
  if (newKey.trim() === '') return { status: 'invalid', reason: 'empty' };
  if (existingKeys.includes(newKey)) return { status: 'invalid', reason: 'duplicate' };
  return { status: 'ok', key: newKey };
}
