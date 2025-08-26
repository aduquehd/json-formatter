'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import styles from './GraphView.module.css';
import {
  detectPatterns,
  displayStats,
  updateNodeLabels,
  analyzeBusinessLogic,
  setupDisplayModeSelector,
  highlightConnections,
  resetHighlight,
  showNodeDetails
} from './GraphViewHelpers';

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
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

type NodeDisplayMode = "keys" | "values" | "types" | "analytics" | "path" | "business";

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
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

interface GraphViewProps {
  json: any;
}

const GraphView: React.FC<GraphViewProps> = ({ json }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayMode, setDisplayMode] = useState<NodeDisplayMode>('values');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [stats, setStats] = useState<JSONStats | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!json || !containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Show loading indicator
    containerRef.current.innerHTML = 
      '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);"><div id="loading-text">Generating graph visualization...</div></div>';
    
    // Update loading text with translation
    setTimeout(() => {
      const loadingText = containerRef.current?.querySelector('#loading-text');
      if (loadingText && window.i18n) {
        loadingText.textContent = window.i18n.t('graph.generating') || 'Generating graph visualization...';
      }
    }, 0);

    // Small delay to show loading indicator
    setTimeout(() => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';
      generateGraphView(json, containerRef.current, displayMode, setSelectedNode, setStats);
    }, 50);
  }, [json]);

  // Update node labels when display mode changes
  useEffect(() => {
    if (!stats || !containerRef.current) return;
    
    const nodeTexts = d3.select(containerRef.current).selectAll('.node-label');
    const nodes = d3.select(containerRef.current).selectAll('.graph-node').data() as GraphNode[];
    
    if (nodes && nodes.length > 0) {
      updateNodeLabels(nodes, displayMode, stats);
      nodeTexts.text((d: any) => d.displayLabel || d.name);
    }
  }, [displayMode, stats]);

  if (!json) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">{mounted ? t('graph.noData') : 'No valid JSON to visualize'}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.graphContainer} />
  );
};

function generateGraphView(
  data: any, 
  container: HTMLElement, 
  initialDisplayMode: NodeDisplayMode,
  setSelectedNode: (node: GraphNode | null) => void,
  setStats: (stats: JSONStats) => void
): void {
  // Create layout with stats panel
  const layout = createLayout();
  container.appendChild(layout.container);

  const controls = createControls();
  layout.graphContainer.appendChild(controls);

  // Add display mode selector
  const displayModeSelector = createDisplayModeSelector(initialDisplayMode);
  layout.graphContainer.appendChild(displayModeSelector);

  const width = layout.graphContainer.clientWidth || 800;
  const height = layout.graphContainer.clientHeight || 600;

  // Ensure container has dimensions
  if (width === 0 || height === 0) {
    console.error("Container has no dimensions");
    setTimeout(() => generateGraphView(data, container, initialDisplayMode, setSelectedNode, setStats), 100);
    return;
  }

  const svg = d3
    .select(layout.graphContainer)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height].join(' '));

  const g = svg.append("g");

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on("zoom", (event) => {
      g.attr("transform", event.transform.toString());
    });

  svg.call(zoom);

  const graphData = convertJsonToGraph(data);
  const calculatedStats = analyzeJSONStructure(data, graphData.nodes);
  setStats(calculatedStats);

  // Display stats
  displayStats(layout.statsPanel, calculatedStats, graphData.nodes);

  // Set initial display mode to "values" for better default view
  updateNodeLabels(graphData.nodes, initialDisplayMode, calculatedStats);

  const simulation = d3
    .forceSimulation<GraphNode>(graphData.nodes)
    .force(
      "link",
      d3
        .forceLink<GraphNode, GraphLink>(graphData.links)
        .id((d) => d.id)
        .distance((d: any) => {
          // Adjust distance based on node types
          const source = d.source as GraphNode;
          const target = d.target as GraphNode;
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
        .forceRadial<GraphNode>(
          (d) => {
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
    .attr("class", "graph-link")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", 1);

  const node = g
    .append("g")
    .selectAll<SVGGElement, GraphNode>("g")
    .data(graphData.nodes)
    .enter()
    .append("g")
    .attr("class", (d) => `graph-node ${d.type}`)
    .call(drag(simulation));

  // Color scale based on depth
  const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, calculatedStats.maxDepth]);

  node
    .append("circle")
    .attr("r", (d) => {
      if (d.type === "root") return 15;
      if (d.type === "array") return 8 + Math.min(d.arrayLength || 0, 10) * 0.5;
      if (d.type === "object") return 8 + Math.min(d.childCount || 0, 10) * 0.3;
      return 6;
    })
    .style("fill", (d) => {
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
    })
    .style("stroke", "#fff")
    .style("stroke-width", 1.5);

  const nodeText = node
    .append("text")
    .attr("dy", -15)
    .attr("class", "node-label")
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "var(--text-primary)")
    .style("pointer-events", "none")
    .text((d) => d.displayLabel || d.name);

  const tooltip = createTooltip(layout.graphContainer);

  node
    .on("mouseover", function (event, d) {
      showTooltip(tooltip, event, d);
      highlightConnections(d, node, link);
    })
    .on("mouseout", function () {
      hideTooltip(tooltip);
      resetHighlight(node, link);
    })
    .on("click", function (event, d) {
      setSelectedNode(d);
      showNodeDetails(layout.detailsPanel, d, calculatedStats);
    });

  simulation.on("tick", () => {
    link
      .attr("x1", (d: any) => d.source.x)
      .attr("y1", (d: any) => d.source.y)
      .attr("x2", (d: any) => d.target.x)
      .attr("y2", (d: any) => d.target.y);

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });

  setupControls(svg, zoom);

  // Setup display mode selector
  setupDisplayModeSelector((mode: string) => {
    updateNodeLabels(graphData.nodes, mode as NodeDisplayMode, calculatedStats);
    nodeText.text((d) => d.displayLabel || d.name);
  });
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

function drag(simulation: d3.Simulation<GraphNode, undefined>) {
  function dragstarted(event: any, d: GraphNode) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event: any, d: GraphNode) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event: any, d: GraphNode) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag<SVGGElement, GraphNode>()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
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

function createDisplayModeSelector(currentMode: NodeDisplayMode): HTMLElement {
  const selector = document.createElement("div");
  selector.className = "display-mode-selector";
  selector.innerHTML = `
    <label for="nodeDisplayMode" id="node-display-label">Node Display:</label>
    <select id="nodeDisplayMode" class="display-mode-select">
      <option value="keys" ${currentMode === 'keys' ? 'selected' : ''}>Property Keys</option>
      <option value="values" ${currentMode === 'values' ? 'selected' : ''}>Value Preview</option>
      <option value="types" ${currentMode === 'types' ? 'selected' : ''}>Data Types</option>
      <option value="analytics" ${currentMode === 'analytics' ? 'selected' : ''}>Structure Analytics</option>
      <option value="business" ${currentMode === 'business' ? 'selected' : ''}>Business Logic</option>
      <option value="path" ${currentMode === 'path' ? 'selected' : ''}>Path Info</option>
    </select>
  `;
  
  // Update display mode selector with translations
  setTimeout(() => {
    const label = selector.querySelector('#node-display-label');
    const select = selector.querySelector('#nodeDisplayMode') as HTMLSelectElement;
    
    if (label && window.i18n) {
      label.textContent = window.i18n.t('graph.nodeDisplay') || 'Node Display:';
    }
    
    if (select && window.i18n) {
      const options = select.querySelectorAll('option');
      const translations: Record<string, string> = {
        'keys': window.i18n.t('graph.propertyKeys') || 'Property Keys',
        'values': window.i18n.t('graph.valuePreview') || 'Value Preview',
        'types': window.i18n.t('graph.dataTypes') || 'Data Types',
        'analytics': window.i18n.t('graph.structureAnalytics') || 'Structure Analytics',
        'business': window.i18n.t('graph.businessLogic') || 'Business Logic',
        'path': window.i18n.t('graph.pathInfo') || 'Path Info'
      };
      
      options.forEach(option => {
        const value = option.value;
        if (translations[value]) {
          option.textContent = translations[value];
        }
      });
    }
  }, 0);
  return selector;
}

function setupControls(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, zoom: d3.ZoomBehavior<SVGSVGElement, unknown>): void {
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

function showTooltip(tooltip: HTMLElement, event: MouseEvent, d: GraphNode): void {
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

  const rect = (event.currentTarget as Element).getBoundingClientRect();
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
        <h3 id="stats-title">JSON Statistics</h3>
        <div class="stats-content"></div>
      </div>
      <div class="details-panel">
        <h3 id="details-title">Node Details</h3>
        <div class="details-content">
          <p id="details-placeholder" style="color: var(--text-secondary);">Click a node to see details</p>
        </div>
      </div>
    </div>
    <div class="graph-container"></div>
  `;
  
  // Update text with translations after DOM is ready
  setTimeout(() => {
    const statsTitle = container.querySelector('#stats-title');
    const detailsTitle = container.querySelector('#details-title');
    const detailsPlaceholder = container.querySelector('#details-placeholder');
    
    if (statsTitle && window.i18n) {
      statsTitle.textContent = window.i18n.t('graph.statistics') || 'JSON Statistics';
    }
    if (detailsTitle && window.i18n) {
      detailsTitle.textContent = window.i18n.t('graph.nodeDetails') || 'Node Details';
    }
    if (detailsPlaceholder && window.i18n) {
      detailsPlaceholder.textContent = window.i18n.t('graph.clickNode') || 'Click a node to see details';
    }
  }, 0);

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

export default GraphView;