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
  const [isUpdatingFromTree, setIsUpdatingFromTree] = useState(false);
  const [preservedExpandedState, setPreservedExpandedState] = useState<Set<string> | null>(null);
  const prevJsonRef = useRef<string>('');

  useEffect(() => {
    // Handle null/undefined json
    if (!json) {
      prevJsonRef.current = '';
      setIsInitialized(false);
      setExpandedNodes(new Set());
      return;
    }
    
    // Skip auto-expand if this is an update from the tree itself
    if (isUpdatingFromTree) {
      // Restore preserved expanded state if available
      if (preservedExpandedState) {
        setExpandedNodes(preservedExpandedState);
        setPreservedExpandedState(null);
      }
      setIsUpdatingFromTree(false);
      return;
    }
    
    // Only auto-expand when JSON actually changes from external source
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
  }, [json, isUpdatingFromTree, preservedExpandedState]);

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

  const startKeyEdit = (path: string, key: string) => {
    setEditingNode(`${path}_key`);
    setEditValue(key);
  };

  const saveEdit = () => {
    if (editingNode && json) {
      try {
        // Save current expanded state before any modifications
        const currentExpandedNodes = new Set(expandedNodes);
        
        // Deep clone to ensure no mutations to original
        const newJson = JSON.parse(JSON.stringify(json));
        
        if (editingNode.endsWith('_key')) {
          // Handle key editing
          const path = editingNode.replace('_key', '');
          const pathParts = path.split(/\.|\[|\]/).filter(Boolean).slice(1);
          
          // Navigate to parent object
          let parent = newJson;
          let grandParent = null;
          let grandParentKey = null;
          
          for (let i = 0; i < pathParts.length - 1; i++) {
            grandParent = parent;
            grandParentKey = pathParts[i];
            parent = parent[pathParts[i]];
          }
          
          const oldKey = pathParts[pathParts.length - 1];
          if (editValue !== oldKey && !Array.isArray(parent)) {
            // Create new object with preserved key order
            const orderedObj: any = {};
            const keys = Object.keys(parent);
            
            keys.forEach(k => {
              if (k === oldKey) {
                orderedObj[editValue] = parent[oldKey];
              } else {
                orderedObj[k] = parent[k];
              }
            });
            
            // Replace the parent object in the tree
            if (grandParent && grandParentKey) {
              grandParent[grandParentKey] = orderedObj;
            } else {
              // If we're at the root level
              Object.keys(newJson).forEach(k => delete newJson[k]);
              Object.assign(newJson, orderedObj);
            }
            
            // Update expanded node paths for renamed keys
            const updatedExpandedNodes = new Set<string>();
            currentExpandedNodes.forEach(nodePath => {
              if (nodePath.includes(path)) {
                const newPath = nodePath.replace(
                  new RegExp(`\\.${oldKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\.|\\[)`),
                  `.${editValue}$1`
                );
                updatedExpandedNodes.add(newPath);
              } else {
                updatedExpandedNodes.add(nodePath);
              }
            });
            setPreservedExpandedState(updatedExpandedNodes);
          } else {
            // Key didn't change, preserve current state
            setPreservedExpandedState(currentExpandedNodes);
          }
        } else {
          // Handle value editing
          const pathParts = editingNode.split(/\.|\[|\]/).filter(Boolean).slice(1);
          
          // Navigate to the target location
          let current = newJson;
          let parent = null;
          let parentKey = null;
          
          for (let i = 0; i < pathParts.length - 1; i++) {
            parent = current;
            parentKey = pathParts[i];
            current = current[pathParts[i]];
          }
          
          const lastKey = pathParts[pathParts.length - 1];
          const oldValue = current[lastKey];
          
          // Parse new value
          let newValue;
          try {
            newValue = JSON.parse(editValue);
          } catch {
            newValue = editValue;
          }
          
          // If updating a value in an object, preserve key order
          if (parent && parentKey !== null && !Array.isArray(current)) {
            const orderedObj: any = {};
            Object.keys(current).forEach(k => {
              if (k === lastKey) {
                orderedObj[k] = newValue;
              } else {
                orderedObj[k] = current[k];
              }
            });
            parent[parentKey] = orderedObj;
          } else {
            // Direct assignment for arrays or root level
            current[lastKey] = newValue;
          }
          
          // Always preserve expanded state for value edits
          setPreservedExpandedState(currentExpandedNodes);
        }
        
        // Mark update as coming from tree and trigger update
        setIsUpdatingFromTree(true);
        onUpdate(JSON.stringify(newJson, null, 2));
        setEditingNode(null);
      } catch (error) {
        console.error('Failed to save edit:', error);
        setEditingNode(null);
      }
    }
  };

  const cancelEdit = () => {
    setEditingNode(null);
    setEditValue('');
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
            if (e.key === 'Enter') {
              e.preventDefault();
              saveEdit();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              cancelEdit();
            }
          }}
          onClick={(e) => e.stopPropagation()}
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
                startKeyEdit(path, key);
              }}
              style={{ cursor: 'pointer' }}
            >
              {editingNode === `${path}_key` ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveEdit();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelEdit();
                    }
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
        <div className="tree-controls-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="edit-hint">
            <Pencil className="w-4 h-4 inline-block mr-1" />
            <span className="edit-text">Click on any value or key to edit directly</span>
          </div>
          <div className="tree-buttons" style={{ display: 'flex', gap: '8px' }}>
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