"use strict";

declare const d3: any;

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
}

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
}

interface Pattern {
  name: string;
  occurrences: number;
  paths: string[];
}

export function generateGraphView(data: any, container: HTMLElement): void {
  // Check if d3 is available
  if (typeof d3 === "undefined") {
    console.error("D3.js is not loaded");
    container.innerHTML =
      '<div style="padding: 20px; color: red;">Error: D3.js library not loaded</div>';
    return;
  }

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
      .force("radial", d3.forceRadial((d: any) => {
        // Create radial grouping by type
        if (d.type === "root") return 0;
        if (d.type === "object") return 150;
        if (d.type === "array") return 250;
        return 350;
      }, 0, 0).strength(0.1));

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
      .call(drag(simulation));

    // Color scale based on depth
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain([0, stats.maxDepth]);
    
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

    node
      .append("text")
      .attr("dy", -15)
      .text((d: any) => d.name);

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

    setupControls(svg, zoom);
  }, 50);
}

function convertJsonToGraph(data: any): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  let nodeId = 0;

  function traverse(obj: any, parentId: string | null, key: string, depth: number, path: string): string {
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

function drag(simulation: any) {
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
    <button class="graph-control-btn" id="zoomInBtn" title="Zoom In">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
    </button>
    <button class="graph-control-btn" id="zoomOutBtn" title="Zoom Out">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
    </button>
    <button class="graph-control-btn" id="resetZoomBtn" title="Reset Zoom">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
      </svg>
    </button>
  `;
  return controls;
}

function setupControls(svg: any, zoom: any): void {
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

function createLayout(): { container: HTMLElement; graphContainer: HTMLElement; statsPanel: HTMLElement; detailsPanel: HTMLElement } {
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
    detailsPanel: container.querySelector(".details-content")!
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
    patterns: []
  };
  
  nodes.forEach(node => {
    // Count node types
    if (node.type === "object") stats.objectCount++;
    else if (node.type === "array") {
      stats.arrayCount++;
      if (node.arrayLength !== undefined) {
        stats.arrayLengths.push(node.arrayLength);
      }
    }
    else if (node.type === "value") stats.valueCount++;
    
    // Track max depth
    if (node.depth > stats.maxDepth) stats.maxDepth = node.depth;
    
    // Track key frequency (excluding array indices)
    if (node.type !== "root" && !node.name.startsWith("[")) {
      stats.keyFrequency.set(node.name, (stats.keyFrequency.get(node.name) || 0) + 1);
    }
    
    // Track value type distribution
    if (node.valueType) {
      stats.typeDistribution.set(node.valueType, (stats.typeDistribution.get(node.valueType) || 0) + 1);
    }
  });
  
  // Detect patterns (repeated structures)
  detectPatterns(nodes, stats);
  
  return stats;
}

function detectPatterns(nodes: GraphNode[], stats: JSONStats): void {
  // Find repeated object structures
  const structureMap = new Map<string, string[]>();
  
  nodes.filter(n => n.type === "object").forEach(node => {
    const children = nodes.filter(n => n.path?.startsWith(node.path + ".") && n.path.split(".").length === node.path!.split(".").length + 1);
    const structure = children.map(c => c.name).sort().join(",");
    
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
        paths: paths.slice(0, 5) // Limit to first 5 examples
      });
    }
  });
}

function displayStats(panel: HTMLElement, stats: JSONStats, nodes: GraphNode[]): void {
  let html = `
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
    html += '</div>';
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
    html += '</div>';
  }
  
  // Patterns
  if (stats.patterns.length > 0) {
    html += '<div class="stat-group"><h4>Patterns Found</h4>';
    stats.patterns.slice(0, 3).forEach(pattern => {
      html += `
        <div class="pattern-item">
          <div class="pattern-name">${pattern.name}</div>
          <div class="pattern-count">${pattern.occurrences} occurrences</div>
        </div>
      `;
    });
    html += '</div>';
  }
  
  panel.innerHTML = html;
}

function groupNodesByType(nodes: GraphNode[]): Map<string, GraphNode[]> {
  const groups = new Map<string, GraphNode[]>();
  
  nodes.forEach(node => {
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
    .each(function(d: any) {
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
  }
  
  // Show if this node's structure appears in patterns
  const relatedPatterns = stats.patterns.filter(p => p.paths.includes(node.path!));
  if (relatedPatterns.length > 0) {
    html += '<div class="detail-group"><h4>Part of Patterns</h4>';
    relatedPatterns.forEach(pattern => {
      html += `<div class="pattern-reference">${pattern.name}</div>`;
    });
    html += '</div>';
  }
  
  panel.innerHTML = html;
}
