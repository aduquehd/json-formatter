'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface EditorViewProps {
  content: string;
  onChange: (value: string) => void;
  theme: 'light' | 'dark';
}

const EditorView: React.FC<EditorViewProps> = ({ content, onChange, theme }) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    // Update theme when it changes
    if (monacoRef.current && editorRef.current) {
      monacoRef.current.editor.setTheme(theme === 'dark' ? 'customDark' : 'customLight');
    }
  }, [theme]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Define custom dark theme to match original
    monaco.editor.defineTheme('customDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'string.key.json', foreground: '7aa2f7' },
        { token: 'string.value.json', foreground: '9ece6a' },
        { token: 'number', foreground: 'ff9e64' },
        { token: 'keyword.json', foreground: 'bb9af7' },
        { token: 'delimiter.bracket.json', foreground: '565f89' },
        { token: 'delimiter.comma.json', foreground: '565f89' },
        { token: 'delimiter.colon.json', foreground: '565f89' },
      ],
      colors: {
        'editor.background': '#1f2335',
        'editor.foreground': '#c0caf5',
        'editor.lineHighlightBackground': '#24283b',
        'editor.selectionBackground': '#3b4261',
        'editorCursor.foreground': '#c0caf5',
        'editorWhitespace.foreground': '#3b4261',
        'editorLineNumber.foreground': '#3b4261',
        'editorLineNumber.activeForeground': '#7aa2f7',
        'editor.inactiveSelectionBackground': '#2d3142',
        'editorBracketMatch.background': '#3b4261',
        'editorBracketMatch.border': '#7aa2f7',
        'scrollbarSlider.background': '#3b426150',
        'scrollbarSlider.hoverBackground': '#3b426180',
        'scrollbarSlider.activeBackground': '#3b4261',
      },
    });

    // Define custom light theme
    monaco.editor.defineTheme('customLight', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'string.key.json', foreground: '005cc5' },
        { token: 'string.value.json', foreground: '22863a' },
        { token: 'number', foreground: '005cc5' },
        { token: 'keyword.json', foreground: 'd73a49' },
        { token: 'delimiter.bracket.json', foreground: '24292e' },
        { token: 'delimiter.comma.json', foreground: '586069' },
        { token: 'delimiter.colon.json', foreground: '586069' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#24292e',
        'editor.lineHighlightBackground': '#f6f8fa',
        'editor.selectionBackground': '#0366d625',
        'editorLineNumber.foreground': '#656d76',
        'editorLineNumber.activeForeground': '#24292e',
      },
    });
    
    // Set the theme
    monaco.editor.setTheme(theme === 'dark' ? 'customDark' : 'customLight');
    
    // Configure editor options
    editor.updateOptions({
      minimap: { 
        enabled: true,
        renderCharacters: false,
        maxColumn: 80,
      },
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', Monaco, 'Courier New', monospace",
      fontLigatures: true,
      lineNumbers: 'on',
      wordWrap: 'on',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'none',
      formatOnPaste: true,
      formatOnType: false,
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',
      bracketPairColorization: {
        enabled: true,
      },
      'bracketPairColorization.independentColorPoolPerBracketType': true,
      renderLineHighlight: 'all',
      cursorStyle: 'line',
      cursorBlinking: 'smooth',
      smoothScrolling: true,
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
      overviewRulerLanes: 3,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 4,
      glyphMargin: true,
      roundedSelection: false,
      theme: theme === 'dark' ? 'customDark' : 'customLight',
    });
  };

  return (
    <div className="monaco-editor-container h-full">
      <MonacoEditor
        height="100%"
        defaultLanguage="json"
        theme={theme === 'dark' ? 'customDark' : 'customLight'}
        value={content}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorDidMount}
        options={{
          minimap: { 
            enabled: true,
            renderCharacters: false,
            maxColumn: 80,
          },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', Monaco, 'Courier New', monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderWhitespace: 'none',
          formatOnPaste: true,
          formatOnType: false,
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'always',
          bracketPairColorization: {
            enabled: true,
          },
          renderLineHighlight: 'all',
          cursorStyle: 'line',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
      />
    </div>
  );
};

export default EditorView;