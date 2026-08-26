'use client';

import { Minus, Pencil, Plus } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '@/hooks/useNotification';
import {
  collectExpandablePaths,
  defaultExpandedPaths,
  entriesOf,
  formatPath,
  getAtPath,
  isJsonContainer,
  isJsonObject,
  type PathSegment,
  remapExpandedAfterRename,
  renameKeyInObject,
  setAtPath,
} from '@/utils/jsonPath';
import { exceedsJsonDepth, MAX_JSON_DEPTH, runDepthGuarded } from '@/utils/jsonWalk';
import {
  type KeyRenameReason,
  resolveKeyRename,
  resolveValueEdit,
  seedValueText,
  type ValueEditReason,
} from '@/utils/treeEdit';
import DepthLimitNotice from './DepthLimitNotice';

interface TreeViewProps {
  json: any;
  /**
   * Whether the editor holds a document at all. Carried explicitly rather than
   * inferred from `json`, because `null`, `0`, `false` and `""` are valid JSON
   * documents that a truthiness test reports as "nothing to display" — while the
   * status bar, which does carry the flag, calls the same document valid.
   */
  isValid: boolean;
  onUpdate: (newContent: string) => void;
}

interface EditState {
  /** Structured path of the node being edited. */
  path: PathSegment[];
  /** Display form of `path`; used for identity comparisons while rendering. */
  pathKey: string;
  target: 'value' | 'key';
  /** Text the input was seeded with — an edit that still matches it is a no-op. */
  seed: string;
  /** The value (or key name) as it was before editing, so its type can be kept. */
  original: unknown;
}

/**
 * What to do when the typed text cannot be applied: `keep` leaves the input open
 * so the user can fix it (Enter), `revert` throws the edit away (blur — the user
 * has already moved on, and refocusing them would trap the pointer).
 */
type InvalidMode = 'keep' | 'revert';

const EXPAND_DEPTH_FALLBACK =
  'This document is nested too deeply to expand every node (limit: {{limit}} levels).';

const TreeView: React.FC<TreeViewProps> = ({ json, isValid, onUpdate }) => {
  const { t } = useTranslation();
  const { showError, showWarning } = useNotification();
  const [mounted, setMounted] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditState | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUpdatingFromTree, setIsUpdatingFromTree] = useState(false);
  const [preservedExpandedState, setPreservedExpandedState] = useState<Set<string> | null>(null);
  // Single-select tree: selection follows focus, which is what `aria-selected`
  // reports to screen readers.
  const [selectedPathKey, setSelectedPathKey] = useState<string | null>(null);
  const prevJsonRef = useRef<unknown>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Whether this document is too deeply nested to work with at all, from the
  // iterative probe — the recursive walkers cannot be asked, since asking is
  // exactly what would blow the stack.
  //
  // Derived during render rather than held in state: it is a pure function of
  // `json`, and the React Compiler memoizes it on that identity, so it costs one
  // pass per document rather than one per keystroke of an inline edit.
  //
  // It gates the whole view, not just the rendering, because the edit path is
  // what really cannot survive a deep document: `structuredClone` gives up at
  // roughly 2,200 levels and `JSON.stringify` at 6,200, both from inside a click
  // handler where no error boundary is watching.
  const tooDeep = json != null && exceedsJsonDepth(json);

  // Translated copy, with an English fallback until i18next has resolved the
  // browser language, so the server and the first client render agree.
  const label = (key: string, fallback: string) =>
    mounted ? t(key, { defaultValue: fallback }) : fallback;

  useEffect(() => {
    // No document at all: forget whatever the last one had expanded.
    if (!isValid) {
      prevJsonRef.current = null;
      setIsInitialized(false);
      setExpandedNodes(new Set());
      return;
    }

    // Skip auto-expand if this is an update from the tree itself
    if (isUpdatingFromTree) {
      // Restore preserved expanded state if available
      if (preservedExpandedState) {
        setExpandedNodes(preservedExpandedState);
        setPreservedExpandedState(null);
      }
      setIsUpdatingFromTree(false);
      return;
    }

    // Only auto-expand when JSON actually changes from an external source.
    // Reference equality is enough — each re-parse produces a fresh object, and
    // stringifying multi-MB documents here just to compare was itself a cost.
    if (json !== prevJsonRef.current) {
      prevJsonRef.current = json;

      // Only auto-expand on new JSON (when not initialized or completely new content)
      if (!isInitialized) {
        setExpandedNodes(defaultExpandedPaths(json));
        setIsInitialized(true);
      }
    }
    // `isInitialized` is in the dep list only for honesty: the `prevJsonRef`
    // guard above makes the extra run a no-op.
  }, [json, isValid, isUpdatingFromTree, preservedExpandedState, isInitialized]);

  // Focus the inline editor when one opens. A ref does what `autoFocus` did
  // without the accessibility warning — and without stealing focus back on every
  // keystroke the way an inline callback ref would.
  useEffect(() => {
    if (editing) editInputRef.current?.focus();
  }, [editing]);

  const toggleNode = (pathKey: string) => {
    setExpandedNodes((previous) => {
      const next = new Set(previous);
      if (next.has(pathKey)) {
        next.delete(pathKey);
      } else {
        next.add(pathKey);
      }
      return next;
    });
  };

  const expandDepthMessage = (limit: number) =>
    mounted
      ? t('depth.expandFailed', { defaultValue: EXPAND_DEPTH_FALLBACK, limit })
      : EXPAND_DEPTH_FALLBACK.replace('{{limit}}', String(limit));

  const expandAll = () => {
    if (!isValid) return;
    // Guarded even though `tooDeep` already gates this view: the walk is the one
    // place a click could still reach an unbounded recursion, and a toast beats
    // an unhandled throw out of an event handler.
    const paths = runDepthGuarded(() => collectExpandablePaths(json));
    if (!paths.ok) {
      showError(expandDepthMessage(paths.limit));
      return;
    }
    setExpandedNodes(paths.value);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const startValueEdit = (path: PathSegment[], pathKey: string, value: unknown) => {
    const seed = seedValueText(value);
    setEditing({ path, pathKey, target: 'value', seed, original: value });
    setEditValue(seed);
  };

  const startKeyEdit = (path: PathSegment[], pathKey: string, key: string) => {
    setEditing({ path, pathKey, target: 'key', seed: key, original: key });
    setEditValue(key);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  const valueErrorMessage = (reason: ValueEditReason) => {
    switch (reason) {
      case 'expected-number':
        return label(
          'tree.errors.expectedNumber',
          'This value is a number. Enter a number, or press Ctrl/Cmd+Enter to change its type.'
        );
      case 'expected-boolean':
        return label(
          'tree.errors.expectedBoolean',
          'This value is a boolean. Enter true or false, or press Ctrl/Cmd+Enter to change its type.'
        );
      default:
        return label('tree.errors.invalidJson', 'That is not valid JSON.');
    }
  };

  const keyErrorMessage = (reason: KeyRenameReason) =>
    reason === 'empty'
      ? label('tree.errors.emptyKey', 'A key name cannot be empty.')
      : label('tree.errors.duplicateKey', 'That key already exists on this object.');

  const rejectEdit = (message: string, mode: InvalidMode) => {
    if (mode === 'keep') {
      showError(message);
      return;
    }
    showWarning(`${label('tree.errors.discarded', 'Edit discarded')} — ${message}`);
    closeEdit();
  };

  /** Hand the edited document back up and remember which nodes were open. */
  const publish = (nextRoot: unknown, expanded: Set<string>) => {
    setPreservedExpandedState(expanded);
    setIsUpdatingFromTree(true);
    onUpdate(JSON.stringify(nextRoot, null, 2));
    closeEdit();
  };

  const missingNodeMessage = () =>
    label('tree.errors.missingNode', 'That node no longer exists in the document.');

  const commitValueEdit = (state: EditState, mode: InvalidMode, asJson: boolean) => {
    const result = resolveValueEdit(state.original, state.seed, editValue, { asJson });

    // No text change (or no effective change) — never touch the document, and in
    // particular never arm `isUpdatingFromTree` with no update to consume it.
    if (result.status === 'unchanged') {
      closeEdit();
      return;
    }
    if (result.status === 'invalid') {
      rejectEdit(valueErrorMessage(result.reason), mode);
      return;
    }

    const nextRoot = structuredClone(json);
    if (!setAtPath(nextRoot, state.path, result.value)) {
      rejectEdit(missingNodeMessage(), 'revert');
      return;
    }
    publish(nextRoot, new Set(expandedNodes));
  };

  const commitKeyEdit = (state: EditState, mode: InvalidMode) => {
    const parentPath = state.path.slice(0, -1);
    const oldKey = state.path[state.path.length - 1];
    const parent = getAtPath(json, parentPath);

    if (typeof oldKey !== 'string' || !isJsonObject(parent)) {
      rejectEdit(
        label(
          'tree.errors.notRenameable',
          'Array items are addressed by index and cannot be renamed.'
        ),
        'revert'
      );
      return;
    }

    const result = resolveKeyRename(Object.keys(parent), oldKey, editValue);
    if (result.status === 'unchanged') {
      closeEdit();
      return;
    }
    if (result.status === 'invalid') {
      rejectEdit(keyErrorMessage(result.reason), mode);
      return;
    }

    const clone = structuredClone(json);
    const parentClone = getAtPath(clone, parentPath);
    if (!isJsonObject(parentClone)) {
      rejectEdit(missingNodeMessage(), 'revert');
      return;
    }

    const renamedParent = renameKeyInObject(parentClone, oldKey, result.key);
    let nextRoot: unknown = renamedParent;
    if (parentPath.length > 0) {
      if (!setAtPath(clone, parentPath, renamedParent)) {
        rejectEdit(missingNodeMessage(), 'revert');
        return;
      }
      nextRoot = clone;
    }

    publish(nextRoot, remapExpandedAfterRename(expandedNodes, parentPath, oldKey, result.key));
  };

  const commitEdit = (mode: InvalidMode, asJson = false) => {
    if (!editing) return;
    if (!isValid) {
      closeEdit();
      return;
    }
    if (editing.target === 'key') {
      commitKeyEdit(editing, mode);
    } else {
      commitValueEdit(editing, mode, asJson);
    }
  };

  const getValueColor = (val: unknown) => {
    if (typeof val === 'string') return 'tree-string';
    if (typeof val === 'number') return 'tree-number';
    if (typeof val === 'boolean') return 'tree-boolean';
    if (val === null) return 'tree-null';
    if (Array.isArray(val)) return 'tree-array';
    if (typeof val === 'object') return 'tree-object';
    return '';
  };

  const renderEditInput = (className: string, ariaLabel: string, title?: string) => (
    <input
      ref={editInputRef}
      type="text"
      value={editValue}
      aria-label={ariaLabel}
      title={title}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={() => commitEdit('revert')}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          // Ctrl/Cmd+Enter is the deliberate "retype this value" gesture.
          commitEdit('keep', e.metaKey || e.ctrlKey);
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          closeEdit();
        }
      }}
      onClick={(e) => e.stopPropagation()}
      className={className}
    />
  );

  const renderValue = (value: unknown, path: PathSegment[], pathKey: string) => {
    if (editing?.target === 'value' && editing.pathKey === pathKey) {
      return renderEditInput(
        'tree-edit-input',
        label('tree.editValue', 'Edit value'),
        label(
          'tree.typeHint',
          "Enter keeps this value's type. Ctrl/Cmd+Enter reads the text as JSON, which is how you change the type."
        )
      );
    }

    // Containers are summarised, not edited inline.
    if (Array.isArray(value)) {
      return <span className="tree-value tree-array">[{value.length}]</span>;
    }
    if (isJsonObject(value)) {
      return <span className="tree-value tree-object">{`{${Object.keys(value).length}}`}</span>;
    }

    const beginEdit = () => startValueEdit(path, pathKey, value);

    return (
      <span
        className={`tree-value ${getValueColor(value)}`}
        role="button"
        tabIndex={0}
        aria-label={`${label('tree.editValue', 'Edit value')}: ${pathKey}`}
        onClick={(e) => {
          e.stopPropagation();
          beginEdit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            beginEdit();
          }
        }}
      >
        {typeof value === 'string' ? `"${value}"` : String(value)}
      </span>
    );
  };

  const renderNode = (segments: PathSegment[], value: unknown, level: number) => {
    const pathKey = formatPath(segments);
    const lastSegment = segments[segments.length - 1];
    const isArrayItem = typeof lastSegment === 'number';
    const isExpandable = isJsonContainer(value);
    const children = isExpandable ? entriesOf(value) : [];
    const isExpanded = expandedNodes.has(pathKey);
    const isEditingKey = editing?.target === 'key' && editing.pathKey === pathKey;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // Only this row's own header toggles this row: leaf rows do not stop
      // propagation, so an unguarded handler would toggle an ancestor instead.
      const header = (e.target as HTMLElement).closest('.tree-node-header');
      if (!header || header.parentElement !== e.currentTarget) return;
      toggleNode(pathKey);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Ignore keys aimed at the key/value controls nested inside this row.
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleNode(pathKey);
      } else if (e.key === 'ArrowRight' && !isExpanded) {
        e.preventDefault();
        toggleNode(pathKey);
      } else if (e.key === 'ArrowLeft' && isExpanded) {
        e.preventDefault();
        toggleNode(pathKey);
      }
    };

    return (
      <div
        key={pathKey}
        className="tree-node"
        role="treeitem"
        tabIndex={0}
        aria-expanded={isExpandable ? isExpanded : undefined}
        aria-selected={selectedPathKey === pathKey}
        onFocus={(e) => {
          if (e.target === e.currentTarget) setSelectedPathKey(pathKey);
        }}
        onClick={isExpandable ? handleClick : undefined}
        onKeyDown={isExpandable ? handleKeyDown : undefined}
        style={{ marginLeft: `calc(${level} * var(--tree-indent, 20px))` }}
      >
        <div
          className={`tree-node-header ${isExpandable ? 'expandable' : ''}`}
          style={{ cursor: isExpandable ? 'pointer' : 'default' }}
        >
          {isExpandable ? (
            <span className="tree-toggle" aria-hidden="true">
              {isExpanded ? '▼' : '▶'}
            </span>
          ) : (
            <span className="tree-spacer"></span>
          )}

          {isArrayItem ? (
            <span className="tree-key">[{lastSegment}]: </span>
          ) : isEditingKey ? (
            <span className="tree-key">
              {renderEditInput('tree-edit-input tree-edit-key', label('tree.editKey', 'Edit key'))}:
            </span>
          ) : (
            <span
              className="tree-key"
              role="button"
              tabIndex={0}
              aria-label={`${label('tree.editKey', 'Edit key')}: ${String(lastSegment)}`}
              onClick={(e) => {
                e.stopPropagation();
                startKeyEdit(segments, pathKey, String(lastSegment));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  startKeyEdit(segments, pathKey, String(lastSegment));
                }
              }}
            >
              {`"${String(lastSegment)}"`}:
            </span>
          )}

          {renderValue(value, segments, pathKey)}
        </div>

        {isExpandable && isExpanded && children.length > 0 && (
          <div className="tree-children" role="group">
            {children.map(([segment, child]) =>
              renderNode([...segments, segment], child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isValid) {
    return (
      <div className="tree-view-container">
        <div className="tree-output flex items-center justify-center">
          <p className="text-[var(--text-secondary)]">
            {label('tree.noData', 'No valid JSON to display')}
          </p>
        </div>
      </div>
    );
  }

  if (tooDeep) {
    return (
      <div className="tree-view-container">
        <div className="tree-output flex items-center justify-center">
          <DepthLimitNotice limit={MAX_JSON_DEPTH} />
        </div>
      </div>
    );
  }

  return (
    <div className="tree-view-container">
      <div className="tree-controls">
        <div
          className="tree-controls-left"
          style={{ display: 'flex', alignItems: 'center', gap: '20px' }}
        >
          <div className="edit-hint">
            <Pencil className="w-4 h-4 inline-block mr-1" />
            <span className="edit-text">
              {label('tree.editHint', 'Click on any value or key to edit directly')}
            </span>
          </div>
          <div className="tree-buttons" style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={expandAll}
              className="tree-control-btn"
              aria-label="Expand all tree nodes"
            >
              <Plus className="w-4 h-4 inline-block mr-1" />
              {label('tree.expand', 'Expand All')}
            </button>
            <button
              onClick={collapseAll}
              className="tree-control-btn"
              aria-label="Collapse all tree nodes"
            >
              <Minus className="w-4 h-4 inline-block mr-1" />
              {label('tree.collapse', 'Collapse All')}
            </button>
          </div>
        </div>
      </div>

      <div className="tree-output" role="tree" aria-label={label('tree.ariaLabel', 'JSON tree')}>
        {entriesOf(json).map(([segment, value]) => renderNode([segment], value, 0))}
      </div>
    </div>
  );
};

export default TreeView;
