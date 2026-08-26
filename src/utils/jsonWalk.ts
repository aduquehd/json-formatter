/**
 * Depth safety for every recursive walk over a parsed JSON document.
 *
 * `JSON.parse` is iterative in V8, so a document like `[[[[…1…]]]]` with a
 * hundred thousand brackets parses in milliseconds and hands the views a value
 * that is perfectly valid and completely un-walkable: the first plain recursive
 * traversal blows the stack with `RangeError: Maximum call stack size exceeded`.
 * The views sit inside an `ErrorBoundary`, so the user gets an error panel and a
 * message that means nothing to them.
 *
 * The fix here is a *guard*, not an iterative rewrite of the walkers, because an
 * iterative walker would not actually make the deep case work. Measured on this
 * machine (Node 24, V8 default ~1 MB stack — the same engine and roughly the
 * same budget Chrome gives a page):
 *
 *   JSON.parse            1,000,000+ levels   (iterative; never the bottleneck)
 *   JSON.stringify            ~6,182 levels   (recursive, engine-internal)
 *   structuredClone           ~2,218 levels   (recursive, engine-internal)
 *   our own walkers      ~4,096–4,863 levels  (light and fat frames)
 *
 * `JSON.stringify` and `structuredClone` are engine primitives every view
 * depends on — Stats measures the minified size, the tree editor clones before
 * writing — and neither can be made iterative. So the real ceiling is set by the
 * engine, not by our recursion; the honest fix is to bound the depth we accept
 * and tell the user, rather than to walk deeper and die one line later.
 *
 * {@link MAX_JSON_DEPTH} is that bound. Below it every guard is a no-op and the
 * walkers behave exactly as before.
 */

/* ------------------------------------------------------------------ *
 * The JSON value type
 * ------------------------------------------------------------------ */

/** A JSON scalar. */
export type JsonPrimitive = string | number | boolean | null;

/** A JSON object. Declared as an interface so the union below can be recursive. */
export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = JsonValue[];

/**
 * Anything `JSON.parse` can return.
 *
 * The views still type their `json` prop as `any`; this union exists so the
 * later type-cleanup phase has one shared definition to adopt instead of twelve
 * private ones.
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/* ------------------------------------------------------------------ *
 * The depth limit
 * ------------------------------------------------------------------ */

/**
 * Deepest nesting level any view will walk. The document root is level 0, its
 * members are level 1, and so on.
 *
 * 512 is generous for real data by a wide margin — configuration files, API
 * payloads, GeoJSON and lock files live at one or two dozen levels — and it
 * leaves headroom against every measured ceiling in the module comment above:
 * ~4.3x on `structuredClone` (the tightest, and the one the tree editor needs),
 * ~8x on our own recursion and ~12x on `JSON.stringify`. That margin is
 * deliberate: those numbers come from one engine on one machine, browsers on
 * smaller stacks (and React's own frames sitting underneath ours) get less, and
 * no equivalent measurement exists for JavaScriptCore or SpiderMonkey.
 */
export const MAX_JSON_DEPTH = 512;

/** Thrown by {@link assertJsonDepth} when a walk goes past the limit. */
export class JsonDepthLimitError extends Error {
  readonly limit: number;

  constructor(limit: number) {
    super(`JSON nesting exceeds the supported depth of ${limit} levels`);
    this.name = 'JsonDepthLimitError';
    this.limit = limit;
  }
}

export function isJsonDepthLimitError(error: unknown): error is JsonDepthLimitError {
  return error instanceof JsonDepthLimitError;
}

/**
 * Does this error look like a blown stack?
 *
 * Engines disagree on both the constructor and the wording — V8 and JSC throw
 * `RangeError: Maximum call stack size exceeded`, SpiderMonkey throws
 * `InternalError: too much recursion` — so this matches on the message and does
 * not test the constructor. A heuristic by necessity, used only as a backstop
 * for recursion we do not own (`JSON.stringify`, `structuredClone`).
 */
const STACK_OVERFLOW_MESSAGE = /maximum call stack|call stack size exceeded|too much recursion/i;

export function isStackOverflow(error: unknown): boolean {
  return error instanceof Error && STACK_OVERFLOW_MESSAGE.test(error.message);
}

/**
 * True while `depth` is still walkable. For walkers that already degrade
 * gracefully (the search engine reports a partial result rather than failing),
 * this is the non-throwing form of {@link assertJsonDepth}.
 */
export function isWithinJsonDepth(depth: number, limit: number = MAX_JSON_DEPTH): boolean {
  return depth <= limit;
}

/**
 * Call at the top of each recursive step, passing that step's depth. A no-op for
 * anything a browser can actually render; throws {@link JsonDepthLimitError} the
 * moment the walk goes deeper than `limit`.
 */
export function assertJsonDepth(depth: number, limit: number = MAX_JSON_DEPTH): void {
  if (depth > limit) throw new JsonDepthLimitError(limit);
}

/* ------------------------------------------------------------------ *
 * Running a guarded walk
 * ------------------------------------------------------------------ */

export type DepthGuardedResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'too-deep'; limit: number };

/**
 * Run a guarded walk and turn a depth overflow into a value the caller can
 * render, instead of an exception that reaches the error boundary.
 *
 * Also catches a genuine stack overflow, so a view survives recursion it does
 * not own — `JSON.stringify` on the same document, say. Every other error is
 * re-thrown untouched: a bug in a walker must still surface as a bug.
 */
export function runDepthGuarded<T>(
  run: () => T,
  limit: number = MAX_JSON_DEPTH
): DepthGuardedResult<T> {
  try {
    return { ok: true, value: run() };
  } catch (error) {
    if (isJsonDepthLimitError(error)) {
      return { ok: false, reason: 'too-deep', limit: error.limit };
    }
    if (isStackOverflow(error)) {
      return { ok: false, reason: 'too-deep', limit };
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ *
 * Iterative probe
 * ------------------------------------------------------------------ */

/**
 * Is anything in this document nested deeper than `limit`?
 *
 * Walks with an explicit stack and never recurses, so it is safe on a document
 * that no recursive walker could survive — which is the whole point: it is the
 * one question that must be answerable *before* deciding whether to recurse.
 * Returns as soon as the answer is known, and only ever holds containers on its
 * stack, so a wide-but-shallow document costs one pass and no per-leaf storage.
 *
 * Callers that walk the document anyway should prefer {@link assertJsonDepth}
 * inside their own recursion, which costs nothing; this is for the places where
 * the recursion is not ours to instrument (React's render, `structuredClone`).
 */
export function exceedsJsonDepth(value: unknown, limit: number = MAX_JSON_DEPTH): boolean {
  if (limit < 0) return true;

  const nodes: unknown[] = [value];
  const depths: number[] = [0];

  while (nodes.length > 0) {
    const node = nodes.pop();
    const depth = depths.pop() as number;

    if (depth > limit) return true;
    if (node === null || typeof node !== 'object') continue;

    const children: unknown[] = Array.isArray(node) ? node : Object.values(node);
    if (children.length === 0) continue;
    // Any member at all sits one level down, primitive or not.
    if (depth + 1 > limit) return true;

    for (const child of children) {
      // Primitives can never be deeper than the container holding them, and the
      // line above has already accounted for their level.
      if (child !== null && typeof child === 'object') {
        nodes.push(child);
        depths.push(depth + 1);
      }
    }
  }

  return false;
}

/**
 * Build a value nested `depth` levels deep, without recursing.
 *
 * Lives beside the guard rather than in a test file because the fixtures that
 * exercise it are the same shape everywhere and building one by recursion would
 * blow the stack before the test could run.
 */
export function nestDeeply(depth: number, kind: 'object' | 'array' = 'object'): JsonValue {
  let value: JsonValue = 1;
  for (let i = 0; i < depth; i++) {
    value = kind === 'array' ? [value] : { a: value };
  }
  return value;
}
