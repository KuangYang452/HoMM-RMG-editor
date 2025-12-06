
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { RmgFile, GraphNode, GraphLink } from '../types';

interface MapGraphProps {
  data: RmgFile;
  onSelectNode: (id: string | null) => void;
  onSelectLink: (id: string | null) => void;
  selectedId: string | null;
  minimapRef: React.RefObject<SVGSVGElement | null>;
}

// 8 Distinct Colors for Portals
const PORTAL_COLORS = [
    "#22d3ee", // Cyan
    "#f472b6", // Pink
    "#a3e635", // Lime
    "#c084fc", // Purple
    "#fb923c", // Orange
    "#2dd4bf", // Teal
    "#f87171", // Red
    "#fbbf24", // Amber
];

// 8 Player Colors (Brighter for Text/Icon on Dark Background)
const getPlayerColor = (player: string | undefined) => {
    switch (player) {
        case 'Player1': return '#ef4444'; // Red-500
        case 'Player2': return '#3b82f6'; // Blue-500
        case 'Player3': return '#22c55e'; // Green-500
        case 'Player4': return '#f97316'; // Orange-500
        case 'Player5': return '#a855f7'; // Purple-500
        case 'Player6': return '#22d3ee'; // Cyan-400
        case 'Player7': return '#ec4899'; // Pink-500
        case 'Player8': return '#cbd5e1'; // Slate-300
        default: return '#94a3b8'; // Slate-400
    }
};

// Helper for guard background color based on value
const getGuardFillColor = (val: number) => {
    if (val >= 40000) return "#7f1d1d"; // Red/Dark for heavy
    if (val >= 10000) return "#854d0e"; // Brown/Orange for mid
    if (val > 0) return "#14532d"; // Green for low
    return "#1e293b"; // Slate for zero/unknown
};

interface ProcessedLink extends GraphLink {
    linkIndex: number;
    linkCount: number;
}

const MapGraph: React.FC<MapGraphProps> = ({ data, onSelectNode, onSelectLink, selectedId, minimapRef }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const onSelectNodeRef = useRef(onSelectNode);
  const onSelectLinkRef = useRef(onSelectLink);

  // Refs for Minimap D3 selections (so main loop can update them without re-binding)
  const miniNodesRef = useRef<d3.Selection<SVGCircleElement, GraphNode, SVGGElement, unknown> | null>(null);
  const miniLinksRef = useRef<d3.Selection<SVGLineElement, ProcessedLink, SVGGElement, unknown> | null>(null);
  const miniViewportRef = useRef<d3.Selection<SVGRectElement, unknown, null, undefined> | null>(null);
  const minimapScaleRef = useRef<number>(1);

  // Dynamic World Size Calculation
  // User Requirement: 10 times the map template's x, y values
  const worldWidth = Math.max((data.sizeX || 64) * 10, 500); // Minimum safety width
  const worldHeight = Math.max((data.sizeZ || 64) * 10, 500);

  useEffect(() => {
    onSelectNodeRef.current = onSelectNode;
    onSelectLinkRef.current = onSelectLink;
  }, [onSelectNode, onSelectLink]);
  
  const nodePositions = useRef<Map<string, {x: number, y: number, fx?: number | null, fy?: number | null}>>(new Map());
  
  // Initialize zoom
  const zoomTransform = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  const getLinkId = (d: GraphLink) => d.data.name || `${d.data.from}-${d.data.to}`;

  // Helper to calculate radius based on Area (Sqrt of size)
  const getNodeRadius = (size: number) => 35 * Math.sqrt(size || 1);

  // Helper for wavy line
  const getComplexLinkPath = (src: {x:number, y:number}, tgt: {x:number, y:number}, link: ProcessedLink, gap: number) => {
      const count = link.linkCount;
      const index = link.linkIndex;
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return "";
      const nx = -dy / len;
      const ny = dx / len;
      const offset = (index - (count - 1) / 2) * gap;
      const x1 = src.x + nx * offset;
      const y1 = src.y + ny * offset;
      const x2 = tgt.x + nx * offset;
      const y2 = tgt.y + ny * offset;

      if (link.data.road || link.data.connectionType === 'Proximity') {
          return `M ${x1} ${y1} L ${x2} ${y2}`;
      } else {
           const dist = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
           const segments = Math.max(1, Math.floor(dist / 40));
           let path = `M ${x1} ${y1}`;
           const vx = (x2 - x1) / segments;
           const vy = (y2 - y1) / segments;
           const amp = 6;
           for (let i = 0; i < segments; i++) {
               const sx = x1 + vx * i;
               const sy = y1 + vy * i;
               const ex = x1 + vx * (i + 1);
               const ey = y1 + vy * (i + 1);
               const mx = (sx + ex) / 2;
               const my = (sy + ey) / 2;
               const dir = (i % 2 === 0) ? 1 : -1;
               const cpx = mx + nx * amp * dir;
               const cpy = my + ny * amp * dir;
               path += ` Q ${cpx} ${cpy}, ${ex} ${ey}`;
           }
           return path;
      }
  }

  // --- 1. Prepare Data (Stable across renders) ---
  const { nodes, physicalLinks, portalLinks } = useMemo(() => {
      if (!data || !data.variants || data.variants.length === 0) {
          return { nodes: [], physicalLinks: [], portalLinks: [] };
      }

      const variant = data.variants[0];
      
      // Nodes
      const processedNodes: GraphNode[] = variant.zones.map(zone => {
          let type: 'spawn' | 'city' | 'empty' = 'empty';
          let player: string | undefined = undefined;

          if (zone.mainObjects) {
            const spawnObj = zone.mainObjects.find(obj => obj.type === 'Spawn');
            if (spawnObj) {
              type = 'spawn';
              player = spawnObj.spawn;
            } else if (zone.mainObjects.find(obj => obj.type === 'City')) {
              type = 'city';
              const cityObj = zone.mainObjects.find(obj => obj.type === 'City');
              if (cityObj && cityObj.owner) {
                  player = cityObj.owner;
              }
            }
          }

          const savedPos = nodePositions.current.get(zone.name);
          let initialX = savedPos?.x ?? (worldWidth/2 + (Math.random() - 0.5) * (worldWidth * 0.2));
          let initialY = savedPos?.y ?? (worldHeight/2 + (Math.random() - 0.5) * (worldHeight * 0.2));
          initialX = Math.max(50, Math.min(worldWidth - 50, initialX));
          initialY = Math.max(50, Math.min(worldHeight - 50, initialY));

          return {
            id: zone.name,
            data: zone,
            type,
            player,
            x: initialX,
            y: initialY,
            fx: savedPos?.fx,
            fy: savedPos?.fy
          };
      });

      const nodeMap = new Map(processedNodes.map(n => [n.id, n]));

      // Links
      const linkCounts = new Map<string, number>();
      const linkIndices = new Map<string, number>();
      const allLinksRaw = variant.connections.filter(conn => nodeMap.has(conn.from) && nodeMap.has(conn.to));
      
      allLinksRaw.forEach(conn => {
          const ids = [conn.from, conn.to].sort();
          const key = `${ids[0]}-${ids[1]}`; 
          linkCounts.set(key, (linkCounts.get(key) || 0) + 1);
      });

      const pLinks: ProcessedLink[] = [];
      const ptLinks: ProcessedLink[] = [];

      allLinksRaw.forEach(conn => {
          const ids = [conn.from, conn.to].sort();
          const key = `${ids[0]}-${ids[1]}`; 
          const count = linkCounts.get(key) || 1;
          const index = linkIndices.get(key) || 0;
          linkIndices.set(key, index + 1);

          const linkObj = {
              source: nodeMap.get(conn.from)!, // We know it exists from filter
              target: nodeMap.get(conn.to)!,
              data: conn,
              linkIndex: index,
              linkCount: count
          };

          if (conn.connectionType === 'Portal') {
              ptLinks.push(linkObj as ProcessedLink);
          } else {
              pLinks.push(linkObj as ProcessedLink);
          }
      });

      return { nodes: processedNodes, physicalLinks: pLinks, portalLinks: ptLinks };

  }, [data, worldWidth, worldHeight]);

  // --- 2. Minimap Rendering Effect (Separate to handle re-mounting of ref) ---
  useEffect(() => {
      // Clean up previous refs if minimap is gone
      if (!minimapRef.current) {
          miniNodesRef.current = null;
          miniLinksRef.current = null;
          miniViewportRef.current = null;
          return;
      }

      const minimapSvg = d3.select(minimapRef.current);
      minimapSvg.selectAll("*").remove();

      // Measure dimensions
      const width = minimapRef.current.clientWidth || 300;
      const height = minimapRef.current.clientHeight || 200;
      
      // Calculate Scale (Fit world into minimap container)
      const scaleX = width / worldWidth;
      const scaleY = height / worldHeight;
      const scale = Math.min(scaleX, scaleY) * 0.9; // 90% fit to add padding
      minimapScaleRef.current = scale;

      // Center it
      const offsetX = (width - worldWidth * scale) / 2;
      const offsetY = (height - worldHeight * scale) / 2;
      
      const g = minimapSvg.append("g")
          .attr("transform", `translate(${offsetX}, ${offsetY})`);

      // Background
      g.append("rect")
          .attr("width", worldWidth * scale)
          .attr("height", worldHeight * scale)
          .attr("fill", "#1e293b")
          .attr("stroke", "#475569")
          .attr("stroke-width", 1);

      // Links
      const linksSel = g.append("g").selectAll("line")
          .data(physicalLinks)
          .join("line")
          .attr("stroke", "#475569")
          .attr("stroke-width", 0.5)
          .attr("opacity", 0.6);
      
      // Nodes
      const nodesSel = g.append("g").selectAll("circle")
          .data(nodes)
          .join("circle")
          .attr("r", 2)
          .attr("fill", d => {
               if (d.type === 'spawn') return getPlayerColor(d.player);
               if (d.data.guardedContentValue && d.data.guardedContentValue > 2000000) return "#f59e0b";
               return "#94a3b8";
          });

      // Viewport Rect
      const viewportSel = g.append("rect")
          .attr("stroke", "#fbbf24")
          .attr("stroke-width", 1.5)
          .attr("fill", "transparent")
          .style("cursor", "move");

      // Save selections for Main Loop
      miniLinksRef.current = linksSel as unknown as d3.Selection<SVGLineElement, ProcessedLink, SVGGElement, unknown>;
      miniNodesRef.current = nodesSel as unknown as d3.Selection<SVGCircleElement, GraphNode, SVGGElement, unknown>;
      miniViewportRef.current = viewportSel;

      // Initialize Viewport Position immediately
      const t = zoomTransform.current;
      const containerW = containerRef.current?.clientWidth || 0;
      const containerH = containerRef.current?.clientHeight || 0;
      
      if (t.k) {
          const vx = -t.x / t.k;
          const vy = -t.y / t.k;
          const vw = containerW / t.k;
          const vh = containerH / t.k;
          viewportSel
              .attr("x", vx * scale)
              .attr("y", vy * scale)
              .attr("width", vw * scale)
              .attr("height", vh * scale);
      }

      // Click to Pan
      minimapSvg.on("click", (event) => {
          if (!svgRef.current) return;
          const [mx, my] = d3.pointer(event, g.node());
          
          const wx = mx / scale;
          const wy = my / scale;
          
          const currentK = zoomTransform.current.k || 1;
          const mainW = containerRef.current?.clientWidth || 0;
          const mainH = containerRef.current?.clientHeight || 0;

          const tx = mainW/2 - wx * currentK;
          const ty = mainH/2 - wy * currentK;

          const mainSvg = d3.select(svgRef.current);
          const zoom = d3.zoom().scaleExtent([0.1, 10]); // Re-create zoom instance not ideal but needed to access transform
          // Better: just trigger the transition on the main SVG which has zoom behavior attached
          // We can't access the zoom behavior instance easily unless stored.
          // However, dispatching a zoom transform is standard.
          
          mainSvg.transition().duration(750)
             // @ts-ignore
             .call(mainSvg.node().__zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(currentK));
      });

  }, [minimapRef.current, nodes, physicalLinks, worldWidth, worldHeight]); // Re-run when Ref changes (mount/unmount) or data changes

  // --- 3. Main Graph Simulation & Rendering ---
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // --- SVG Setup ---
    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("cursor", "grab");

    // Store zoom behavior on element for access in minimap
    const minScale = Math.max(width / worldWidth, height / worldHeight);
    const maxScale = Math.max(4, minScale * 2);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([minScale, maxScale])
      .translateExtent([[0, 0], [worldWidth, worldHeight]])
      .on("zoom", (event) => {
        zoomTransform.current = event.transform;
        g.attr("transform", event.transform);
        
        // Update Minimap Viewport if it exists
        if (miniViewportRef.current) {
            const t = event.transform;
            const scale = minimapScaleRef.current;
            const vx = -t.x / t.k;
            const vy = -t.y / t.k;
            const vw = width / t.k;
            const vh = height / t.k;
            
            miniViewportRef.current
                .attr("x", vx * scale)
                .attr("y", vy * scale)
                .attr("width", vw * scale)
                .attr("height", vh * scale);
        }
      });
    
    // @ts-ignore
    svg.node().__zoomBehavior = zoom;

    const g = svg.append("g").attr("class", "graph-container");

    // Boundary
    g.append("rect")
        .attr("x", 0).attr("y", 0)
        .attr("width", worldWidth).attr("height", worldHeight)
        .attr("fill", "#0f172a").attr("stroke", "#334155")
        .attr("stroke-width", 4).attr("stroke-dasharray", "20, 10")
        .attr("rx", 20).style("pointer-events", "none");

    svg.call(zoom);

    // Initial positioning
    const initialScale = minScale; 
    const initialTx = (width - worldWidth * initialScale) / 2;
    const initialTy = (height - worldHeight * initialScale) / 2;
    svg.call(zoom.transform, d3.zoomIdentity.translate(initialTx, initialTy).scale(initialScale));

    const handleBackgroundClick = () => {
        onSelectNodeRef.current(null);
        onSelectLinkRef.current(null);
    };
    svg.on("click", handleBackgroundClick);

    // --- Simulation ---
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, ProcessedLink>(physicalLinks).id(d => d.id).distance(110)) 
      .force("charge", d3.forceManyBody().strength(-5000))
      .force("x", d3.forceX<GraphNode>(worldWidth / 2).strength(d => {
          if (d.data.layout?.toLowerCase().includes('center')) { return 0.25; }
          else if (d.data.layout?.toLowerCase().includes('sides')) { return 0; }
          else { return 0.1; }
      })) 
      .force("y", d3.forceY<GraphNode>(worldHeight / 2).strength(d => {
          if (d.data.layout?.toLowerCase().includes('center')) { return 0.25; }
          else if (d.data.layout?.toLowerCase().includes('sides')) { return 0; }
          else { return 0.1 }
      }))
      .force("collide", d3.forceCollide<GraphNode>().radius(d => getNodeRadius(d.data.size || 1) + 30)); 

    const boundaryPadding = 120; 
    const boundaryStrength = 0.8; 
    
    simulation.force("boundary", () => {
        const alpha = simulation.alpha();
        nodes.forEach(node => {
            if (node.x === undefined || node.y === undefined || node.vx === undefined || node.vy === undefined) return;
            if (node.x < boundaryPadding) { node.vx += (boundaryPadding - node.x) * boundaryStrength * alpha; }
            if (node.x > worldWidth - boundaryPadding) { node.vx -= (node.x - (worldWidth - boundaryPadding)) * boundaryStrength * alpha; }
            if (node.y < boundaryPadding) { node.vy += (boundaryPadding - node.y) * boundaryStrength * alpha; }
            if (node.y > worldHeight - boundaryPadding) { node.vy -= (node.y - (worldHeight - boundaryPadding)) * boundaryStrength * alpha; }
        });
    });

    // --- Draw Main Elements ---
    const linkGroup = g.append("g").attr("class", "links");
    const linkHitAreas = linkGroup.selectAll("path.hit-area").data(physicalLinks).join("path")
      .attr("class", "hit-area").attr("stroke", "transparent").attr("stroke-width", 20).attr("fill", "none")
      .style("cursor", "pointer").on("click", (event, d) => { event.stopPropagation(); onSelectLinkRef.current(getLinkId(d)); });

    const linkVisible = linkGroup.selectAll("path.visible-link").data(physicalLinks).join("path")
      .attr("class", "visible-link").attr("stroke", "#475569").attr("stroke-width", d => d.data.road ? 6 : 2)
      .attr("stroke-dasharray", d => d.data.connectionType === 'Proximity' ? "6,6" : "0")
      .attr("fill", "none").style("cursor", "pointer").on("click", (event, d) => { event.stopPropagation(); onSelectLinkRef.current(getLinkId(d)); });

    // Link Labels
    const linkLabelGroup = g.append("g").attr("class", "link-labels");
    const linkLabel = linkLabelGroup.selectAll("g").data(physicalLinks).join("g")
        .style("cursor", "pointer").on("click", (event, d) => { event.stopPropagation(); onSelectLinkRef.current(getLinkId(d)); });
    
    linkLabel.append("rect").attr("rx", 6).attr("ry", 6).attr("fill", d => getGuardFillColor(d.data.guardValue || 0))
        .attr("stroke", "#0f172a").attr("stroke-width", 2).attr("opacity", 0.9);

    const linkText = linkLabel.append("text")
        .text(d => d.data.guardValue ? `${Math.round(d.data.guardValue/1000)}k` : "")
        .attr("fill", "#e2e8f0").attr("font-size", "11px").attr("font-weight", "bold").attr("text-anchor", "middle").attr("dy", "0.35em");

    // Portals
    const portalGroup = g.append("g").attr("class", "portals");
    const portalElements = portalGroup.selectAll("g.portal-connection").data(portalLinks).join("g")
        .attr("class", "portal-connection").style("cursor", "pointer")
        .on("click", (event, d) => { event.stopPropagation(); onSelectLinkRef.current(getLinkId(d)); });

    const portalSourceArrow = portalElements.append("g").attr("class", "source-arrow");
    const portalTargetArrow = portalElements.append("g").attr("class", "target-arrow");

    // Helper for Arrows
    const drawArrowWithTail = (selection: d3.Selection<SVGGElement, ProcessedLink, any, any>) => {
        const TAIL_LENGTH = 24; 
        selection.append("path")
            .attr("d", (d) => {
                const startX = -6; const endX = -6 - TAIL_LENGTH;
                if (d.data.road) return `M ${startX} 0 L ${endX} 0`;
                return `M ${endX} 0 C ${endX + 8} 5, ${startX - 8} -5, ${startX} 0`;
            })
            .attr("fill", "none").attr("stroke", "#475569").attr("stroke-width", d => d.data.road ? 6 : 2)
            .attr("stroke-linecap", "round").attr("data-orig-stroke", "#475569");

        selection.append("path").attr("d", "M -6 -6 L 8 0 L -6 6 z") 
            .attr("fill", (d, i) => PORTAL_COLORS[i % PORTAL_COLORS.length])
            .attr("stroke", "#fff").attr("stroke-width", 1);
    };

    drawArrowWithTail(portalSourceArrow);
    drawArrowWithTail(portalTargetArrow);

    const portalGuardGroup = portalSourceArrow.append("g").attr("class", "portal-guard")
        .style("display", d => (d.data.guardValue && d.data.guardValue > 0) ? "block" : "none");

    portalGuardGroup.append("rect").attr("rx", 6).attr("ry", 6).attr("x", -14).attr("y", -8)
        .attr("width", 28).attr("height", 16).attr("fill", d => getGuardFillColor(d.data.guardValue || 0))
        .attr("stroke", "#0f172a").attr("stroke-width", 2);
    
    portalGuardGroup.append("text").text(d => d.data.guardValue ? `${Math.round(d.data.guardValue/1000)}k` : "")
        .attr("font-size", "10px").attr("font-weight", "bold").attr("fill", "#e2e8f0").attr("text-anchor", "middle").attr("dy", "0.3em");

    // Nodes
    const nodeGroup = g.append("g").attr("class", "nodes");
    const drag = d3.drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
        svg.style("cursor", "grabbing");
      })
      .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
        svg.style("cursor", "grab");
        nodes.forEach(n => { if (n.x && n.y) nodePositions.current.set(n.id, {x: n.x, y: n.y, fx: n.fx, fy: n.fy}); });
      });

    const node = nodeGroup.selectAll("g").data(nodes).join("g").attr("class", "node-group")
      .style("cursor", "pointer").call(drag as any)
      .on("click", (event, d) => { if (event.defaultPrevented) return; event.stopPropagation(); onSelectNodeRef.current(d.id); });

    node.append("circle").attr("id", d => `node-circle-${d.id}`)
      .attr("r", d => getNodeRadius(d.data.size || 1)).attr("fill", "#1e293b")
      .attr("stroke", d => {
          const value = d.data.guardedContentValue || 0;
          if (value > 2000000) return "#f59e0b"; 
          if (value > 800000) return "#94a3b8"; 
          return "#475569"; 
      })
      .attr("stroke-width", d => (d.data.guardedContentValue || 0) > 2000000 ? 4 : 2)
      .style("filter", d => (d.data.guardedContentValue || 0) > 2000000 ? "drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))" : "none");

    node.each(function(d) {
        const el = d3.select(this);
        const r = getNodeRadius(d.data.size || 1);
        const objects = d.data.mainObjects || [];
        const displayObjs = objects.filter(o => o.type === 'City' || o.type === 'Spawn');
        const renderObj = (obj: any, x: number, y: number, fontSize: number) => {
             let txt = "⌂"; let color = "#e2e8f0";
             if (obj.type === 'Spawn') { txt = obj.spawn?.replace('Player', 'P') || 'S'; color = getPlayerColor(obj.spawn); } 
             else if (obj.type === 'City') { txt = "⌂"; color = obj.owner ? getPlayerColor(obj.owner) : "#e2e8f0"; }
             el.append("text").text(txt).attr("x", x).attr("y", y).attr("text-anchor", "middle").attr("dy", "0.35em")
                .attr("fill", color).attr("font-size", `${fontSize}px`).attr("font-weight", "bold").style("pointer-events", "none");
        };
        if (displayObjs.length === 0) {
            el.append("text").text("⌂").attr("text-anchor", "middle").attr("dy", "0.35em")
                .attr("fill", "#64748b").attr("font-size", `${r}px`).style("pointer-events", "none"); 
        } else if (displayObjs.length === 1) { renderObj(displayObjs[0], 0, 0, r); } 
        else {
            const count = displayObjs.length; const angleStep = (2 * Math.PI) / count; const subR = r * 0.5; const iconSize = r * 0.6; 
            displayObjs.forEach((obj, i) => {
                const angle = i * angleStep - Math.PI / 2; renderObj(obj, Math.cos(angle) * subR, Math.sin(angle) * subR, iconSize);
            });
        }
    });

    node.append("text").text(d => d.id).attr("y", d => getNodeRadius(d.data.size || 1) + 16)
      .attr("text-anchor", "middle").attr("fill", "#cbd5e1").attr("font-size", "12px").style("pointer-events", "none").style("text-shadow", "2px 2px 4px #000");

    // --- TICK ---
    simulation.on("tick", () => {
      // 1. Update Main Graph
      const updateLinkPath = (d: any) => {
          const l = d as ProcessedLink; const src = l.source as GraphNode; const tgt = l.target as GraphNode;
          if (src.x === undefined || src.y === undefined || tgt.x === undefined || tgt.y === undefined) return "";
          return getComplexLinkPath({ x: src.x, y: src.y }, { x: tgt.x, y: tgt.y }, l, 8);
      };
      linkVisible.attr("d", updateLinkPath);
      linkHitAreas.attr("d", updateLinkPath);
      
      linkLabel.attr("transform", (d: any) => {
          const l = d as ProcessedLink; const src = l.source as GraphNode; const tgt = l.target as GraphNode;
          if (!src.x || !src.y || !tgt.x || !tgt.y) return "translate(0,0)";
          let midX = (src.x + tgt.x) / 2; let midY = (src.y + tgt.y) / 2;
          const dx = tgt.x - src.x; const dy = tgt.y - src.y; const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
              const nx = -dy / len; const ny = dx / len;
              if (l.linkCount > 1) {
                  const offset = (l.linkIndex - (l.linkCount - 1) / 2) * 8; midX += nx * offset; midY += ny * offset;
                  const spread = (l.linkIndex - (l.linkCount - 1) / 2) * 30; midX += (dx/len) * spread; midY += (dy/len) * spread;
              }
          }
          return `translate(${midX},${midY})`;
      });
      linkText.each(function(d) {
          const bbox = this.getBBox();
          d3.select(this.parentNode as SVGGElement).select("rect")
            .attr("x", bbox.x - 8).attr("y", bbox.y - 4).attr("width", bbox.width + 16).attr("height", bbox.height + 8);
      });

      nodes.forEach(d => {
           const r = getNodeRadius(d.data.size || 1);
           d.x = Math.max(r + 10, Math.min(worldWidth - (r + 10), d.x || 0));
           d.y = Math.max(r + 10, Math.min(worldHeight - (r + 10), d.y || 0));
      });
      node.attr("transform", d => `translate(${d.x},${d.y})`);
      nodes.forEach(n => { if (n.x && n.y) nodePositions.current.set(n.id, {x: n.x, y: n.y, fx: n.fx, fy: n.fy}); });

      portalElements.each(function(d) {
          const link = d as ProcessedLink; const src = link.source as GraphNode; const tgt = link.target as GraphNode;
          if (!src.x || !src.y || !tgt.x || !tgt.y) return;
          const isCanonical = src.id < tgt.id;
          const x1 = isCanonical ? src.x : tgt.x; const y1 = isCanonical ? src.y : tgt.y;
          const x2 = isCanonical ? tgt.x : src.x; const y2 = isCanonical ? tgt.y : src.y;
          const dx = x2 - x1; const dy = y2 - y1; const len = Math.sqrt(dx * dx + dy * dy);
          if (len === 0) return;
          const ux = dx / len; const uy = dy / len; const nx = -uy; const ny = ux;
          const gap = 12; const offset = (link.linkIndex - (link.linkCount - 1) / 2) * gap;
          const shiftX = nx * offset; const shiftY = ny * offset;
          const TAIL_LENGTH = 24; const ARROW_OFFSET_FROM_CIRCLE = TAIL_LENGTH + 6; 

          const srcR = getNodeRadius(src.data.size || 1); const srcDist = srcR + ARROW_OFFSET_FROM_CIRCLE;
          const srcDirX = isCanonical ? ux : -ux; const srcDirY = isCanonical ? uy : -uy;
          const srcArrowX = src.x + shiftX + srcDirX * srcDist; const srcArrowY = src.y + shiftY + srcDirY * srcDist;
          const srcAngle = Math.atan2(srcDirY, srcDirX) * 180 / Math.PI;
          const srcGroup = d3.select(this).select(".source-arrow");
          srcGroup.attr("transform", `translate(${srcArrowX}, ${srcArrowY}) rotate(${srcAngle})`);
          srcGroup.select(".portal-guard").attr("transform", `translate(24, 0) rotate(${-srcAngle})`); 

          const tgtR = getNodeRadius(tgt.data.size || 1); const tgtDist = tgtR + ARROW_OFFSET_FROM_CIRCLE;
          const tgtDirX = isCanonical ? -ux : ux; const tgtDirY = isCanonical ? -uy : uy;
          const tgtArrowX = tgt.x + shiftX + tgtDirX * tgtDist; const tgtArrowY = tgt.y + shiftY + tgtDirY * tgtDist;
          const tgtAngle = Math.atan2(tgtDirY, tgtDirX) * 180 / Math.PI;
          const tgtGroup = d3.select(this).select(".target-arrow");
          tgtGroup.attr("transform", `translate(${tgtArrowX}, ${tgtArrowY}) rotate(${tgtAngle})`);
      });

      // 2. Update Minimap (Using Refs to access latest selections even if re-mounted)
      const minimapScale = minimapScaleRef.current;
      
      if (miniNodesRef.current) {
          miniNodesRef.current
            .attr("cx", d => (d.x || 0) * minimapScale)
            .attr("cy", d => (d.y || 0) * minimapScale);
      }
      if (miniLinksRef.current) {
          miniLinksRef.current
            .attr("x1", d => ((d.source as GraphNode).x || 0) * minimapScale)
            .attr("y1", d => ((d.source as GraphNode).y || 0) * minimapScale)
            .attr("x2", d => ((d.target as GraphNode).x || 0) * minimapScale)
            .attr("y2", d => ((d.target as GraphNode).y || 0) * minimapScale);
      }
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, physicalLinks, portalLinks, worldWidth, worldHeight]);

  // Handle Selection Styling
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll(".node-group circle[id^='node-circle']")
       .attr("stroke", function() {
           const d = d3.select(this).datum() as GraphNode;
           const isRich = (d.data.guardedContentValue || 0) > 2000000;
           if (d.id === selectedId) return "#fff";
           return isRich ? "#f59e0b" : "#475569";
       })
       .style("filter", function() {
           const d = d3.select(this).datum() as GraphNode;
           const isRich = (d.data.guardedContentValue || 0) > 2000000;
           if (d.id === selectedId) return "drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))";
           return isRich ? "drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))" : "none";
       });

    svg.selectAll(".visible-link")
        .attr("stroke", function() {
            const d = d3.select(this).datum() as GraphLink;
            if (getLinkId(d) === selectedId) return "#f59e0b";
            return "#475569";
        })
        .attr("opacity", function() {
             const d = d3.select(this).datum() as GraphLink;
             return getLinkId(d) === selectedId ? 1 : 0.8;
        });

    svg.selectAll(".portal-connection")
        .attr("opacity", function() {
            const d = d3.select(this).datum() as GraphLink;
            return getLinkId(d) === selectedId ? 1 : 0.85; 
        })
        .each(function(d) {
             const link = d as GraphLink;
             const isSelected = getLinkId(link) === selectedId;
             const group = d3.select(this);
             group.selectAll("path")
                .attr("stroke", function() {
                     const fill = d3.select(this).attr("fill");
                     if (fill !== "none") { return isSelected ? "#fff" : "#fff"; } 
                     else { if (isSelected) return "#fff"; return d3.select(this).attr("data-orig-stroke") || "#475569"; }
                })
                .attr("stroke-width", function() {
                      const fill = d3.select(this).attr("fill");
                      if (fill !== "none") { return isSelected ? 2 : 1; } 
                      else { const processed = d as ProcessedLink; return isSelected ? (processed.data.road ? 7 : 4) : (processed.data.road ? 6 : 2); }
                  });
        });

    svg.select(".links").lower();
    svg.select("rect").lower();       
    svg.select(".portals").raise();
    svg.select(".link-labels").raise(); 
    svg.select(".nodes").raise();       
       
  }, [selectedId, nodes]); 

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0f172a] relative overflow-hidden">
        {/* Title Watermark */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none opacity-50">
            <h2 className="text-4xl font-black text-slate-700 select-none tracking-tighter">RMG EDITOR</h2>
        </div>
      <svg ref={svgRef} className="w-full h-full block"></svg>
    </div>
  );
};

export default MapGraph;
