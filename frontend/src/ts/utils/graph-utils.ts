"use strict";

interface GraphNode {
  id: string;
  name: string;
  value?: any;
  type: "root" | "object" | "array" | "value";
  children?: GraphNode[];
  depth: number;
  parent?: GraphNode;
  childCount?: number;
  arrayLength?: number;
  path?: string;
  valueType?: string;
  displayLabel?: string;
  businessInfo?: {
    isEnum?: boolean;
    enumDistribution?: string;
    isPotentialId?: boolean;
    completeness?: number;
    isAnomaly?: boolean;
    isSensitive?: boolean;
    dataType?: string;
  };
}

type NodeDisplayMode = "keys" | "values" | "types" | "analytics" | "path" | "business";

interface GraphLink {
  source: string;
  target: string;
}

interface JSONStats {
  totalNodes: number;
  objectCount: number;
  arrayCount: number;
  valueCount: number;
  maxDepth: number;
  keyFrequency: Map<string, number>;
  typeDistribution: Map<string, number>;
  arrayLengths: number[];
  patterns: Pattern[];
  businessAnalytics: BusinessAnalytics;
}

interface BusinessAnalytics {
  enumerations: Map<string, EnumInfo>;
  potentialIds: Set<string>;
  dataCompleteness: Map<string, number>;
  valueDistributions: Map<string, ValueDistribution>;
  anomalies: Map<string, string[]>;
  sensitiveData: Map<string, string>;
  dateFields: Set<string>;
  numericRanges: Map<string, NumericRange>;
}

interface EnumInfo {
  values: Map<string, number>;
  totalCount: number;
  isLikelyEnum: boolean;
}

interface ValueDistribution {
  uniqueValues: number;
  totalOccurrences: number;
  topValues: Array<{ value: any; count: number }>;
}

interface NumericRange {
  min: number;
  max: number;
  avg: number;
  isLikelyMonetary: boolean;
  isLikelyId: boolean;
}

interface Pattern {
  name: string;
  occurrences: number;
  paths: string[];
}

export function generateGraphView(data: any, container: HTMLElement): void {
  // Check if d3 is available on window
  if (typeof (window as any).d3 === "undefined") {
    console.error("D3.js is not loaded");
    container.innerHTML =
      '<div style="padding: 20px; color: red;">Error: D3.js library not loaded</div>';
    return;
  }
  
  // Use d3 from window
  const d3 = (window as any).d3;

  // Show loading indicator
  container.innerHTML =
    '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);"><div>Generating graph visualization...</div></div>';

  // Small delay to show loading indicator
  setTimeout(() => {
    container.innerHTML = "";

    // Create layout with stats panel
    const layout = createLayout();
    container.appendChild(layout.container);

    const controls = createControls();
    layout.graphContainer.appendChild(controls);

    // Add display mode selector
    const displayModeSelector = createDisplayModeSelector();
    layout.graphContainer.appendChild(displayModeSelector);

    const width = layout.graphContainer.clientWidth || 800;
    const height = layout.graphContainer.clientHeight || 600;

    // Ensure container has dimensions
    if (width === 0 || height === 0) {
      console.error("Container has no dimensions");
      setTimeout(() => generateGraphView(data, container), 100);
      return;
    }

    const svg = d3
      .select(layout.graphContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height]);

    const g = svg.append("g");

    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event: any) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const graphData = convertJsonToGraph(data);
    const stats = analyzeJSONStructure(data, graphData.nodes);

    // Display stats
    displayStats(layout.statsPanel, stats, graphData.nodes);

    // Set initial display mode to "values" for better default view
    let currentDisplayMode: NodeDisplayMode = "values";
    updateNodeLabels(graphData.nodes, currentDisplayMode, stats);

    // Group nodes by type for better visualization
    const groupedNodes = groupNodesByType(graphData.nodes);

    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink(graphData.links)
          .id((d: any) => d.id)
          .distance((d: any) => {
            // Adjust distance based on node types
            const source = d.source;
            const target = d.target;
            if (source.type === "array" || target.type === "array") return 100;
            if (source.depth === target.depth) return 60;
            return 80;
          })
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(0, 0))
      .force("collision", d3.forceCollide().radius(30))
      .force(
        "radial",
        d3
          .forceRadial(
            (d: any) => {
              // Create radial grouping by type
              if (d.type === "root") return 0;
              if (d.type === "object") return 150;
              if (d.type === "array") return 250;
              return 350;
            },
            0,
            0
          )
          .strength(0.1)
      );

    const link = g
      .append("g")
      .selectAll("line")
      .data(graphData.links)
      .enter()
      .append("line")
      .attr("class", "graph-link");

    const node = g
      .append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .enter()
      .append("g")
      .attr("class", (d: any) => `graph-node ${d.type}`)
      .call(drag(simulation, d3));

    // Color scale based on depth
    const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, stats.maxDepth]);

    node
      .append("circle")
      .attr("r", (d: any) => {
        if (d.type === "root") return 15;
        if (d.type === "array") return 8 + Math.min(d.arrayLength || 0, 10) * 0.5;
        if (d.type === "object") return 8 + Math.min(d.childCount || 0, 10) * 0.3;
        return 6;
      })
      .style("fill", (d: any) => {
        if (d.type === "root") return "#667eea";
        if (d.type === "value") {
          // Color based on value type
          if (d.valueType === "string") return "#00d4fe";
          if (d.valueType === "number") return "#48bb78";
          if (d.valueType === "boolean") return "#ed8936";
          if (d.valueType === "null") return "#718096";
        }
        // Use depth-based coloring for objects/arrays
        return colorScale(d.depth);
      });

    const nodeText = node
      .append("text")
      .attr("dy", -15)
      .attr("class", "node-label")
      .text((d: any) => d.displayLabel || d.name);

    const tooltip = createTooltip(layout.graphContainer);

    node
      .on("mouseover", function (event: any, d: any) {
        showTooltip(tooltip, event, d);
        highlightConnections(d, node, link);
      })
      .on("mouseout", function () {
        hideTooltip(tooltip);
        resetHighlight(node, link);
      })
      .on("click", function (event: any, d: any) {
        showNodeDetails(layout.detailsPanel, d, stats);
      });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    setupControls(svg, zoom, d3);

    // Setup display mode selector
    setupDisplayModeSelector((mode: NodeDisplayMode) => {
      currentDisplayMode = mode;
      updateNodeLabels(graphData.nodes, mode, stats);
      nodeText.text((d: any) => d.displayLabel || d.name);
    });
  }, 50);
}

function convertJsonToGraph(data: any): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  let nodeId = 0;

  function traverse(
    obj: any,
    parentId: string | null,
    key: string,
    depth: number,
    path: string
  ): string {
    const id = `node-${nodeId++}`;
    const type = Array.isArray(obj)
      ? "array"
      : typeof obj === "object" && obj !== null
        ? "object"
        : "value";

    const node: GraphNode = {
      id,
      name: key,
      type: depth === 0 ? "root" : type,
      depth,
      value: type === "value" ? obj : undefined,
      path: path,
      valueType: type === "value" ? typeof obj : undefined,
    };

    if (type === "object" && obj !== null) {
      node.childCount = Object.keys(obj).length;
    } else if (type === "array") {
      node.arrayLength = obj.length;
    }

    nodes.push(node);

    if (parentId) {
      links.push({ source: parentId, target: id });
    }

    if (type === "object" && obj !== null) {
      Object.keys(obj).forEach((k) => {
        traverse(obj[k], id, k, depth + 1, `${path}.${k}`);
      });
    } else if (type === "array") {
      obj.forEach((item: any, index: number) => {
        traverse(item, id, `[${index}]`, depth + 1, `${path}[${index}]`);
      });
    }

    return id;
  }

  traverse(data, null, "root", 0, "root");

  return { nodes, links };
}

function drag(simulation: any, d3: any) {
  function dragstarted(event: any, d: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event: any, d: any) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event: any, d: any) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
}

function createControls(): HTMLElement {
  const controls = document.createElement("div");
  controls.className = "graph-controls";
  controls.innerHTML = `
    <div class="graph-controls-container">
      <button class="graph-control-btn futuristic" id="zoomInBtn" title="Zoom In">
        <div class="btn-glow"></div>
        <div class="btn-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </div>
        <div class="btn-border"></div>
      </button>
      <button class="graph-control-btn futuristic" id="zoomOutBtn" title="Zoom Out">
        <div class="btn-glow"></div>
        <div class="btn-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </div>
        <div class="btn-border"></div>
      </button>
      <button class="graph-control-btn futuristic" id="resetZoomBtn" title="Reset Zoom">
        <div class="btn-glow"></div>
        <div class="btn-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </div>
        <div class="btn-border"></div>
      </button>
    </div>
  `;
  return controls;
}

function createDisplayModeSelector(): HTMLElement {
  const selector = document.createElement("div");
  selector.className = "display-mode-selector";
  selector.innerHTML = `
    <label for="nodeDisplayMode">Node Display:</label>
    <select id="nodeDisplayMode" class="display-mode-select">
      <option value="keys">Property Keys</option>
      <option value="values" selected>Value Preview</option>
      <option value="types">Data Types</option>
      <option value="analytics">Structure Analytics</option>
      <option value="business">Business Logic</option>
      <option value="path">Path Info</option>
    </select>
  `;
  return selector;
}

function setupControls(svg: any, zoom: any, d3: any): void {
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const resetZoomBtn = document.getElementById("resetZoomBtn");

  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    });
  }

  if (resetZoomBtn) {
    resetZoomBtn.addEventListener("click", () => {
      svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
    });
  }
}

function createTooltip(container: HTMLElement): HTMLElement {
  const tooltip = document.createElement("div");
  tooltip.className = "graph-tooltip";
  container.appendChild(tooltip);
  return tooltip;
}

function showTooltip(tooltip: HTMLElement, event: any, d: any): void {
  let content = `<strong>${d.name}</strong>`;
  content += `<br><span style="color: #888;">Path: ${d.path}</span>`;

  if (d.type === "value" && d.value !== undefined) {
    content += `<br>Value: ${JSON.stringify(d.value)}`;
    content += `<br>Type: ${d.valueType}`;
  } else if (d.type === "object") {
    content += `<br>Type: Object`;
    content += `<br>Properties: ${d.childCount || 0}`;
  } else if (d.type === "array") {
    content += `<br>Type: Array`;
    content += `<br>Length: ${d.arrayLength || 0}`;
  }

  content += `<br>Depth: ${d.depth}`;

  tooltip.innerHTML = content;
  tooltip.classList.add("visible");

  const rect = event.currentTarget.getBoundingClientRect();
  const containerRect = tooltip.parentElement!.getBoundingClientRect();

  tooltip.style.left = `${rect.left - containerRect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
  tooltip.style.top = `${rect.top - containerRect.top - tooltip.offsetHeight - 10}px`;
}

function hideTooltip(tooltip: HTMLElement): void {
  tooltip.classList.remove("visible");
}

function createLayout(): {
  container: HTMLElement;
  graphContainer: HTMLElement;
  statsPanel: HTMLElement;
  detailsPanel: HTMLElement;
} {
  const container = document.createElement("div");
  container.className = "graph-layout";
  container.innerHTML = `
    <div class="graph-sidebar">
      <div class="stats-panel">
        <h3>JSON Statistics</h3>
        <div class="stats-content"></div>
      </div>
      <div class="details-panel">
        <h3>Node Details</h3>
        <div class="details-content">
          <p style="color: var(--text-secondary);">Click a node to see details</p>
        </div>
      </div>
    </div>
    <div class="graph-container"></div>
  `;

  return {
    container,
    graphContainer: container.querySelector(".graph-container")!,
    statsPanel: container.querySelector(".stats-content")!,
    detailsPanel: container.querySelector(".details-content")!,
  };
}

function analyzeJSONStructure(data: any, nodes: GraphNode[]): JSONStats {
  const stats: JSONStats = {
    totalNodes: nodes.length,
    objectCount: 0,
    arrayCount: 0,
    valueCount: 0,
    maxDepth: 0,
    keyFrequency: new Map(),
    typeDistribution: new Map(),
    arrayLengths: [],
    patterns: [],
    businessAnalytics: {
      enumerations: new Map(),
      potentialIds: new Set(),
      dataCompleteness: new Map(),
      valueDistributions: new Map(),
      anomalies: new Map(),
      sensitiveData: new Map(),
      dateFields: new Set(),
      numericRanges: new Map(),
    },
  };

  nodes.forEach((node) => {
    // Count node types
    if (node.type === "object") stats.objectCount++;
    else if (node.type === "array") {
      stats.arrayCount++;
      if (node.arrayLength !== undefined) {
        stats.arrayLengths.push(node.arrayLength);
      }
    } else if (node.type === "value") stats.valueCount++;

    // Track max depth
    if (node.depth > stats.maxDepth) stats.maxDepth = node.depth;

    // Track key frequency (excluding array indices)
    if (node.type !== "root" && !node.name.startsWith("[")) {
      stats.keyFrequency.set(node.name, (stats.keyFrequency.get(node.name) || 0) + 1);
    }

    // Track value type distribution
    if (node.valueType) {
      stats.typeDistribution.set(
        node.valueType,
        (stats.typeDistribution.get(node.valueType) || 0) + 1
      );
    }
  });

  // Detect patterns (repeated structures)
  detectPatterns(nodes, stats);

  // Analyze business logic patterns
  analyzeBusinessLogic(data, nodes, stats);

  return stats;
}

function detectPatterns(nodes: GraphNode[], stats: JSONStats): void {
  // Find repeated object structures
  const structureMap = new Map<string, string[]>();

  nodes
    .filter((n) => n.type === "object")
    .forEach((node) => {
      const children = nodes.filter(
        (n) =>
          n.path?.startsWith(node.path + ".") &&
          n.path.split(".").length === node.path!.split(".").length + 1
      );
      const structure = children
        .map((c) => c.name)
        .sort()
        .join(",");

      if (structure) {
        if (!structureMap.has(structure)) {
          structureMap.set(structure, []);
        }
        structureMap.get(structure)!.push(node.path!);
      }
    });

  // Convert to patterns
  structureMap.forEach((paths, structure) => {
    if (paths.length > 1) {
      stats.patterns.push({
        name: `Object with keys: ${structure}`,
        occurrences: paths.length,
        paths: paths.slice(0, 5), // Limit to first 5 examples
      });
    }
  });
}

function displayStats(panel: HTMLElement, stats: JSONStats, nodes: GraphNode[]): void {
  const ba = stats.businessAnalytics;
  let html = "";

  // Sensitive Data (shown first if present)
  if (ba.sensitiveData.size > 0) {
    html += '<div class="stat-group"><h4>Sensitive Data ⚠️</h4>';
    ba.sensitiveData.forEach((type, key) => {
      const icon = type === "email" ? "📧" : "📱";
      html += `<div class="sensitive-item">${icon} ${key}</div>`;
    });
    html += "</div>";
  }

  // Basic stats
  html += `
    <div class="stat-item">
      <span class="stat-label">Total Nodes:</span>
      <span class="stat-value">${stats.totalNodes}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Max Depth:</span>
      <span class="stat-value">${stats.maxDepth}</span>
    </div>
    <div class="stat-group">
      <h4>Node Types</h4>
      <div class="stat-item">
        <span class="stat-label">Objects:</span>
        <span class="stat-value">${stats.objectCount}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Arrays:</span>
        <span class="stat-value">${stats.arrayCount}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Values:</span>
        <span class="stat-value">${stats.valueCount}</span>
      </div>
    </div>
  `;

  // Value type distribution
  if (stats.typeDistribution.size > 0) {
    html += '<div class="stat-group"><h4>Value Types</h4>';
    stats.typeDistribution.forEach((count, type) => {
      html += `
        <div class="stat-item">
          <span class="stat-label">${type}:</span>
          <span class="stat-value">${count}</span>
        </div>
      `;
    });
    html += "</div>";
  }

  // Array statistics
  if (stats.arrayLengths.length > 0) {
    const avgLength = stats.arrayLengths.reduce((a, b) => a + b, 0) / stats.arrayLengths.length;
    const maxLength = Math.max(...stats.arrayLengths);
    html += `
      <div class="stat-group">
        <h4>Array Statistics</h4>
        <div class="stat-item">
          <span class="stat-label">Avg Length:</span>
          <span class="stat-value">${avgLength.toFixed(1)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Max Length:</span>
          <span class="stat-value">${maxLength}</span>
        </div>
      </div>
    `;
  }

  // Most frequent keys
  const topKeys = Array.from(stats.keyFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topKeys.length > 0) {
    html += '<div class="stat-group"><h4>Top Keys</h4>';
    topKeys.forEach(([key, count]) => {
      html += `
        <div class="stat-item">
          <span class="stat-label">${key}:</span>
          <span class="stat-value">${count}</span>
        </div>
      `;
    });
    html += "</div>";
  }

  // Business Analytics

  // Enumerations
  if (ba.enumerations.size > 0) {
    html += '<div class="stat-group"><h4>Enumerations</h4>';
    Array.from(ba.enumerations.entries())
      .slice(0, 3)
      .forEach(([key, enumInfo]) => {
        const topValues = Array.from(enumInfo.values.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(
            ([val, count]) =>
              `${JSON.parse(val)} (${Math.round((count / enumInfo.totalCount) * 100)}%)`
          )
          .join(", ");
        html += `
        <div class="enum-item">
          <div class="enum-key">${key}:</div>
          <div class="enum-values">${topValues}</div>
        </div>
      `;
      });
    html += "</div>";
  }

  // Potential IDs
  if (ba.potentialIds.size > 0) {
    html += '<div class="stat-group"><h4>Potential IDs 🔑</h4>';
    Array.from(ba.potentialIds)
      .slice(0, 5)
      .forEach((id) => {
        html += `<div class="id-item">${id}</div>`;
      });
    html += "</div>";
  }

  // Data Completeness
  const incompleteFields = Array.from(ba.dataCompleteness.entries())
    .filter(([_, completeness]) => completeness < 100)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);

  if (incompleteFields.length > 0) {
    html += '<div class="stat-group"><h4>Data Completeness</h4>';
    incompleteFields.forEach(([key, completeness]) => {
      html += `
        <div class="stat-item">
          <span class="stat-label">${key}:</span>
          <span class="stat-value ${completeness < 50 ? "low-completeness" : ""}">${Math.round(completeness)}%</span>
        </div>
      `;
    });
    html += "</div>";
  }

  // Patterns
  if (stats.patterns.length > 0) {
    html += '<div class="stat-group"><h4>Patterns Found</h4>';
    stats.patterns.slice(0, 3).forEach((pattern) => {
      html += `
        <div class="pattern-item">
          <div class="pattern-name">${pattern.name}</div>
          <div class="pattern-count">${pattern.occurrences} occurrences</div>
        </div>
      `;
    });
    html += "</div>";
  }

  panel.innerHTML = html;
}

function updateNodeLabels(nodes: GraphNode[], mode: NodeDisplayMode, stats: JSONStats): void {
  nodes.forEach((node) => {
    switch (mode) {
      case "keys":
        // Default behavior - show property keys
        node.displayLabel = node.name;
        break;

      case "values":
        // Show value preview for leaf nodes
        if (node.type === "value") {
          const valueStr = JSON.stringify(node.value);
          node.displayLabel = valueStr.length > 20 ? valueStr.substring(0, 17) + "..." : valueStr;
        } else if (node.type === "array") {
          node.displayLabel = `Array[${node.arrayLength}]`;
        } else if (node.type === "object") {
          node.displayLabel = `Object{${node.childCount}}`;
        } else {
          node.displayLabel = node.name;
        }
        break;

      case "types":
        // Show data type information
        if (node.type === "value") {
          node.displayLabel = `${node.name}: ${node.valueType}`;
        } else if (node.type === "array") {
          node.displayLabel = `${node.name}: array[${node.arrayLength}]`;
        } else if (node.type === "object") {
          node.displayLabel = `${node.name}: object{${node.childCount}}`;
        } else {
          node.displayLabel = node.name;
        }
        break;

      case "analytics":
        // Show analytical information
        if (node.type === "value") {
          // Check if this key appears frequently
          const keyFreq = stats.keyFrequency.get(node.name) || 0;
          if (keyFreq > 1) {
            node.displayLabel = `${node.name} (×${keyFreq})`;
          } else {
            node.displayLabel = node.name;
          }
        } else if (node.type === "array") {
          // Show array size analytics
          const avgLength =
            stats.arrayLengths.reduce((a, b) => a + b, 0) / stats.arrayLengths.length;
          if (node.arrayLength! > avgLength * 1.5) {
            node.displayLabel = `${node.name} [Large: ${node.arrayLength}]`;
          } else if (node.arrayLength === 0) {
            node.displayLabel = `${node.name} [Empty]`;
          } else {
            node.displayLabel = `${node.name} [${node.arrayLength}]`;
          }
        } else if (node.type === "object") {
          // Check if this object matches a pattern
          const matchesPattern = stats.patterns.some((p) => p.paths.includes(node.path!));
          if (matchesPattern) {
            node.displayLabel = `${node.name} 📊`;
          } else if (node.childCount === 0) {
            node.displayLabel = `${node.name} {}`;
          } else {
            node.displayLabel = node.name;
          }
        } else {
          node.displayLabel = node.name;
        }
        break;

      case "path":
        // Show simplified path information
        const pathParts = node.path!.split(".");
        if (pathParts.length > 2) {
          node.displayLabel = `...${pathParts.slice(-2).join(".")}`;
        } else {
          node.displayLabel = node.path!;
        }
        break;

      case "business":
        // Show business logic insights
        if (node.type === "value" && node.businessInfo) {
          const info = node.businessInfo;
          if (info.isEnum && info.enumDistribution) {
            node.displayLabel = `${node.name} [${info.enumDistribution}]`;
          } else if (info.isPotentialId) {
            node.displayLabel = `${node.name} 🔑`;
          } else if (info.isSensitive) {
            const icon = info.dataType === "email" ? "📧" : "📱";
            node.displayLabel = `${node.name} ${icon}`;
          } else if (info.isAnomaly) {
            node.displayLabel = `${node.name} ⚠️`;
          } else if (info.completeness !== undefined && info.completeness < 100) {
            node.displayLabel = `${node.name} (${Math.round(info.completeness)}%)`;
          } else {
            node.displayLabel = node.name;
          }
        } else if (node.type === "array") {
          const dist = stats.businessAnalytics.valueDistributions.get(node.name);
          if (dist && dist.uniqueValues === 1) {
            node.displayLabel = `${node.name} [uniform]`;
          } else if (node.arrayLength === 0) {
            node.displayLabel = `${node.name} [empty]`;
          } else {
            node.displayLabel = `${node.name} [${node.arrayLength}]`;
          }
        } else if (node.type === "object") {
          const childKeys = nodes.filter(
            (n) =>
              n.path?.startsWith(node.path + ".") &&
              n.path.split(".").length === node.path!.split(".").length + 1
          );
          const hasId = childKeys.some((n) => stats.businessAnalytics.potentialIds.has(n.name));
          if (hasId) {
            node.displayLabel = `${node.name} 🏷️`;
          } else {
            node.displayLabel = node.name;
          }
        } else {
          node.displayLabel = node.name;
        }
        break;

      default:
        node.displayLabel = node.name;
    }
  });
}

function analyzeBusinessLogic(data: any, nodes: GraphNode[], stats: JSONStats): void {
  const valuesByKey = new Map<string, any[]>();
  const keyPaths = new Map<string, string[]>();

  // Collect all values by key name
  nodes.forEach((node) => {
    if (node.type === "value" && node.value !== undefined && node.value !== null) {
      const key = node.name;
      if (!valuesByKey.has(key)) {
        valuesByKey.set(key, []);
        keyPaths.set(key, []);
      }
      valuesByKey.get(key)!.push(node.value);
      keyPaths.get(key)!.push(node.path!);
    }
  });

  // Analyze each key's values
  valuesByKey.forEach((values, key) => {
    const uniqueValues = new Set(values);
    const valueCount = new Map<any, number>();

    // Count occurrences
    values.forEach((v) => {
      const vStr = JSON.stringify(v);
      valueCount.set(vStr, (valueCount.get(vStr) || 0) + 1);
    });

    // Check for enumerations (limited set of values)
    if (uniqueValues.size <= 10 && values.length >= 3 && uniqueValues.size < values.length * 0.5) {
      const enumInfo: EnumInfo = {
        values: new Map(),
        totalCount: values.length,
        isLikelyEnum: true,
      };

      valueCount.forEach((count, value) => {
        enumInfo.values.set(value, count);
      });

      stats.businessAnalytics.enumerations.set(key, enumInfo);
    }

    // Check for potential IDs
    if (
      key.toLowerCase().includes("id") ||
      key.toLowerCase().includes("key") ||
      key.toLowerCase().includes("uuid") ||
      key.toLowerCase().includes("code")
    ) {
      if (uniqueValues.size === values.length) {
        stats.businessAnalytics.potentialIds.add(key);
      }
    } else if (uniqueValues.size === values.length && values.length > 5) {
      // Also check if all values are unique even without ID-like name
      stats.businessAnalytics.potentialIds.add(key);
    }

    // Check for sensitive data patterns
    if (typeof values[0] === "string") {
      const sampleValue = values[0];
      if (/^[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(sampleValue)) {
        stats.businessAnalytics.sensitiveData.set(key, "email");
      } else if (/^\+?[1-9]\d{1,14}$/.test(sampleValue.replace(/[\s()-]/g, ""))) {
        stats.businessAnalytics.sensitiveData.set(key, "phone");
      } else if (
        /^\d{4}-\d{2}-\d{2}/.test(sampleValue) ||
        /^\d{2}\/\d{2}\/\d{4}/.test(sampleValue)
      ) {
        stats.businessAnalytics.dateFields.add(key);
      }
    }

    // Numeric analysis
    if (typeof values[0] === "number") {
      const numbers = values as number[];
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;

      const range: NumericRange = {
        min,
        max,
        avg,
        isLikelyMonetary:
          key.toLowerCase().includes("price") ||
          key.toLowerCase().includes("cost") ||
          key.toLowerCase().includes("amount") ||
          key.toLowerCase().includes("total"),
        isLikelyId: uniqueValues.size === values.length && Number.isInteger(min) && min > 0,
      };

      stats.businessAnalytics.numericRanges.set(key, range);
    }

    // Store value distribution
    const topValues = Array.from(valueCount.entries())
      .map(([value, count]) => ({ value: JSON.parse(value), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    stats.businessAnalytics.valueDistributions.set(key, {
      uniqueValues: uniqueValues.size,
      totalOccurrences: values.length,
      topValues,
    });
  });

  // Calculate data completeness
  const allObjectPaths = new Set<string>();
  nodes.forEach((node) => {
    if (node.type === "object") {
      allObjectPaths.add(node.path!.split(".").slice(0, -1).join("."));
    }
  });

  valuesByKey.forEach((values, key) => {
    const keyOccurrences = keyPaths.get(key)!.length;
    const possibleOccurrences = allObjectPaths.size || 1;
    const completeness = (keyOccurrences / possibleOccurrences) * 100;
    stats.businessAnalytics.dataCompleteness.set(key, Math.min(completeness, 100));
  });

  // Detect anomalies
  stats.businessAnalytics.enumerations.forEach((enumInfo, key) => {
    const values = Array.from(enumInfo.values.entries());
    values.forEach(([value, count]) => {
      if (count === 1 && enumInfo.totalCount > 10) {
        if (!stats.businessAnalytics.anomalies.has(key)) {
          stats.businessAnalytics.anomalies.set(key, []);
        }
        stats.businessAnalytics.anomalies.get(key)!.push(value);
      }
    });
  });

  // Update nodes with business info
  nodes.forEach((node) => {
    if (node.type === "value" && node.name) {
      node.businessInfo = {};

      // Check if it's an enum
      if (stats.businessAnalytics.enumerations.has(node.name)) {
        node.businessInfo.isEnum = true;
        const enumInfo = stats.businessAnalytics.enumerations.get(node.name)!;
        const valueStr = JSON.stringify(node.value);
        const count = enumInfo.values.get(valueStr) || 0;
        const percentage = Math.round((count / enumInfo.totalCount) * 100);
        node.businessInfo.enumDistribution = `${percentage}%`;
      }

      // Check if it's a potential ID
      if (stats.businessAnalytics.potentialIds.has(node.name)) {
        node.businessInfo.isPotentialId = true;
      }

      // Add completeness info
      if (stats.businessAnalytics.dataCompleteness.has(node.name)) {
        node.businessInfo.completeness = stats.businessAnalytics.dataCompleteness.get(node.name);
      }

      // Check for anomalies
      if (stats.businessAnalytics.anomalies.has(node.name)) {
        const anomalies = stats.businessAnalytics.anomalies.get(node.name)!;
        if (anomalies.includes(JSON.stringify(node.value))) {
          node.businessInfo.isAnomaly = true;
        }
      }

      // Check for sensitive data
      if (stats.businessAnalytics.sensitiveData.has(node.name)) {
        node.businessInfo.isSensitive = true;
        node.businessInfo.dataType = stats.businessAnalytics.sensitiveData.get(node.name);
      }
    }
  });
}

function setupDisplayModeSelector(onChange: (mode: NodeDisplayMode) => void): void {
  const selector = document.getElementById("nodeDisplayMode") as HTMLSelectElement;
  if (selector) {
    selector.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      onChange(target.value as NodeDisplayMode);
    });
  }
}

function groupNodesByType(nodes: GraphNode[]): Map<string, GraphNode[]> {
  const groups = new Map<string, GraphNode[]>();

  nodes.forEach((node) => {
    if (!groups.has(node.type)) {
      groups.set(node.type, []);
    }
    groups.get(node.type)!.push(node);
  });

  return groups;
}

function highlightConnections(targetNode: any, allNodes: any, allLinks: any): void {
  // Dim all nodes and links
  allNodes.style("opacity", 0.2);
  allLinks.style("opacity", 0.1);

  // Highlight the target node
  allNodes.filter((d: any) => d.id === targetNode.id).style("opacity", 1);

  // Highlight connected nodes and links
  allLinks
    .filter((d: any) => d.source.id === targetNode.id || d.target.id === targetNode.id)
    .style("opacity", 1)
    .each(function (d: any) {
      allNodes.filter((n: any) => n.id === d.source.id || n.id === d.target.id).style("opacity", 1);
    });
}

function resetHighlight(allNodes: any, allLinks: any): void {
  allNodes.style("opacity", 1);
  allLinks.style("opacity", 0.6);
}

function showNodeDetails(panel: HTMLElement, node: GraphNode, stats: JSONStats): void {
  let html = `
    <div class="detail-item">
      <strong>Name:</strong> ${node.name}
    </div>
    <div class="detail-item">
      <strong>Type:</strong> ${node.type}
    </div>
    <div class="detail-item">
      <strong>Path:</strong> <code>${node.path}</code>
    </div>
    <div class="detail-item">
      <strong>Depth:</strong> ${node.depth}
    </div>
  `;

  if (node.type === "value") {
    html += `
      <div class="detail-item">
        <strong>Value:</strong> <code>${JSON.stringify(node.value)}</code>
      </div>
      <div class="detail-item">
        <strong>Value Type:</strong> ${node.valueType}
      </div>
    `;

    // Business analytics details
    if (node.businessInfo) {
      html += '<div class="detail-group"><h4>Business Analytics</h4>';

      if (node.businessInfo.isEnum) {
        const enumInfo = stats.businessAnalytics.enumerations.get(node.name)!;
        html += `<div class="detail-item"><strong>Enumeration:</strong> ${enumInfo.values.size} unique values</div>`;
        if (node.businessInfo.enumDistribution) {
          html += `<div class="detail-item"><strong>This Value:</strong> ${node.businessInfo.enumDistribution} of occurrences</div>`;
        }
      }

      if (node.businessInfo.isPotentialId) {
        html += `<div class="detail-item"><strong>Potential ID:</strong> All values are unique</div>`;
      }

      if (node.businessInfo.completeness !== undefined) {
        html += `<div class="detail-item"><strong>Completeness:</strong> ${Math.round(node.businessInfo.completeness)}%</div>`;
      }

      if (node.businessInfo.isAnomaly) {
        html += `<div class="detail-item" style="color: #dc2626;"><strong>⚠️ Anomaly:</strong> Rare value in enumeration</div>`;
      }

      if (node.businessInfo.isSensitive) {
        html += `<div class="detail-item" style="color: #dc2626;"><strong>🔒 Sensitive:</strong> ${node.businessInfo.dataType}</div>`;
      }

      html += "</div>";
    }

    // Numeric ranges
    if (stats.businessAnalytics.numericRanges.has(node.name)) {
      const range = stats.businessAnalytics.numericRanges.get(node.name)!;
      html += '<div class="detail-group"><h4>Numeric Analysis</h4>';
      html += `<div class="detail-item"><strong>Range:</strong> ${range.min} - ${range.max}</div>`;
      html += `<div class="detail-item"><strong>Average:</strong> ${range.avg.toFixed(2)}</div>`;
      if (range.isLikelyMonetary) {
        html += `<div class="detail-item"><strong>Type:</strong> Likely monetary value 💰</div>`;
      }
      html += "</div>";
    }
  } else if (node.type === "object") {
    html += `
      <div class="detail-item">
        <strong>Properties:</strong> ${node.childCount || 0}
      </div>
    `;
  } else if (node.type === "array") {
    html += `
      <div class="detail-item">
        <strong>Length:</strong> ${node.arrayLength || 0}
      </div>
    `;

    // Value distribution for arrays
    const dist = stats.businessAnalytics.valueDistributions.get(node.name);
    if (dist) {
      html += '<div class="detail-group"><h4>Array Analysis</h4>';
      html += `<div class="detail-item"><strong>Unique Values:</strong> ${dist.uniqueValues}</div>`;
      if (dist.uniqueValues === 1) {
        html += `<div class="detail-item"><strong>Pattern:</strong> All values are identical</div>`;
      }
      html += "</div>";
    }
  }

  // Show if this node's structure appears in patterns
  const relatedPatterns = stats.patterns.filter((p) => p.paths.includes(node.path!));
  if (relatedPatterns.length > 0) {
    html += '<div class="detail-group"><h4>Part of Patterns</h4>';
    relatedPatterns.forEach((pattern) => {
      html += `<div class="pattern-reference">${pattern.name}</div>`;
    });
    html += "</div>";
  }

  panel.innerHTML = html;
}
