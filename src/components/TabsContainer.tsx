'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ToolView } from '@/lib/tools';

interface TabsContainerProps {
  activeTab: string;
  onTabChange: (tab: ToolView) => void;
}

const TabsContainer: React.FC<TabsContainerProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const tabs: { id: ToolView; label: string; beta?: boolean }[] = [
    { id: 'formatted', label: mounted ? t('tabs.editor') : 'JSON Editor' },
    { id: 'tree', label: mounted ? t('tabs.tree') : 'Tree View' },
    { id: 'graph', label: mounted ? t('tabs.graph') : 'Graph View' },
    { id: 'stats', label: mounted ? t('tabs.stats') : 'Statistics' },
    { id: 'diff', label: mounted ? t('tabs.diff') : 'Diff View' },
    { id: 'search', label: mounted ? t('tabs.search') : 'Search & Filter' },
    { id: 'map', label: mounted ? t('tabs.map') : 'Map View', beta: true },
  ];

  // Roving-tabindex keyboard navigation following the ARIA tabs pattern.
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    switch (e.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const next = tabs[nextIndex];
    tabRefs.current[nextIndex]?.focus();
    onTabChange(next.id);
  };

  return (
    <div
      className="tabs-scroll flex items-center gap-1 mb-2 border-b border-[var(--tabs-border)] overflow-x-auto"
      role="tablist"
      aria-label={mounted ? t('tabs.editor') : 'JSON views'}
      aria-orientation="horizontal"
    >
      {tabs.map((tab, index) => (
        <React.Fragment key={tab.id}>
          {index === 4 && <div className="tab-separator" aria-hidden="true" />}
          <button
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            id={`${tab.id}-tabbtn`}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-tab`}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            {tab.label}
            {tab.beta && <span className="beta-badge">{mounted ? t('tabs.beta') : 'Beta'}</span>}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default TabsContainer;
