'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound, Braces, Layers, Brackets, Tags, HardDrive } from 'lucide-react';
import styles from './StatsView.module.css';

interface StatsViewProps {
  json: any;
}

interface JSONStats {
  totalKeys: number;
  totalValues: number;
  maxDepth: number;
  typeDistribution: Map<string, number>;
  arrayStats: { count: number; minLength: number; maxLength: number; sumLength: number };
  keyAnalysis: { uniqueKeys: Set<string>; keyFrequency: Map<string, number>; longestKey: string };
  depthMap: Map<number, number>;
}

// JSON value-type colors — shared with the editor / tree (Tokyo Night palette).
const TYPE_COLORS: Record<string, string> = {
  string: '#9ece6a',
  number: '#ff9e64',
  boolean: '#bb9af7',
  object: '#7aa2f7',
  array: '#7dcfff',
  null: '#565f89',
};

function analyzeJSON(data: any, depth = 0, stats?: JSONStats): JSONStats {
  if (!stats) {
    stats = {
      totalKeys: 0,
      totalValues: 0,
      maxDepth: 0,
      typeDistribution: new Map(),
      arrayStats: { count: 0, minLength: Infinity, maxLength: 0, sumLength: 0 },
      keyAnalysis: { uniqueKeys: new Set(), keyFrequency: new Map(), longestKey: '' },
      depthMap: new Map(),
    };
  }

  stats.maxDepth = Math.max(stats.maxDepth, depth);
  stats.depthMap.set(depth, (stats.depthMap.get(depth) || 0) + 1);

  const type = data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data;
  stats.typeDistribution.set(type, (stats.typeDistribution.get(type) || 0) + 1);
  stats.totalValues++;

  if (Array.isArray(data)) {
    stats.arrayStats.count++;
    stats.arrayStats.minLength = Math.min(stats.arrayStats.minLength, data.length);
    stats.arrayStats.maxLength = Math.max(stats.arrayStats.maxLength, data.length);
    stats.arrayStats.sumLength += data.length;
    data.forEach((item) => analyzeJSON(item, depth + 1, stats));
  } else if (typeof data === 'object' && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      stats!.totalKeys++;
      stats!.keyAnalysis.uniqueKeys.add(key);
      stats!.keyAnalysis.keyFrequency.set(key, (stats!.keyAnalysis.keyFrequency.get(key) || 0) + 1);
      if (key.length > stats!.keyAnalysis.longestKey.length) stats!.keyAnalysis.longestKey = key;
      analyzeJSON(value, depth + 1, stats);
    });
  }

  return stats;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

const StatsView: React.FC<StatsViewProps> = ({ json }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const tr = (key: string, fallback: string) => (mounted ? t(key, fallback) : fallback);

  const data = useMemo(() => {
    if (!json) return null;
    const stats = analyzeJSON(json);
    const totalValues = stats.totalValues;
    const typeEntries = Array.from(stats.typeDistribution.entries()).sort((a, b) => b[1] - a[1]);
    const topKeys = Array.from(stats.keyAnalysis.keyFrequency.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const depthEntries = Array.from(stats.depthMap.entries()).sort((a, b) => a[0] - b[0]);
    const maxDepthCount = Math.max(...Array.from(stats.depthMap.values()), 1);
    const minifiedBytes = new TextEncoder().encode(JSON.stringify(json)).length;
    const avgLength = stats.arrayStats.count ? stats.arrayStats.sumLength / stats.arrayStats.count : 0;
    return { stats, totalValues, typeEntries, topKeys, depthEntries, maxDepthCount, minifiedBytes, avgLength };
  }, [json]);

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">{tr('stats.noData', 'No JSON data to analyze')}</p>
      </div>
    );
  }

  const { stats, totalValues, typeEntries, topKeys, depthEntries, maxDepthCount, minifiedBytes, avgLength } = data;
  const maxTopKey = topKeys.length ? topKeys[0][1] : 1;

  const metrics = [
    { icon: KeyRound, label: tr('stats.totalKeys', 'Total Keys'), value: stats.totalKeys.toLocaleString() },
    { icon: Braces, label: tr('stats.totalValues', 'Total Values'), value: stats.totalValues.toLocaleString() },
    { icon: Layers, label: tr('stats.depth', 'Max Depth'), value: String(stats.maxDepth) },
    { icon: Brackets, label: tr('stats.arrays', 'Arrays'), value: stats.arrayStats.count.toLocaleString() },
    { icon: Tags, label: 'Unique Keys', value: stats.keyAnalysis.uniqueKeys.size.toLocaleString() },
    { icon: HardDrive, label: 'Minified Size', value: formatBytes(minifiedBytes) },
  ];

  return (
    <div className={styles.statsRoot}>
      {/* Metric cards */}
      <div className={styles.metrics}>
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className={styles.metricCard}>
              <Icon className={styles.metricIcon} />
              <div className={styles.metricValue}>{m.value}</div>
              <div className={styles.metricLabel}>{m.label}</div>
            </div>
          );
        })}
      </div>

      <div className={styles.grid2}>
        {/* Type distribution */}
        <section className={styles.panel}>
          <h4 className={styles.panelTitle}>{tr('stats.distribution', 'Type Distribution')}</h4>
          <div className={styles.stackBar}>
            {typeEntries.map(([type, count]) => (
              <div
                key={type}
                className={styles.stackSeg}
                style={{ width: `${(count / totalValues) * 100}%`, background: TYPE_COLORS[type] || '#888' }}
                title={`${type}: ${count}`}
              />
            ))}
          </div>
          <div className={styles.legend}>
            {typeEntries.map(([type, count]) => (
              <div key={type} className={styles.legendItem}>
                <span className={styles.dot} style={{ background: TYPE_COLORS[type] || '#888' }} />
                <span className={styles.legendName}>{type}</span>
                <span className={styles.legendVal}>{count.toLocaleString()}</span>
                <span className={styles.legendPct}>{((count / totalValues) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </section>

        {/* Nesting depth */}
        <section className={styles.panel}>
          <h4 className={styles.panelTitle}>Nesting Depth</h4>
          <div className={styles.depthList}>
            {depthEntries.map(([depth, count]) => (
              <div key={depth} className={styles.depthRow}>
                <span className={styles.depthLabel}>L{depth}</span>
                <div className={styles.depthTrack}>
                  <div className={styles.depthFill} style={{ width: `${(count / maxDepthCount) * 100}%` }} />
                </div>
                <span className={styles.depthCount}>{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Arrays */}
        <section className={styles.panel}>
          <h4 className={styles.panelTitle}>{tr('stats.arrays', 'Arrays')}</h4>
          {stats.arrayStats.count === 0 ? (
            <p className={styles.empty}>{tr('stats.noData', 'No arrays found')}</p>
          ) : (
            <div className={styles.miniGrid}>
              <div className={styles.mini}>
                <div className={styles.miniVal}>{stats.arrayStats.count}</div>
                <div className={styles.miniLabel}>Total</div>
              </div>
              <div className={styles.mini}>
                <div className={styles.miniVal}>{stats.arrayStats.minLength === Infinity ? 0 : stats.arrayStats.minLength}</div>
                <div className={styles.miniLabel}>Min len</div>
              </div>
              <div className={styles.mini}>
                <div className={styles.miniVal}>{stats.arrayStats.maxLength}</div>
                <div className={styles.miniLabel}>Max len</div>
              </div>
              <div className={styles.mini}>
                <div className={styles.miniVal}>{avgLength.toFixed(1)}</div>
                <div className={styles.miniLabel}>Avg len</div>
              </div>
            </div>
          )}
        </section>

        {/* Key insights */}
        <section className={styles.panel}>
          <h4 className={styles.panelTitle}>Key Insights</h4>
          <div className={styles.kvRow}>
            <span className={styles.kvLabel}>Unique keys</span>
            <span className={styles.kvVal}>{stats.keyAnalysis.uniqueKeys.size.toLocaleString()}</span>
          </div>
          <div className={styles.kvRow}>
            <span className={styles.kvLabel}>Longest key</span>
            <span className={styles.kvVal}>
              <code className={styles.code}>{stats.keyAnalysis.longestKey || '—'}</code>
              {stats.keyAnalysis.longestKey ? ` (${stats.keyAnalysis.longestKey.length})` : ''}
            </span>
          </div>
          {topKeys.length > 0 && (
            <>
              <div className={styles.subhead}>Most frequent keys</div>
              <div className={styles.topKeys}>
                {topKeys.map(([key, count]) => (
                  <div key={key} className={styles.topKeyRow}>
                    <code className={styles.code}>{key}</code>
                    <div className={styles.topKeyTrack}>
                      <div className={styles.topKeyFill} style={{ width: `${(count / maxTopKey) * 100}%` }} />
                    </div>
                    <span className={styles.topKeyCount}>{count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default StatsView;
