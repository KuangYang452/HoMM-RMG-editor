
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RmgFile, GraphNode, GraphLink } from '../types';

interface MapGraphProps {
  data: RmgFile;
  onSelectNode: (id: string | null) => void;
  onSelectLink: (id: string | null) => void;
  selectedId: string | null;
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

const MapGraph: React.FC<MapGraphProps> = ({ data, onSelectNode, onSelectLink, selectedId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const minimapRef = useRef<SVGSVGElement>(null); // Ref for Minimap SVG
  const containerRef = useRef<HTMLDivElement>(null);
  
  const onSelectNodeRef = useRef(onSelectNode);
  const onSelectLinkRef = useRef(onSelectLink);

  // Dynamic World Size Calculation
  // User Requirement: 10 times the map template's x, y values
  const worldWidth = Math.max((data.sizeX || 64) * 10, 500); // Minimum safety width
  const worldHeight = Math.max((data.sizeZ || 64) * 10, 500);

  // Minimap UI Size (Adaptive Height)
  const MINIMAP_UI_WIDTH = 280;
  const minimapScale = MINIMAP_UI_WIDTH / worldWidth;
  const minimapHeight = worldHeight * minimapScale;

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

  // Helper to generate path for links
  const getLinkPath = (src: {x:number, y:number}, tgt: {x:number, y:number}, link: ProcessedLink, gap: number) => {
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
           // Using simple quadratic curve
           return `M ${x1} ${y1} Q ${(x1+x2)/2 + nx*20} ${(y1+y2)/2 + ny*20} ${x2} ${y2}`; 
      }
  };

  // Helper for wavy line (Restored)
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


  useEffect(() => {
    if (!data || !data.variants || data.variants.length === 0 || !svgRef.current || !containerRef.current || !minimapRef.current) return;

    const variant = data.variants[0];
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // --- Prepare Nodes ---
    const nodes: GraphNode[] = variant.zones.map(zone => {
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
      
      // Initial Position Logic:
      // Must ensure they start WITHIN the new world boundary
      let initialX = savedPos?.x ?? (worldWidth/2 + (Math.random() - 0.5) * (worldWidth * 0.2));
      let initialY = savedPos?.y ?? (worldHeight/2 + (Math.random() - 0.5) * (worldHeight * 0.2));
      
      // Clamp to boundary with padding
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

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // --- Prepare Links ---
    const nodeDegree = new Map<string, number>();
    const linkCounts = new Map<string, number>();
    const allLinksRaw = variant.connections.filter(conn => nodeMap.has(conn.from) && nodeMap.has(conn.to));
    allLinksRaw.forEach(conn => {
        // Calculate Node Degree for gravity logic
        nodeDegree.set(conn.from, (nodeDegree.get(conn.from) || 0) + 1);
        nodeDegree.set(conn.to, (nodeDegree.get(conn.to) || 0) + 1);

        const ids = [conn.from, conn.to].sort();
        const key = `${ids[0]}-${ids[1]}`; 
        linkCounts.set(key, (linkCounts.get(key) || 0) + 1);
    });
    const linkIndices = new Map<string, number>(); 
    const physicalLinks: ProcessedLink[] = [];
    const portalLinks: ProcessedLink[] = [];

    allLinksRaw.forEach(conn => {
        const ids = [conn.from, conn.to].sort();
        const key = `${ids[0]}-${ids[1]}`; 
        const count = linkCounts.get(key) || 1;
        const index = linkIndices.get(key) || 0;
        linkIndices.set(key, index + 1);

        const linkObj = {
            source: conn.from, 
            target: conn.to,
            data: conn,
            linkIndex: index,
            linkCount: count
        };

        if (conn.connectionType === 'Portal') {
            const l = { ...linkObj, source: nodeMap.get(conn.from)!, target: nodeMap.get(conn.to)! };
            portalLinks.push(l as ProcessedLink);
        } else {
            physicalLinks.push(linkObj as ProcessedLink);
        }
    });

    // --- SVG Setup ---
    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("cursor", "grab");

    const g = svg.append("g").attr("class", "graph-container");

    // --- Dynamic World Boundary ---
    g.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", worldWidth)
        .attr("height", worldHeight)
        .attr("fill", "#0f172a") 
        .attr("stroke", "#334155")
        .attr("stroke-width", 4)
        .attr("stroke-dasharray", "20, 10")
        .attr("rx", 20)
        .style("pointer-events", "none");

    // --- Minimap Setup ---
    const minimapSvg = d3.select(minimapRef.current);
    minimapSvg.selectAll("*").remove();
    
    minimapSvg.append("rect")
        .attr("width", MINIMAP_UI_WIDTH)
        .attr("height", minimapHeight)
        .attr("fill", "#1e293b")
        .attr("opacity", 0.9);

    minimapSvg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", MINIMAP_UI_WIDTH)
        .attr("height", minimapHeight)
        .attr("fill", "none")
        .attr("stroke", "#475569")
        .attr("stroke-width", 1);

    const miniLinks = minimapSvg.append("g").selectAll("line")
        .data(physicalLinks)
        .join("line")
        .attr("stroke", "#475569")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.6);

    const miniNodes = minimapSvg.append("g").selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 2)
        .attr("fill", d => {
             if (d.type === 'spawn') return getPlayerColor(d.player);
             if (d.data.guardedContentValue && d.data.guardedContentValue > 2000000) return "#f59e0b";
             return "#94a3b8";
        });

    const miniViewport = minimapSvg.append("rect")
        .attr("stroke", "#fbbf24")
        .attr("stroke-width", 1.5)
        .attr("fill", "transparent")
        .style("cursor", "move");

    // --- Zoom Logic ---
    const minScale = Math.max(width / worldWidth, height / worldHeight);
    const maxScale = Math.max(4, minScale * 2);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([minScale, maxScale])
      .translateExtent([[0, 0], [worldWidth, worldHeight]]) // Strictly confine camera to world
      .on("zoom", (event) => {
        zoomTransform.current = event.transform;
        g.attr("transform", event.transform);
        updateMinimapViewport(event.transform);
      });

    svg.call(zoom);

    // Initial positioning: Center the map
    const initialScale = minScale; 
    const initialTx = (width - worldWidth * initialScale) / 2;
    const initialTy = (height - worldHeight * initialScale) / 2;
    const initialTransform = d3.zoomIdentity.translate(initialTx, initialTy).scale(initialScale);
    
    // Apply initial transform
    svg.call(zoom.transform, initialTransform);

    function updateMinimapViewport(t: d3.ZoomTransform) {
        const vx = -t.x / t.k;
        const vy = -t.y / t.k;
        const vw = width / t.k;
        const vh = height / t.k;

        miniViewport
            .attr("x", vx * minimapScale)
            .attr("y", vy * minimapScale)
            .attr("width", vw * minimapScale)
            .attr("height", vh * minimapScale);
    }

    minimapSvg.on("click", (event) => {
        const [mx, my] = d3.pointer(event);
        const wx = mx / minimapScale;
        const wy = my / minimapScale;
        
        const currentK = zoomTransform.current.k;
        // Keep current scale, just center
        const tx = width/2 - wx * currentK;
        const ty = height/2 - wy * currentK;

        svg.transition().duration(750)
           .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(currentK));
    });

    // --- Simulation ---
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      // 1. Shortened Link Distance: 110.
      // This is generally smaller than the sum of collision radii (~130px for avg nodes).
      // Result: Links are mostly in tension (attracting), preventing them from "pushing" nodes apart (repulsion).
      .force("link", d3.forceLink<GraphNode, ProcessedLink>(physicalLinks).id(d => d.id).distance(110)) 
      
      // High Repulsion to ensure space filling
      .force("charge", d3.forceManyBody().strength(-3000))
      
      // 2. Empty Area Attraction (Simulated):
      // Nodes with few connections (degree <= 1) have minimal center gravity (0.002).
      // Nodes with many connections (degree > 1) have standard gravity (0.05).
      // Result: Loose nodes are pushed by the Charge force away from the dense center into the "empty" void.
      .force("x", d3.forceX(worldWidth / 2).strength(d => {
          const deg = nodeDegree.get(d.id) || 0;
          return deg > 1 ? 0.05 : 0.002; 
      })) 
      .force("y", d3.forceY(worldHeight / 2).strength(d => {
          const deg = nodeDegree.get(d.id) || 0;
          return deg > 1 ? 0.05 : 0.002;
      }))
      
      .force("collide", d3.forceCollide<GraphNode>().radius(d => getNodeRadius(d.data.size || 1) + 30)); 

    // Custom Boundary Repulsion Force
    // Pushes nodes away from edges softly
    const boundaryPadding = 120; // Reduced padding to allow filling corners
    const boundaryStrength = 0.8; 
    
    simulation.force("boundary", () => {
        const alpha = simulation.alpha();
        nodes.forEach(node => {
            if (node.x === undefined || node.y === undefined || node.vx === undefined || node.vy === undefined) return;
            
            // Left Edge
            if (node.x < boundaryPadding) {
                node.vx += (boundaryPadding - node.x) * boundaryStrength * alpha;
            }
            // Right Edge
            if (node.x > worldWidth - boundaryPadding) {
                node.vx -= (node.x - (worldWidth - boundaryPadding)) * boundaryStrength * alpha;
            }
            // Top Edge
            if (node.y < boundaryPadding) {
                node.vy += (boundaryPadding - node.y) * boundaryStrength * alpha;
            }
            // Bottom Edge
            if (node.y > worldHeight - boundaryPadding) {
                node.vy -= (node.y - (worldHeight - boundaryPadding)) * boundaryStrength * alpha;
            }
        });
    });

    // Relax mechanism: Reduce charge after initial explosion, but keep it high enough to fill space
    const relaxTimer = setTimeout(() => {
        const chargeForce = simulation.force("charge") as d3.ForceManyBody<GraphNode>;
        if (chargeForce) {
            // High sustained repulsion to keep nodes spread out in empty areas
            chargeForce.strength(-2500); 
            simulation.alpha(0.3).restart(); 
        }
    }, 800); 

    // --- Draw Physical Links ---
    const linkGroup = g.append("g").attr("class", "links");

    const linkHitAreas = linkGroup.selectAll("path.hit-area")
      .data(physicalLinks).join("path")
      .attr("class", "hit-area")
      .attr("stroke", "transparent").attr("stroke-width", 20).attr("fill", "none")
      .style("cursor", "pointer")
      .on("click", (event, d) => { event.stopPropagation(); onSelectLinkRef.current(getLinkId(d)); });

    const linkVisible = linkGroup.selectAll("path.visible-link")
      .data(physicalLinks).join("path")
      .attr("class", "visible-link")
      .attr("stroke", "#475569").attr("stroke-width", d => d.data.road ? 6 : 2)
      .attr("stroke-dasharray", d => d.data.connectionType === 'Proximity' ? "6,6" : "0")
      .attr("fill", "none").style("cursor", "pointer")
      .on("click", (event, d) => { event.stopPropagation(); onSelectLinkRef.current(getLinkId(d)); });

    // --- Link Labels ---
    const linkLabelGroup = g.append("g").attr("class", "link-labels");
    const linkLabel = linkLabelGroup.selectAll("g").data(physicalLinks).join("g")
        .style("cursor", "pointer")
        .on("click", (event, d) => { event.stopPropagation(); onSelectLinkRef.current(getLinkId(d)); });
    
    linkLabel.append("rect").attr("rx", 6).attr("ry", 6).attr("fill", d => getGuardFillColor(d.data.guardValue || 0))
        .attr("stroke", "#0f172a").attr("stroke-width", 2).attr("opacity", 0.9);

    const linkText = linkLabel.append("text")
        .text(d => d.data.guardValue ? `${Math.round(d.data.guardValue/1000)}k` : "")
        .attr("fill", "#e2e8f0").attr("font-size", "11px").attr("font-weight", "bold")
        .attr("text-anchor", "middle").attr("dy", "0.35em");

    // --- Draw Portals ---
    const portalGroup = g.append("g").attr("class", "portals");
    const portalElements = portalGroup.selectAll("g.portal-connection").data(portalLinks).join("g")
        .attr("class", "portal-connection").style("cursor", "pointer")
        .on("click", (event, d) => { event.stopPropagation(); onSelectLinkRef.current(getLinkId(d)); });

    const portalSourceArrow = portalElements.append("g").attr("class", "source-arrow");
    const portalTargetArrow = portalElements.append("g").attr("class", "target-arrow");

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


    // --- Nodes ---
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

    // Node Text/Icons Logic
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
      // 1. Update Physical Links
      const updateLinkPath = (d: any) => {
          const l = d as ProcessedLink; const src = l.source as GraphNode; const tgt = l.target as GraphNode;
          if (src.x === undefined || src.y === undefined || tgt.x === undefined || tgt.y === undefined) return "";
          return getComplexLinkPath({ x: src.x, y: src.y }, { x: tgt.x, y: tgt.y }, l, 8);
      };
      linkVisible.attr("d", updateLinkPath);
      linkHitAreas.attr("d", updateLinkPath);

      // Update Minimap Links
      miniLinks
        .attr("x1", d => ((d.source as GraphNode).x || 0) * minimapScale)
        .attr("y1", d => ((d.source as GraphNode).y || 0) * minimapScale)
        .attr("x2", d => ((d.target as GraphNode).x || 0) * minimapScale)
        .attr("y2", d => ((d.target as GraphNode).y || 0) * minimapScale);

      // Update Labels position
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

      // 2. Update Nodes
      // Use Hard Clamp as a safety net (keep nodes strictly within bounds), 
      // but rely on "boundary" force for soft repulsion from edges.
      // Offset by radius to prevent circle clipping.
      nodes.forEach(d => {
           const r = getNodeRadius(d.data.size || 1);
           d.x = Math.max(r + 10, Math.min(worldWidth - (r + 10), d.x || 0));
           d.y = Math.max(r + 10, Math.min(worldHeight - (r + 10), d.y || 0));
      });

      node.attr("transform", d => `translate(${d.x},${d.y})`);
      nodes.forEach(n => { if (n.x && n.y) nodePositions.current.set(n.id, {x: n.x, y: n.y, fx: n.fx, fy: n.fy}); });

      // Update Minimap Nodes
      miniNodes
        .attr("cx", d => (d.x || 0) * minimapScale)
        .attr("cy", d => (d.y || 0) * minimapScale);


      // 3. Update Portal Arrows
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
    });

    return () => {
      clearTimeout(relaxTimer);
      simulation.stop();
    };
  }, [data, worldWidth, worldHeight]); // Dependencies updated to include dynamic dimensions

  // Effect 2: Handle Selection Styling
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Update Nodes Style
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

    // Update Links Style (Physical)
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

    // Update Portal Style
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

    // Reset Group Order
    svg.select(".links").lower();
    svg.select("rect").lower();       
    svg.select(".portals").raise();
    svg.select(".link-labels").raise(); 
    svg.select(".nodes").raise();       
       
  }, [selectedId, data]); 

  const handleBackgroundClick = () => {
      onSelectNodeRef.current(null);
      onSelectLinkRef.current(null);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0f172a] relative overflow-hidden">
        <div className="absolute top-4 left-4 z-10 pointer-events-none opacity-50">
            <h2 className="text-4xl font-black text-slate-700 select-none tracking-tighter">RMG EDITOR</h2>
        </div>
      <svg ref={svgRef} className="w-full h-full block" onClick={handleBackgroundClick}></svg>

      {/* Minimap Container - Adaptive Height */}
      <div className="absolute bottom-4 right-4 bg-slate-900 border border-slate-700 shadow-xl rounded-lg overflow-hidden z-20">
          <svg 
            ref={minimapRef} 
            width={MINIMAP_UI_WIDTH} 
            height={minimapHeight} 
            className="block cursor-crosshair hover:bg-slate-800/50 transition-colors"
          />
          <div className="bg-slate-950 px-2 py-1 text-[10px] text-slate-500 font-mono text-center border-t border-slate-800">
              MINIMAP {worldWidth}x{worldHeight}
          </div>
      </div>
      
      {/* Legend */}
       <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg text-xs pointer-events-none select-none shadow-xl">
            <div className="font-bold text-slate-400 mb-2 uppercase tracking-wider">图例说明</div>
            <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-[#f59e0b] border border-slate-500 shadow-[0_0_4px_#f59e0b]"></span>
                <span className="text-amber-500">高价值区域 ({'>'}2M)</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-[#1e293b] border border-slate-500"></span>
                <span className="text-slate-300">普通区域</span>
            </div>
            <div className="h-px bg-slate-700 my-2"></div>
            <div className="flex items-center gap-2 mb-1">
                <span className="w-8 h-4 rounded bg-[#7f1d1d] flex items-center justify-center text-[8px] font-bold text-white">40k</span>
                <span className="text-red-400">强力守卫 ({'>'}=40k)</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
                <span className="w-8 h-4 rounded bg-[#14532d] flex items-center justify-center text-[8px] font-bold text-white">2k</span>
                <span className="text-green-400">弱守卫</span>
            </div>
             <div className="h-px bg-slate-700 my-2"></div>
             
             {/* Connection Types Legend */}
             <div className="flex items-center gap-2 mb-1">
                 <span className="w-8 h-0 border-b-[4px] border-slate-500"></span>
                 <span className="text-slate-400">道路连接 (Road)</span>
             </div>
             <div className="flex items-center gap-2 mb-1">
                 <svg width="32" height="6" className="overflow-visible">
                     <path d="M 0 3 Q 8 6, 16 3 T 32 3" fill="none" stroke="#64748b" strokeWidth="2" />
                 </svg>
                 <span className="text-slate-400">野外连接 (Passage)</span>
             </div>
             <div className="flex items-center gap-2 mb-1">
                 <div className="flex items-center">
                     <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-cyan-400 rotate-90"></span>
                     <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-cyan-400 -rotate-90 ml-1"></span>
                 </div>
                 <span className="text-cyan-400">传送门 (Portal)</span>
             </div>
             <div className="flex items-center gap-2 mb-1">
                 <span className="w-8 border-b-2 border-slate-500 border-dashed h-0"></span>
                 <span className="text-slate-400">邻近连接 (Proximity)</span>
             </div>
             <div className="h-px bg-slate-700 my-2"></div>
             <div className="flex items-center gap-2 mb-1">
                 <span className="w-3 h-0 border-b-[2px] border-slate-600 border-dashed"></span>
                 <span className="text-slate-500 text-[10px]">地图边界 ({data.sizeX}x{data.sizeZ})</span>
             </div>

             <div className="h-px bg-slate-700 my-2"></div>
             <div className="flex items-center gap-2 mb-1">
                 <span className="text-slate-300 font-bold">⌂</span>
                 <span>城市</span>
             </div>
             <div className="grid grid-cols-4 gap-1 w-full">
                 {[1,2,3,4,5,6,7,8].map(i => (
                     <div key={i} className="flex items-center gap-1">
                         <span className="w-2 h-2 rounded-full" style={{background: getPlayerColor(`Player${i}`)}}></span>
                         <span className="text-[9px] text-slate-400">P{i}</span>
                     </div>
                 ))}
             </div>
        </div>
    </div>
  );
};

export default MapGraph;
