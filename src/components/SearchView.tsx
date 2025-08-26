'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface SearchViewProps {
  json: any;
}

interface SearchResult {
  type: 'key' | 'value' | 'both';
  path: string;
  key: string;
  value: any;
  depth: number;
  dataType: string;
}

interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

type SearchMode = 'contains' | 'exact' | 'starts' | 'ends' | 'regex';
type SearchTarget = 'both' | 'keys' | 'values';

interface TreeNode {
  path: string;
  results: SearchResult[];
  children: Map<string, TreeNode>;
  expanded?: boolean;
}

// Tree Result View Component
const TreeResultView: React.FC<{
  results: SearchResult[];
  onSelectResult: (index: number) => void;
  selectedResult: number | null;
}> = ({ results, onSelectResult, selectedResult }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Build tree structure from results
  const buildTree = (): TreeNode => {
    const root: TreeNode = {
      path: '',
      results: [],
      children: new Map(),
    };

    results.forEach((result, index) => {
      const pathParts = result.path.split(/\.|\[|\]/).filter(Boolean);
      let currentNode = root;
      let currentPath = '';

      pathParts.forEach((part, i) => {
        currentPath = currentPath ? `${currentPath}.${part}` : part;
        
        if (!currentNode.children.has(part)) {
          currentNode.children.set(part, {
            path: currentPath,
            results: [],
            children: new Map(),
          });
        }
        
        currentNode = currentNode.children.get(part)!;
        
        // Add result to the leaf node
        if (i === pathParts.length - 1) {
          currentNode.results.push({ ...result, originalIndex: index } as any);
        }
      });
    });

    return root;
  };

  const tree = buildTree();

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string': return '"';
      case 'number': return '#';
      case 'boolean': return '⊤';
      case 'object': return '{}';
      case 'array': return '[]';
      case 'null': return '∅';
      default: return '?';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'text-green-500';
      case 'number': return 'text-blue-500';
      case 'boolean': return 'text-purple-500';
      case 'object': return 'text-orange-500';
      case 'array': return 'text-yellow-500';
      case 'null': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const renderTreeNode = (node: TreeNode, key: string, level: number = 0): React.ReactElement => {
    const hasChildren = node.children.size > 0;
    const isExpanded = expandedNodes.has(node.path);
    const indent = level * 24;

    return (
      <div key={node.path || 'root'}>
        {key && (
          <div 
            className="flex items-center py-1 hover:bg-[var(--bg-secondary)]/50 rounded cursor-pointer transition-colors"
            style={{ paddingLeft: `${indent}px` }}
            onClick={() => hasChildren && toggleNode(node.path)}
          >
            {hasChildren && (
              <span className="w-4 h-4 mr-2 text-[var(--text-secondary)] flex-shrink-0">
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            {!hasChildren && <span className="w-4 h-4 mr-2" />}
            
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {key}
            </span>
            
            {node.results.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs">
                {node.results.length} match{node.results.length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        )}

        {/* Render results at this node */}
        {node.results.map((result: any) => (
          <div
            key={`${node.path}-${result.originalIndex}`}
            onClick={() => onSelectResult(result.originalIndex)}
            className={`flex items-center py-2 px-3 ml-6 hover:bg-[var(--bg-secondary)]/50 rounded cursor-pointer transition-all ${
              selectedResult === result.originalIndex ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''
            }`}
            style={{ paddingLeft: `${indent + 24}px` }}
          >
            <span className={`w-6 h-6 flex items-center justify-center font-bold text-sm mr-3 ${getTypeColor(result.dataType)}`}>
              {getTypeIcon(result.dataType)}
            </span>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-[var(--json-key)]">
                  {result.key}
                </span>
                <span className="text-[var(--text-secondary)]">:</span>
                <span className={`font-mono text-sm ${
                  typeof result.value === 'string' ? 'text-green-500' :
                  typeof result.value === 'number' ? 'text-blue-500' :
                  typeof result.value === 'boolean' ? 'text-purple-500' :
                  'text-gray-500'
                }`}>
                  {typeof result.value === 'object' && result.value !== null
                    ? Array.isArray(result.value) ? `[${result.value.length}]` : `{...}`
                    : typeof result.value === 'string' 
                      ? `"${result.value.substring(0, 50)}${result.value.length > 50 ? '...' : ''}"`
                      : String(result.value)
                  }
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  result.type === 'key' ? 'bg-blue-500/10 text-blue-500' : 
                  result.type === 'value' ? 'bg-green-500/10 text-green-500' : 
                  'bg-purple-500/10 text-purple-500'
                }`}>
                  {result.type.toUpperCase()}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Depth: {result.depth}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Render children */}
        {isExpanded && Array.from(node.children.entries()).map(([childKey, childNode]) => 
          renderTreeNode(childNode, childKey, level + 1)
        )}
      </div>
    );
  };

  return (
    <div className="font-mono text-sm">
      {tree.children.size === 0 && tree.results.length === 0 ? (
        <div className="text-center text-[var(--text-secondary)] py-8">
          No results to display in tree view
        </div>
      ) : (
        <>
          {/* Render root-level results */}
          {tree.results.map((result: any) => (
            <div
              key={result.originalIndex}
              onClick={() => onSelectResult(result.originalIndex)}
              className={`flex items-center py-2 px-3 hover:bg-[var(--bg-secondary)]/50 rounded cursor-pointer transition-all ${
                selectedResult === result.originalIndex ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''
              }`}
            >
              <span className={`w-6 h-6 flex items-center justify-center font-bold text-sm mr-3 ${getTypeColor(result.dataType)}`}>
                {getTypeIcon(result.dataType)}
              </span>
              <div className="flex-1">
                <span className="font-mono text-sm">
                  {result.key}: {typeof result.value === 'object' ? JSON.stringify(result.value).substring(0, 50) + '...' : String(result.value)}
                </span>
              </div>
            </div>
          ))}
          
          {/* Render tree */}
          {Array.from(tree.children.entries()).map(([key, node]) => 
            renderTreeNode(node, key, 0)
          )}
        </>
      )}
    </div>
  );
};

const SearchView: React.FC<SearchViewProps> = ({ json }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [allPaths, setAllPaths] = useState<string[]>([]);
  const [wordFrequencies, setWordFrequencies] = useState<WordFrequency[]>([]);
  const [selectedResult, setSelectedResult] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'tree' | 'visual'>('list');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Filters
  const [activeFilters, setActiveFilters] = useState({
    strings: true,
    numbers: true,
    booleans: true,
    objects: true,
    arrays: true,
    nulls: true,
  });
  
  // Advanced Filters
  const [searchMode, setSearchMode] = useState<SearchMode>('contains');
  const [searchTarget, setSearchTarget] = useState<SearchTarget>('both');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [maxDepth, setMaxDepth] = useState<number>(-1);
  const [minLength, setMinLength] = useState<number>(0);
  const [maxLength, setMaxLength] = useState<number>(-1);
  const [pathPattern, setPathPattern] = useState('');
  const [excludePattern, setExcludePattern] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [regexError, setRegexError] = useState<string>('');
  const [dataInsights, setDataInsights] = useState({
    totalKeys: 0,
    totalValues: 0,
    maxDepth: 0,
    dataTypes: {} as Record<string, number>,
  });

  // Analyze JSON structure on mount
  useEffect(() => {
    if (json) {
      analyzeJsonStructure();
    }
  }, [json]);

  // Real-time search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch();
        if (!searchHistory.includes(searchQuery)) {
          setSearchHistory(prev => [searchQuery, ...prev].slice(0, 10));
        }
      } else {
        setSearchResults([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFilters, searchMode, searchTarget, caseSensitive, maxDepth, minLength, maxLength, pathPattern, excludePattern]);

  const analyzeJsonStructure = () => {
    setIsAnalyzing(true);
    const paths: string[] = [];
    const words: Record<string, number> = {};
    const typeCount: Record<string, number> = {};
    let totalKeys = 0;
    let totalValues = 0;
    let maxDepthFound = 0;

    const analyze = (obj: any, path: string = '', depth: number = 0) => {
      maxDepthFound = Math.max(maxDepthFound, depth);

      if (Array.isArray(obj)) {
        typeCount.array = (typeCount.array || 0) + 1;
        obj.forEach((item, index) => {
          analyze(item, `${path}[${index}]`, depth + 1);
        });
      } else if (obj && typeof obj === 'object') {
        typeCount.object = (typeCount.object || 0) + 1;
        Object.entries(obj).forEach(([key, value]) => {
          totalKeys++;
          paths.push(`${path}${path ? '.' : ''}${key}`);
          
          // Extract words for frequency analysis
          key.split(/[^a-zA-Z0-9]+/).forEach(word => {
            if (word.length > 2) {
              words[word.toLowerCase()] = (words[word.toLowerCase()] || 0) + 1;
            }
          });

          if (typeof value === 'string') {
            totalValues++;
            typeCount.string = (typeCount.string || 0) + 1;
            value.split(/[^a-zA-Z0-9]+/).forEach(word => {
              if (word.length > 2) {
                words[word.toLowerCase()] = (words[word.toLowerCase()] || 0) + 1;
              }
            });
          } else if (typeof value === 'number') {
            totalValues++;
            typeCount.number = (typeCount.number || 0) + 1;
          } else if (typeof value === 'boolean') {
            totalValues++;
            typeCount.boolean = (typeCount.boolean || 0) + 1;
          } else if (value === null) {
            totalValues++;
            typeCount.null = (typeCount.null || 0) + 1;
          }

          analyze(value, `${path}${path ? '.' : ''}${key}`, depth + 1);
        });
      }
    };

    analyze(json);

    // Calculate word frequencies
    const totalWords = Object.values(words).reduce((a, b) => a + b, 0);
    const frequencies = Object.entries(words)
      .map(([word, count]) => ({
        word,
        count,
        percentage: (count / totalWords) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    setAllPaths(paths);
    setWordFrequencies(frequencies);
    setDataInsights({
      totalKeys,
      totalValues,
      maxDepth: maxDepthFound,
      dataTypes: typeCount,
    });
    setIsAnalyzing(false);
  };

  const testRegex = (pattern: string): RegExp | null => {
    try {
      return new RegExp(pattern, caseSensitive ? 'g' : 'gi');
    } catch (e) {
      setRegexError(e instanceof Error ? e.message : 'Invalid regex');
      return null;
    }
  };

  const matchesSearch = (text: string, query: string): boolean => {
    const targetText = caseSensitive ? text : text.toLowerCase();
    const searchText = caseSensitive ? query : query.toLowerCase();

    switch (searchMode) {
      case 'exact':
        return targetText === searchText;
      case 'starts':
        return targetText.startsWith(searchText);
      case 'ends':
        return targetText.endsWith(searchText);
      case 'regex':
        const regex = testRegex(query);
        return regex ? regex.test(text) : false;
      case 'contains':
      default:
        return targetText.includes(searchText);
    }
  };

  const performSearch = () => {
    if (!json || !searchQuery.trim()) {
      setSearchResults([]);
      setRegexError('');
      return;
    }

    // Clear regex error if not in regex mode
    if (searchMode !== 'regex') {
      setRegexError('');
    }

    const results: SearchResult[] = [];
    const query = searchQuery;

    // Test regex validity if in regex mode
    if (searchMode === 'regex') {
      const regex = testRegex(query);
      if (!regex) return;
    }

    // Compile path pattern regex if provided
    let pathRegex: RegExp | null = null;
    if (pathPattern) {
      try {
        pathRegex = new RegExp(pathPattern, 'i');
      } catch {
        // Invalid path pattern, skip
      }
    }

    // Compile exclude pattern regex if provided
    let excludeRegex: RegExp | null = null;
    if (excludePattern) {
      try {
        excludeRegex = new RegExp(excludePattern, 'i');
      } catch {
        // Invalid exclude pattern, skip
      }
    }

    const search = (obj: any, path: string = '', depth: number = 0) => {
      // Check max depth
      if (maxDepth !== -1 && depth > maxDepth) return;

      // Check path pattern
      if (pathRegex && !pathRegex.test(path)) return;

      // Check exclude pattern
      if (excludeRegex && excludeRegex.test(path)) return;

      if (Array.isArray(obj)) {
        if (!activeFilters.arrays) return;
        obj.forEach((item, index) => {
          search(item, `${path}[${index}]`, depth + 1);
        });
      } else if (obj && typeof obj === 'object') {
        if (!activeFilters.objects) return;
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = `${path}${path ? '.' : ''}${key}`;
          let keyMatch = false;
          let valueMatch = false;
          let dataType = 'unknown';

          // Check if we should search in keys
          if (searchTarget === 'both' || searchTarget === 'keys') {
            keyMatch = matchesSearch(key, query);
          }

          // Check if we should search in values
          if (searchTarget === 'both' || searchTarget === 'values') {
            if (typeof value === 'string') {
              if (!activeFilters.strings) return;
              
              // Check length filters
              if (minLength > 0 && value.length < minLength) return;
              if (maxLength !== -1 && value.length > maxLength) return;
              
              valueMatch = matchesSearch(value, query);
              dataType = 'string';
            } else if (typeof value === 'number') {
              if (!activeFilters.numbers) return;
              valueMatch = matchesSearch(String(value), query);
              dataType = 'number';
            } else if (typeof value === 'boolean') {
              if (!activeFilters.booleans) return;
              valueMatch = matchesSearch(String(value), query);
              dataType = 'boolean';
            } else if (value === null) {
              if (!activeFilters.nulls) return;
              valueMatch = matchesSearch('null', query);
              dataType = 'null';
            } else if (Array.isArray(value)) {
              dataType = 'array';
            } else if (typeof value === 'object') {
              dataType = 'object';
            }
          }

          if (keyMatch || valueMatch) {
            results.push({
              type: keyMatch && valueMatch ? 'both' : keyMatch ? 'key' : 'value',
              path: currentPath,
              key,
              value,
              depth,
              dataType,
            });
          }

          if (typeof value === 'object' && value !== null) {
            search(value, currentPath, depth + 1);
          }
        });
      }
    };

    search(json);
    setSearchResults(results);
  };

  const getSuggestions = useMemo(() => {
    if (!searchQuery) return [];
    
    const query = searchQuery.toLowerCase();
    const pathSuggestions = allPaths
      .filter(path => path.toLowerCase().includes(query))
      .slice(0, 5);
    
    const wordSuggestions = wordFrequencies
      .filter(w => w.word.startsWith(query))
      .slice(0, 5)
      .map(w => w.word);
    
    return Array.from(new Set([...pathSuggestions, ...wordSuggestions])).slice(0, 8);
  }, [searchQuery, allPaths, wordFrequencies]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedResult(null);
    setRegexError('');
  };

  const resetFilters = () => {
    setSearchMode('contains');
    setSearchTarget('both');
    setCaseSensitive(false);
    setMaxDepth(-1);
    setMinLength(0);
    setMaxLength(-1);
    setPathPattern('');
    setExcludePattern('');
    setActiveFilters({
      strings: true,
      numbers: true,
      booleans: true,
      objects: true,
      arrays: true,
      nulls: true,
    });
  };

  const toggleFilter = (filterKey: keyof typeof activeFilters) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string': return '"';
      case 'number': return '#';
      case 'boolean': return '⊤';
      case 'object': return '{}';
      case 'array': return '[]';
      case 'null': return '∅';
      default: return '?';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'text-green-500 bg-green-500/10';
      case 'number': return 'text-blue-500 bg-blue-500/10';
      case 'boolean': return 'text-purple-500 bg-purple-500/10';
      case 'object': return 'text-orange-500 bg-orange-500/10';
      case 'array': return 'text-yellow-500 bg-yellow-500/10';
      case 'null': return 'text-gray-500 bg-gray-500/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const highlightMatch = (text: string) => {
    if (!searchQuery || searchMode === 'regex') return text;
    
    const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="bg-yellow-400/30 text-yellow-900 dark:bg-yellow-400/20 dark:text-yellow-300 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportResults = () => {
    const data = {
      query: searchQuery,
      mode: searchMode,
      filters: {
        target: searchTarget,
        caseSensitive,
        maxDepth,
        minLength,
        maxLength,
        pathPattern,
        excludePattern,
        dataTypes: activeFilters,
      },
      timestamp: new Date().toISOString(),
      resultsCount: searchResults.length,
      results: searchResults.map(r => ({
        path: r.path,
        key: r.key,
        value: r.value,
        type: r.type,
        dataType: r.dataType,
        depth: r.depth,
      })),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-secondary)]">
      {/* Modern Header */}
      <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {mounted ? t('search.smartSearch') : 'Smart Search & Discovery'}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {dataInsights.totalKeys} {mounted ? t('search.keys') : 'keys'} • {dataInsights.totalValues} {mounted ? t('search.values') : 'values'} • {mounted ? t('search.depth') : 'Depth'}: {dataInsights.maxDepth}
            </p>
          </div>
          <div className="flex gap-2">
            {['list', 'tree', 'visual'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === mode 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-[var(--text-secondary)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={mounted ? t('search.placeholder') : 'Search keys or values...'}
              className="w-full pl-12 pr-24 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-14 p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {searchResults.length > 0 && (
              <button
                onClick={exportResults}
                className="absolute right-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg transition-all"
              >
                Export
              </button>
            )}
          </div>

          {/* Regex Error */}
          {regexError && searchMode === 'regex' && (
            <div className="absolute mt-1 text-xs text-red-500">
              Regex Error: {regexError}
            </div>
          )}

          {/* Search Suggestions */}
          {showSuggestions && getSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] shadow-2xl overflow-hidden">
              <div className="p-2">
                <p className="text-xs text-[var(--text-secondary)] px-3 py-1">Suggestions</p>
                {getSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-sm text-[var(--text-primary)]">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm text-[var(--text-secondary)]">Filter:</span>
          {Object.entries(activeFilters).map(([key, active]) => (
            <button
              key={key}
              onClick={() => toggleFilter(key as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                active 
                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30' 
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-transparent opacity-50'
              }`}
            >
              <span className="text-lg">{getTypeIcon(key.slice(0, -1))}</span>
              <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Advanced
              <svg className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {(searchMode !== 'contains' || searchTarget !== 'both' || caseSensitive || maxDepth !== -1 || minLength > 0 || maxLength !== -1 || pathPattern || excludePattern) && (
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mt-4 p-4 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Search Mode */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Search Mode</label>
                <select
                  value={searchMode}
                  onChange={(e) => setSearchMode(e.target.value as SearchMode)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm"
                >
                  <option value="contains">Contains</option>
                  <option value="exact">Exact Match</option>
                  <option value="starts">Starts With</option>
                  <option value="ends">Ends With</option>
                  <option value="regex">Regular Expression</option>
                </select>
              </div>

              {/* Search Target */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Search In</label>
                <select
                  value={searchTarget}
                  onChange={(e) => setSearchTarget(e.target.value as SearchTarget)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm"
                >
                  <option value="both">Keys & Values</option>
                  <option value="keys">Keys Only</option>
                  <option value="values">Values Only</option>
                </select>
              </div>

              {/* Max Depth */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Max Depth</label>
                <input
                  type="number"
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(parseInt(e.target.value) || -1)}
                  placeholder="-1 for unlimited"
                  min="-1"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm"
                />
              </div>

              {/* Case Sensitive */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Options</label>
                <div className="flex items-center h-[38px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={caseSensitive}
                      onChange={(e) => setCaseSensitive(e.target.checked)}
                      className="rounded border-[var(--border-color)]"
                    />
                    <span className="text-sm text-[var(--text-primary)]">{mounted ? t('search.caseSensitive') : 'Case Sensitive'}</span>
                  </label>
                </div>
              </div>

              {/* String Length Filters */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Min String Length</label>
                <input
                  type="number"
                  value={minLength}
                  onChange={(e) => setMinLength(parseInt(e.target.value) || 0)}
                  placeholder="0 for no minimum"
                  min="0"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Max String Length</label>
                <input
                  type="number"
                  value={maxLength}
                  onChange={(e) => setMaxLength(parseInt(e.target.value) || -1)}
                  placeholder="-1 for no maximum"
                  min="-1"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm"
                />
              </div>

              {/* Path Pattern */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Path Pattern (Regex)</label>
                <input
                  type="text"
                  value={pathPattern}
                  onChange={(e) => setPathPattern(e.target.value)}
                  placeholder="e.g., user\\..*"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm font-mono"
                />
              </div>

              {/* Exclude Pattern */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Exclude Pattern (Regex)</label>
                <input
                  type="text"
                  value={excludePattern}
                  onChange={(e) => setExcludePattern(e.target.value)}
                  placeholder="e.g., \\._id$"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm font-mono"
                />
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <div className="flex flex-wrap gap-2">
                {searchMode !== 'contains' && (
                  <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-xs">
                    Mode: {searchMode}
                  </span>
                )}
                {searchTarget !== 'both' && (
                  <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs">
                    Target: {searchTarget}
                  </span>
                )}
                {caseSensitive && (
                  <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-500 text-xs">
                    {mounted ? t('search.caseSensitive') : 'Case Sensitive'}
                  </span>
                )}
                {maxDepth !== -1 && (
                  <span className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-500 text-xs">
                    Max Depth: {maxDepth}
                  </span>
                )}
                {minLength > 0 && (
                  <span className="px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-500 text-xs">
                    Min Length: {minLength}
                  </span>
                )}
                {maxLength !== -1 && (
                  <span className="px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-500 text-xs">
                    Max Length: {maxLength}
                  </span>
                )}
                {pathPattern && (
                  <span className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-500 text-xs font-mono">
                    Path: {pathPattern}
                  </span>
                )}
                {excludePattern && (
                  <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-500 text-xs font-mono">
                    Exclude: {excludePattern}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Main Results */}
        <div className="flex-1 overflow-auto p-6">
          {searchResults.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {searchResults.length} Result{searchResults.length !== 1 ? 's' : ''}
                </h3>
                <div className="flex gap-2 text-sm">
                  {searchHistory.length > 0 && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Recent: {searchHistory.length}
                    </div>
                  )}
                </div>
              </div>

              {viewMode === 'tree' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 p-4 max-h-[60vh] overflow-auto">
                    <TreeResultView results={searchResults} onSelectResult={setSelectedResult} selectedResult={selectedResult} />
                  </div>
                  
                  {selectedResult !== null && searchResults[selectedResult] && (
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Selected Result Details</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-secondary)]">Path:</span>
                          <code className="text-xs bg-[var(--bg-primary)] px-2 py-1 rounded">
                            {searchResults[selectedResult].path}
                          </code>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-secondary)]">Type:</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            searchResults[selectedResult].type === 'key' ? 'bg-blue-500/10 text-blue-500' : 
                            searchResults[selectedResult].type === 'value' ? 'bg-green-500/10 text-green-500' : 
                            'bg-purple-500/10 text-purple-500'
                          }`}>
                            {searchResults[selectedResult].type.toUpperCase()}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)]">
                            Data: {searchResults[selectedResult].dataType}
                          </span>
                        </div>
                        {typeof searchResults[selectedResult].value === 'object' && searchResults[selectedResult].value !== null && (
                          <div className="mt-3">
                            <span className="text-xs text-[var(--text-secondary)]">Value:</span>
                            <pre className="mt-2 p-3 bg-[var(--bg-primary)] rounded text-xs overflow-x-auto">
                              {JSON.stringify(searchResults[selectedResult].value, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'list' && searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedResult(index)}
                  className={`group relative rounded-xl border transition-all cursor-pointer overflow-hidden ${
                    selectedResult === index 
                      ? 'border-blue-500 bg-blue-500/5 shadow-lg' 
                      : 'border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 hover:border-blue-500/50 hover:shadow-md'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${getTypeColor(result.dataType)}`}>
                          {getTypeIcon(result.dataType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              result.type === 'key' ? 'bg-blue-500/10 text-blue-500' : 
                              result.type === 'value' ? 'bg-green-500/10 text-green-500' : 
                              'bg-purple-500/10 text-purple-500'
                            }`}>
                              {result.type.toUpperCase()}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                              Depth: {result.depth}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
                            {result.path}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(result.path);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>
                    <div className="font-mono text-sm bg-[var(--bg-primary)] rounded-lg p-3 mt-3">
                      <span className="text-[var(--json-key)]">
                        {result.type !== 'value' ? highlightMatch(result.key) : `"${result.key}"`}
                      </span>
                      <span className="text-[var(--text-secondary)]">: </span>
                      {typeof result.value === 'object' && result.value !== null ? (
                        <span className="text-[var(--text-secondary)]">
                          {Array.isArray(result.value) ? `[${result.value.length} items]` : `{${Object.keys(result.value).length} keys}`}
                        </span>
                      ) : (
                        <span className={
                          typeof result.value === 'string' ? 'text-green-500' :
                          typeof result.value === 'number' ? 'text-blue-500' :
                          typeof result.value === 'boolean' ? 'text-purple-500' :
                          'text-gray-500'
                        }>
                          {typeof result.value === 'string' 
                            ? `"${result.type !== 'key' ? highlightMatch(result.value) : result.value}"` 
                            : String(result.value)}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedResult === index && typeof result.value === 'object' && result.value !== null && (
                    <div className="border-t border-[var(--border-color)] p-4 bg-[var(--bg-primary)]/50">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(result.value, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}

              {viewMode === 'visual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Word Cloud */}
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 p-4">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Word Frequency</h4>
                    <div className="flex flex-wrap gap-2">
                      {wordFrequencies.slice(0, 20).map((word, i) => (
                        <button
                          key={i}
                          onClick={() => setSearchQuery(word.word)}
                          className="px-3 py-1 rounded-lg hover:scale-105 transition-transform cursor-pointer"
                          style={{
                            fontSize: `${Math.max(12, Math.min(24, word.percentage * 3))}px`,
                            background: `linear-gradient(135deg, rgba(59, 130, 246, ${word.percentage / 100}) 0%, rgba(147, 51, 234, ${word.percentage / 100}) 100%)`,
                            color: word.percentage > 5 ? 'white' : 'var(--text-primary)',
                          }}
                        >
                          {word.word}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Data Type Distribution */}
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 p-4">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Data Types</h4>
                    <div className="space-y-2">
                      {Object.entries(dataInsights.dataTypes).map(([type, count]) => {
                        const percentage = (count / Object.values(dataInsights.dataTypes).reduce((a, b) => a + b, 0)) * 100;
                        return (
                          <div key={type} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${getTypeColor(type)}`}>
                              {getTypeIcon(type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-[var(--text-primary)]">{type}</span>
                                <span className="text-xs text-[var(--text-secondary)]">{count}</span>
                              </div>
                              <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : searchQuery ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-[var(--text-primary)]">No results found</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center mb-6 animate-pulse">
                <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Ready to Search</h3>
              <p className="text-sm text-[var(--text-secondary)] text-center max-w-md">
                Start typing to search through your JSON data. Use filters to refine results.
              </p>
              {searchHistory.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs text-[var(--text-secondary)] mb-2">Recent searches:</p>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.slice(0, 5).map((term, i) => (
                      <button
                        key={i}
                        onClick={() => setSearchQuery(term)}
                        className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side Panel - Insights */}
        {viewMode === 'list' && wordFrequencies.length > 0 && (
          <div className="w-80 border-l border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 p-6 overflow-auto">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{mounted ? t('search.quickInsights') : 'Quick Insights'}</h3>
            
            {/* Top Words */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">{mounted ? t('search.topWords') : 'Top Words'}</h4>
              <div className="space-y-2">
                {wordFrequencies.slice(0, 10).map((word, i) => (
                  <button
                    key={i}
                    onClick={() => setSearchQuery(word.word)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group"
                  >
                    <span className="text-sm text-[var(--text-primary)]">{word.word}</span>
                    <span className="text-xs text-[var(--text-secondary)] group-hover:text-blue-500">
                      {word.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Paths */}
            {allPaths.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">{mounted ? t('search.samplePaths') : 'Sample Paths'}</h4>
                <div className="space-y-1">
                  {allPaths.slice(0, 8).map((path, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchQuery(path)}
                      className="w-full text-left p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <p className="text-xs font-mono text-[var(--text-primary)] truncate">{path}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;