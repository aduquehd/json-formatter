'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface DiffViewProps {
  json: any;
}

const DiffView: React.FC<DiffViewProps> = ({ json }) => {
  const [leftContent, setLeftContent] = useState(json ? JSON.stringify(json, null, 2) : '');
  const [rightContent, setRightContent] = useState('');

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--border-color)]">
        <h3 className="text-lg font-semibold">JSON Diff Comparison</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Compare two JSON objects side by side
        </p>
      </div>
      
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">Original JSON</label>
          <div className="flex-1 border border-[var(--border-color)] rounded-lg overflow-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={leftContent}
              onChange={(value) => setLeftContent(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
              }}
            />
          </div>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">Modified JSON</label>
          <div className="flex-1 border border-[var(--border-color)] rounded-lg overflow-hidden">
            <MonacoEditor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={rightContent}
              onChange={(value) => setRightContent(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiffView;