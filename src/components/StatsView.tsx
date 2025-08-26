'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface StatsViewProps {
  json: any;
}

interface JSONStats {
  totalKeys: number;
  totalValues: number;
  maxDepth: number;
  estimatedSize: number;
  typeDistribution: Map<string, number>;
  arrayStats: {
    count: number;
    minLength: number;
    maxLength: number;
    avgLength: number;
  };
  keyAnalysis: {
    uniqueKeys: Set<string>;
    keyFrequency: Map<string, number>;
    longestKey: string;
  };
  depthMap: Map<number, number>;
}

const StatsView: React.FC<StatsViewProps> = ({ json }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const analyzeJSON = (data: any, depth: number = 0, stats?: JSONStats): JSONStats => {
    if (!stats) {
      stats = {
        totalKeys: 0,
        totalValues: 0,
        maxDepth: 0,
        estimatedSize: 0,
        typeDistribution: new Map(),
        arrayStats: {
          count: 0,
          minLength: Infinity,
          maxLength: 0,
          avgLength: 0,
        },
        keyAnalysis: {
          uniqueKeys: new Set(),
          keyFrequency: new Map(),
          longestKey: "",
        },
        depthMap: new Map(),
      };
    }

    stats.maxDepth = Math.max(stats.maxDepth, depth);
    stats.depthMap.set(depth, (stats.depthMap.get(depth) || 0) + 1);

    const type = data === null ? "null" : Array.isArray(data) ? "array" : typeof data;
    stats.typeDistribution.set(type, (stats.typeDistribution.get(type) || 0) + 1);
    stats.totalValues++;

    // Estimate size
    stats.estimatedSize += estimateSize(data);

    if (Array.isArray(data)) {
      stats.arrayStats.count++;
      stats.arrayStats.minLength = Math.min(stats.arrayStats.minLength, data.length);
      stats.arrayStats.maxLength = Math.max(stats.arrayStats.maxLength, data.length);

      data.forEach((item) => analyzeJSON(item, depth + 1, stats));
    } else if (typeof data === "object" && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        stats!.totalKeys++;
        stats!.keyAnalysis.uniqueKeys.add(key);
        stats!.keyAnalysis.keyFrequency.set(key, (stats!.keyAnalysis.keyFrequency.get(key) || 0) + 1);

        if (key.length > stats!.keyAnalysis.longestKey.length) {
          stats!.keyAnalysis.longestKey = key;
        }

        analyzeJSON(value, depth + 1, stats);
      });
    }

    // Calculate array average
    if (stats.arrayStats.count > 0 && stats.arrayStats.minLength !== Infinity) {
      const totalArrayLength = Array.from(stats.typeDistribution.entries())
        .filter(([type]) => type === "array")
        .reduce((sum, [_, count]) => sum + count, 0);
      stats.arrayStats.avgLength = totalArrayLength / stats.arrayStats.count;
    }

    return stats;
  };

  const estimateSize = (data: any): number => {
    if (data === null) return 4;
    if (typeof data === "boolean") return 5;
    if (typeof data === "number") return 8;
    if (typeof data === "string") return data.length * 2;
    if (Array.isArray(data)) return 2; // Just brackets
    if (typeof data === "object") return 2; // Just braces
    return 0;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const stats = json ? analyzeJSON(json) : null;

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">No JSON data to analyze</p>
      </div>
    );
  }

  const total = Array.from(stats.typeDistribution.values()).reduce((sum, count) => sum + count, 0);
  const typeEntries = Array.from(stats.typeDistribution.entries()).sort((a, b) => b[1] - a[1]);
  const topKeys = Array.from(stats.keyAnalysis.keyFrequency.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxDepthCount = Math.max(...Array.from(stats.depthMap.values()));

  return (
    <div className="stats-output">
      <div className="stats-container">
        {/* Overview Section */}
        <div className="stats-section">
          <h4>{mounted ? t('stats.title') : 'JSON Statistics'}</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.totalKeys}</div>
              <div className="stat-label">{mounted ? t('stats.totalKeys') : 'Total Keys'}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.totalValues}</div>
              <div className="stat-label">{mounted ? t('stats.totalValues') : 'Total Values'}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.maxDepth}</div>
              <div className="stat-label">{mounted ? t('stats.depth') : 'Max Depth'}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatBytes(stats.estimatedSize)}</div>
              <div className="stat-label">Estimated Size</div>
            </div>
          </div>
        </div>

        {/* Type Distribution */}
        <div className="stats-section">
          <h4>{mounted ? t('stats.distribution') : 'Type Distribution'}</h4>
          <div className="type-chart">
            {typeEntries.map(([type, count]) => {
              const percentage = ((count / total) * 100).toFixed(1);
              return (
                <div key={type} className="type-bar">
                  <div className="type-bar-label">{type}</div>
                  <div className="type-bar-container">
                    <div 
                      className={`type-bar-fill type-${type}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <span className="type-bar-value">{count} ({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Array Statistics */}
        <div className="stats-section">
          <h4>{mounted ? t('stats.arrays') : 'Arrays'}</h4>
          {stats.arrayStats.count === 0 ? (
            <p className="stats-empty">{mounted ? t('stats.noData') : 'No arrays found'}</p>
          ) : (
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.arrayStats.count}</div>
                <div className="stat-label">Total Arrays</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {stats.arrayStats.minLength === Infinity ? 0 : stats.arrayStats.minLength}
                </div>
                <div className="stat-label">Min Length</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.arrayStats.maxLength}</div>
                <div className="stat-label">Max Length</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.arrayStats.avgLength.toFixed(1)}</div>
                <div className="stat-label">Avg Length</div>
              </div>
            </div>
          )}
        </div>

        {/* Key Analysis */}
        <div className="stats-section">
          <h4>{mounted ? t('stats.keyFrequency') : 'Key Analysis'}</h4>
          <div className="key-analysis-content">
            <p><strong>Unique Keys:</strong> {stats.keyAnalysis.uniqueKeys.size}</p>
            <p><strong>Longest Key:</strong> "{stats.keyAnalysis.longestKey}" ({stats.keyAnalysis.longestKey.length} chars)</p>
            
            {topKeys.length > 0 && (
              <div className="top-keys">
                <p><strong>Most Frequent Keys:</strong></p>
                <ol>
                  {topKeys.map(([key, count]) => (
                    <li key={key}>"{key}" ({count} times)</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Depth Visualization */}
        <div className="stats-section">
          <h4>Nesting Depth Distribution</h4>
          <div className="depth-chart">
            {Array.from(stats.depthMap.entries())
              .sort((a, b) => a[0] - b[0])
              .map(([depth, count]) => {
                const height = (count / maxDepthCount) * 100;
                return (
                  <div key={depth} className="depth-bar">
                    <div className="depth-bar-fill" style={{ height: `${height}%` }}></div>
                    <div className="depth-bar-label">L{depth}</div>
                    <div className="depth-bar-count">{count}</div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsView;