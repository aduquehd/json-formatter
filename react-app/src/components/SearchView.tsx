'use client';

import React, { useState } from 'react';

interface SearchViewProps {
  json: any;
}

const SearchView: React.FC<SearchViewProps> = ({ json }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const search = () => {
    if (!json || !searchQuery) {
      setSearchResults([]);
      return;
    }

    const results: any[] = [];
    const searchInObject = (obj: any, path: string = '') => {
      if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          
          // Search in keys
          if (key.toLowerCase().includes(searchQuery.toLowerCase())) {
            results.push({
              type: 'key',
              path: currentPath,
              key,
              value,
            });
          }
          
          // Search in values
          if (typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase())) {
            results.push({
              type: 'value',
              path: currentPath,
              key,
              value,
            });
          }
          
          // Recursive search
          if (typeof value === 'object') {
            searchInObject(value, currentPath);
          }
        });
      }
    };

    searchInObject(json);
    setSearchResults(results);
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Search & Filter</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Enter search term..."
            className="flex-1 px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={search}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:shadow-lg transition-all"
          >
            Search
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {searchResults.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Found {searchResults.length} result(s)
            </p>
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.type === 'key' 
                      ? 'bg-blue-500/20 text-blue-500' 
                      : 'bg-green-500/20 text-green-500'
                  }`}>
                    {result.type.toUpperCase()}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">{result.path}</span>
                </div>
                <div className="font-mono text-sm">
                  <span className="text-[var(--json-key)]">"{result.key}"</span>
                  <span className="text-[var(--text-secondary)]">: </span>
                  <span className={
                    typeof result.value === 'string' ? 'text-[var(--tree-string)]' :
                    typeof result.value === 'number' ? 'text-[var(--tree-number)]' :
                    typeof result.value === 'boolean' ? 'text-[var(--tree-boolean)]' :
                    'text-[var(--text-primary)]'
                  }>
                    {typeof result.value === 'object' 
                      ? JSON.stringify(result.value, null, 2).substring(0, 100) + '...'
                      : typeof result.value === 'string' 
                        ? `"${result.value}"`
                        : String(result.value)
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <p className="text-center text-[var(--text-secondary)]">No results found</p>
        ) : (
          <p className="text-center text-[var(--text-secondary)]">Enter a search term to begin</p>
        )}
      </div>
    </div>
  );
};

export default SearchView;