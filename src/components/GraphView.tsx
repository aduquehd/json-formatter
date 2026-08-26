'use client';

import * as d3 from 'd3';
import { ChevronsDownUp, ChevronsUpDown, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { buildTooltipModel, buildTree, type JsonNode, previewValue } from '@/utils/graphData';
import { exceedsJsonDepth, MAX_JSON_DEPTH, runDepthGuarded } from '@/utils/jsonWalk';
import DepthLimitNotice from './DepthLimitNotice';
import styles from './GraphView.module.css';

interface GraphViewProps {
  json: any;
  /**
   * Whether the editor holds a document at all. Carried explicitly rather than
   * inferred from `json`, because `null`, `0`, `false` and `""` are valid JSON
   * documents that a truthiness test reports as "nothing to visualise" — while
   * the status bar, which does carry the flag, calls the same document valid.
   */
  isValid: boolean;
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

const NODE_HEIGHT = 26; // vertical spacing between siblings
const LEVEL_WIDTH = 250; // horizontal spacing between depths
const INITIAL_DEPTH = 2; // collapse nodes at this depth and deeper on load

const GraphView: React.FC<GraphViewProps> = ({ json, isValid }) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{
    zoom: (factor: number) => void;
    fit: () => void;
    expandAll: () => void;
    collapseAll: () => void;
  } | null>(null);

  // Asked with the iterative probe, before anything recursive touches the
  // document. Derived during render (the React Compiler memoizes it on `json`)
  // rather than set from the effect, which would mean a cascading render.
  const tooDeep = json != null && exceedsJsonDepth(json);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isValid || tooDeep) return;
    container.replaceChildren();

    // Every `setTimeout` scheduled by this effect lands here so cleanup can
    // cancel it; a fit() that fires after unmount would call getBBox() on a
    // detached <g>, which throws NS_ERROR_FAILURE in Firefox.
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const scheduleFit = (delay: number) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fit();
      }, delay);
      timers.add(id);
    };

    const rootLabel = Array.isArray(json)
      ? '[ ]'
      : json !== null && typeof json === 'object'
        ? '{ }'
        : 'value';
    // Belt and braces behind the probe above: if the two ever disagreed, an
    // empty canvas beats an error boundary.
    const built = runDepthGuarded(() => buildTree(json, rootLabel, '$'));
    if (!built.ok) return;
    const rootData = built.value;

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
        sel
          .append('tspan')
          .style('fill', valueColor(data.valueType))
          .text(previewValue(data.value));
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
      const tip = buildTooltipModel(d.data as JsonNode);
      // Built with DOM nodes and .text(), never .html(): the path and the value
      // are raw user JSON, so anything that parsed them as markup would execute
      // a key like `<img src=x onerror=…>` on hover.
      tooltip.selectAll('*').remove();
      tooltip.append('div').attr('class', styles.tipPath).text(tip.path);
      if (tip.kind === 'value') {
        // .text() wipes children, so it has to run before the type span is
        // appended — the trailing space is the separator the old markup had.
        tooltip
          .append('div')
          .attr('class', styles.tipVal)
          .text(`${tip.value} `)
          .append('span')
          .attr('class', styles.tipType)
          .text(tip.valueType);
      } else {
        tooltip.append('div').attr('class', styles.tipType).text(tip.summary);
      }
      tooltip.style('opacity', '1');
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
      // getBBox() on a detached / non-rendered element throws NS_ERROR_FAILURE in
      // Firefox, so bail out if this graph was torn down since fit() was queued.
      if (!node || !node.isConnected) return;
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
        scheduleFit(260);
      },
      collapseAll: () => {
        root.descendants().forEach((d: any) => {
          if (d.depth >= 1 && d.children) {
            d._children = d.children;
            d.children = null;
          }
        });
        update(root);
        scheduleFit(260);
      },
    };

    update(root);
    scheduleFit(60);

    return () => {
      for (const id of timers) clearTimeout(id);
      timers.clear();
      // The 240–300ms node/link/zoom transitions keep ticking after the nodes
      // are detached, so stop them before tearing the DOM down.
      svg.interrupt();
      svg.selectAll('*').interrupt();
      // d3-zoom's listeners live on the <svg> we are about to drop, but a
      // gesture in flight also holds window-level ones; detaching them here
      // keeps nothing pointed at this effect's closure.
      svg.on('.zoom', null);
      apiRef.current = null;
      container.replaceChildren();
    };
  }, [json, isValid, tooDeep]);

  if (!isValid) {
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

  const zoomInLabel = t('graph.zoomIn', 'Zoom in');
  const zoomOutLabel = t('graph.zoomOut', 'Zoom out');
  const fitLabel = t('graph.fitToScreen', 'Fit to screen');
  const expandLabel = t('graph.expandAll', 'Expand all');
  const collapseLabel = t('graph.collapseAll', 'Collapse all');

  return (
    <div className={`${styles.wrap} absolute inset-0 overflow-hidden`}>
      {tooDeep ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg-primary)]">
          <DepthLimitNotice limit={MAX_JSON_DEPTH} />
        </div>
      ) : (
        <>
          <div className={`${styles.controls} absolute top-3 right-3 z-10 flex flex-col gap-1.5`}>
            <button
              className={btnCls}
              onClick={() => apiRef.current?.zoom(1.3)}
              title={zoomInLabel}
              aria-label={zoomInLabel}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              className={btnCls}
              onClick={() => apiRef.current?.zoom(0.75)}
              title={zoomOutLabel}
              aria-label={zoomOutLabel}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              className={btnCls}
              onClick={() => apiRef.current?.fit()}
              title={fitLabel}
              aria-label={fitLabel}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              className={btnCls}
              onClick={() => apiRef.current?.expandAll()}
              title={expandLabel}
              aria-label={expandLabel}
            >
              <ChevronsUpDown className="w-4 h-4" />
            </button>
            <button
              className={btnCls}
              onClick={() => apiRef.current?.collapseAll()}
              title={collapseLabel}
              aria-label={collapseLabel}
            >
              <ChevronsDownUp className="w-4 h-4" />
            </button>
          </div>
          <div
            className={`${styles.hint} absolute bottom-3 left-3 z-10 pointer-events-none font-mono text-[11px] text-[var(--text-muted)]`}
          >
            {t('graph.hint', 'click a node to expand / collapse · scroll to zoom · drag to pan')}
          </div>
        </>
      )}
      {/* Always mounted, in both branches: unmounting it would null out
          `containerRef` and the effect would then refuse every later document. */}
      <div ref={containerRef} className={`${styles.canvas} absolute inset-0`} />
    </div>
  );
};

export default GraphView;
