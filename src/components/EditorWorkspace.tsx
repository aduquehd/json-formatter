'use client';

import { Columns2, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import type React from 'react';
import EditorView from './EditorView';

// The diff machinery is only pulled in once the user opens compare mode, keeping
// the editor route's initial bundle lean.
const CompareWorkspace = dynamic(() => import('./CompareWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-[var(--text-secondary)]">
      Loading compare…
    </div>
  ),
});

interface EditorWorkspaceProps {
  /** The shared main editor document. */
  content: string;
  onChange: (value: string) => void;
  theme: 'light' | 'dark';
  /** Whether the second editor + diff panel is open. */
  compareMode: boolean;
  onCompareModeChange: (on: boolean) => void;
  /** The "Compare JSON" document (right side), lifted so it survives view switches. */
  compareContent: string;
  onCompareContentChange: (value: string) => void;
}

/**
 * The Editor view. By default the editor fills ~70% of the width with a
 * "Compare JSON" call-to-action card alongside it. Opening compare swaps in the
 * full side-by-side diff workspace, with the main editor as the left "Your JSON"
 * panel — so diffing is an optional mode of the editor rather than a separate tab.
 */
const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  content,
  onChange,
  theme,
  compareMode,
  onCompareModeChange,
  compareContent,
  onCompareContentChange,
}) => {
  if (compareMode) {
    return (
      <CompareWorkspace
        content={content}
        onChange={onChange}
        compareContent={compareContent}
        onCompareContentChange={onCompareContentChange}
        theme={theme}
        onExit={() => onCompareModeChange(false)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 sm:flex-row">
      <div className="min-h-0 flex-1 sm:flex-none sm:w-[70%]">
        <EditorView content={content} onChange={onChange} theme={theme} />
      </div>
      <button
        type="button"
        onClick={() => onCompareModeChange(true)}
        aria-label="Compare this JSON against another document"
        className="group flex shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 text-center transition-colors hover:border-[var(--accent-color)] hover:bg-[var(--btn-secondary-hover)] sm:w-[30%] sm:max-w-[340px]"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[var(--accent-color)]">
          <Columns2 className="h-6 w-6" />
        </span>
        <span className="text-base font-semibold text-[var(--text-primary)]">Compare JSON</span>
        <span className="text-sm leading-relaxed text-[var(--text-secondary)]">
          Open a second editor to diff this JSON against another — side-by-side, unified, or
          semantic.
        </span>
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent-color)] bg-[var(--accent-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--accent-color)] transition-colors group-hover:bg-[var(--accent-color)] group-hover:text-[var(--accent-text)]">
          <Plus className="h-4 w-4" />
          Compare
        </span>
      </button>
    </div>
  );
};

export default EditorWorkspace;
