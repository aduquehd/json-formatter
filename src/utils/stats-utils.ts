export function generateStatsView(data: any, container: HTMLElement): void {
  container.innerHTML = "";

  const stats = analyzeJSON(data);

  const statsContainer = document.createElement("div");
  statsContainer.className = "stats-container";

  // Overview section
  const overviewSection = createStatsSection("Overview", [
    { label: "Total Keys", value: stats.totalKeys },
    { label: "Total Values", value: stats.totalValues },
    { label: "Nesting Depth", value: stats.maxDepth },
    { label: "Estimated Size", value: formatBytes(stats.estimatedSize) },
  ]);

  // Type distribution
  const typeSection = createTypeDistribution(stats.typeDistribution);

  // Array statistics
  const arraySection = createArrayStats(stats.arrayStats);

  // Key analysis
  const keySection = createKeyAnalysis(stats.keyAnalysis);

  // Depth visualization
  const depthSection = createDepthVisualization(stats.depthMap);

  statsContainer.appendChild(overviewSection);
  statsContainer.appendChild(typeSection);
  statsContainer.appendChild(arraySection);
  statsContainer.appendChild(keySection);
  statsContainer.appendChild(depthSection);

  container.appendChild(statsContainer);
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

function analyzeJSON(data: any, depth: number = 0, stats?: JSONStats): JSONStats {
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
  if (stats.arrayStats.count > 0) {
    const totalArrayLength = Array.from(stats.typeDistribution.entries())
      .filter(([type]) => type === "array")
      .reduce((sum, [_, count]) => sum + count, 0);
    stats.arrayStats.avgLength = totalArrayLength / stats.arrayStats.count;
  }

  return stats;
}

function estimateSize(data: any): number {
  if (data === null) return 4;
  if (typeof data === "boolean") return 5;
  if (typeof data === "number") return 8;
  if (typeof data === "string") return data.length * 2;
  if (Array.isArray(data)) return 2; // Just brackets
  if (typeof data === "object") return 2; // Just braces
  return 0;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function createStatsSection(
  title: string,
  items: Array<{ label: string; value: any }>
): HTMLElement {
  const section = document.createElement("div");
  section.className = "stats-section";

  const header = document.createElement("h4");
  header.textContent = title;
  section.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "stats-grid";

  items.forEach((item) => {
    const statItem = document.createElement("div");
    statItem.className = "stat-item";
    statItem.innerHTML = `
      <div class="stat-value">${item.value}</div>
      <div class="stat-label">${item.label}</div>
    `;
    grid.appendChild(statItem);
  });

  section.appendChild(grid);
  return section;
}

function createTypeDistribution(distribution: Map<string, number>): HTMLElement {
  const section = document.createElement("div");
  section.className = "stats-section";

  const header = document.createElement("h4");
  header.textContent = "Type Distribution";
  section.appendChild(header);

  const chartContainer = document.createElement("div");
  chartContainer.className = "type-chart";

  const total = Array.from(distribution.values()).reduce((sum, count) => sum + count, 0);

  const distEntries = Array.from(distribution.entries()) as [string, number][];
  distEntries
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);

      const bar = document.createElement("div");
      bar.className = "type-bar";
      bar.innerHTML = `
        <div class="type-bar-label">${type}</div>
        <div class="type-bar-container">
          <div class="type-bar-fill type-${type}" style="width: ${percentage}%"></div>
          <span class="type-bar-value">${count} (${percentage}%)</span>
        </div>
      `;
      chartContainer.appendChild(bar);
    });

  section.appendChild(chartContainer);
  return section;
}

function createArrayStats(arrayStats: any): HTMLElement {
  const section = document.createElement("div");
  section.className = "stats-section";

  const header = document.createElement("h4");
  header.textContent = "Array Statistics";
  section.appendChild(header);

  if (arrayStats.count === 0) {
    section.innerHTML += '<p class="stats-empty">No arrays found</p>';
    return section;
  }

  const items = [
    { label: "Total Arrays", value: arrayStats.count },
    { label: "Min Length", value: arrayStats.minLength === Infinity ? 0 : arrayStats.minLength },
    { label: "Max Length", value: arrayStats.maxLength },
    { label: "Avg Length", value: arrayStats.avgLength.toFixed(1) },
  ];

  const grid = document.createElement("div");
  grid.className = "stats-grid";

  items.forEach((item) => {
    const statItem = document.createElement("div");
    statItem.className = "stat-item";
    statItem.innerHTML = `
      <div class="stat-value">${item.value}</div>
      <div class="stat-label">${item.label}</div>
    `;
    grid.appendChild(statItem);
  });

  section.appendChild(grid);
  return section;
}

function createKeyAnalysis(keyAnalysis: any): HTMLElement {
  const section = document.createElement("div");
  section.className = "stats-section";

  const header = document.createElement("h4");
  header.textContent = "Key Analysis";
  section.appendChild(header);

  const content = document.createElement("div");
  content.className = "key-analysis-content";

  content.innerHTML = `
    <p><strong>Unique Keys:</strong> ${keyAnalysis.uniqueKeys.size}</p>
    <p><strong>Longest Key:</strong> "${keyAnalysis.longestKey}" (${keyAnalysis.longestKey.length} chars)</p>
  `;

  // Top frequent keys
  const entries = Array.from(keyAnalysis.keyFrequency.entries()) as [string, number][];
  const topKeys = entries.sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (topKeys.length > 0) {
    const topKeysDiv = document.createElement("div");
    topKeysDiv.className = "top-keys";
    topKeysDiv.innerHTML = "<p><strong>Most Frequent Keys:</strong></p>";

    const keysList = document.createElement("ol");
    topKeys.forEach(([key, count]) => {
      const li = document.createElement("li");
      li.textContent = `"${key}" (${count} times)`;
      keysList.appendChild(li);
    });

    topKeysDiv.appendChild(keysList);
    content.appendChild(topKeysDiv);
  }

  section.appendChild(content);
  return section;
}

function createDepthVisualization(depthMap: Map<number, number>): HTMLElement {
  const section = document.createElement("div");
  section.className = "stats-section";

  const header = document.createElement("h4");
  header.textContent = "Nesting Depth Distribution";
  section.appendChild(header);

  const depthChart = document.createElement("div");
  depthChart.className = "depth-chart";

  const maxCount = Math.max(...Array.from(depthMap.values()));

  Array.from(depthMap.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([depth, count]) => {
      const bar = document.createElement("div");
      bar.className = "depth-bar";

      const height = (count / maxCount) * 100;
      bar.innerHTML = `
        <div class="depth-bar-fill" style="height: ${height}%"></div>
        <div class="depth-bar-label">L${depth}</div>
        <div class="depth-bar-count">${count}</div>
      `;

      depthChart.appendChild(bar);
    });

  section.appendChild(depthChart);
  return section;
}
