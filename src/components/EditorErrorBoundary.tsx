'use client';

import React from 'react';
import ErrorBoundary from './ErrorBoundary';

interface EditorErrorBoundaryProps {
  children: React.ReactNode;
  onError?: () => void;
}

const EditorErrorBoundary: React.FC<EditorErrorBoundaryProps> = ({ children, onError }) => {
  const handleEditorError = (error: Error) => {
    console.error('Editor error:', error);
    if (onError) {
      onError();
    }
  };

  const editorFallback = (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Editor Loading Error
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          The JSON editor failed to load. This might be due to network issues or browser compatibility.
        </p>
        <div className="space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Reload Page
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Or use the simple text editor below:
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={editorFallback}
      onError={(error) => handleEditorError(error)}
    >
      {children}
    </ErrorBoundary>
  );
};

export default EditorErrorBoundary;