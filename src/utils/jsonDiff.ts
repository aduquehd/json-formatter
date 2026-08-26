// Dependency-free JSON diff engine.
//
// Two complementary strategies live here:
//   1. Textual line diff (LCS) over pretty-printed JSON — powers the Split and
//      Unified views with GitHub-style hunks and intra-line character highlights.
//   2. Structural diff — a key-order-independent walk of the two values that
//      reports added / removed / modified / type-changed paths for the Semantic
//      view.
//
// Everything runs in the browser; no data ever leaves the page.

import { assertJsonDepth, type JsonValue } from './jsonWalk';

/* ------------------------------------------------------------------ *
 * Normalization
 * ------------------------------------------------------------------ */

// Recursively sort object keys so that re-ordered keys don't surface as
// textual changes. Arrays keep their order (order is meaningful in JSON arrays).
export function sortKeysDeep(value: any, depth = 0): any {
  // `depth` is a real argument now, so the recursion must be wrapped rather than
  // passed by reference: `value.map(sortKeysDeep)` would hand each element's
  // *index* to `depth` and trip the guard on the 513th member of a flat array.
  assertJsonDepth(depth);
  if (Array.isArray(value)) return value.map((item) => sortKeysDeep(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, any>>((acc, key) => {
        const sorted = sortKeysDeep(value[key], depth + 1);
        if (key === '__proto__') {
          // `acc.__proto__ = x` hits the setter inherited from Object.prototype:
          // it swaps the prototype and silently drops the key. JSON.parse can
          // produce a real own "__proto__" key, so define it as a data property
          // instead. Only this one key takes the slow path — normalize() runs on
          // every keystroke in the compare view.
          Object.defineProperty(acc, key, {
            value: sorted,
            enumerable: true,
            writable: true,
            configurable: true,
          });
        } else {
          acc[key] = sorted;
        }
        return acc;
      }, {});
  }
  return value;
}

export function normalize(data: any, sortKeys: boolean): string {
  return JSON.stringify(sortKeys ? sortKeysDeep(data) : data, null, 2);
}

/* ------------------------------------------------------------------ *
 * Sequence diff (shared LCS core)
 * ------------------------------------------------------------------ */

// Cap the LCS table so a pathological input can't freeze the tab. The table is
// a single flat Uint32Array of (n + 1) * (m + 1) cells — 4 bytes each — so this
// cap is a ~48 MB transient allocation and covers a changed region of roughly
// 3400 x 3400 lines. Beyond it the line diff falls back to a plain block
// replace (delete everything, add everything) and sets `lcsFallback` on its
// result, because that fallback is a wrong-looking answer, not a slower one.
export const MAX_LCS_CELLS = 12_000_000;

// Aligning array items by content (instead of by position) uses the same table
// plus one stable serialization per item, and runs once per array node rather
// than once per document — so it is bounded by item count, not by cells: two
// 2000-item arrays are a 2000 x 2000 table (16 MB) and measured ~16 ms end to
// end, against ~3 ms for 500 items. Longer arrays fall back to the positional
// walk, which is cheap but re-reports every item after an insertion as
// modified; those arrays are listed in `positionalArrays` so the view can say
// so. Ordinary record arrays must stay under this bound.
export const MAX_ARRAY_ALIGN_ITEMS = 2_000;

export type EditOp =
  | { type: 'equal'; ai: number; bi: number }
  | { type: 'remove'; ai: number }
  | { type: 'add'; bi: number };

// Classic LCS edit script over two string sequences. The dynamic-programming
// table is a flat typed array indexed `i * width + j` rather than an array of
// arrays: one allocation, 4 bytes per cell, and no per-row object headers.
// Callers are responsible for bounding the table size (see the caps above).
function diffSequences(a: string[], b: string[]): EditOp[] {
  const n = a.length;
  const m = b.length;
  const width = m + 1;
  // dp[i * width + j] = length of the LCS of a[i:] and b[j:]
  const dp = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    const row = i * width;
    const nextRow = row + width;
    for (let j = m - 1; j >= 0; j--) {
      dp[row + j] =
        a[i] === b[j] ? dp[nextRow + j + 1] + 1 : Math.max(dp[nextRow + j], dp[row + j + 1]);
    }
  }

  const ops: EditOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: 'equal', ai: i, bi: j });
      i++;
      j++;
    } else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) {
      ops.push({ type: 'remove', ai: i });
      i++;
    } else {
      ops.push({ type: 'add', bi: j });
      j++;
    }
  }
  while (i < n) ops.push({ type: 'remove', ai: i++ });
  while (j < m) ops.push({ type: 'add', bi: j++ });
  return ops;
}

/* ------------------------------------------------------------------ *
 * Textual line diff
 * ------------------------------------------------------------------ */

type RawOp =
  | { type: 'equal'; text: string; leftNo: number; rightNo: number }
  | { type: 'remove'; text: string; leftNo: number }
  | { type: 'add'; text: string; rightNo: number };

export interface EqualRow {
  leftNo: number;
  rightNo: number;
  text: string;
}

export interface DiffLine {
  no: number;
  text: string;
}

export type DiffBlock =
  | { kind: 'equal'; rows: EqualRow[] }
  | { kind: 'change'; removed: DiffLine[]; added: DiffLine[] };

function opsToBlocks(ops: RawOp[]): DiffBlock[] {
  const blocks: DiffBlock[] = [];
  let equal: EqualRow[] = [];
  let removed: DiffLine[] = [];
  let added: DiffLine[] = [];

  const flushChange = () => {
    if (removed.length || added.length) {
      blocks.push({ kind: 'change', removed, added });
      removed = [];
      added = [];
    }
  };
  const flushEqual = () => {
    if (equal.length) {
      blocks.push({ kind: 'equal', rows: equal });
      equal = [];
    }
  };

  for (const op of ops) {
    if (op.type === 'equal') {
      flushChange();
      equal.push({ leftNo: op.leftNo, rightNo: op.rightNo, text: op.text });
    } else {
      flushEqual();
      if (op.type === 'remove') removed.push({ no: op.leftNo, text: op.text });
      else added.push({ no: op.rightNo, text: op.text });
    }
  }
  flushEqual();
  flushChange();
  return blocks;
}

export interface LineDiffResult {
  blocks: DiffBlock[];
  /**
   * True when the changed region was too large for the LCS table (see
   * {@link MAX_LCS_CELLS}) and was reported as one block replace instead: every
   * line of the left region marked removed and every line of the right region
   * marked added, including lines that are identical on both sides.
   *
   * The blocks are still a faithful reconstruction of both documents, but they
   * are NOT the minimal edit script — so a caller that shows them to a human has
   * to say so, otherwise the view claims a whole file changed when one line did.
   */
  lcsFallback: boolean;
}

// Diff two multi-line strings. Trims the common prefix/suffix first (the common
// case for JSON where only a handful of lines change) so the expensive LCS only
// runs on the genuinely differing middle.
export function computeLineDiff(leftText: string, rightText: string): LineDiffResult {
  const a = leftText.split('\n');
  const b = rightText.split('\n');

  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;

  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const ops: RawOp[] = [];
  for (let i = 0; i < start; i++) {
    ops.push({ type: 'equal', text: a[i], leftNo: i + 1, rightNo: i + 1 });
  }

  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);

  let lcsFallback = false;
  if (midA.length * midB.length > MAX_LCS_CELLS) {
    lcsFallback = true;
    for (let i = 0; i < midA.length; i++) {
      ops.push({ type: 'remove', text: midA[i], leftNo: start + i + 1 });
    }
    for (let j = 0; j < midB.length; j++) {
      ops.push({ type: 'add', text: midB[j], rightNo: start + j + 1 });
    }
  } else if (midA.length || midB.length) {
    for (const op of diffSequences(midA, midB)) {
      if (op.type === 'equal') {
        ops.push({
          type: 'equal',
          text: midA[op.ai],
          leftNo: start + op.ai + 1,
          rightNo: start + op.bi + 1,
        });
      } else if (op.type === 'remove') {
        ops.push({ type: 'remove', text: midA[op.ai], leftNo: start + op.ai + 1 });
      } else {
        ops.push({ type: 'add', text: midB[op.bi], rightNo: start + op.bi + 1 });
      }
    }
  }

  // Common suffix realigns both sides; numbering picks up after each side's mid.
  const suffixLen = a.length - endA;
  for (let k = 0; k < suffixLen; k++) {
    ops.push({ type: 'equal', text: a[endA + k], leftNo: endA + k + 1, rightNo: endB + k + 1 });
  }

  return { blocks: opsToBlocks(ops), lcsFallback };
}

/* ------------------------------------------------------------------ *
 * Intra-line character highlight
 * ------------------------------------------------------------------ */

export interface CharSeg {
  text: string;
  changed: boolean;
}

// Cheap, readable character diff: shared prefix + shared suffix, everything in
// between is "changed". For JSON value edits ("Alice" -> "Alicia") this lands
// exactly on the part that moved, which is what a reader wants to see.
export function charDiff(oldLine: string, newLine: string): { left: CharSeg[]; right: CharSeg[] } {
  const max = Math.min(oldLine.length, newLine.length);
  let prefix = 0;
  while (prefix < max && oldLine[prefix] === newLine[prefix]) prefix++;

  let suffix = 0;
  while (
    suffix < max - prefix &&
    oldLine[oldLine.length - 1 - suffix] === newLine[newLine.length - 1 - suffix]
  ) {
    suffix++;
  }

  const segs = (line: string): CharSeg[] =>
    [
      { text: line.slice(0, prefix), changed: false },
      { text: line.slice(prefix, line.length - suffix), changed: true },
      { text: line.slice(line.length - suffix), changed: false },
    ].filter((s) => s.text.length > 0);

  return { left: segs(oldLine), right: segs(newLine) };
}

/* ------------------------------------------------------------------ *
 * Stats
 * ------------------------------------------------------------------ */

export interface LineStats {
  additions: number;
  deletions: number;
  hunks: number;
}

export function lineStats(blocks: DiffBlock[]): LineStats {
  let additions = 0;
  let deletions = 0;
  let hunks = 0;
  for (const block of blocks) {
    if (block.kind === 'change') {
      additions += block.added.length;
      deletions += block.removed.length;
      hunks++;
    }
  }
  return { additions, deletions, hunks };
}

/* ------------------------------------------------------------------ *
 * Structural (semantic) diff
 * ------------------------------------------------------------------ */

export type DiffType = 'added' | 'removed' | 'modified' | 'type-changed';

export interface StructuralDiff {
  path: string;
  type: DiffType;
  leftValue?: any;
  rightValue?: any;
}

function valueType(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

// Key-order-independent serialization used only to decide which array items
// correspond to each other. Values the JSON grammar can't express (undefined,
// functions, symbols) stringify to undefined; collapse those to one sentinel —
// the recursive compare below still reports how the pair actually differs.
const UNSERIALIZABLE = '\0unserializable';

function stableSerialize(value: any, depth: number): string {
  const json = JSON.stringify(sortKeysDeep(value, depth));
  return json === undefined ? UNSERIALIZABLE : json;
}

export interface StructuralDiffResult {
  diffs: StructuralDiff[];
  /**
   * Paths of the arrays that were too long to align by content (see
   * {@link MAX_ARRAY_ALIGN_ITEMS}) and were therefore compared index by index.
   * Distinct paths, in the order they were first reached.
   *
   * A positional comparison never misses a change, but it reports a shifted
   * array badly: prepending one item to a 2,001-item array reports 2,001 diffs
   * instead of one addition. A caller showing these diffs to a human has to
   * disclose that, or the view is confidently wrong about what changed.
   */
  positionalArrays: string[];
}

// Accumulator threaded through the walk. Sub-walks push into the same arrays
// instead of returning fresh ones: it keeps the degraded-comparison signal
// flowing up from any depth, and avoids `diffs.push(...subDiffs)`, which spreads
// the whole sub-result onto the argument stack and throws RangeError once a
// single node produces enough diffs.
interface StructuralContext {
  diffs: StructuralDiff[];
  positionalArrays: string[];
}

// Align two arrays by item content instead of by position, so inserting one
// element at the front reports a single addition rather than re-reporting every
// element after it as modified.
function compareArrayAligned(
  left: any[],
  right: any[],
  path: string,
  depth: number,
  ctx: StructuralContext
): void {
  const diffs = ctx.diffs;
  // Wrapped, not passed by reference: `map` supplies an index as the second
  // argument, which `stableSerialize` now reads as a depth.
  const ops = diffSequences(
    left.map((item) => stableSerialize(item, depth + 1)),
    right.map((item) => stableSerialize(item, depth + 1))
  );

  // Removed and added items that land in the same run are far more likely to be
  // one edited item than an unrelated delete plus insert, so pair them up and
  // recurse. A pair is reported at its RIGHT-hand index so that a "modified"
  // path resolves in the updated document; a leftover removal keeps its left
  // index, the only side it exists on.
  //
  // That makes an array path a per-side hint, not a unique id: an unbalanced
  // run can reuse one index for a pair and for a leftover removal (see
  // ['K','A','B'] vs ['N','K','X'] in the tests, which reports $[2] twice).
  // No single-index scheme avoids this once items are aligned rather than
  // walked by position, so consumers must not key rows by path alone.
  let pendingRemoved: number[] = [];
  let pendingAdded: number[] = [];

  const flush = () => {
    const paired = Math.min(pendingRemoved.length, pendingAdded.length);
    for (let k = 0; k < paired; k++) {
      const i = pendingRemoved[k];
      const j = pendingAdded[k];
      compareInto(left[i], right[j], `${path}[${j}]`, depth + 1, ctx);
    }
    for (let k = paired; k < pendingRemoved.length; k++) {
      const i = pendingRemoved[k];
      diffs.push({ path: `${path}[${i}]`, type: 'removed', leftValue: left[i] });
    }
    for (let k = paired; k < pendingAdded.length; k++) {
      const j = pendingAdded[k];
      diffs.push({ path: `${path}[${j}]`, type: 'added', rightValue: right[j] });
    }
    pendingRemoved = [];
    pendingAdded = [];
  };

  for (const op of ops) {
    if (op.type === 'remove') {
      pendingRemoved.push(op.ai);
    } else if (op.type === 'add') {
      pendingAdded.push(op.bi);
    } else {
      flush();
      compareInto(left[op.ai], right[op.bi], `${path}[${op.bi}]`, depth + 1, ctx);
    }
  }
  flush();
}

/**
 * Key-order-independent walk. Objects compare by key, arrays by aligned item
 * (or by index once an array is too large to align), leaves by value. Reports
 * the most specific changed paths rather than whole subtrees.
 *
 * Returns the diffs together with the paths of any array that had to be
 * compared positionally, so the caller can tell the user the answer is coarser
 * than usual instead of presenting a shifted array as thousands of edits.
 */
export function compareStructured(
  left: any,
  right: any,
  path = '$',
  depth = 0
): StructuralDiffResult {
  const ctx: StructuralContext = { diffs: [], positionalArrays: [] };
  compareInto(left, right, path, depth, ctx);
  return {
    diffs: ctx.diffs,
    // One array is reached once, but a path is not a unique id (see the note in
    // compareArrayAligned), so collapse repeats while keeping first-seen order.
    positionalArrays: Array.from(new Set(ctx.positionalArrays)),
  };
}

function compareInto(
  left: any,
  right: any,
  path: string,
  depth: number,
  ctx: StructuralContext
): void {
  assertJsonDepth(depth);
  const diffs = ctx.diffs;

  if (Object.is(left, right)) return;

  const lt = valueType(left);
  const rt = valueType(right);

  if (lt !== rt) {
    diffs.push({ path, type: 'type-changed', leftValue: left, rightValue: right });
    return;
  }

  if (lt !== 'object' && lt !== 'array') {
    if (left !== right) diffs.push({ path, type: 'modified', leftValue: left, rightValue: right });
    return;
  }

  if (lt === 'array') {
    const leftArr = left as JsonValue[];
    const rightArr = right as JsonValue[];
    if (leftArr.length <= MAX_ARRAY_ALIGN_ITEMS && rightArr.length <= MAX_ARRAY_ALIGN_ITEMS) {
      compareArrayAligned(leftArr, rightArr, path, depth, ctx);
      return;
    }
    // Too big to align: compare index by index, and record that this array's
    // result is positional so the caller can disclose it.
    ctx.positionalArrays.push(path);
    const max = Math.max(leftArr.length, rightArr.length);
    for (let i = 0; i < max; i++) {
      if (i >= leftArr.length)
        diffs.push({ path: `${path}[${i}]`, type: 'added', rightValue: rightArr[i] });
      else if (i >= rightArr.length)
        diffs.push({ path: `${path}[${i}]`, type: 'removed', leftValue: leftArr[i] });
      else compareInto(leftArr[i], rightArr[i], `${path}[${i}]`, depth + 1, ctx);
    }
    return;
  }

  const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)]));
  for (const key of keys) {
    // JSON.stringify supplies the quotes and escapes anything inside them, so a
    // key containing " or \ still produces a path that parses back to that key.
    const keyPath = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
      ? `${path}.${key}`
      : `${path}[${JSON.stringify(key)}]`;
    // Object.hasOwn, not `key in obj`: every object inherits "constructor",
    // "toString", "valueOf", … from Object.prototype, and `in` would claim a
    // key like that already exists on the other side and then diff against an
    // inherited function.
    if (!Object.hasOwn(left, key)) {
      diffs.push({ path: keyPath, type: 'added', rightValue: right[key] });
    } else if (!Object.hasOwn(right, key)) {
      diffs.push({ path: keyPath, type: 'removed', leftValue: left[key] });
    } else {
      compareInto(left[key], right[key], keyPath, depth + 1, ctx);
    }
  }
}
