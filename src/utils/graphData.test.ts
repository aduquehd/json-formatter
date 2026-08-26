import { describe, expect, it } from 'vitest';
import {
  buildTooltipModel,
  buildTree,
  type GraphTooltipModel,
  type JsonNode,
  PREVIEW_MAX_LENGTH,
  previewValue,
} from './graphData';
import { MAX_JSON_DEPTH, nestDeeply, runDepthGuarded } from './jsonWalk';

/** Narrowing accessor so the assertions below stay free of non-null assertions. */
function childAt(node: JsonNode, index: number): JsonNode {
  const child = node.children?.[index];
  if (!child) throw new Error(`expected a child at index ${index} of ${node.path}`);
  return child;
}

describe('previewValue', () => {
  it('quotes strings and leaves other primitives bare', () => {
    expect(previewValue('hi')).toBe('"hi"');
    expect(previewValue(42)).toBe('42');
    expect(previewValue(true)).toBe('true');
    expect(previewValue(null)).toBe('null');
    expect(previewValue(undefined)).toBe('undefined');
  });

  it('keeps a string of exactly the max length untruncated', () => {
    const exact = 'a'.repeat(PREVIEW_MAX_LENGTH);
    expect(previewValue(exact)).toBe(`"${exact}"`);
    expect(previewValue(exact)).not.toContain('…');
  });

  it('truncates one character past the max length', () => {
    const long = 'a'.repeat(PREVIEW_MAX_LENGTH + 1);
    expect(previewValue(long)).toBe(`"${'a'.repeat(PREVIEW_MAX_LENGTH)}…"`);
  });

  it('does not escape or mangle quotes inside the value', () => {
    expect(previewValue('say "hi"')).toBe('"say "hi""');
  });
});

describe('buildTree', () => {
  it('builds object paths with dots and array paths with indices', () => {
    const tree = buildTree({ users: [{ name: 'ada' }] }, '{ }', '$');
    const users = tree.children?.[0];
    const first = users?.children?.[0];
    const name = first?.children?.[0];

    expect(tree.path).toBe('$');
    expect(users?.path).toBe('$.users');
    expect(first?.path).toBe('$.users[0]');
    expect(name?.path).toBe('$.users[0].name');
  });

  it('tags leaf nodes with their runtime type, treating null as its own type', () => {
    const tree = buildTree({ n: 1, s: 'x', b: false, z: null }, '{ }', '$');
    const types = tree.children?.map((c) => c.valueType);
    expect(types).toEqual(['number', 'string', 'boolean', 'null']);
    expect(tree.children?.every((c) => c.type === 'value')).toBe(true);
  });

  it('classifies arrays as arrays rather than plain objects', () => {
    expect(buildTree([1, 2], '[ ]', '$').type).toBe('array');
    expect(buildTree({}, '{ }', '$').type).toBe('object');
  });

  it('carries hostile keys through the path verbatim, without escaping', () => {
    const key = '<img src=x onerror=alert(1)>';
    const tree = buildTree({ [key]: 1 }, '{ }', '$');
    expect(tree.children?.[0].path).toBe(`$.${key}`);
  });
});

describe('buildTooltipModel', () => {
  it('describes a leaf as a value model with its preview and type', () => {
    const leaf = childAt(buildTree({ name: 'ada' }, '{ }', '$'), 0);
    expect(buildTooltipModel(leaf)).toEqual({
      path: '$.name',
      kind: 'value',
      value: '"ada"',
      valueType: 'string',
    });
  });

  it('summarises containers with their child count, using items vs keys', () => {
    const tree = buildTree({ list: [1, 2, 3], obj: { a: 1 } }, '{ }', '$');
    const list = childAt(tree, 0);
    const obj = childAt(tree, 1);

    expect(buildTooltipModel(list)).toEqual({
      path: '$.list',
      kind: 'container',
      summary: 'array · 3 items',
    });
    expect(buildTooltipModel(obj)).toEqual({
      path: '$.obj',
      kind: 'container',
      summary: 'object · 1 keys',
    });
  });

  it('counts the static children, so the summary is independent of collapse state', () => {
    // d3 moves `children` to `_children` when a node is collapsed; the model
    // reads the JsonNode, which never changes, so the count must stay put.
    const tree = buildTree({ list: [1, 2, 3] }, '{ }', '$');
    const list = childAt(tree, 0);
    const model = buildTooltipModel(list) as Extract<GraphTooltipModel, { kind: 'container' }>;
    expect(model.summary).toContain('3 items');
  });

  // The injection fix: the tooltip used to be assembled as an HTML string and
  // handed to d3's .html(), so a key or value containing a tag was parsed as
  // markup and its event handlers ran on hover. The model is data only — no
  // field may carry markup, and the raw input must survive unescaped so the
  // render side can put it through .text().
  it('returns hostile paths and values as literal text, never markup', () => {
    const key = '<img src=x onerror=alert(1)>';
    const value = '<script>alert(1)</script>';
    const leaf = childAt(buildTree({ [key]: value }, '{ }', '$'), 0);
    const model = buildTooltipModel(leaf) as Extract<GraphTooltipModel, { kind: 'value' }>;

    expect(model.path).toBe(`$.${key}`);
    // Short enough to survive whole: the tags come back exactly as pasted.
    expect(value.length).toBeLessThanOrEqual(PREVIEW_MAX_LENGTH);
    expect(model.value).toBe(`"${value}"`);

    for (const field of Object.values(model)) {
      // No wrapper markup: the old implementation emitted `<div class="…">`
      // around every one of these fields.
      expect(field).not.toMatch(/<div|<span|class=/);
    }
    // And the payload is passed through untouched rather than entity-escaped,
    // which would corrupt legitimate values like `a < b`.
    expect(model.value).not.toContain('&lt;');
    expect(model.path).not.toContain('&lt;');
  });

  it('does not wrap container summaries in markup either', () => {
    const tree = buildTree({ '<b>k</b>': [1] }, '{ }', '$');
    const model = buildTooltipModel(childAt(tree, 0));
    expect(model.path).toBe('$.<b>k</b>');
    expect(model).not.toHaveProperty('html');
    expect(JSON.stringify(model)).not.toContain('<div');
  });
});

describe('buildTree - depth guard', () => {
  it('reports a 100,000-level document instead of throwing RangeError', () => {
    const deep = nestDeeply(100_000, 'array');
    expect(runDepthGuarded(() => buildTree(deep, 'root', '$'))).toEqual({
      ok: false,
      reason: 'too-deep',
      limit: MAX_JSON_DEPTH,
    });
  });

  it('builds a document that sits exactly on the limit', () => {
    const atLimit = nestDeeply(MAX_JSON_DEPTH, 'object');
    const built = runDepthGuarded(() => buildTree(atLimit, 'root', '$'));
    expect(built.ok).toBe(true);
  });

  it('leaves wide-but-shallow documents alone', () => {
    const wide = Array.from({ length: 2_000 }, (_, i) => i);
    const tree = buildTree(wide, 'root', '$');
    expect(tree.children).toHaveLength(2_000);
    expect(childAt(tree, 1_999).path).toBe('$[1999]');
  });
});
