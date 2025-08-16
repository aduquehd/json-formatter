'use client';

import React, { useEffect } from 'react';
import Editor, { loader } from '@monaco-editor/react';

// Configure loader to use CDN with fallback
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
  },
  'vs/nls': {
    availableLanguages: {}
  }
} as any);

interface MonacoEditorWrapperProps {
  height: string;
  defaultLanguage: string;
  theme: string;
  value: string;
  onChange: (value: string | undefined) => void;
  onMount: (editor: any, monaco: any) => void;
  options: any;
  loading?: React.ReactNode;
}

const MonacoEditorWrapper: React.FC<MonacoEditorWrapperProps> = (props) => {
  useEffect(() => {
    // Disable workers globally when component mounts - this runs in synchronous mode
    if (typeof window !== 'undefined' && !(window as any).MonacoEnvironment) {
      // Only set if not already set by suppress-monaco-warnings.js
      (window as any).MonacoEnvironment = {
        // Don't provide getWorker at all - this forces synchronous mode
        getWorkerUrl: (_: string, label: string) => {
          // Return data URL to prevent network requests
          return 'data:text/javascript;charset=utf-8,';
        }
      };
    }
  }, []);

  return (
    <Editor
      {...props}
      beforeMount={(monaco) => {
        // Disable JSON validation to avoid worker requirements
        try {
          monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: false,
            comments: 'ignore',
            trailingCommas: 'ignore',
            schemas: []
          });
        } catch (e) {
          console.info('JSON defaults configuration skipped');
        }
        
        // Disable TypeScript/JavaScript workers if they exist
        try {
          if (monaco.languages.typescript) {
            monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
            monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
          }
        } catch (e) {
          console.info('TypeScript defaults configuration skipped');
        }
      }}
    />
  );
};

export default MonacoEditorWrapper;