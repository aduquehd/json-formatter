'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { documentStatus, formatBytes, measureDocument } from '@/utils/jsonDocument';
import { measureShape } from '@/utils/jsonStats';
import { runDepthGuarded } from '@/utils/jsonWalk';

interface StatusBarProps {
  content: string;
  json: any;
  /**
   * Whether `content` parsed. Passed in explicitly rather than inferred from
   * `json`, because `null`, `0`, `false` and `""` are valid JSON documents that
   * a truthiness test would report as invalid.
   */
  isValid: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ content, json, isValid }) => {
  const status = documentStatus(content, isValid);

  // Single pass over the document, allocating nothing — this runs on every
  // keystroke, since `content` is not debounced.
  const metrics = status === 'empty' ? null : measureDocument(content);

  // Keyed on `json` alone: the parsed document only changes when the debounced
  // parse commits, so typing must not re-walk the whole tree.
  //
  // Guarded, because this bar renders as a direct child of `<main>` — outside
  // every ErrorBoundary in the app. An unguarded recursive walk here died with
  // `RangeError` somewhere past 5,000 levels and unmounted the entire workbench,
  // destroying whatever the user had in the editor: exactly the failure the
  // depth limit exists to prevent, in the one place nothing was watching. Past
  // the limit the two shape metrics are simply left out; lines, bytes and the
  // validity pill are unaffected, and the views show the depth notice.
  const shape = useMemo(
    () => (isValid ? runDepthGuarded(() => measureShape(json)) : null),
    [json, isValid]
  );
  const measured = shape?.ok === true ? shape.value : null;

  return (
    <div className="status-bar">
      {/* Only the validity pill is a live region. With the whole bar live, a
          screen reader announced every byte and line count as the user typed. */}
      <div role="status" aria-live="polite">
        {status === 'empty' ? (
          <span className="status-pill" style={{ fontWeight: 400 }}>
            Ready — paste, open a file, or try an example
          </span>
        ) : status === 'valid' ? (
          <span className="status-pill status-valid">
            <CheckCircle2 className="w-3.5 h-3.5" /> Valid JSON
          </span>
        ) : (
          <span className="status-pill status-invalid">
            <AlertCircle className="w-3.5 h-3.5" /> Invalid JSON
          </span>
        )}
      </div>

      {metrics && (
        <div className="status-metrics">
          {measured && <span>{measured.nodes.toLocaleString()} nodes</span>}
          {measured && <span>depth {measured.depth}</span>}
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
