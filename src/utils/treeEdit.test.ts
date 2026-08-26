import { describe, expect, it } from 'vitest';
import { getAtPath, type JsonPath, renameKeyInObject, setAtPath } from './jsonPath';
import { resolveKeyRename, resolveValueEdit, seedValueText } from './treeEdit';

describe('seedValueText', () => {
  it('seeds a string with its raw text, not its quoted JSON form', () => {
    expect(seedValueText('123')).toBe('123');
    expect(seedValueText('he said "hi"')).toBe('he said "hi"');
  });

  it('seeds non-strings with their JSON literal', () => {
    expect(seedValueText(123)).toBe('123');
    expect(seedValueText(true)).toBe('true');
    expect(seedValueText(null)).toBe('null');
  });
});

describe('resolveValueEdit', () => {
  it('is a no-op when the text was never touched (the onBlur-without-typing case)', () => {
    expect(resolveValueEdit('123', '123', '123')).toEqual({ status: 'unchanged' });
    expect(resolveValueEdit(true, 'true', 'true')).toEqual({ status: 'unchanged' });
    expect(resolveValueEdit(null, 'null', 'null')).toEqual({ status: 'unchanged' });
    expect(resolveValueEdit('{}', '{}', '{}')).toEqual({ status: 'unchanged' });
    expect(resolveValueEdit('true', 'true', 'true')).toEqual({ status: 'unchanged' });
  });

  it('keeps a string a string, whatever the new text looks like', () => {
    for (const text of ['456', 'true', 'null', '{}', '[]', '1e3', '0.5']) {
      const result = resolveValueEdit('123', '123', text);
      expect(result).toEqual({ status: 'ok', value: text });
      expect(typeof (result as { value: unknown }).value).toBe('string');
    }
  });

  it('accepts prose in a string without demanding valid JSON', () => {
    expect(resolveValueEdit('hello', 'hello', 'he said "hi"')).toEqual({
      status: 'ok',
      value: 'he said "hi"',
    });
  });

  it('keeps a number a number and rejects text that is not one', () => {
    expect(resolveValueEdit(123, '123', '456')).toEqual({ status: 'ok', value: 456 });
    expect(resolveValueEdit(123, '123', ' 007 ')).toEqual({ status: 'ok', value: 7 });
    expect(resolveValueEdit(123, '123', '-1.5e2')).toEqual({ status: 'ok', value: -150 });
    expect(resolveValueEdit(123, '123', 'abc')).toEqual({
      status: 'invalid',
      reason: 'expected-number',
    });
    expect(resolveValueEdit(123, '123', '')).toEqual({
      status: 'invalid',
      reason: 'expected-number',
    });
    expect(resolveValueEdit(123, '123', 'Infinity')).toEqual({
      status: 'invalid',
      reason: 'expected-number',
    });
  });

  it('keeps a boolean a boolean and rejects text that is not one', () => {
    expect(resolveValueEdit(false, 'false', 'true')).toEqual({ status: 'ok', value: true });
    expect(resolveValueEdit(false, 'false', ' TRUE ')).toEqual({ status: 'ok', value: true });
    expect(resolveValueEdit(true, 'true', 'yes')).toEqual({
      status: 'invalid',
      reason: 'expected-boolean',
    });
    expect(resolveValueEdit(true, 'true', '1')).toEqual({
      status: 'invalid',
      reason: 'expected-boolean',
    });
  });

  it('treats retyping the same value as a no-op even when the text differs', () => {
    expect(resolveValueEdit(123, '123', ' 123 ')).toEqual({ status: 'unchanged' });
    expect(resolveValueEdit(true, 'true', 'TRUE')).toEqual({ status: 'unchanged' });
  });

  it('lets null take any JSON, falling back to a string', () => {
    expect(resolveValueEdit(null, 'null', '5')).toEqual({ status: 'ok', value: 5 });
    expect(resolveValueEdit(null, 'null', 'hello')).toEqual({ status: 'ok', value: 'hello' });
    expect(resolveValueEdit(null, 'null', 'false')).toEqual({ status: 'ok', value: false });
  });

  it('changes type only on the explicit asJson gesture', () => {
    expect(resolveValueEdit('123', '123', '123', { asJson: true })).toEqual({
      status: 'ok',
      value: 123,
    });
    expect(resolveValueEdit('123', '123', 'true', { asJson: true })).toEqual({
      status: 'ok',
      value: true,
    });
    expect(resolveValueEdit(123, '123', '"123"', { asJson: true })).toEqual({
      status: 'ok',
      value: '123',
    });
    expect(resolveValueEdit('x', 'x', '{"a":1}', { asJson: true })).toEqual({
      status: 'ok',
      value: { a: 1 },
    });
  });

  it('rejects invalid JSON on the asJson gesture rather than coercing it', () => {
    expect(resolveValueEdit('hello', 'hello', 'hello', { asJson: true })).toEqual({
      status: 'invalid',
      reason: 'invalid-json',
    });
    expect(resolveValueEdit(1, '1', '{oops', { asJson: true })).toEqual({
      status: 'invalid',
      reason: 'invalid-json',
    });
  });

  it('reports an asJson edit that lands on the same value as unchanged', () => {
    expect(resolveValueEdit(123, '123', '123', { asJson: true })).toEqual({ status: 'unchanged' });
  });
});

describe('resolveKeyRename', () => {
  it('is a no-op when the name is untouched', () => {
    expect(resolveKeyRename(['a', 'b'], 'a', 'a')).toEqual({ status: 'unchanged' });
  });

  it('rejects a name that would overwrite a sibling', () => {
    expect(resolveKeyRename(['a', 'b'], 'a', 'b')).toEqual({
      status: 'invalid',
      reason: 'duplicate',
    });
  });

  it('rejects empty and whitespace-only names', () => {
    expect(resolveKeyRename(['a'], 'a', '')).toEqual({ status: 'invalid', reason: 'empty' });
    expect(resolveKeyRename(['a'], 'a', '   ')).toEqual({ status: 'invalid', reason: 'empty' });
  });

  it('accepts a fresh name, punctuation and __proto__ included', () => {
    expect(resolveKeyRename(['a', 'b'], 'a', 'c')).toEqual({ status: 'ok', key: 'c' });
    expect(resolveKeyRename(['a'], 'a', 'x.y[0]')).toEqual({ status: 'ok', key: 'x.y[0]' });
    expect(resolveKeyRename(['a'], 'a', '__proto__')).toEqual({ status: 'ok', key: '__proto__' });
  });

  it('does not treat inherited property names as existing keys', () => {
    expect(resolveKeyRename(Object.keys({ a: 1 }), 'a', 'toString')).toEqual({
      status: 'ok',
      key: 'toString',
    });
  });
});

/**
 * TreeView's save path is `structuredClone` → resolve → write. The component
 * itself needs a DOM to test, so these mirror its pipeline over the same helpers
 * to pin the composition — that is where the type changes, lost keys and
 * misrouted edits actually happened.
 */
function saveValue(doc: unknown, path: JsonPath, text: string, options: { asJson?: boolean } = {}) {
  const original = getAtPath(doc, path);
  const result = resolveValueEdit(original, seedValueText(original), text, options);
  if (result.status !== 'ok') return { doc, result };
  const clone = structuredClone(doc);
  expect(setAtPath(clone, path, result.value)).toBe(true);
  return { doc: clone, result };
}

function saveKey(doc: unknown, parentPath: JsonPath, oldKey: string, newKey: string) {
  const parent = getAtPath(doc, parentPath) as Record<string, unknown>;
  const result = resolveKeyRename(Object.keys(parent), oldKey, newKey);
  if (result.status !== 'ok') return { doc, result };
  const clone = structuredClone(doc);
  const parentClone = getAtPath(clone, parentPath) as Record<string, unknown>;
  const renamed = renameKeyInObject(parentClone, oldKey, result.key);
  if (parentPath.length === 0) return { doc: renamed, result };
  expect(setAtPath(clone, parentPath, renamed)).toBe(true);
  return { doc: clone, result };
}

describe('tree save pipeline', () => {
  it('keeps a quoted number a string end to end', () => {
    const { doc } = saveValue({ v: '123' }, ['v'], '456');
    expect(JSON.stringify(doc)).toBe('{"v":"456"}');
  });

  it('changes the type only when the JSON gesture is used', () => {
    const { doc } = saveValue({ v: '123' }, ['v'], '123', { asJson: true });
    expect(JSON.stringify(doc)).toBe('{"v":123}');
  });

  it('leaves the document untouched when the value edit is a no-op', () => {
    const original = { v: 'text' };
    const { doc, result } = saveValue(original, ['v'], 'text');
    expect(result.status).toBe('unchanged');
    expect(doc).toBe(original);
  });

  it('edits {"a.b": 1} without touching {"a": {"b": 1}} in the same document', () => {
    const { doc } = saveValue({ 'a.b': 1, a: { b: 1 } }, ['a.b'], '99');
    expect(doc).toEqual({ 'a.b': 99, a: { b: 1 } });
  });

  it('edits an item of a root-level array through its index', () => {
    const { doc } = saveValue([{ name: 'first' }, 'second'], [1], 'edited');
    expect(doc).toEqual([{ name: 'first' }, 'edited']);
  });

  it('refuses a rename that would destroy a sibling, leaving the document intact', () => {
    const original = { a: 1, b: 2 };
    const { doc, result } = saveKey(original, [], 'a', 'b');
    expect(result).toEqual({ status: 'invalid', reason: 'duplicate' });
    expect(doc).toBe(original);
    expect(original).toEqual({ a: 1, b: 2 });
  });

  it('renames a nested key in place, preserving order', () => {
    const { doc } = saveKey({ outer: { a: 1, b: 2, c: 3 } }, ['outer'], 'b', 'renamed');
    expect(JSON.stringify(doc)).toBe('{"outer":{"a":1,"renamed":2,"c":3}}');
  });

  it('round-trips a rename to __proto__ instead of silently dropping the key', () => {
    const { doc } = saveKey(JSON.parse('{"a": 1, "b": 2}'), [], 'b', '__proto__');
    expect(JSON.stringify(doc)).toBe('{"a":1,"__proto__":2}');
    expect(Object.getPrototypeOf(doc)).toBe(Object.prototype);
  });

  it('edits a value stored under a __proto__ key', () => {
    const { doc } = saveValue(JSON.parse('{"__proto__": "old"}'), ['__proto__'], 'new');
    expect(JSON.stringify(doc)).toBe('{"__proto__":"new"}');
  });
});
