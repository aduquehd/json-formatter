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
}

interface GraphLink {
  source: string;
  target: string;
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

    const controls = createControls();
    container.appendChild(controls);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Ensure container has dimensions
    if (width === 0 || height === 0) {
      console.error("Container has no dimensions");
      setTimeout(() => generateGraphView(data, container), 100);
      return;
    }

    const svg = d3
      .select(container)
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

    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink(graphData.links)
          .id((d: any) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(0, 0))
      .force("collision", d3.forceCollide().radius(30));

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

    node
      .append("circle")
      .attr("r", (d: any) => (d.type === "root" ? 12 : d.type === "value" ? 6 : 8));

    node
      .append("text")
      .attr("dy", -15)
      .text((d: any) => d.name);

    const tooltip = createTooltip(container);

    node
      .on("mouseover", function (event: any, d: any) {
        showTooltip(tooltip, event, d);
      })
      .on("mouseout", function () {
        hideTooltip(tooltip);
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

  function traverse(obj: any, parentId: string | null, key: string, depth: number): string {
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
    };

    nodes.push(node);

    if (parentId) {
      links.push({ source: parentId, target: id });
    }

    if (type === "object" && obj !== null) {
      Object.keys(obj).forEach((k) => {
        traverse(obj[k], id, k, depth + 1);
      });
    } else if (type === "array") {
      obj.forEach((item: any, index: number) => {
        traverse(item, id, `[${index}]`, depth + 1);
      });
    }

    return id;
  }

  traverse(data, null, "root", 0);

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
  if (d.type === "value" && d.value !== undefined) {
    content += `<br>Value: ${JSON.stringify(d.value)}`;
  } else if (d.type === "object" || d.type === "array") {
    content += `<br>Type: ${d.type}`;
  }

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
