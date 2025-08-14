'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface GraphViewProps {
  json: any;
}

const GraphView: React.FC<GraphViewProps> = ({ json }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!json || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const g = svg.append('g');

    // Convert JSON to hierarchical data
    const root = d3.hierarchy({ name: 'root', children: jsonToHierarchy(json) });
    
    const treeLayout = d3.tree().size([height - 100, width - 200]);
    treeLayout(root);

    // Draw links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('d', d3.linkHorizontal()
        .x((d: any) => d.y + 100)
        .y((d: any) => d.x + 50) as any);

    // Draw nodes
    const node = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y + 100},${d.x + 50})`);

    node.append('circle')
      .attr('r', 4)
      .attr('fill', (d: any) => d.children ? '#69b3a2' : '#999');

    node.append('text')
      .attr('dy', '.35em')
      .attr('x', (d: any) => d.children ? -10 : 10)
      .style('text-anchor', (d: any) => d.children ? 'end' : 'start')
      .style('font-size', '12px')
      .style('fill', 'var(--text-primary)')
      .text((d: any) => d.data.name);

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

  }, [json]);

  const jsonToHierarchy = (obj: any): any[] => {
    if (!obj || typeof obj !== 'object') return [];
    
    return Object.entries(obj).map(([key, value]) => {
      if (value && typeof value === 'object') {
        return {
          name: key,
          children: jsonToHierarchy(value)
        };
      }
      return {
        name: `${key}: ${JSON.stringify(value)}`
      };
    });
  };

  if (!json) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">No valid JSON to visualize</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default GraphView;