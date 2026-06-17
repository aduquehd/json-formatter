'use client';

import React, { useMemo } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: 'light' | 'dark';
}

const FONT_FAMILY =
  "var(--font-mono), 'JetBrains Mono', 'Fira Code', Monaco, 'Courier New', monospace";

// Dark theme — Engineering Console palette (deep slate + aqua signal accent).
const darkTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#0b0f14',
    foreground: '#e6edf3',
    caret: '#2dd4bf',
    selection: '#173a36',
    selectionMatch: '#12302c',
    lineHighlight: '#0e141b',
    gutterBackground: '#0b0f14',
    gutterForeground: '#3a4654',
    gutterActiveForeground: '#2dd4bf',
    fontFamily: FONT_FAMILY,
    fontSize: '16px',
  },
  styles: [
    { tag: t.propertyName, color: '#79c0ff' },
    { tag: t.string, color: '#7ee787' },
    { tag: t.number, color: '#ffa657' },
    { tag: [t.bool, t.null], color: '#d2a8ff' },
    { tag: [t.brace, t.squareBracket, t.separator, t.punctuation], color: '#6e7b8a' },
  ],
});

// Light theme — paper variant (off-white + teal accent).
const lightTheme = createTheme({
  theme: 'light',
  settings: {
    background: '#ffffff',
    foreground: '#0c1116',
    caret: '#0d9488',
    selection: '#0d948822',
    selectionMatch: '#0d948822',
    lineHighlight: '#f3f5f7',
    gutterBackground: '#ffffff',
    gutterForeground: '#8a949f',
    gutterActiveForeground: '#0d9488',
    fontFamily: FONT_FAMILY,
    fontSize: '16px',
  },
  styles: [
    { tag: t.propertyName, color: '#0550ae' },
    { tag: t.string, color: '#1a7f37' },
    { tag: t.number, color: '#0550ae' },
    { tag: t.bool, color: '#cf222e' },
    { tag: t.null, color: '#6639ba' },
    { tag: [t.brace, t.squareBracket, t.separator, t.punctuation], color: '#656d76' },
  ],
});

// CodeMirror 6 editor — the single editor used on every device. It is
// contenteditable-based (no hidden <textarea>), so iOS never force-zooms on
// focus, and it provides real JSON syntax highlighting, line numbers, folding,
// and bracket matching while staying fully bundled (no CDN egress).
const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({ value, onChange, theme }) => {
  const extensions = useMemo(
    () => [
      json(),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': 'JSON editor' }),
    ],
    []
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={theme === 'dark' ? darkTheme : lightTheme}
      extensions={extensions}
      height="100%"
      style={{ height: '100%', fontSize: '16px' }}
      placeholder="Paste or type your JSON here..."
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
        highlightSelectionMatches: false,
      }}
    />
  );
};

export default CodeMirrorEditor;
