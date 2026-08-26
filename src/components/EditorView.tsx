'use client';

import dynamic from 'next/dynamic';
import type React from 'react';
import { describeDocumentSize } from '@/utils/jsonDocument';

// Single editor across all devices: CodeMirror 6. It's fully bundled (no CDN
// egress, matching the privacy-first stance), touch-friendly, and theme-aware.
const CodeMirrorEditor = dynamic(() => import('./CodeMirrorEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
      Loading editor…
    </div>
  ),
});

interface EditorViewProps {
  content: string;
  onChange: (value: string) => void;
  theme: 'light' | 'dark';
}

const EditorView: React.FC<EditorViewProps> = ({ content, onChange, theme }) => {
  // Derived during render, not written from an effect.
  //
  // This used to be an effect that, past the 10MB cap, called
  // `onChange('{"error": "File too large…"}')` — replacing whatever the user had
  // just pasted with an error object. A warning must never destroy the
  // document: the size cap is enforced where content enters from outside (file
  // open, drag-and-drop, the Paste button), and content typed or pasted
  // directly into the editor is kept and flagged here instead.
  const size = describeDocumentSize(content.length);

  return (
    <div className="editor-container flex flex-col">
      {size !== 'normal' && (
        <div className="shrink-0 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-sm">
          {size === 'over-max'
            ? `Very large document (${(content.length / 1024 / 1024).toFixed(2)}MB, over the 10MB limit). Nothing was discarded — editing and the other views may be slow.`
            : 'Large file detected. Some features may be slower.'}
        </div>
      )}
      <div className="min-h-0 flex-1">
        <CodeMirrorEditor value={content} onChange={onChange} theme={theme} />
      </div>
    </div>
  );
};

export default EditorView;
