'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface TabsContainerProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}


const TabsContainer: React.FC<TabsContainerProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { id: 'formatted', label: mounted ? t('tabs.editor') : 'JSON Editor' },
    { id: 'tree', label: mounted ? t('tabs.tree') : 'Tree View' },
    { id: 'graph', label: mounted ? t('tabs.graph') : 'Graph View', beta: true },
    { id: 'stats', label: mounted ? t('tabs.stats') : 'Statistics' },
    { id: 'diff', label: mounted ? t('tabs.diff') : 'Diff View' },
    { id: 'chart', label: mounted ? t('tabs.chart') : 'Charts', beta: true },
    { id: 'search', label: mounted ? t('tabs.search') : 'Search & Filter' },
    { id: 'map', label: mounted ? t('tabs.map') : 'Map View', beta: true },
  ];
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
            {tab.beta && <span className="beta-badge">{mounted ? t('tabs.beta') : 'Beta'}</span>}
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
            {tab.beta && <span className="beta-badge">{mounted ? t('tabs.beta') : 'Beta'}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default TabsContainer;