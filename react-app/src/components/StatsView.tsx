'use client';

import React from 'react';

interface StatsViewProps {
  json: any;
}

const StatsView: React.FC<StatsViewProps> = ({ json }) => {
  const calculateStats = () => {
    if (!json) return null;

    const stats = {
      totalKeys: 0,
      totalValues: 0,
      stringCount: 0,
      numberCount: 0,
      booleanCount: 0,
      nullCount: 0,
      arrayCount: 0,
      objectCount: 0,
      maxDepth: 0,
      totalSize: JSON.stringify(json).length,
    };

    const analyze = (obj: any, depth: number = 0) => {
      if (depth > stats.maxDepth) stats.maxDepth = depth;

      if (Array.isArray(obj)) {
        stats.arrayCount++;
        obj.forEach(item => analyze(item, depth + 1));
      } else if (obj && typeof obj === 'object') {
        stats.objectCount++;
        Object.entries(obj).forEach(([key, value]) => {
          stats.totalKeys++;
          stats.totalValues++;
          
          if (value === null) {
            stats.nullCount++;
          } else if (typeof value === 'string') {
            stats.stringCount++;
          } else if (typeof value === 'number') {
            stats.numberCount++;
          } else if (typeof value === 'boolean') {
            stats.booleanCount++;
          } else if (typeof value === 'object') {
            analyze(value, depth + 1);
          }
        });
      }
    };

    analyze(json);
    return stats;
  };

  const stats = calculateStats();

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">No JSON data to analyze</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <h2 className="text-xl font-bold mb-6">JSON Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Total Size</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {(stats.totalSize / 1024).toFixed(2)} KB
          </div>
        </div>
        
        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Total Keys</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalKeys}</div>
        </div>
        
        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Max Depth</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.maxDepth}</div>
        </div>
        
        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Strings</div>
          <div className="text-2xl font-bold text-[var(--tree-string)]">{stats.stringCount}</div>
        </div>
        
        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Numbers</div>
          <div className="text-2xl font-bold text-[var(--tree-number)]">{stats.numberCount}</div>
        </div>
        
        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Booleans</div>
          <div className="text-2xl font-bold text-[var(--tree-boolean)]">{stats.booleanCount}</div>
        </div>
        
        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Null Values</div>
          <div className="text-2xl font-bold text-[var(--tree-null)]">{stats.nullCount}</div>
        </div>
        
        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Arrays</div>
          <div className="text-2xl font-bold text-[var(--tree-array)]">{stats.arrayCount}</div>
        </div>
        
        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Objects</div>
          <div className="text-2xl font-bold text-[var(--tree-object)]">{stats.objectCount}</div>
        </div>
      </div>
    </div>
  );
};

export default StatsView;