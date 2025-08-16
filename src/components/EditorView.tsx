'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { JSONFixer } from '@/utils/jsonFixer';
import { useNotification } from '@/hooks/useNotification';

const MonacoEditor = dynamic(() => import('./MonacoEditorWrapper'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading Editor...</div>
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
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const { showWarning, showError } = useNotification();
  const isPastingRef = useRef(false);
  const isDisposedRef = useRef(false);
  const [isLargeFile, setIsLargeFile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);


  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
                            (window.innerWidth <= 768);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check file size
  useEffect(() => {
    const contentSize = new Blob([content]).size;
    if (contentSize > MAX_FILE_SIZE) {
      showError(`File too large (${(contentSize / 1024 / 1024).toFixed(2)}MB). Maximum allowed is 10MB.`);
      onChange('{"error": "File too large. Please use a file smaller than 10MB"}');
      return;
    }
    setIsLargeFile(contentSize > LARGE_FILE_SIZE);
  }, [content, onChange, showError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isDisposedRef.current = true;
      if (editorRef.current) {
        try {
          editorRef.current.dispose();
        } catch (e) {
          console.error('Error disposing editor:', e);
        }
      }
    };
  }, []);

  // Update theme when it changes
  useEffect(() => {
    if (monacoRef.current && editorRef.current && !isDisposedRef.current) {
      try {
        monacoRef.current.editor.setTheme(theme === 'dark' ? 'customDark' : 'customLight');
      } catch (e) {
        console.error('Error updating theme:', e);
      }
    }
  }, [theme]);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    // Store references
    editorRef.current = editor;
    monacoRef.current = monaco;
    isDisposedRef.current = false;
    
    // Check if editor and monaco are valid
    if (!editor || !monaco) {
      console.error('Monaco Editor failed to mount properly');
      return;
    }
    
    try {
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
      
      // Add paste event handler to fix JSON automatically
      const pasteDisposable = editor.onDidPaste((e: any) => {
        if (isDisposedRef.current) return;
        
        isPastingRef.current = true;
        
        // Get the current content after paste
        setTimeout(() => {
          if (isDisposedRef.current || !editor) return;
          
          try {
            const currentContent = editor.getValue();
            
            // Check file size after paste
            const contentSize = new Blob([currentContent]).size;
            if (contentSize > MAX_FILE_SIZE) {
              showError(`Pasted content too large. Maximum allowed is 10MB.`);
              editor.undo(); // Undo the paste
              return;
            }
            
            // Try to parse and fix the JSON
            const result = JSONFixer.parseWithFixInfo(currentContent);
            
            if (result.wasFixed && result.data && result.fixes && result.fixes.length > 0) {
              // JSON was fixed - update the editor with the fixed version
              const formatted = JSON.stringify(result.data, null, 2);
              editor.setValue(formatted);
              
              // Show warning about fixes
              setTimeout(() => {
                if (!isDisposedRef.current) {
                  showWarning(`JSON was automatically fixed: ${result.fixes!.join(', ')}`);
                }
              }, 100);
            }
          } catch (e) {
            console.error('Error handling paste:', e);
          } finally {
            isPastingRef.current = false;
          }
        }, 10);
      });
      
      // Configure editor options with performance optimizations for large files
      const editorOptions = {
        minimap: { 
          enabled: !isMobile && !isLargeFile,
          renderCharacters: false,
          maxColumn: 80,
        },
        fontSize: isMobile ? 12 : 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', Monaco, 'Courier New', monospace",
        fontLigatures: !isMobile,
        lineNumbers: 'on',
        wordWrap: 'on',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        renderWhitespace: 'none',
        formatOnPaste: !isLargeFile,
        formatOnType: false,
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'always',
        bracketPairColorization: {
          enabled: !isLargeFile,
        },
        'bracketPairColorization.independentColorPoolPerBracketType': !isLargeFile,
        renderLineHighlight: isLargeFile ? 'none' : 'all',
        cursorStyle: 'line',
        cursorBlinking: 'smooth',
        smoothScrolling: !isLargeFile,
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          verticalScrollbarSize: isMobile ? 6 : 10,
          horizontalScrollbarSize: isMobile ? 6 : 10,
        },
        overviewRulerLanes: isLargeFile ? 0 : 3,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 4,
        glyphMargin: !isMobile,
        roundedSelection: false,
        theme: theme === 'dark' ? 'customDark' : 'customLight',
        // Performance optimizations
        maxTokenizationLineLength: isLargeFile ? 500 : 20000,
        renderValidationDecorations: !isLargeFile ? 'on' : 'off',
        largeFileOptimizations: isLargeFile,
      };
      
      editor.updateOptions(editorOptions);
      
      // Cleanup function
      return () => {
        pasteDisposable?.dispose();
      };
    } catch (e) {
      console.error('Error mounting editor:', e);
      showError('Failed to initialize editor. Please refresh the page.');
    }
  }, [theme, showWarning, showError, isLargeFile, isMobile]);

  // Safe onChange handler
  const handleChange = useCallback((value: string | undefined) => {
    if (!isDisposedRef.current) {
      onChange(value || '');
    }
  }, [onChange]);

  // Mobile fallback editor
  if (isMobile) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-sm">
          Using simplified editor for mobile. For best experience, use a desktop browser.
        </div>
        <textarea
          className="flex-1 w-full p-4 font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-none outline-none resize-none"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste or type your JSON here..."
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    );
  }

  return (
    <div className="monaco-editor-container h-full">
      {isLargeFile && (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-sm">
          Large file detected. Some features disabled for performance.
        </div>
      )}
      <MonacoEditor
        height={isLargeFile ? "calc(100% - 40px)" : "100%"}
        defaultLanguage="json"
        theme={theme === 'dark' ? 'customDark' : 'customLight'}
        value={content}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { 
            enabled: !isMobile && !isLargeFile,
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
          formatOnPaste: !isLargeFile,
          formatOnType: false,
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'always',
          bracketPairColorization: {
            enabled: !isLargeFile,
          },
          renderLineHighlight: isLargeFile ? 'none' : 'all',
          cursorStyle: 'line',
          cursorBlinking: 'smooth',
          smoothScrolling: !isLargeFile,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          largeFileOptimizations: isLargeFile,
        }}
      />
    </div>
  );
};

export default EditorView;