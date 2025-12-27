import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SchemaData, Table, Relationship } from '../types';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface ErdDiagramProps {
  data: SchemaData;
  onNodeClick: (table: Table) => void;
}

// Extend d3 types for simulation nodes
interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  table: Table;
  width?: number;
  height?: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
  label?: string;
}

export const ErdDiagram: React.FC<ErdDiagramProps> = ({ data, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.tables.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("font-family", "JetBrains Mono");

    // Define Arrow Marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25) // Offset to not overlap node
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748b");

    const g = svg.append("g"); // Group for zooming

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Prepare Nodes and Links
    const nodes: SimNode[] = data.tables.map(t => ({ id: t.id, table: t }));
    // Create a deep copy of links for D3 to mutate
    const links: SimLink[] = data.relationships.map(r => ({ ...r }));

    // Force Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(80).iterations(2));

    // Render Links
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrowhead)");

    // Render Nodes (Groups)
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "grab")
      .call(d3.drag<SVGGElement, SimNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node Rectangle
    node.append("rect")
      .attr("width", 140)
      .attr("height", 60)
      .attr("x", -70)
      .attr("y", -30)
      .attr("rx", 6)
      .attr("fill", "#1e293b")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 1)
      .attr("class", "transition-colors duration-200 hover:fill-slate-800 shadow-lg");

    // Table Name
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-5")
      .attr("fill", "#e2e8f0")
      .attr("font-weight", "bold")
      .attr("font-size", "12px")
      .text(d => d.table.name.length > 15 ? d.table.name.substring(0, 15) + '...' : d.table.name);

    // Column Count subtitle
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "15")
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .text(d => `${d.table.columns.length} columns`);

    // Click interaction
    node.on("click", (event, d) => {
        onNodeClick(d.table);
        // Highlight logic could go here
        node.select('rect').attr('stroke', '#38bdf8').attr('stroke-width', 1);
        d3.select(event.currentTarget).select('rect').attr('stroke', '#ec4899').attr('stroke-width', 2);
    });

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      d3.select(this).attr("cursor", "grabbing");
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      d3.select(this).attr("cursor", "grab");
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data]); // Re-run when data changes

  const handleReset = () => {
     // Trigger re-render effectively by parent, or just simple internal reset logic
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-950">
      <div className="absolute top-4 left-4 z-10 flex gap-2 bg-slate-900/80 p-1 rounded-lg backdrop-blur border border-slate-800">
        <div className="px-2 py-1 text-xs text-slate-400 font-mono">
            {data.tables.length} Entities • {data.relationships.length} Relations
        </div>
      </div>
      
      <svg ref={svgRef} className="w-full h-full block" />
      
      {data.tables.length === 0 && (
         <div className="absolute inset-0 flex items-center justify-center text-slate-500 pointer-events-none">
            <p>Parse SQL to generate visualization</p>
         </div>
      )}
    </div>
  );
};