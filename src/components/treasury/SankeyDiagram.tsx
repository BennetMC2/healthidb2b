import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { formatCurrency } from '@/utils/format';

interface SankeyDiagramProps {
  budget: number;
  yield_: number;
  buyingPower: number;
  totalValue: number;
}

interface SankeyNode {
  name: string;
  value?: number;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export default function SankeyDiagram({ budget, yield_, buyingPower, totalValue }: SankeyDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 180;
    const margin = { top: 8, right: 80, bottom: 8, left: 80 };

    const nodes: SankeyNode[] = [
      { name: 'Budget' },
      { name: 'T-Bill Yield' },
      { name: 'Buying Power' },
      { name: 'User Value' },
    ];

    const links: SankeyLink[] = [
      { source: 0, target: 1, value: yield_ },
      { source: 0, target: 2, value: buyingPower },
      { source: 0, target: 3, value: budget - yield_ - buyingPower },
      { source: 1, target: 3, value: yield_ },
      { source: 2, target: 3, value: buyingPower },
    ];

    const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(12)
      .nodePadding(16)
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ]);

    const graph = sankeyGenerator({
      nodes: nodes.map((d) => ({ ...d })),
      links: links.map((d) => ({ ...d })),
    });

    // Links
    svg
      .append('g')
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', '#4ca5ff')
      .attr('stroke-opacity', 0.15)
      .attr('stroke-width', (d) => Math.max(1, (d as { width?: number }).width || 1));

    // Nodes
    svg
      .append('g')
      .selectAll('rect')
      .data(graph.nodes)
      .join('rect')
      .attr('x', (d) => (d as { x0?: number }).x0 || 0)
      .attr('y', (d) => (d as { y0?: number }).y0 || 0)
      .attr('width', (d) => ((d as { x1?: number }).x1 || 0) - ((d as { x0?: number }).x0 || 0))
      .attr('height', (d) => Math.max(1, ((d as { y1?: number }).y1 || 0) - ((d as { y0?: number }).y0 || 0)))
      .attr('fill', '#4ca5ff')
      .attr('fill-opacity', 0.3)
      .attr('rx', 2);

    // Labels
    svg
      .append('g')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', (d) => {
        const x0 = (d as { x0?: number }).x0 || 0;
        const x1 = (d as { x1?: number }).x1 || 0;
        return x0 < width / 2 ? x0 - 6 : x1 + 6;
      })
      .attr('y', (d) => (((d as { y0?: number }).y0 || 0) + ((d as { y1?: number }).y1 || 0)) / 2)
      .attr('text-anchor', (d) => ((d as { x0?: number }).x0 || 0) < width / 2 ? 'end' : 'start')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#8b8fa3')
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text((d) => d.name || '');

    // Value labels
    svg
      .append('g')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', (d) => {
        const x0 = (d as { x0?: number }).x0 || 0;
        const x1 = (d as { x1?: number }).x1 || 0;
        return x0 < width / 2 ? x0 - 6 : x1 + 6;
      })
      .attr('y', (d) => (((d as { y0?: number }).y0 || 0) + ((d as { y1?: number }).y1 || 0)) / 2 + 12)
      .attr('text-anchor', (d) => ((d as { x0?: number }).x0 || 0) < width / 2 ? 'end' : 'start')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#5c6070')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text((_d, i) => {
        const values = [budget, yield_, buyingPower, totalValue];
        return formatCurrency(values[i]);
      });
  }, [budget, yield_, buyingPower, totalValue]);

  return <svg ref={svgRef} className="w-full h-[180px]" />;
}
