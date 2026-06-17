'use client';

import * as d3 from 'd3';
import { ChevronsDownUp, ChevronsUpDown, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './GraphView.module.css';

interface GraphViewProps {
  json: any;
}

interface JsonNode {
  name: string;
  type: 'object' | 'array' | 'value';
  path: string;
  value?: any;
  valueType?: string;
  children?: JsonNode[];
}

// Theme-aware value color (the CSS vars resolve per light/dark automatically).
function valueColor(valueType?: string): string {
  switch (valueType) {
    case 'string':
      return 'var(--tree-string)';
    case 'number':
      return 'var(--tree-number)';
    case 'boolean':
      return 'var(--tree-boolean)';
    case 'null':
      return 'var(--tree-null)';
    default:
      return 'var(--text-primary)';
  }
}

function preview(value: any): string {
  if (value === null) return 'null';
  if (typeof value === 'string') {
    return value.length > 28 ? `"${value.slice(0, 28)}…"` : `"${value}"`;
  }
  return String(value);
}

function buildTree(data: any, name: string, path: string): JsonNode {
  if (data !== null && Array.isArray(data)) {
    return {
      name,
      type: 'array',
      path,
      children: data.map((v, i) => buildTree(v, String(i), `${path}[${i}]`)),
    };
  }
  if (data !== null && typeof data === 'object') {
    return {
      name,
      type: 'object',
      path,
      children: Object.entries(data).map(([k, v]) => buildTree(v, k, `${path}.${k}`)),
    };
  }
  return {
    name,
    type: 'value',
    path,
    value: data,
    valueType: data === null ? 'null' : typeof data,
  };
}

const NODE_HEIGHT = 26; // vertical spacing between siblings
const LEVEL_WIDTH = 250; // horizontal spacing between depths
const INITIAL_DEPTH = 2; // collapse nodes at this depth and deeper on load

const GraphView: React.FC<GraphViewProps> = ({ json }) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{
    zoom: (factor: number) => void;
    fit: () => void;
    expandAll: () => void;
    collapseAll: () => void;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !json) return;
    container.innerHTML = '';

    const rootLabel = Array.isArray(json)
      ? '[ ]'
      : json !== null && typeof json === 'object'
        ? '{ }'
        : 'value';
    const rootData = buildTree(json, rootLabel, '$');

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('display', 'block');
    const g = svg.append('g');

    const gLink = g
      .append('g')
      .attr('fill', 'none')
      .attr('stroke', 'var(--border-color)')
      .attr('stroke-width', 1.2)
      .attr('stroke-opacity', 0.9);
    const gNode = g.append('g');

    const tooltip = d3
      .select(container)
      .append('div')
      .attr('class', styles.tooltip)
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('z-index', '10')
      .style('opacity', '0');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 2.5])
      .on('zoom', (event) => g.attr('transform', event.transform.toString()));
    svg.call(zoom as any);

    const tree = d3.tree<JsonNode>().nodeSize([NODE_HEIGHT, LEVEL_WIDTH]);
    const diagonal = d3
      .linkHorizontal<any, any>()
      .x((d) => d.y)
      .y((d) => d.x);

    const root: any = d3.hierarchy<JsonNode>(rootData);
    let uid = 0;
    root.descendants().forEach((d: any) => {
      d.id = ++uid;
      d._children = d.children;
      if (d.depth >= INITIAL_DEPTH) d.children = null;
    });
    root.x0 = 0;
    root.y0 = 0;

    const isCollapsed = (d: any) => d._children && !d.children;
    const hasToggle = (d: any) => Boolean(d._children || d.children);

    function renderLabel(sel: d3.Selection<any, any, any, any>, d: any) {
      sel.selectAll('*').remove();
      const data: JsonNode = d.data;
      if (data.type === 'value') {
        sel.append('tspan').style('fill', 'var(--json-key)').text(data.name);
        sel.append('tspan').style('fill', 'var(--text-muted)').text(': ');
        sel.append('tspan').style('fill', valueColor(data.valueType)).text(preview(data.value));
      } else {
        const n = data.children ? data.children.length : 0;
        const wrap = data.type === 'array' ? ['[', ']'] : ['{', '}'];
        sel
          .append('tspan')
          .style('fill', 'var(--json-key)')
          .text(data.name + ' ');
        sel.append('tspan').style('fill', 'var(--text-muted)').text(`${wrap[0]}${n}${wrap[1]}`);
      }
      if (isCollapsed(d)) {
        sel
          .append('tspan')
          .style('fill', 'var(--accent-color)')
          .style('font-weight', '700')
          .text('  +');
      }
    }

    function showTip(event: MouseEvent, d: any) {
      const data: JsonNode = d.data;
      const count = data.children ? data.children.length : 0;
      let html = `<div class="${styles.tipPath}">${data.path}</div>`;
      if (data.type === 'value') {
        html += `<div class="${styles.tipVal}">${preview(data.value)} <span class="${styles.tipType}">${data.valueType}</span></div>`;
      } else {
        html += `<div class="${styles.tipType}">${data.type} · ${count} ${data.type === 'array' ? 'items' : 'keys'}</div>`;
      }
      tooltip.html(html).style('opacity', '1');
      moveTip(event);
    }
    function moveTip(event: MouseEvent) {
      const [mx, my] = d3.pointer(event, container);
      tooltip.style('left', `${mx + 16}px`).style('top', `${my + 16}px`);
    }
    function hideTip() {
      tooltip.style('opacity', '0');
    }

    function update(source: any) {
      tree(root);
      const nodes = root.descendants();
      const links = root.links();
      const tr = svg.transition().duration(240) as any;

      const node = gNode.selectAll<SVGGElement, any>('g.node').data(nodes, (d: any) => d.id);

      const nodeEnter = node
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', `translate(${source.y0},${source.x0})`)
        .attr('opacity', 0)
        .style('cursor', (d: any) => (hasToggle(d) ? 'pointer' : 'default'))
        .on('click', (_event: any, d: any) => {
          if (!hasToggle(d)) return;
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
          }
          update(d);
        })
        .on('mouseenter', (event: any, d: any) => showTip(event, d))
        .on('mousemove', (event: any) => moveTip(event))
        .on('mouseleave', hideTip);

      nodeEnter.append('circle').attr('r', 4.5).attr('stroke-width', 1.5);
      nodeEnter.append('text').attr('dy', '0.32em').attr('x', 10).attr('text-anchor', 'start');

      const nodeAll = node.merge(nodeEnter);
      nodeAll
        .transition(tr)
        .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
        .attr('opacity', 1);
      nodeAll
        .select('circle')
        .style('fill', (d: any) =>
          isCollapsed(d)
            ? 'var(--accent-color)'
            : d.children
              ? 'var(--bg-secondary)'
              : valueColor(d.data.valueType)
        )
        .style('stroke', (d: any) => (hasToggle(d) ? 'var(--accent-color)' : 'none'));
      nodeAll.select('text').each(function (d: any) {
        renderLabel(d3.select(this), d);
      });

      node
        .exit()
        .transition(tr)
        .attr('transform', `translate(${source.y},${source.x})`)
        .attr('opacity', 0)
        .remove();

      const link = gLink
        .selectAll<SVGPathElement, any>('path')
        .data(links, (d: any) => d.target.id);
      const linkEnter = link
        .enter()
        .append('path')
        .attr('d', () => {
          const o = { x: source.x0, y: source.y0 };
          return diagonal({ source: o, target: o } as any);
        });
      link
        .merge(linkEnter)
        .transition(tr)
        .attr('d', diagonal as any);
      link
        .exit()
        .transition(tr)
        .attr('d', () => {
          const o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o } as any);
        })
        .remove();

      root.eachBefore((d: any) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    function fit() {
      const node = g.node() as SVGGElement | null;
      if (!node) return;
      const b = node.getBBox();
      if (!b.width || !b.height) return;
      const fw = container!.clientWidth || 800;
      const fh = container!.clientHeight || 600;
      const raw = 0.86 / Math.max(b.width / fw, b.height / fh);
      // Floor the scale so huge fully-expanded trees stay legible (pan instead
      // of shrinking to an invisible sliver). Root stays anchored on the left.
      const scale = Math.max(0.4, Math.min(1.3, raw || 1));
      const tx = 48 - scale * b.x;
      const ty = fh / 2 - scale * (b.y + b.height / 2);
      svg
        .transition()
        .duration(300)
        .call(zoom.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }

    apiRef.current = {
      zoom: (factor) =>
        svg
          .transition()
          .duration(200)
          .call(zoom.scaleBy as any, factor),
      fit,
      expandAll: () => {
        root.each((d: any) => {
          if (d._children) d.children = d._children;
        });
        update(root);
        setTimeout(fit, 260);
      },
      collapseAll: () => {
        root.descendants().forEach((d: any) => {
          if (d.depth >= 1 && d.children) {
            d._children = d.children;
            d.children = null;
          }
        });
        update(root);
        setTimeout(fit, 260);
      },
    };

    update(root);
    setTimeout(fit, 60);

    return () => {
      apiRef.current = null;
      container.innerHTML = '';
    };
  }, [json]);

  if (!json) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">
          {t('graph.noData', 'No valid JSON to visualize')}
        </p>
      </div>
    );
  }

  // Structural layout (size/position) uses Tailwind utilities so it never
  // depends on the dynamically-loaded CSS module; the module adds cosmetics.
  const btnCls =
    'w-8 h-8 flex items-center justify-center rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--accent-color)] hover:border-[var(--border-hover)] transition-colors';

  return (
    <div className={`${styles.wrap} absolute inset-0 overflow-hidden`}>
      <div className={`${styles.controls} absolute top-3 right-3 z-10 flex flex-col gap-1.5`}>
        <button
          className={btnCls}
          onClick={() => apiRef.current?.zoom(1.3)}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          className={btnCls}
          onClick={() => apiRef.current?.zoom(0.75)}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          className={btnCls}
          onClick={() => apiRef.current?.fit()}
          title="Fit to screen"
          aria-label="Fit to screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          className={btnCls}
          onClick={() => apiRef.current?.expandAll()}
          title="Expand all"
          aria-label="Expand all"
        >
          <ChevronsUpDown className="w-4 h-4" />
        </button>
        <button
          className={btnCls}
          onClick={() => apiRef.current?.collapseAll()}
          title="Collapse all"
          aria-label="Collapse all"
        >
          <ChevronsDownUp className="w-4 h-4" />
        </button>
      </div>
      <div
        className={`${styles.hint} absolute bottom-3 left-3 z-10 pointer-events-none font-mono text-[11px] text-[var(--text-muted)]`}
      >
        click a node to expand / collapse · scroll to zoom · drag to pan
      </div>
      <div ref={containerRef} className={`${styles.canvas} absolute inset-0`} />
    </div>
  );
};

export default GraphView;
