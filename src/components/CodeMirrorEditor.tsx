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
  "'JetBrains Mono', 'Fira Code', Monaco, 'Courier New', monospace";

// Dark theme — matches the Monaco "customDark" (Tokyo Night) palette used on desktop.
const darkTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#1f2335',
    foreground: '#c0caf5',
    caret: '#c0caf5',
    selection: '#3b4261',
    selectionMatch: '#3b4261',
    lineHighlight: '#24283b',
    gutterBackground: '#1f2335',
    gutterForeground: '#3b4261',
    gutterActiveForeground: '#7aa2f7',
    fontFamily: FONT_FAMILY,
    fontSize: '16px',
  },
  styles: [
    { tag: t.propertyName, color: '#7aa2f7' },
    { tag: t.string, color: '#9ece6a' },
    { tag: t.number, color: '#ff9e64' },
    { tag: [t.bool, t.null], color: '#bb9af7' },
    { tag: [t.brace, t.squareBracket, t.separator, t.punctuation], color: '#565f89' },
  ],
});

// Light theme — matches the Monaco "customLight" (GitHub) palette.
const lightTheme = createTheme({
  theme: 'light',
  settings: {
    background: '#ffffff',
    foreground: '#24292e',
    caret: '#24292e',
    selection: '#0366d625',
    selectionMatch: '#0366d625',
    lineHighlight: '#f6f8fa',
    gutterBackground: '#ffffff',
    gutterForeground: '#656d76',
    gutterActiveForeground: '#24292e',
    fontFamily: FONT_FAMILY,
    fontSize: '16px',
  },
  styles: [
    { tag: t.propertyName, color: '#005cc5' },
    { tag: t.string, color: '#22863a' },
    { tag: t.number, color: '#005cc5' },
    { tag: t.bool, color: '#d73a49' },
    { tag: t.null, color: '#6f42c1' },
    { tag: [t.brace, t.squareBracket, t.separator, t.punctuation], color: '#586069' },
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
