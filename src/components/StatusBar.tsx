'use client';

import React, { useMemo } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusBarProps {
  content: string;
  json: any;
}

// Count total nodes and maximum nesting depth in one traversal.
function analyze(json: any): { nodes: number; depth: number } {
  let nodes = 0;
  let maxDepth = 0;
  const walk = (value: any, depth: number) => {
    nodes++;
    if (depth > maxDepth) maxDepth = depth;
    if (value && typeof value === 'object') {
      const children = Array.isArray(value) ? value : Object.values(value);
      for (const child of children) walk(child, depth + 1);
    }
  };
  walk(json, 0);
  return { nodes, depth: maxDepth };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const StatusBar: React.FC<StatusBarProps> = ({ content, json }) => {
  const isEmpty = !content || content.trim() === '';
  const valid = !isEmpty && json !== null && json !== undefined;

  const metrics = useMemo(() => {
    if (isEmpty) return null;
    const bytes = new TextEncoder().encode(content).length;
    const lines = content.split('\n').length;
    const { nodes, depth } = valid ? analyze(json) : { nodes: 0, depth: 0 };
    return { bytes, lines, nodes, depth };
  }, [content, json, isEmpty, valid]);

  return (
    <div className="status-bar" role="status" aria-live="polite">
      {isEmpty ? (
        <span className="status-pill" style={{ fontWeight: 400 }}>
          Ready — paste, open a file, or try an example
        </span>
      ) : valid ? (
        <span className="status-pill status-valid">
          <CheckCircle2 className="w-3.5 h-3.5" /> Valid JSON
        </span>
      ) : (
        <span className="status-pill status-invalid">
          <AlertCircle className="w-3.5 h-3.5" /> Invalid JSON
        </span>
      )}

      {metrics && (
        <div className="status-metrics">
          {valid && <span>{metrics.nodes.toLocaleString()} nodes</span>}
          {valid && <span>depth {metrics.depth}</span>}
          <span>{metrics.lines.toLocaleString()} lines</span>
          <span>{formatBytes(metrics.bytes)}</span>
          <span className="hidden sm:inline">
            <kbd>⌘↵</kbd> format
          </span>
        </div>
      )}
    </div>
  );
};

export default StatusBar;
