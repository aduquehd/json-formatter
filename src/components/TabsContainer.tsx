'use client';

import React from 'react';

interface TabsContainerProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'formatted', label: 'JSON Editor' },
  { id: 'tree', label: 'Tree View' },
  { id: 'graph', label: 'Graph View', beta: true },
  { id: 'stats', label: 'Statistics' },
  { id: 'diff', label: 'Diff View' },
  { id: 'chart', label: 'Charts', beta: true },
  { id: 'search', label: 'Search & Filter' },
  { id: 'map', label: 'Map View', beta: true },
];

const TabsContainer: React.FC<TabsContainerProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex items-center gap-1 mb-2 border-b border-[var(--tabs-border)] overflow-x-auto">
      {tabs.slice(0, 4).map((tab) => {
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-tab`}
          >
            {tab.label}
            {tab.beta && <span className="beta-badge">Beta</span>}
          </button>
        );
      })}
      <div className="tab-separator" />
      {tabs.slice(4).map((tab) => {
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-tab`}
          >
            {tab.label}
            {tab.beta && <span className="beta-badge">Beta</span>}
          </button>
        );
      })}
    </div>
  );
};

export default TabsContainer;