'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { JSONFixer } from '../utils/jsonFixer';
import { useNotification } from '../hooks/useNotification';
import styles from './DiffView.module.css';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface DiffViewProps {
  json: any;
}

interface DiffResult {
  path: string;
  type: 'added' | 'removed' | 'modified' | 'type-changed';
  leftValue?: any;
  rightValue?: any;
}

const DiffView: React.FC<DiffViewProps> = ({ json }) => {
  const [leftContent, setLeftContent] = useState(json ? JSON.stringify(json, null, 2) : '');
  const [rightContent, setRightContent] = useState('');
  const [differences, setDifferences] = useState<DiffResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { showWarning, showError } = useNotification();

  const formatJSON = useCallback((content: string, side: 'left' | 'right') => {
    try {
      const result = JSONFixer.parseWithFixInfo(content || '{}');
      
      if (result.wasFixed && result.fixes) {
        const description = result.fixes.join(', ');
        const panelName = side === 'left' ? 'Left JSON' : 'Right JSON';
        showWarning(`The JSON has a wrong structure, it has been repaired automatically: ${panelName} - ${description}`);
      }
      
      const formatted = JSON.stringify(result.data, null, 2);
      if (side === 'left') {
        setLeftContent(formatted);
      } else {
        setRightContent(formatted);
      }
    } catch (error) {
      showError('Invalid JSON format');
    }
  }, [showWarning, showError]);

  const compactJSON = useCallback((content: string, side: 'left' | 'right') => {
    try {
      const result = JSONFixer.parseWithFixInfo(content || '{}');
      
      if (result.wasFixed && result.fixes) {
        const description = result.fixes.join(', ');
        const panelName = side === 'left' ? 'Left JSON' : 'Right JSON';
        showWarning(`The JSON has a wrong structure, it has been repaired automatically: ${panelName} - ${description}`);
      }
      
      const compacted = JSON.stringify(result.data);
      if (side === 'left') {
        setLeftContent(compacted);
      } else {
        setRightContent(compacted);
      }
    } catch (error) {
      showError('Invalid JSON format');
    }
  }, [showWarning, showError]);

  const compareJSON = useCallback((left: any, right: any, path: string = '$'): DiffResult[] => {
    const differences: DiffResult[] = [];

    if (left === right) {
      return differences;
    }

    if (typeof left !== typeof right) {
      differences.push({
        path,
        type: 'type-changed',
        leftValue: left,
        rightValue: right,
      });
      return differences;
    }

    if (typeof left !== 'object' || left === null || right === null) {
      differences.push({
        path,
        type: 'modified',
        leftValue: left,
        rightValue: right,
      });
      return differences;
    }

    if (Array.isArray(left) && Array.isArray(right)) {
      const maxLength = Math.max(left.length, right.length);
      for (let i = 0; i < maxLength; i++) {
        if (i >= left.length) {
          differences.push({
            path: `${path}[${i}]`,
            type: 'added',
            rightValue: right[i],
          });
        } else if (i >= right.length) {
          differences.push({
            path: `${path}[${i}]`,
            type: 'removed',
            leftValue: left[i],
          });
        } else {
          differences.push(...compareJSON(left[i], right[i], `${path}[${i}]`));
        }
      }
    } else {
      const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);

      for (const key of Array.from(allKeys)) {
        const keyPath = `${path}.${key}`;

        if (!(key in left)) {
          differences.push({
            path: keyPath,
            type: 'added',
            rightValue: right[key],
          });
        } else if (!(key in right)) {
          differences.push({
            path: keyPath,
            type: 'removed',
            leftValue: left[key],
          });
        } else {
          differences.push(...compareJSON(left[key], right[key], keyPath));
        }
      }
    }

    return differences;
  }, []);

  const handleCompare = useCallback(() => {
    try {
      const leftResult = JSONFixer.parseWithFixInfo(leftContent || '{}');
      const rightResult = JSONFixer.parseWithFixInfo(rightContent || '{}');
      
      const allFixes: string[] = [];
      if (leftResult.wasFixed && leftResult.fixes) {
        allFixes.push(...leftResult.fixes.map(f => `Left JSON: ${f}`));
      }
      if (rightResult.wasFixed && rightResult.fixes) {
        allFixes.push(...rightResult.fixes.map(f => `Right JSON: ${f}`));
      }
      
      if (allFixes.length > 0) {
        const leftDesc = leftResult.fixes ? leftResult.fixes.join(', ') : '';
        const rightDesc = rightResult.fixes ? rightResult.fixes.join(', ') : '';
        
        let message = 'The JSON has a wrong structure, it has been repaired automatically: ';
        if (leftResult.wasFixed && rightResult.wasFixed) {
          message += `Left JSON - ${leftDesc}; Right JSON - ${rightDesc}`;
        } else if (leftResult.wasFixed) {
          message += `Left JSON - ${leftDesc}`;
        } else {
          message += `Right JSON - ${rightDesc}`;
        }
        
        showWarning(message);
      }

      const diffs = compareJSON(leftResult.data, rightResult.data);
      setDifferences(diffs);
      setShowResults(true);
    } catch (error) {
      showError('Invalid JSON. Please check both inputs.');
    }
  }, [leftContent, rightContent, compareJSON, showWarning, showError]);

  const stats = useMemo(() => ({
    added: differences.filter(d => d.type === 'added').length,
    removed: differences.filter(d => d.type === 'removed').length,
    modified: differences.filter(d => d.type === 'modified').length,
    typeChanged: differences.filter(d => d.type === 'type-changed').length,
  }), [differences]);

  return (
    <div className={styles.diffContainer}>
      <div className={styles.diffInputSection}>
        <div className={styles.diffPanel}>
          <h4>Left JSON</h4>
          <div className={styles.diffEditorContainer}>
            <MonacoEditor
              height="300px"
              defaultLanguage="json"
              theme="vs-dark"
              value={leftContent}
              onChange={(value) => setLeftContent(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, monospace',
                fontLigatures: true,
                lineHeight: 1.7,
                folding: true,
                lineNumbers: 'on',
                lineNumbersMinChars: 3,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                wrappingStrategy: 'advanced',
                formatOnPaste: true,
                formatOnType: true,
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                autoIndent: 'full',
                tabSize: 2,
                insertSpaces: true,
                trimAutoWhitespace: true,
                matchBrackets: 'always',
                bracketPairColorization: {
                  enabled: true,
                },
                padding: {
                  top: 10,
                  bottom: 10,
                },
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  useShadows: false,
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                },
              }}
            />
          </div>
          <div className={styles.diffButtonGroup}>
            <button
              className={`${styles.diffActionButton} ${styles.diffFormatButton}`}
              onClick={() => formatJSON(leftContent, 'left')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16,18 22,12 16,6"></polyline>
                <polyline points="8,6 2,12 8,18"></polyline>
              </svg>
              Format JSON
            </button>
            <button
              className={`${styles.diffActionButton} ${styles.diffCompactButton}`}
              onClick={() => compactJSON(leftContent, 'left')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4,14 10,14 10,20"></polyline>
                <polyline points="20,10 14,10 14,4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
              Compact JSON
            </button>
          </div>
        </div>

        <div className={styles.diffPanel}>
          <h4>Right JSON</h4>
          <div className={styles.diffEditorContainer}>
            <MonacoEditor
              height="300px"
              defaultLanguage="json"
              theme="vs-dark"
              value={rightContent}
              onChange={(value) => setRightContent(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, monospace',
                fontLigatures: true,
                lineHeight: 1.7,
                folding: true,
                lineNumbers: 'on',
                lineNumbersMinChars: 3,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                wrappingStrategy: 'advanced',
                formatOnPaste: true,
                formatOnType: true,
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                autoIndent: 'full',
                tabSize: 2,
                insertSpaces: true,
                trimAutoWhitespace: true,
                matchBrackets: 'always',
                bracketPairColorization: {
                  enabled: true,
                },
                padding: {
                  top: 10,
                  bottom: 10,
                },
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  useShadows: false,
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                },
              }}
            />
          </div>
          <div className={styles.diffButtonGroup}>
            <button
              className={`${styles.diffActionButton} ${styles.diffFormatButton}`}
              onClick={() => formatJSON(rightContent, 'right')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16,18 22,12 16,6"></polyline>
                <polyline points="8,6 2,12 8,18"></polyline>
              </svg>
              Format JSON
            </button>
            <button
              className={`${styles.diffActionButton} ${styles.diffCompactButton}`}
              onClick={() => compactJSON(rightContent, 'right')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4,14 10,14 10,20"></polyline>
                <polyline points="20,10 14,10 14,4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
              Compact JSON
            </button>
          </div>
        </div>
      </div>

      <div className={styles.diffCompareSection}>
        <button className={styles.diffCompareButton} onClick={handleCompare}>
          Compare JSONs
        </button>
      </div>

      {showResults && (
        <div className={styles.diffResultsSection}>
          {differences.length === 0 ? (
            <div className={styles.diffNoChanges}>No differences found</div>
          ) : (
            <>
              <div className={styles.diffSummary}>
                <h4>Summary</h4>
                <div className={styles.diffStats}>
                  <span className={`${styles.diffStat} ${styles.diffAdded}`}>
                    +{stats.added} added
                  </span>
                  <span className={`${styles.diffStat} ${styles.diffRemoved}`}>
                    -{stats.removed} removed
                  </span>
                  <span className={`${styles.diffStat} ${styles.diffModified}`}>
                    ~{stats.modified} modified
                  </span>
                  <span className={`${styles.diffStat} ${styles.diffTypeChanged}`}>
                    ⚡{stats.typeChanged} type changed
                  </span>
                </div>
              </div>

              <div className={styles.diffList}>
                {differences.map((diff, index) => (
                  <div key={index} className={`${styles.diffItem} ${styles[`diff${diff.type.charAt(0).toUpperCase()}${diff.type.slice(1).replace('-', '')}`]}`}>
                    <div className={styles.diffPath}>{diff.path}</div>
                    <div className={styles.diffValues}>
                      {diff.type === 'added' && (
                        <div className={`${styles.diffValue} ${styles.diffRight}`}>
                          <span className={styles.diffLabel}>Added:</span>
                          <pre>{JSON.stringify(diff.rightValue, null, 2)}</pre>
                        </div>
                      )}
                      {diff.type === 'removed' && (
                        <div className={`${styles.diffValue} ${styles.diffLeft}`}>
                          <span className={styles.diffLabel}>Removed:</span>
                          <pre>{JSON.stringify(diff.leftValue, null, 2)}</pre>
                        </div>
                      )}
                      {(diff.type === 'modified' || diff.type === 'type-changed') && (
                        <>
                          <div className={`${styles.diffValue} ${styles.diffLeft}`}>
                            <span className={styles.diffLabel}>Before:</span>
                            <pre>{JSON.stringify(diff.leftValue, null, 2)}</pre>
                          </div>
                          <div className={`${styles.diffValue} ${styles.diffRight}`}>
                            <span className={styles.diffLabel}>After:</span>
                            <pre>{JSON.stringify(diff.rightValue, null, 2)}</pre>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DiffView;