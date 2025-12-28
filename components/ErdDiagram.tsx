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
  width: number;
  height: number;
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
      .attr("refX", 9) // Point of the arrow
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
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
    const nodes: SimNode[] = data.tables.map(t => ({ 
        id: t.id, 
        table: t,
        width: 150,
        height: 65
    }));
    // Create a deep copy of links for D3 to mutate
    const links: SimLink[] = data.relationships.map(r => ({ ...r }));

    // Force Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(220)) // Increased for label room
      .force("charge", d3.forceManyBody().strength(-1200)) // Stronger repelling
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(120).iterations(3)); // Stronger collision circular approximation

    // Render Links (Groups)
    const link = g.append("g")
      .selectAll("g")
      .data(links)
      .join("g");

    const linkLine = link.append("line")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrowhead)");

    const linkLabel = link.append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", "9px")
      .attr("dy", -5)
      .text(d => (d as any).label || "");

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
      .attr("width", d => d.width)
      .attr("height", d => d.height)
      .attr("x", d => -d.width / 2)
      .attr("y", d => -d.height / 2)
      .attr("rx", 10)
      .attr("fill", "#0f172a")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0 0 8px rgba(56, 189, 248, 0.2))")
      .attr("class", "transition-all duration-300 hover:fill-slate-900 shadow-2xl");

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
      linkLine.each(function(d: any) {
        const sourceNode = d.source as SimNode;
        const targetNode = d.target as SimNode;
        
        // Calculate the intersection of the link with the source and target rectangles
        const dx = (targetNode as any).x - (sourceNode as any).x;
        const dy = (targetNode as any).y - (sourceNode as any).y;
        
        const getIntersection = (node: SimNode, directionX: number, directionY: number) => {
          const absDx = Math.abs(directionX);
          const absDy = Math.abs(directionY);
          
          if (absDx === 0 && absDy === 0) return { x: (node as any).x, y: (node as any).y };
          
          const scaleW = (node.width / 2) / absDx;
          const scaleH = (node.height / 2) / absDy;
          const scale = Math.min(scaleW, scaleH);
          
          return {
            x: (node as any).x + directionX * scale,
            y: (node as any).y + directionY * scale
          };
        };
        
        const start = getIntersection(sourceNode, dx, dy);
        const end = getIntersection(targetNode, -dx, -dy);
        
        d3.select(this)
          .attr("x1", start.x)
          .attr("y1", start.y)
          .attr("x2", end.x)
          .attr("y2", end.y);
      });

      linkLabel
        .attr("x", (d: any) => ((d.source as any).x + (d.target as any).x) / 2)
        .attr("y", (d: any) => ((d.source as any).y + (d.target as any).y) / 2)
        .attr("transform", (d: any) => {
          const s = d.source as any;
          const t = d.target as any;
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          const rotation = (angle > 90 || angle < -90) ? angle + 180 : angle;
          return `rotate(${rotation}, ${(s.x + t.x) / 2}, ${(s.y + t.y) / 2})`;
        });

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