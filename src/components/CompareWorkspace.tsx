'use client';

import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Columns2,
  Copy,
  ListTree,
  Minimize2,
  Rows3,
  Search,
  SquareStack,
  Trash2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNotification } from '../hooks/useNotification';
import {
  charDiff,
  compareStructured,
  computeLineDiff,
  type DiffBlock,
  type DiffType,
  type EqualRow,
  lineStats,
  normalize,
  type StructuralDiff,
} from '../utils/jsonDiff';
import { JSONFixer } from '../utils/jsonFixer';
import CodeMirrorEditor from './CodeMirrorEditor';
import styles from './CompareWorkspace.module.css';

interface CompareWorkspaceProps {
  /** Left "Your JSON" side — the shared main editor document. */
  content: string;
  onChange: (value: string) => void;
  /** Right "Compare JSON" side — the document to diff against. */
  compareContent: string;
  onCompareContentChange: (value: string) => void;
  theme?: 'light' | 'dark';
  /** Close compare mode and return to the single full-width editor. */
  onExit: () => void;
}

type ViewMode = 'split' | 'unified' | 'semantic';
type SemanticFilter = DiffType | 'all';

// Lines of unchanged context kept around each change when "collapse unchanged"
// is on; equal runs longer than 2x this + 2 get folded.
const CONTEXT = 3;
const MAX_VALUE_CHARS = 1500;

const TYPE_META: Record<DiffType, { label: string; item: string; badge: string; pill: string }> = {
  added: { label: 'Added', item: 'itemAdded', badge: 'badgeAdded', pill: 'pillAdded' },
  removed: { label: 'Removed', item: 'itemRemoved', badge: 'badgeRemoved', pill: 'pillRemoved' },
  modified: {
    label: 'Modified',
    item: 'itemModified',
    badge: 'badgeModified',
    pill: 'pillModified',
  },
  'type-changed': { label: 'Type', item: 'itemType', badge: 'badgeType', pill: 'pillType' },
};

const SAMPLE_LEFT = JSON.stringify(
  {
    name: 'Acme API',
    version: '1.4.0',
    enabled: true,
    timeout: 30,
    tags: ['stable', 'public'],
    owner: { team: 'platform', email: 'platform@acme.dev' },
  },
  null,
  2
);

const SAMPLE_RIGHT = JSON.stringify(
  {
    name: 'Acme API',
    version: '2.0.0',
    enabled: false,
    timeout: '30s',
    tags: ['stable', 'beta'],
    owner: { team: 'platform', email: 'platform@acme.dev', slack: '#platform' },
  },
  null,
  2
);

function clampValue(value: any): string {
  if (value === undefined) return '';
  const str =
    value !== null && typeof value === 'object'
      ? JSON.stringify(value, null, 2)
      : JSON.stringify(value);
  if (str && str.length > MAX_VALUE_CHARS) {
    return `${str.slice(0, MAX_VALUE_CHARS)}\n… (${(str.length - MAX_VALUE_CHARS).toLocaleString()} more characters)`;
  }
  return str;
}

/**
 * The JSON comparison surface that lives inside the Editor view. The left panel
 * is the shared main editor (so "Your JSON" is whatever you were already
 * editing); the right panel is a second document to diff against. Lazy-loaded —
 * the diff machinery only ships once the user opens compare mode.
 */
const CompareWorkspace: React.FC<CompareWorkspaceProps> = ({
  content,
  onChange,
  compareContent,
  onCompareContentChange,
  theme = 'dark',
  onExit,
}) => {
  const { showWarning, showError } = useNotification();

  const [leftData, setLeftData] = useState<any>(undefined);
  const [rightData, setRightData] = useState<any>(undefined);
  const [leftInvalid, setLeftInvalid] = useState(false);
  const [rightInvalid, setRightInvalid] = useState(false);
  const [ready, setReady] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [sortKeys, setSortKeys] = useState(false);
  const [collapseUnchanged, setCollapseUnchanged] = useState(true);
  const [editorsCollapsed, setEditorsCollapsed] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set());

  const [semanticFilter, setSemanticFilter] = useState<SemanticFilter>('all');
  const [query, setQuery] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const navIndexRef = useRef(-1);

  // Parse both panels (debounced) and stash the parsed values + validity. The
  // left side mirrors the live main-editor content passed in via props.
  useEffect(() => {
    const id = setTimeout(() => {
      const leftFilled = content.trim() !== '';
      const rightFilled = compareContent.trim() !== '';
      const lr = leftFilled
        ? JSONFixer.parseWithFixInfo(content)
        : { data: undefined, error: null };
      const rr = rightFilled
        ? JSONFixer.parseWithFixInfo(compareContent)
        : { data: undefined, error: null };

      setLeftInvalid(leftFilled && !!lr.error);
      setRightInvalid(rightFilled && !!rr.error);
      setLeftData(lr.error ? undefined : lr.data);
      setRightData(rr.error ? undefined : rr.data);
      setReady(leftFilled && rightFilled && !lr.error && !rr.error);
    }, 300);
    return () => clearTimeout(id);
  }, [content, compareContent]);

  // Reset fold state whenever the underlying comparison changes.
  useEffect(() => {
    setExpandedBlocks(new Set());
    navIndexRef.current = -1;
  }, [leftData, rightData, sortKeys, viewMode]);

  const transform = useCallback(
    (value: string, side: 'left' | 'right', pretty: boolean) => {
      const result = JSONFixer.parseWithFixInfo(value || '{}');
      if (result.error) {
        showError('Invalid JSON format');
        return;
      }
      if (result.wasFixed && result.fixes) {
        const panel = side === 'left' ? 'Your JSON' : 'Compare JSON';
        showWarning(`Repaired ${panel}: ${result.fixes.join(', ')}`);
      }
      const next = pretty ? JSON.stringify(result.data, null, 2) : JSON.stringify(result.data);
      if (side === 'left') onChange(next);
      else onCompareContentChange(next);
    },
    [showWarning, showError, onChange, onCompareContentChange]
  );

  const handleSwap = useCallback(() => {
    const previousLeft = content;
    onChange(compareContent);
    onCompareContentChange(previousLeft);
  }, [content, compareContent, onChange, onCompareContentChange]);

  // Clears only the compare side, so swapping in a new comparison target never
  // wipes the JSON you were editing. (The main toolbar's Clear empties the editor.)
  const handleClearCompare = useCallback(() => {
    onCompareContentChange('');
  }, [onCompareContentChange]);

  const handleSample = useCallback(() => {
    onChange(SAMPLE_LEFT);
    onCompareContentChange(SAMPLE_RIGHT);
  }, [onChange, onCompareContentChange]);

  const copyPath = useCallback(
    (path: string) => {
      navigator.clipboard?.writeText(path).then(
        () => {
          setCopiedPath(path);
          setTimeout(() => setCopiedPath((p) => (p === path ? null : p)), 1200);
        },
        () => showError('Failed to copy')
      );
    },
    [showError]
  );

  // Textual line diff over normalized (pretty-printed) JSON, so whitespace /
  // key-order noise never masquerades as a real change.
  const blocks = useMemo<DiffBlock[]>(() => {
    if (!ready) return [];
    return computeLineDiff(normalize(leftData, sortKeys), normalize(rightData, sortKeys));
  }, [ready, leftData, rightData, sortKeys]);

  const stats = useMemo(() => lineStats(blocks), [blocks]);

  const structural = useMemo<StructuralDiff[]>(
    () => (ready ? compareStructured(leftData, rightData) : []),
    [ready, leftData, rightData]
  );

  const semanticCounts = useMemo(
    () => ({
      all: structural.length,
      added: structural.filter((d) => d.type === 'added').length,
      removed: structural.filter((d) => d.type === 'removed').length,
      modified: structural.filter((d) => d.type === 'modified').length,
      'type-changed': structural.filter((d) => d.type === 'type-changed').length,
    }),
    [structural]
  );

  const visibleStructural = useMemo(() => {
    const q = query.trim().toLowerCase();
    return structural.filter((d) => {
      if (semanticFilter !== 'all' && d.type !== semanticFilter) return false;
      if (!q) return true;
      return (
        d.path.toLowerCase().includes(q) ||
        clampValue(d.leftValue).toLowerCase().includes(q) ||
        clampValue(d.rightValue).toLowerCase().includes(q)
      );
    });
  }, [structural, semanticFilter, query]);

  const identical = ready && stats.hunks === 0 && structural.length === 0;

  // Jump between change hunks in the scrollable results area.
  const navigate = useCallback((dir: 1 | -1) => {
    const root = resultsRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-change-block]'));
    if (!nodes.length) return;
    let next = navIndexRef.current + dir;
    if (next < 0) next = nodes.length - 1;
    if (next >= nodes.length) next = 0;
    navIndexRef.current = next;
    nodes.forEach((n) => {
      n.classList.remove(styles.hunkActive);
    });
    const target = nodes[next];
    target.classList.add(styles.hunkActive);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const toggleBlock = useCallback((index: number) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  /* ---------------------------------------------------------------- *
   * Editor panels
   * ---------------------------------------------------------------- */
  const renderPanel = (
    side: 'left' | 'right',
    title: string,
    value: string,
    setValue: (v: string) => void,
    invalid: boolean
  ) => (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <span
          className={`${styles.panelDot} ${side === 'left' ? styles.dotLeft : styles.dotRight}`}
        />
        <h4>{title}</h4>
        {invalid && <span className={styles.invalidTag}>invalid JSON</span>}
        <div className={styles.panelActions}>
          <button
            className={styles.miniBtn}
            onClick={() => transform(value, side, true)}
            title="Format"
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
          <button
            className={styles.miniBtn}
            onClick={() => transform(value, side, false)}
            title="Compact"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className={`${styles.editorBox} ${invalid ? styles.editorInvalid : ''}`}>
        <CodeMirrorEditor value={value} onChange={setValue} theme={theme} />
      </div>
    </div>
  );

  /* ---------------------------------------------------------------- *
   * Equal-block folding
   * ---------------------------------------------------------------- */
  // Returns the rows to show plus optional fold markers for one equal block.
  const foldEqual = (
    rows: EqualRow[],
    blockIndex: number,
    isFirst: boolean,
    isLast: boolean
  ): { topHidden: number; bottomHidden: number; rows: EqualRow[] } => {
    if (!collapseUnchanged || expandedBlocks.has(blockIndex) || rows.length <= CONTEXT * 2 + 2) {
      return { topHidden: 0, bottomHidden: 0, rows };
    }
    if (isFirst && isLast) {
      // Whole document identical — keep head + tail, fold the middle.
      return {
        topHidden: 0,
        bottomHidden: rows.length - CONTEXT,
        rows: rows.slice(0, CONTEXT),
      };
    }
    if (isFirst) {
      return {
        topHidden: rows.length - CONTEXT,
        bottomHidden: 0,
        rows: rows.slice(rows.length - CONTEXT),
      };
    }
    if (isLast) {
      return { topHidden: 0, bottomHidden: rows.length - CONTEXT, rows: rows.slice(0, CONTEXT) };
    }
    return {
      topHidden: 0,
      bottomHidden: rows.length - CONTEXT * 2,
      rows: [...rows.slice(0, CONTEXT), ...rows.slice(rows.length - CONTEXT)],
    };
  };

  const foldMarker = (count: number, blockIndex: number) => (
    <button type="button" className={styles.foldRow} onClick={() => toggleBlock(blockIndex)}>
      <SquareStack className="w-3.5 h-3.5" />
      {`Show ${count.toLocaleString()} unchanged line${count === 1 ? '' : 's'}`}
    </button>
  );

  /* ---------------------------------------------------------------- *
   * Split view
   * ---------------------------------------------------------------- */
  const renderSplit = () => (
    <div className={styles.codeGrid}>
      {blocks.map((block, bi) => {
        const isFirst = bi === 0;
        const isLast = bi === blocks.length - 1;
        if (block.kind === 'equal') {
          const fold = foldEqual(block.rows, bi, isFirst, isLast);
          return (
            <React.Fragment key={bi}>
              {fold.topHidden > 0 && foldMarker(fold.topHidden, bi)}
              {fold.rows.map((row, ri) => (
                <div className={styles.splitRow} key={`${bi}-${ri}`}>
                  <span className={styles.lineNo}>{row.leftNo}</span>
                  <code className={styles.lineText}>{row.text || ' '}</code>
                  <span className={styles.lineNo}>{row.rightNo}</span>
                  <code className={styles.lineText}>{row.text || ' '}</code>
                </div>
              ))}
              {fold.bottomHidden > 0 && foldMarker(fold.bottomHidden, bi)}
            </React.Fragment>
          );
        }
        const count = Math.max(block.removed.length, block.added.length);
        const rows = [];
        for (let i = 0; i < count; i++) {
          const rem = block.removed[i];
          const add = block.added[i];
          const segs = rem && add ? charDiff(rem.text, add.text) : null;
          rows.push(
            <div className={styles.splitRow} key={`${bi}-c-${i}`}>
              {rem ? (
                <>
                  <span className={`${styles.lineNo} ${styles.lineNoDel}`}>{rem.no}</span>
                  <code className={`${styles.lineText} ${styles.delText}`}>
                    {segs
                      ? segs.left.map((s, k) => (
                          <span key={k} className={s.changed ? styles.delHi : undefined}>
                            {s.text}
                          </span>
                        ))
                      : rem.text || ' '}
                  </code>
                </>
              ) : (
                <>
                  <span className={`${styles.lineNo} ${styles.lineNoEmpty}`} />
                  <code className={`${styles.lineText} ${styles.fillerText}`} />
                </>
              )}
              {add ? (
                <>
                  <span className={`${styles.lineNo} ${styles.lineNoAdd}`}>{add.no}</span>
                  <code className={`${styles.lineText} ${styles.addText}`}>
                    {segs
                      ? segs.right.map((s, k) => (
                          <span key={k} className={s.changed ? styles.addHi : undefined}>
                            {s.text}
                          </span>
                        ))
                      : add.text || ' '}
                  </code>
                </>
              ) : (
                <>
                  <span className={`${styles.lineNo} ${styles.lineNoEmpty}`} />
                  <code className={`${styles.lineText} ${styles.fillerText}`} />
                </>
              )}
            </div>
          );
        }
        return (
          <div className={styles.changeBlock} data-change-block key={bi}>
            {rows}
          </div>
        );
      })}
    </div>
  );

  /* ---------------------------------------------------------------- *
   * Unified view
   * ---------------------------------------------------------------- */
  const renderUnified = () => (
    <div className={styles.codeGrid}>
      {blocks.map((block, bi) => {
        const isFirst = bi === 0;
        const isLast = bi === blocks.length - 1;
        if (block.kind === 'equal') {
          const fold = foldEqual(block.rows, bi, isFirst, isLast);
          return (
            <React.Fragment key={bi}>
              {fold.topHidden > 0 && foldMarker(fold.topHidden, bi)}
              {fold.rows.map((row, ri) => (
                <div className={`${styles.uniRow} ${styles.uniEqual}`} key={`${bi}-${ri}`}>
                  <span className={styles.lineNo}>{row.leftNo}</span>
                  <span className={styles.lineNo}>{row.rightNo}</span>
                  <code className={styles.lineText}>
                    <span className={styles.sign}> </span>
                    {row.text || ' '}
                  </code>
                </div>
              ))}
              {fold.bottomHidden > 0 && foldMarker(fold.bottomHidden, bi)}
            </React.Fragment>
          );
        }
        const pairCount = Math.min(block.removed.length, block.added.length);
        return (
          <div className={styles.changeBlock} data-change-block key={bi}>
            {block.removed.map((line, i) => {
              const segs = i < pairCount ? charDiff(line.text, block.added[i].text).left : null;
              return (
                <div className={`${styles.uniRow} ${styles.uniDel}`} key={`d-${i}`}>
                  <span className={`${styles.lineNo} ${styles.lineNoDel}`}>{line.no}</span>
                  <span className={`${styles.lineNo} ${styles.lineNoEmpty}`} />
                  <code className={`${styles.lineText} ${styles.delText}`}>
                    <span className={styles.sign}>-</span>
                    {segs
                      ? segs.map((s, k) => (
                          <span key={k} className={s.changed ? styles.delHi : undefined}>
                            {s.text}
                          </span>
                        ))
                      : line.text || ' '}
                  </code>
                </div>
              );
            })}
            {block.added.map((line, i) => {
              const segs = i < pairCount ? charDiff(block.removed[i].text, line.text).right : null;
              return (
                <div className={`${styles.uniRow} ${styles.uniAdd}`} key={`a-${i}`}>
                  <span className={`${styles.lineNo} ${styles.lineNoEmpty}`} />
                  <span className={`${styles.lineNo} ${styles.lineNoAdd}`}>{line.no}</span>
                  <code className={`${styles.lineText} ${styles.addText}`}>
                    <span className={styles.sign}>+</span>
                    {segs
                      ? segs.map((s, k) => (
                          <span key={k} className={s.changed ? styles.addHi : undefined}>
                            {s.text}
                          </span>
                        ))
                      : line.text || ' '}
                  </code>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  /* ---------------------------------------------------------------- *
   * Semantic view
   * ---------------------------------------------------------------- */
  const semanticPills: { key: SemanticFilter; label: string; count: number; cls?: string }[] = [
    { key: 'all', label: 'All', count: semanticCounts.all },
    { key: 'added', label: 'added', count: semanticCounts.added, cls: styles.pillAdded },
    { key: 'removed', label: 'removed', count: semanticCounts.removed, cls: styles.pillRemoved },
    {
      key: 'modified',
      label: 'modified',
      count: semanticCounts.modified,
      cls: styles.pillModified,
    },
    {
      key: 'type-changed',
      label: 'type',
      count: semanticCounts['type-changed'],
      cls: styles.pillType,
    },
  ];

  const renderSemantic = () => (
    <div className={styles.semanticWrap}>
      <div className={styles.semanticBar}>
        {semanticPills.map((pill) => (
          <button
            key={pill.key}
            className={`${styles.pill} ${pill.cls ?? styles.pillAll} ${
              semanticFilter === pill.key ? styles.pillActive : ''
            }`}
            onClick={() => setSemanticFilter(pill.key)}
            aria-pressed={semanticFilter === pill.key}
          >
            {pill.key === 'all' ? `All ${pill.count}` : `${pill.count} ${pill.label}`}
          </button>
        ))}
      </div>
      {visibleStructural.length === 0 ? (
        <div className={styles.noChanges}>No entries match this filter.</div>
      ) : (
        <div className={styles.semanticList}>
          {visibleStructural.map((diff, index) => (
            <div
              key={`${diff.path}-${index}`}
              data-change-block
              className={`${styles.semanticItem} ${styles[TYPE_META[diff.type].item]}`}
            >
              <div className={styles.semanticHead}>
                <span className={`${styles.badge} ${styles[TYPE_META[diff.type].badge]}`}>
                  {TYPE_META[diff.type].label}
                </span>
                <span className={styles.path}>{diff.path}</span>
                <button
                  className={styles.copyBtn}
                  onClick={() => copyPath(diff.path)}
                  title="Copy path"
                  aria-label="Copy path"
                >
                  {copiedPath === diff.path ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className={styles.semanticBody}>
                {diff.leftValue !== undefined && diff.type !== 'added' && (
                  <pre className={`${styles.valueLine} ${styles.valueDel}`}>
                    {clampValue(diff.leftValue)}
                  </pre>
                )}
                {diff.rightValue !== undefined && diff.type !== 'removed' && (
                  <pre className={`${styles.valueLine} ${styles.valueAdd}`}>
                    {clampValue(diff.rightValue)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ---------------------------------------------------------------- *
   * Results
   * ---------------------------------------------------------------- */
  const renderResults = () => {
    if (!ready) {
      return (
        <div className={styles.placeholder}>
          <ListTree className={styles.placeholderIcon} />
          <p className={styles.placeholderTitle}>
            {leftInvalid || rightInvalid
              ? 'Fix the invalid JSON to compare'
              : 'Compare against another JSON'}
          </p>
          <p className={styles.placeholderText}>
            {leftInvalid || rightInvalid
              ? 'One of the panels has invalid JSON. Fix it (or hit Format) to see the diff.'
              : 'Paste JSON into the “Compare JSON” panel — the diff updates automatically as you type.'}
          </p>
          {!leftInvalid && !rightInvalid && (
            <button className={styles.sampleBtn} onClick={handleSample}>
              Load a sample comparison
            </button>
          )}
        </div>
      );
    }
    if (identical) {
      return (
        <div className={styles.noChanges}>
          <Check className={styles.placeholderIcon} />
          <p className={styles.placeholderTitle}>No differences found</p>
          <p className={styles.placeholderText}>
            Both JSON documents are identical{sortKeys ? ' (ignoring key order)' : ''}.
          </p>
        </div>
      );
    }
    if (viewMode === 'semantic') return renderSemantic();
    return viewMode === 'split' ? renderSplit() : renderUnified();
  };

  return (
    <div className={styles.root}>
      {/* Input editors */}
      {!editorsCollapsed && (
        <div className={styles.inputs}>
          {renderPanel('left', 'Your JSON', content, onChange, leftInvalid)}
          {renderPanel(
            'right',
            'Compare JSON',
            compareContent,
            onCompareContentChange,
            rightInvalid
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.modeSwitch} role="tablist" aria-label="Diff view mode">
          <button
            className={`${styles.modeBtn} ${viewMode === 'split' ? styles.modeActive : ''}`}
            onClick={() => setViewMode('split')}
            role="tab"
            aria-selected={viewMode === 'split'}
          >
            <Columns2 className="w-4 h-4" />
            Split
          </button>
          <button
            className={`${styles.modeBtn} ${viewMode === 'unified' ? styles.modeActive : ''}`}
            onClick={() => setViewMode('unified')}
            role="tab"
            aria-selected={viewMode === 'unified'}
          >
            <Rows3 className="w-4 h-4" />
            Unified
          </button>
          <button
            className={`${styles.modeBtn} ${viewMode === 'semantic' ? styles.modeActive : ''}`}
            onClick={() => setViewMode('semantic')}
            role="tab"
            aria-selected={viewMode === 'semantic'}
          >
            <ListTree className="w-4 h-4" />
            Semantic
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <label
            className={styles.toggle}
            title="Sort object keys before comparing (ignore key order)"
          >
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.target.checked)}
            />
            Ignore key order
          </label>
          {viewMode !== 'semantic' && (
            <label className={styles.toggle} title="Collapse runs of unchanged lines">
              <input
                type="checkbox"
                checked={collapseUnchanged}
                onChange={(e) => setCollapseUnchanged(e.target.checked)}
              />
              Collapse unchanged
            </label>
          )}
          <div className={styles.divider} />
          <button className={styles.toolBtn} onClick={handleSwap} title="Swap the two panels">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Swap
          </button>
          <button className={styles.toolBtn} onClick={() => setEditorsCollapsed((v) => !v)}>
            {editorsCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
            {editorsCollapsed ? 'Show editors' : 'Hide editors'}
          </button>
          <button
            className={styles.toolBtn}
            onClick={handleClearCompare}
            title="Clear the Compare JSON panel"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
          <div className={styles.divider} />
          <button
            className={styles.toolBtn}
            onClick={onExit}
            title="Close compare and return to the editor"
          >
            <X className="w-3.5 h-3.5" />
            Close compare
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {ready && !identical && (
        <div className={styles.summary}>
          {viewMode === 'semantic' ? (
            <div className={styles.summaryStats}>
              <span className={styles.statAdd}>+{semanticCounts.added}</span>
              <span className={styles.statDel}>−{semanticCounts.removed}</span>
              <span className={styles.statMod}>
                ~{semanticCounts.modified + semanticCounts['type-changed']}
              </span>
              <span className={styles.summaryLabel}>
                {semanticCounts.all} change{semanticCounts.all === 1 ? '' : 's'}
              </span>
            </div>
          ) : (
            <div className={styles.summaryStats}>
              <span className={styles.statAdd}>+{stats.additions}</span>
              <span className={styles.statDel}>−{stats.deletions}</span>
              <span className={styles.summaryLabel}>
                {stats.hunks} hunk{stats.hunks === 1 ? '' : 's'}
              </span>
            </div>
          )}

          <div className={styles.summaryRight}>
            {viewMode === 'semantic' ? (
              <div className={styles.searchBox}>
                <Search className="w-3.5 h-3.5" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter by path or value…"
                  aria-label="Filter changes"
                />
                {query && (
                  <button onClick={() => setQuery('')} aria-label="Clear filter">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : null}
            <div className={styles.nav}>
              <button
                onClick={() => navigate(-1)}
                title="Previous change"
                aria-label="Previous change"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button onClick={() => navigate(1)} title="Next change" aria-label="Next change">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className={styles.results} ref={resultsRef}>
        {renderResults()}
      </div>
    </div>
  );
};

export default CompareWorkspace;
