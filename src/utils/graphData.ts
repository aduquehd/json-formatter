/**
 * Pure data helpers behind the D3 graph view.
 *
 * These live outside the component on purpose: everything here is fed straight
 * from user-supplied JSON (arbitrary keys, arbitrary string values), so it is
 * the part that most needs unit tests. Nothing here produces markup — the
 * tooltip builder returns a plain data model that the component renders with
 * DOM nodes and `.text()`, never with `.html()`.
 */

import { assertJsonDepth } from './jsonWalk';

export type JsonNodeType = 'object' | 'array' | 'value';

export interface JsonNode {
  name: string;
  type: JsonNodeType;
  path: string;
  value?: unknown;
  valueType?: string;
  children?: JsonNode[];
}

/** Strings longer than this are truncated in node labels and tooltips. */
export const PREVIEW_MAX_LENGTH = 28;

/**
 * Render a leaf value as display text. Strings keep their quotes and are
 * truncated with an ellipsis; everything else is stringified as-is.
 *
 * The result is plain text, never escaped and never markup — callers must
 * insert it via `textContent` / d3 `.text()`.
 */
export function previewValue(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') {
    return value.length > PREVIEW_MAX_LENGTH
      ? `"${value.slice(0, PREVIEW_MAX_LENGTH)}…"`
      : `"${value}"`;
  }
  return String(value);
}

/**
 * Turn parsed JSON into the hierarchy d3 lays out, tagging every node with the
 * JSONPath-ish path shown in the tooltip (`$.users[0].name`).
 *
 * Throws `JsonDepthLimitError` past `MAX_JSON_DEPTH`; GraphView runs it inside
 * `runDepthGuarded` and shows the "nested too deeply" panel instead. Capping
 * here is also what keeps d3 safe: `d3.hierarchy` and the tree layout only ever
 * see the shape this function produced.
 */
export function buildTree(data: unknown, name: string, path: string, depth = 0): JsonNode {
  assertJsonDepth(depth);
  if (Array.isArray(data)) {
    return {
      name,
      type: 'array',
      path,
      children: data.map((v, i) => buildTree(v, String(i), `${path}[${i}]`, depth + 1)),
    };
  }
  if (data !== null && typeof data === 'object') {
    return {
      name,
      type: 'object',
      path,
      children: Object.entries(data).map(([k, v]) => buildTree(v, k, `${path}.${k}`, depth + 1)),
    };
  }
  return {
    name,
    type: 'value',
    path,
    value: data,
    valueType: data === null ? 'null' : typeof data,
  };
}

/**
 * The text the hover tooltip shows, as data rather than a string of HTML.
 *
 * `path` and `value` are raw user input and are returned verbatim: escaping
 * them here would be the wrong fix (it would corrupt legitimate values like
 * `"a < b"`). Safety comes from the render side using `.text()`.
 */
export type GraphTooltipModel =
  | { path: string; kind: 'value'; value: string; valueType: string }
  | { path: string; kind: 'container'; summary: string };

export function buildTooltipModel(node: JsonNode): GraphTooltipModel {
  if (node.type === 'value') {
    return {
      path: node.path,
      kind: 'value',
      value: previewValue(node.value),
      valueType: node.valueType ?? '',
    };
  }
  const count = node.children ? node.children.length : 0;
  return {
    path: node.path,
    kind: 'container',
    summary: `${node.type} · ${count} ${node.type === 'array' ? 'items' : 'keys'}`,
  };
}
