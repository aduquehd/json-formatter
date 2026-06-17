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

/* ------------------------------------------------------------------ *
 * Normalization
 * ------------------------------------------------------------------ */

// Recursively sort object keys so that re-ordered keys don't surface as
// textual changes. Arrays keep their order (order is meaningful in JSON arrays).
export function sortKeysDeep(value: any): any {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, any>>((acc, key) => {
        acc[key] = sortKeysDeep(value[key]);
        return acc;
      }, {});
  }
  return value;
}

export function normalize(data: any, sortKeys: boolean): string {
  return JSON.stringify(sortKeys ? sortKeysDeep(data) : data, null, 2);
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

// Cap the LCS table so a pathological input can't freeze the tab. When the
// changed region is larger than this, fall back to a plain block replace.
const MAX_LCS_CELLS = 4_000_000;

function lcsDiff(a: string[], b: string[], offset: number): RawOp[] {
  const n = a.length;
  const m = b.length;
  // dp[i][j] = length of the LCS of a[i:] and b[j:]
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops: RawOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: 'equal', text: a[i], leftNo: offset + i + 1, rightNo: offset + j + 1 });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'remove', text: a[i], leftNo: offset + i + 1 });
      i++;
    } else {
      ops.push({ type: 'add', text: b[j], rightNo: offset + j + 1 });
      j++;
    }
  }
  while (i < n) ops.push({ type: 'remove', text: a[i], leftNo: offset + i++ + 1 });
  while (j < m) ops.push({ type: 'add', text: b[j], rightNo: offset + j++ + 1 });
  return ops;
}

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

// Diff two multi-line strings. Trims the common prefix/suffix first (the common
// case for JSON where only a handful of lines change) so the expensive LCS only
// runs on the genuinely differing middle.
export function computeLineDiff(leftText: string, rightText: string): DiffBlock[] {
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

  if (midA.length * midB.length > MAX_LCS_CELLS) {
    for (let i = 0; i < midA.length; i++) {
      ops.push({ type: 'remove', text: midA[i], leftNo: start + i + 1 });
    }
    for (let j = 0; j < midB.length; j++) {
      ops.push({ type: 'add', text: midB[j], rightNo: start + j + 1 });
    }
  } else if (midA.length || midB.length) {
    ops.push(...lcsDiff(midA, midB, start));
  }

  // Common suffix realigns both sides; numbering picks up after each side's mid.
  const suffixLen = a.length - endA;
  for (let k = 0; k < suffixLen; k++) {
    ops.push({ type: 'equal', text: a[endA + k], leftNo: endA + k + 1, rightNo: endB + k + 1 });
  }

  return opsToBlocks(ops);
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

// Key-order-independent walk. Objects compare by key, arrays by index, leaves by
// value. Reports the most specific changed paths rather than whole subtrees.
export function compareStructured(left: any, right: any, path = '$'): StructuralDiff[] {
  const diffs: StructuralDiff[] = [];

  if (Object.is(left, right)) return diffs;

  const lt = valueType(left);
  const rt = valueType(right);

  if (lt !== rt) {
    diffs.push({ path, type: 'type-changed', leftValue: left, rightValue: right });
    return diffs;
  }

  if (lt !== 'object' && lt !== 'array') {
    if (left !== right) diffs.push({ path, type: 'modified', leftValue: left, rightValue: right });
    return diffs;
  }

  if (lt === 'array') {
    const max = Math.max(left.length, right.length);
    for (let i = 0; i < max; i++) {
      if (i >= left.length)
        diffs.push({ path: `${path}[${i}]`, type: 'added', rightValue: right[i] });
      else if (i >= right.length)
        diffs.push({ path: `${path}[${i}]`, type: 'removed', leftValue: left[i] });
      else diffs.push(...compareStructured(left[i], right[i], `${path}[${i}]`));
    }
    return diffs;
  }

  const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)]));
  for (const key of keys) {
    const keyPath = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? `${path}.${key}` : `${path}["${key}"]`;
    if (!(key in left)) diffs.push({ path: keyPath, type: 'added', rightValue: right[key] });
    else if (!(key in right)) diffs.push({ path: keyPath, type: 'removed', leftValue: left[key] });
    else diffs.push(...compareStructured(left[key], right[key], keyPath));
  }
  return diffs;
}
