'use client';

import type React from 'react';
import { useState } from 'react';

export interface HelpTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

// In-page tabs for the help/docs page. All panels stay in the DOM (hidden via the
// `hidden` attribute) so the content remains crawlable for SEO while only the
// active tab is shown.
export default function HelpTabs({ tabs }: { tabs: HelpTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Help topics"
        className="sticky top-16 z-20 -mx-4 mb-8 flex gap-1 overflow-x-auto border-b border-[var(--border-color)] bg-[var(--bg-primary)]/85 px-4 backdrop-blur-md"
      >
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.id)}
              className={`relative shrink-0 whitespace-nowrap px-4 py-3 font-mono text-sm transition-colors ${
                isActive
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.label}
              {isActive && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--accent-color)] shadow-[0_0_8px_var(--accent-color)]" />
              )}
            </button>
          );
        })}
      </div>

      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} hidden={active !== t.id}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
