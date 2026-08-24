/**
 * Structured JSON paths.
 *
 * A path is an array of segments: a `string` segment addresses an object key and
 * a `number` segment addresses an array index. Keeping paths structured is what
 * makes `{"a.b": 1}` and `{"a": {"b": 1}}` distinguishable — the legacy
 * `root.a.b` string form collapsed them onto the same key, so expanding or
 * editing one silently hit the other.
 *
 * `formatPath` renders a segment array as a display string that is *injective*:
 * keys that are not plain identifiers are emitted in bracket-quoted JSON form,
 * so the display string can be used as a React key / Set member and parsed back
 * with `parsePath` without loss.
 *
 * These helpers are intentionally free of React so other views that still tear
 * paths apart with `split(/\.|\[|\]/)` (SearchView, at time of writing) can adopt
 * them without any further refactor.
 */

import { assertJsonDepth } from './jsonWalk';

export type PathSegment = string | number;
export type JsonPath = readonly PathSegment[];

const ROOT_LABEL = 'root';
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const INDEX = /^(0|[1-9][0-9]*)$/;

/** Number of top-level entries expanded by default. */
const DEFAULT_TOP_LEVEL = 10;
/** Number of top-level entries whose children are also expanded by default. */
const DEFAULT_SECOND_LEVEL_PARENTS = 3;
/** Number of children expanded per second-level parent. */
const DEFAULT_SECOND_LEVEL = 3;

export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isJsonContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  return typeof value === 'object' && value !== null;
}

/**
 * Child entries of a container as `[segment, value]` pairs — numeric segments for
 * arrays, string segments for objects. Non-containers have no entries.
 */
export function entriesOf(value: unknown): [PathSegment, unknown][] {
  if (Array.isArray(value)) return value.map((item, index) => [index, item]);
  if (isJsonObject(value)) return Object.entries(value);
  return [];
}

export function formatSegment(segment: PathSegment): string {
  if (typeof segment === 'number') return `[${segment}]`;
  if (IDENTIFIER.test(segment)) return `.${segment}`;
  return `[${JSON.stringify(segment)}]`;
}

/** Display / identity string for a path. Injective: distinct paths never collide. */
export function formatPath(segments: JsonPath, root: string = ROOT_LABEL): string {
  let out = root;
  for (const segment of segments) out += formatSegment(segment);
  return out;
}

/** Inverse of {@link formatPath}. Returns `null` for anything malformed. */
export function parsePath(path: string, root: string = ROOT_LABEL): PathSegment[] | null {
  if (!path.startsWith(root)) return null;
  const segments: PathSegment[] = [];
  let i = root.length;

  while (i < path.length) {
    const char = path[i];

    if (char === '.') {
      i += 1;
      const start = i;
      while (i < path.length && path[i] !== '.' && path[i] !== '[') i += 1;
      const name = path.slice(start, i);
      if (!IDENTIFIER.test(name)) return null;
      segments.push(name);
      continue;
    }

    if (char !== '[') return null;
    i += 1;

    if (path[i] === '"') {
      let j = i + 1;
      let closed = false;
      while (j < path.length) {
        if (path[j] === '\\') {
          j += 2;
          continue;
        }
        if (path[j] === '"') {
          closed = true;
          break;
        }
        j += 1;
      }
      if (!closed || path[j + 1] !== ']') return null;
      let key: unknown;
      try {
        key = JSON.parse(path.slice(i, j + 1));
      } catch {
        return null;
      }
      if (typeof key !== 'string') return null;
      segments.push(key);
      i = j + 2;
      continue;
    }

    const end = path.indexOf(']', i);
    if (end === -1) return null;
    const digits = path.slice(i, end);
    if (!INDEX.test(digits)) return null;
    segments.push(Number(digits));
    i = end + 1;
  }

  return segments;
}

export function pathsEqual(a: JsonPath, b: JsonPath): boolean {
  if (a.length !== b.length) return false;
  return a.every((segment, index) => segment === b[index]);
}

/** True when `prefix` addresses `path` itself or one of its ancestors. */
export function isPathPrefix(prefix: JsonPath, path: JsonPath): boolean {
  if (prefix.length > path.length) return false;
  return prefix.every((segment, index) => segment === path[index]);
}

/**
 * Assign an own, enumerable, writable property. Plain `obj[key] = value` runs the
 * inherited `__proto__` setter, so a key named `__proto__` would mutate the
 * prototype instead of round-tripping through `JSON.stringify`.
 */
function defineOwn(target: Record<string, unknown>, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

/** Read a value by path. Own properties only — never walks the prototype chain. */
export function getAtPath(root: unknown, segments: JsonPath): unknown {
  let current: unknown = root;
  for (const segment of segments) {
    if (typeof segment === 'number') {
      if (!Array.isArray(current) || segment < 0 || segment >= current.length) return undefined;
      current = current[segment];
      continue;
    }
    if (!isJsonObject(current) || !Object.hasOwn(current, segment)) return undefined;
    current = current[segment];
  }
  return current;
}

/**
 * Write a value by path, mutating `root` in place. Returns `false` when the path
 * does not address an existing slot (empty path included — there is no container
 * to write into, so the caller must replace the root itself).
 */
export function setAtPath(root: unknown, segments: JsonPath, value: unknown): boolean {
  if (segments.length === 0) return false;
  const parent = getAtPath(root, segments.slice(0, -1));
  const last = segments[segments.length - 1];

  if (typeof last === 'number') {
    if (!Array.isArray(parent) || last < 0 || last >= parent.length) return false;
    parent[last] = value;
    return true;
  }

  if (!isJsonObject(parent) || !Object.hasOwn(parent, last)) return false;
  defineOwn(parent, last, value);
  return true;
}

/**
 * Rebuild `source` with `oldKey` renamed to `newKey`, preserving key order.
 * `Object.fromEntries` uses CreateDataProperty, so `__proto__` survives as an own
 * property rather than being swallowed by the prototype setter.
 */
export function renameKeyInObject(
  source: Record<string, unknown>,
  oldKey: string,
  newKey: string
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key === oldKey ? newKey : key, value])
  );
}

/**
 * Paths of every container node, used by "expand all".
 *
 * Throws `JsonDepthLimitError` past `MAX_JSON_DEPTH` rather than recursing into a
 * document deep enough to blow the stack. TreeView refuses to render such a
 * document at all, so in practice this guard is only ever a backstop.
 */
export function collectExpandablePaths(json: unknown): Set<string> {
  const paths = new Set<string>();
  const walk = (value: unknown, segments: PathSegment[], depth: number) => {
    assertJsonDepth(depth);
    for (const [segment, child] of entriesOf(value)) {
      const next = [...segments, segment];
      if (isJsonContainer(child)) {
        paths.add(formatPath(next));
        walk(child, next, depth + 1);
      }
    }
  };
  walk(json, [], 0);
  return paths;
}

/**
 * Paths expanded when a document is first shown: the first ten top-level
 * containers, plus the first three children of the first three of those.
 */
export function defaultExpandedPaths(json: unknown): Set<string> {
  const paths = new Set<string>();
  const topLevel = entriesOf(json);

  topLevel.slice(0, DEFAULT_TOP_LEVEL).forEach(([segment, value]) => {
    if (isJsonContainer(value)) paths.add(formatPath([segment]));
  });

  topLevel.slice(0, DEFAULT_SECOND_LEVEL_PARENTS).forEach(([segment, value]) => {
    if (!isJsonContainer(value)) return;
    entriesOf(value)
      .slice(0, DEFAULT_SECOND_LEVEL)
      .forEach(([childSegment, childValue]) => {
        if (isJsonContainer(childValue)) paths.add(formatPath([segment, childSegment]));
      });
  });

  return paths;
}

/**
 * Rewrite expanded-node keys after `parentPath[oldKey]` is renamed to `newKey`,
 * covering the renamed node itself and every descendant. Unparseable entries are
 * passed through untouched.
 */
export function remapExpandedAfterRename(
  paths: Iterable<string>,
  parentPath: JsonPath,
  oldKey: string,
  newKey: string
): Set<string> {
  const renamedPath = [...parentPath, oldKey];
  const remapped = new Set<string>();

  for (const pathKey of paths) {
    const segments = parsePath(pathKey);
    if (!segments || !isPathPrefix(renamedPath, segments)) {
      remapped.add(pathKey);
      continue;
    }
    const next = [...segments];
    next[parentPath.length] = newKey;
    remapped.add(formatPath(next));
  }

  return remapped;
}
