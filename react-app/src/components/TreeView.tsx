'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Plus, Minus } from 'lucide-react';

interface TreeViewProps {
  json: any;
  onUpdate: (newContent: string) => void;
}

const TreeView: React.FC<TreeViewProps> = ({ json, onUpdate }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const prevJsonRef = useRef<string>('');

  useEffect(() => {
    // Handle null/undefined json
    if (!json) {
      prevJsonRef.current = '';
      setIsInitialized(false);
      setExpandedNodes(new Set());
      return;
    }
    
    // Only auto-expand when JSON actually changes
    const jsonString = JSON.stringify(json);
    if (jsonString !== prevJsonRef.current) {
      prevJsonRef.current = jsonString;
      
      // Only auto-expand on new JSON (when not initialized or completely new content)
      if (!isInitialized) {
        const firstLevel = new Set<string>();
        // Expand root level
        Object.keys(json).forEach((key, index) => {
          if (index < 10) { // Expand first 10 items
            firstLevel.add(`root.${key}`);
          }
        });
        // Also expand second level for first few items
        Object.entries(json).forEach(([key, value], index) => {
          if (index < 3 && value && typeof value === 'object') {
            if (Array.isArray(value)) {
              value.forEach((_, subIndex) => {
                if (subIndex < 3) {
                  firstLevel.add(`root.${key}[${subIndex}]`);
                }
              });
            } else {
              Object.keys(value).forEach((subKey, subIndex) => {
                if (subIndex < 3) {
                  firstLevel.add(`root.${key}.${subKey}`);
                }
              });
            }
          }
        });
        setExpandedNodes(firstLevel);
        setIsInitialized(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json]);

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    if (!json) return;
    
    const allPaths = new Set<string>();
    const collectPaths = (obj: any, parentPath: string = '') => {
      if (obj && typeof obj === 'object') {
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            const currentPath = parentPath ? `${parentPath}[${index}]` : `root[${index}]`;
            allPaths.add(currentPath);
            collectPaths(item, currentPath);
          });
        } else {
          Object.keys(obj).forEach((key) => {
            const currentPath = parentPath ? `${parentPath}.${key}` : `root.${key}`;
            allPaths.add(currentPath);
            collectPaths(obj[key], currentPath);
          });
        }
      }
    };
    
    // Start collecting from root level
    Object.keys(json).forEach((key) => {
      const path = `root.${key}`;
      allPaths.add(path);
      collectPaths(json[key], path);
    });
    
    setExpandedNodes(allPaths);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const startEdit = (path: string, value: any) => {
    setEditingNode(path);
    setEditValue(typeof value === 'object' ? JSON.stringify(value) : String(value));
  };

  const saveEdit = () => {
    if (editingNode && json) {
      try {
        const newJson = JSON.parse(JSON.stringify(json));
        const pathParts = editingNode.split(/\.|\[|\]/).filter(Boolean).slice(1);
        let current = newJson;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          current = current[pathParts[i]];
        }
        
        const lastKey = pathParts[pathParts.length - 1];
        try {
          current[lastKey] = JSON.parse(editValue);
        } catch {
          current[lastKey] = editValue;
        }
        
        onUpdate(JSON.stringify(newJson, null, 2));
        setEditingNode(null);
      } catch (error) {
        console.error('Failed to save edit:', error);
      }
    }
  };

  const getValueColor = (val: any) => {
    if (typeof val === 'string') return 'tree-string';
    if (typeof val === 'number') return 'tree-number';
    if (typeof val === 'boolean') return 'tree-boolean';
    if (val === null) return 'tree-null';
    if (Array.isArray(val)) return 'tree-array';
    if (typeof val === 'object') return 'tree-object';
    return '';
  };

  const renderValue = (value: any, path: string) => {
    if (editingNode === path) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') setEditingNode(null);
          }}
          className="tree-edit-input"
          autoFocus
        />
      );
    }

    if (value === null) {
      return (
        <span 
          className="tree-value tree-null"
          onClick={(e) => {
            e.stopPropagation();
            startEdit(path, value);
          }}
        >
          null
        </span>
      );
    }

    if (typeof value !== 'object') {
      return (
        <span 
          className={`tree-value ${getValueColor(value)}`}
          onClick={(e) => {
            e.stopPropagation();
            startEdit(path, value);
          }}
        >
          {typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
      );
    }

    // For objects and arrays, show type and count
    if (Array.isArray(value)) {
      return <span className="tree-value tree-array">[{value.length}]</span>;
    } else {
      return <span className="tree-value tree-object">{`{${Object.keys(value).length}}`}</span>;
    }
  };

  const renderNode = (key: string, value: any, path: string, level: number = 0, isArrayItem: boolean = false) => {
    const isExpanded = expandedNodes.has(path);
    const isExpandable = value && typeof value === 'object';
    const hasChildren = isExpandable && (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0);

    const handleLineClick = (e: React.MouseEvent) => {
      // Only toggle if clicking on the line itself, not on editable elements
      if (isExpandable && !(e.target as HTMLElement).classList.contains('tree-edit-input')) {
        e.stopPropagation();
        toggleNode(path);
      }
    };

    return (
      <div key={path} className="tree-node" style={{ marginLeft: `${level * 20}px` }}>
        <div 
          className={`tree-node-header ${isExpandable ? 'expandable' : ''}`}
          onClick={handleLineClick}
          style={{ cursor: isExpandable ? 'pointer' : 'default' }}
        >
          {isExpandable ? (
            <span
              className="tree-toggle"
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          ) : (
            <span className="tree-spacer"></span>
          )}
          
          {!isArrayItem ? (
            <span 
              className="tree-key"
              onClick={(e) => {
                e.stopPropagation();
                editingNode !== `${path}_key` && setEditingNode(`${path}_key`);
              }}
            >
              {editingNode === `${path}_key` ? (
                <input
                  type="text"
                  value={editValue || key}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => setEditingNode(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') setEditingNode(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="tree-edit-input tree-edit-key"
                  autoFocus
                />
              ) : (
                `"${key}"`
              )}
              : 
            </span>
          ) : (
            <span className="tree-key">[{key}]: </span>
          )}
          
          {renderValue(value, path)}
        </div>
        
        {isExpandable && isExpanded && hasChildren && (
          <div className="tree-children">
            {Array.isArray(value) 
              ? value.map((item, index) => 
                  renderNode(String(index), item, `${path}[${index}]`, level + 1, true)
                )
              : Object.entries(value).map(([childKey, childValue]) => 
                  renderNode(childKey, childValue, `${path}.${childKey}`, level + 1, false)
                )
            }
          </div>
        )}
      </div>
    );
  };

  if (!json) {
    return (
      <div className="tree-view-container">
        <div className="tree-output flex items-center justify-center">
          <p className="text-[var(--text-secondary)]">No valid JSON to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tree-view-container">
      <div className="tree-controls">
        <div className="tree-controls-left">
          <div className="edit-hint">
            <Pencil className="w-4 h-4 inline-block mr-1" />
            <span className="edit-text">Click on any value or key to edit directly</span>
          </div>
          <div className="tree-buttons">
            <button
              onClick={expandAll}
              className="tree-control-btn"
              aria-label="Expand all tree nodes"
            >
              <Plus className="w-4 h-4 inline-block mr-1" />
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="tree-control-btn"
              aria-label="Collapse all tree nodes"
            >
              <Minus className="w-4 h-4 inline-block mr-1" />
              Collapse All
            </button>
          </div>
        </div>
      </div>
      
      <div className="tree-output">
        {Object.entries(json).map(([key, value]) => 
          renderNode(key, value, `root.${key}`)
        )}
      </div>
    </div>
  );
};

export default TreeView;