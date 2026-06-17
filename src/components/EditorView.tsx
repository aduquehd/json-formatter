'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useNotification } from '@/hooks/useNotification';

// Single editor across all devices: CodeMirror 6. It's fully bundled (no CDN
// egress, matching the privacy-first stance), touch-friendly, and theme-aware —
// replacing the previous Monaco-on-desktop / CodeMirror-on-mobile split.
const CodeMirrorEditor = dynamic(() => import('./CodeMirrorEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">Loading editor…</div>
  ),
});

interface EditorViewProps {
  content: string;
  onChange: (value: string) => void;
  theme: 'light' | 'dark';
}

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const LARGE_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const EditorView: React.FC<EditorViewProps> = ({ content, onChange, theme }) => {
  const { showError } = useNotification();
  const [isLargeFile, setIsLargeFile] = useState(false);

  // Check file size. Uses string length as a fast proxy for byte size.
  useEffect(() => {
    const contentSize = content.length;
    if (contentSize > MAX_FILE_SIZE) {
      showError(`File too large (${(contentSize / 1024 / 1024).toFixed(2)}MB). Maximum allowed is 10MB.`);
      onChange('{"error": "File too large. Please use a file smaller than 10MB"}');
      return;
    }
    setIsLargeFile(contentSize > LARGE_FILE_SIZE);
  }, [content, onChange, showError]);

  return (
    <div className="monaco-editor-container h-full">
      {isLargeFile && (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-sm">
          Large file detected. Some features may be slower.
        </div>
      )}
      <div className={isLargeFile ? 'h-[calc(100%-40px)]' : 'h-full'}>
        <CodeMirrorEditor value={content} onChange={onChange} theme={theme} />
      </div>
    </div>
  );
};

export default EditorView;
