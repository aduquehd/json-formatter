'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Code2, Minimize2, ArrowLeftRight } from 'lucide-react';
import { JSONFixer } from '../utils/jsonFixer';
import { useNotification } from '../hooks/useNotification';
import CodeMirrorEditor from './CodeMirrorEditor';
import styles from './DiffView.module.css';

interface DiffViewProps {
  json: any;
  theme?: 'light' | 'dark';
}

type DiffType = 'added' | 'removed' | 'modified' | 'type-changed';
type FilterType = DiffType | 'all';

interface DiffResult {
  path: string;
  type: DiffType;
  leftValue?: any;
  rightValue?: any;
}

const TYPE_META: Record<DiffType, { label: string; item: string; badge: string }> = {
  added: { label: 'Added', item: 'itemAdded', badge: 'badgeAdded' },
  removed: { label: 'Removed', item: 'itemRemoved', badge: 'badgeRemoved' },
  modified: { label: 'Modified', item: 'itemModified', badge: 'badgeModified' },
  'type-changed': { label: 'Type', item: 'itemType', badge: 'badgeType' },
};

const MAX_VALUE_CHARS = 1500;

function formatValue(value: any): string {
  if (value === undefined) return '';
  const str = value !== null && typeof value === 'object' ? JSON.stringify(value, null, 2) : JSON.stringify(value);
  if (str && str.length > MAX_VALUE_CHARS) {
    return `${str.slice(0, MAX_VALUE_CHARS)}\n… (${(str.length - MAX_VALUE_CHARS).toLocaleString()} more characters)`;
  }
  return str;
}

const DiffView: React.FC<DiffViewProps> = ({ json, theme = 'dark' }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [leftContent, setLeftContent] = useState(json ? JSON.stringify(json, null, 2) : '');
  const [rightContent, setRightContent] = useState('');
  const [differences, setDifferences] = useState<DiffResult[] | null>(null);
  const [leftInvalid, setLeftInvalid] = useState(false);
  const [rightInvalid, setRightInvalid] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const { showWarning, showError } = useNotification();

  useEffect(() => {
    setMounted(true);
  }, []);

  const transform = useCallback(
    (content: string, side: 'left' | 'right', pretty: boolean) => {
      try {
        const result = JSONFixer.parseWithFixInfo(content || '{}');
        if (result.error) {
          showError('Invalid JSON format');
          return;
        }
        if (result.wasFixed && result.fixes) {
          const panelName = side === 'left' ? 'Original JSON' : 'Modified JSON';
          showWarning(`Repaired automatically: ${panelName} — ${result.fixes.join(', ')}`);
        }
        const next = pretty ? JSON.stringify(result.data, null, 2) : JSON.stringify(result.data);
        if (side === 'left') setLeftContent(next);
        else setRightContent(next);
      } catch {
        showError('Invalid JSON format');
      }
    },
    [showWarning, showError]
  );

  const compareJSON = useCallback((left: any, right: any, path: string = '$'): DiffResult[] => {
    const diffs: DiffResult[] = [];

    if (left === right) return diffs;

    if (typeof left !== typeof right) {
      diffs.push({ path, type: 'type-changed', leftValue: left, rightValue: right });
      return diffs;
    }

    if (typeof left !== 'object' || left === null || right === null) {
      diffs.push({ path, type: 'modified', leftValue: left, rightValue: right });
      return diffs;
    }

    if (Array.isArray(left) && Array.isArray(right)) {
      const maxLength = Math.max(left.length, right.length);
      for (let i = 0; i < maxLength; i++) {
        if (i >= left.length) {
          diffs.push({ path: `${path}[${i}]`, type: 'added', rightValue: right[i] });
        } else if (i >= right.length) {
          diffs.push({ path: `${path}[${i}]`, type: 'removed', leftValue: left[i] });
        } else {
          diffs.push(...compareJSON(left[i], right[i], `${path}[${i}]`));
        }
      }
    } else {
      const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
      for (const key of Array.from(allKeys)) {
        const keyPath = `${path}.${key}`;
        if (!(key in left)) {
          diffs.push({ path: keyPath, type: 'added', rightValue: right[key] });
        } else if (!(key in right)) {
          diffs.push({ path: keyPath, type: 'removed', leftValue: left[key] });
        } else {
          diffs.push(...compareJSON(left[key], right[key], keyPath));
        }
      }
    }

    return diffs;
  }, []);

  // Differences update automatically (debounced) once both panels have content.
  useEffect(() => {
    const id = setTimeout(() => {
      const leftFilled = leftContent.trim() !== '';
      const rightFilled = rightContent.trim() !== '';

      const leftResult = leftFilled ? JSONFixer.parseWithFixInfo(leftContent) : { data: undefined, error: null };
      const rightResult = rightFilled ? JSONFixer.parseWithFixInfo(rightContent) : { data: undefined, error: null };

      setLeftInvalid(leftFilled && !!leftResult.error);
      setRightInvalid(rightFilled && !!rightResult.error);

      if (!leftFilled || !rightFilled || leftResult.error || rightResult.error) {
        setDifferences(null);
        return;
      }
      setDifferences(compareJSON(leftResult.data, rightResult.data));
    }, 350);
    return () => clearTimeout(id);
  }, [leftContent, rightContent, compareJSON]);

  const handleSwap = useCallback(() => {
    setLeftContent(rightContent);
    setRightContent(leftContent);
  }, [leftContent, rightContent]);

  const stats = useMemo(
    () => ({
      added: differences?.filter((d) => d.type === 'added').length ?? 0,
      removed: differences?.filter((d) => d.type === 'removed').length ?? 0,
      modified: differences?.filter((d) => d.type === 'modified').length ?? 0,
      'type-changed': differences?.filter((d) => d.type === 'type-changed').length ?? 0,
    }),
    [differences]
  );

  const visibleDiffs = useMemo(
    () => (differences ?? []).filter((d) => filter === 'all' || d.type === filter),
    [differences, filter]
  );

  const renderPanel = (side: 'left' | 'right', title: string, content: string, setContent: (v: string) => void, invalid: boolean) => (
    <div className={styles.diffPanel}>
      <div className={styles.diffPanelHead}>
        <h4>{title}</h4>
        {invalid && <span className={styles.diffInvalidTag}>invalid JSON</span>}
      </div>
      <div className={`${styles.diffEditorContainer} ${invalid ? styles.diffEditorInvalid : ''}`}>
        <CodeMirrorEditor value={content} onChange={setContent} theme={theme} />
      </div>
      <div className={styles.diffButtonGroup}>
        <button className="btn btn-secondary text-xs" onClick={() => transform(content, side, true)}>
          <Code2 className="w-3.5 h-3.5" />
          {mounted ? t('buttons.format') : 'Format'}
        </button>
        <button className="btn btn-secondary text-xs" onClick={() => transform(content, side, false)}>
          <Minimize2 className="w-3.5 h-3.5" />
          {mounted ? t('buttons.compact') : 'Compact'}
        </button>
      </div>
    </div>
  );

  const filterPills: { key: FilterType; label: string; count: number; cls: string }[] = [
    { key: 'all', label: 'All', count: differences?.length ?? 0, cls: 'pillAll' },
    { key: 'added', label: 'added', count: stats.added, cls: 'pillAdded' },
    { key: 'removed', label: 'removed', count: stats.removed, cls: 'pillRemoved' },
    { key: 'modified', label: 'modified', count: stats.modified, cls: 'pillModified' },
    { key: 'type-changed', label: 'type', count: stats['type-changed'], cls: 'pillType' },
  ];

  return (
    <div className={styles.diffContainer}>
      <div className={styles.diffInputSection}>
        {renderPanel('left', mounted ? t('diff.original') : 'Original JSON', leftContent, setLeftContent, leftInvalid)}
        {renderPanel('right', mounted ? t('diff.modified') : 'Modified JSON', rightContent, setRightContent, rightInvalid)}
      </div>

      <div className={styles.diffToolbar}>
        <button className="btn btn-secondary text-xs" onClick={handleSwap} title="Swap the two panels">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          Swap sides
        </button>
        <span className={styles.diffHint}>Differences update automatically</span>
      </div>

      <div className={styles.diffResultsSection}>
        {differences === null ? (
          <div className={styles.diffPlaceholder}>
            {leftInvalid || rightInvalid
              ? 'Fix the invalid JSON to see the comparison.'
              : 'Paste or edit JSON in both panels — differences appear here automatically.'}
          </div>
        ) : differences.length === 0 ? (
          <div className={styles.diffNoChanges}>
            {mounted ? t('diff.noDifference') : 'No differences — both JSON documents are identical.'}
          </div>
        ) : (
          <>
            <div className={styles.diffStats}>
              {filterPills.map((pill) => (
                <button
                  key={pill.key}
                  className={`${styles.diffStat} ${styles[pill.cls]} ${
                    filter === pill.key ? styles.diffStatActive : ''
                  }`}
                  onClick={() => setFilter(pill.key)}
                  aria-pressed={filter === pill.key}
                >
                  {pill.key === 'all' ? `All ${pill.count}` : `${pill.count} ${pill.label}`}
                </button>
              ))}
            </div>

            <div className={styles.diffList}>
              {visibleDiffs.map((diff, index) => (
                <div key={`${diff.path}-${index}`} className={`${styles.diffItem} ${styles[TYPE_META[diff.type].item]}`}>
                  <div className={styles.diffItemHead}>
                    <span className={`${styles.diffBadge} ${styles[TYPE_META[diff.type].badge]}`}>
                      {TYPE_META[diff.type].label}
                    </span>
                    <span className={styles.diffPath}>{diff.path}</span>
                  </div>
                  <div className={styles.diffLines}>
                    {diff.leftValue !== undefined && diff.type !== 'added' && (
                      <pre className={`${styles.diffLine} ${styles.diffLineRemoved}`}>{formatValue(diff.leftValue)}</pre>
                    )}
                    {diff.rightValue !== undefined && diff.type !== 'removed' && (
                      <pre className={`${styles.diffLine} ${styles.diffLineAdded}`}>{formatValue(diff.rightValue)}</pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DiffView;
