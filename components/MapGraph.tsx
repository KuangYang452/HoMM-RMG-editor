import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RmgFile, GraphNode, GraphLink } from '../types';
import { debugTrack } from './DebugMonitor';
import { getLocalizedName } from '../utils/localization';

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

// 8 Player Colors
const getPlayerColor = (player: string | undefined) => {
    switch (player) {
        case 'Player1': return '#dc2626'; // Red
        case 'Player2': return '#2563eb'; // Blue
        case 'Player3': return '#16a34a'; // Green
        case 'Player4': return '#ea580c'; // Orange
        case 'Player5': return '#9333ea'; // Purple
        case 'Player6': return '#0891b2'; // Cyan
        case 'Player7': return '#db2777'; // Pink
        case 'Player8': return '#475569'; // Slate/Black
        default: return '#1e293b';
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
  const containerRef = useRef<HTMLDivElement>(null);
  
  const onSelectNodeRef = useRef(onSelectNode);
  const onSelectLinkRef = useRef(onSelectLink);

  useEffect(() => {
    onSelectNodeRef.current = onSelectNode;
    onSelectLinkRef.current = onSelectLink;
  }, [onSelectNode, onSelectLink]);
  
  const nodePositions = useRef<Map<string, {x: number, y: number, fx?: number | null, fy?: number | null}>>(new Map());
  const zoomTransform = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  const getLinkId = (d: GraphLink) => d.data.name || `${d.data.from}-${d.data.to}`;

  // Helper to calculate radius based on Area (Sqrt of size)
  const getNodeRadius = (size: number) => 35 * Math.sqrt(size || 1);

  // Helper to generate path for links
  const getLinkPath = (src: {x:number, y:number}, tgt: {x:number, y:number}, link: ProcessedLink, gap: number) => {
      // 1. Parallel Offset Logic
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

      // 2. Path Generation
      // Use straight line for Roads AND Proximity connections.
      // Wavy line is reserved for 'Direct' connections that do NOT have a road (e.g. wild path).
      if (link.data.road || link.data.connectionType === 'Proximity') {
          return `M ${x1} ${y1} L ${x2} ${y2}`;
      } else {
          // Wavy Line Generator (Quadratic Bezier chain)
          const dist = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
          const segmentLen = 40;
          const segments = Math.max(1, Math.floor(dist / segmentLen));
          
          let path = `M ${x1} ${y1}`;
          
          const vx = (x2 - x1) / segments;
          const vy = (y2 - y1) / segments;
          
          // Amplitude vector (using normal)
          const amp = 5; 
          
          for (let i = 0; i < segments; i++) {
              // End of this segment
              const ex = x1 + vx * (i + 1);
              const ey = y1 + vy * (i + 1);
              
              // Previous point (start of segment)
              const sx = x1 + vx * i;
              const sy = y1 + vy * i;

              // Midpoint
              const mx = (sx + ex) / 2;
              const my = (sy + ey) / 2;
              
              // Control point: mid + normal * amp * direction
              const direction = (i % 2 === 0) ? 1 : -1;
              const cpx = mx + nx * amp * direction;
              const cpy = my + ny * amp * direction;
              
              path += ` Q ${cpx} ${cpy}, ${ex} ${ey}`;
          }
          return path;
      }
  };

  useEffect(() => {
    if (!data || !data.variants || data.variants.length === 0 || !svgRef.current || !containerRef.current) return;

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
        }
      }

      const savedPos = nodePositions.current.get(zone.name);

      return {
        id: zone.name,
        data: zone,
        type,
        player,
        x: savedPos?.x,
        y: savedPos?.y,
        fx: savedPos?.fx,
        fy: savedPos?.fy
      };
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // --- Prepare Links with Grouping ---
    const linkCounts = new Map<string, number>();
    const allLinksRaw = variant.connections.filter(conn => nodeMap.has(conn.from) && nodeMap.has(conn.to));
    
    // 1. Count links per pair (From-To)
    allLinksRaw.forEach(conn => {
        // Treat A->B and B->A as the same connection pair for physical spacing
        // But for portals, direction matters for arrow heads. 
        // We group by sorted ID pair to handle parallel lines between same nodes
        const ids = [conn.from, conn.to].sort();
        const key = `${ids[0]}-${ids[1]}`; 
        linkCounts.set(key, (linkCounts.get(key) || 0) + 1);
    });

    // 2. Assign indices
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
            const l = {
                ...linkObj,
                source: nodeMap.get(conn.from)!,
                target: nodeMap.get(conn.to)!
            };
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

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        zoomTransform.current = event.transform;
      });

    svg.call(zoom);
    if (zoomTransform.current) {
        svg.call(zoom.transform, zoomTransform.current);
    } else {
        svg.call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.8));
    }

    // Simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, ProcessedLink>(physicalLinks).id(d => d.id).distance(220)) 
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force("collide", d3.forceCollide<GraphNode>().radius(d => getNodeRadius(d.data.size || 1) + 30)); 

    // --- Draw Physical Links ---
    const linkGroup = g.append("g").attr("class", "links");

    // 1. Invisible Hit Areas (Wide) for easier selection
    const linkHitAreas = linkGroup
      .selectAll("path.hit-area")
      .data(physicalLinks)
      .join("path")
      .attr("class", "hit-area")
      .attr("stroke", "transparent")
      .attr("stroke-width", 20) // Wide hit area
      .attr("fill", "none")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        onSelectLinkRef.current(getLinkId(d));
      });

    // 2. Visible Physical Links
    const linkVisible = linkGroup
      .selectAll("path.visible-link")
      .data(physicalLinks)
      .join("path")
      .attr("class", "visible-link")
      .attr("stroke", "#475569")
      .attr("stroke-width", d => d.data.road ? 6 : 2)
      .attr("stroke-dasharray", d => d.data.connectionType === 'Proximity' ? "6,6" : "0") // Standardized dash
      .attr("fill", "none")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        onSelectLinkRef.current(getLinkId(d));
      });

    // --- Draw Physical Link Labels (Guards) ---
    const linkLabelGroup = g.append("g").attr("class", "link-labels");
    const linkLabel = linkLabelGroup
        .selectAll("g")
        .data(physicalLinks)
        .join("g")
        .style("cursor", "pointer") // Make labels clickable
        .on("click", (event, d) => {
            event.stopPropagation();
            onSelectLinkRef.current(getLinkId(d));
        });
    
    linkLabel.append("rect")
        .attr("rx", 6).attr("ry", 6)
        .attr("fill", d => getGuardFillColor(d.data.guardValue || 0))
        .attr("stroke", "#0f172a").attr("stroke-width", 2).attr("opacity", 0.9);

    const linkText = linkLabel.append("text")
        .text(d => d.data.guardValue ? `${Math.round(d.data.guardValue/1000)}k` : "")
        .attr("fill", "#e2e8f0").attr("font-size", "11px").attr("font-weight", "bold")
        .attr("text-anchor", "middle").attr("dy", "0.35em");

    // --- Draw Portal Links ---
    const portalGroup = g.append("g").attr("class", "portals");
    
    const portalElements = portalGroup
        .selectAll("g.portal-connection")
        .data(portalLinks)
        .join("g")
        .attr("class", "portal-connection")
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            event.stopPropagation();
            onSelectLinkRef.current(getLinkId(d));
        });

    const portalSourceArrow = portalElements.append("g").attr("class", "source-arrow");
    const portalTargetArrow = portalElements.append("g").attr("class", "target-arrow");

    const drawArrowWithTail = (selection: d3.Selection<SVGGElement, ProcessedLink, any, any>) => {
        const TAIL_LENGTH = 24; 
        
        // 1. Tail (Appended first so it's behind the arrow head)
        // Draw from -30 (node side) to -6 (arrow head side)
        // If road: straight line.
        // If no road: wavy curve.
        selection.append("path")
            .attr("d", (d) => {
                const startX = -6;
                const endX = -6 - TAIL_LENGTH; // -30
                if (d.data.road) {
                    return `M ${startX} 0 L ${endX} 0`;
                } else {
                    // Wavy path: simple quadratic bezier sequence or sine-like curve
                    // M -30 0 Q -24 5, -18 0 T -6 0
                    return `M ${endX} 0 C ${endX + 8} 5, ${startX - 8} -5, ${startX} 0`;
                }
            })
            .attr("fill", "none")
            .attr("stroke", "#475569") // Standard road color
            .attr("stroke-width", d => d.data.road ? 6 : 2)
            .attr("stroke-linecap", "round")
            .attr("data-orig-stroke", "#475569"); // Store gray as original

        // 2. Arrow head (Appended second so it overlays the tail connection)
        selection.append("path")
            .attr("d", "M -6 -6 L 8 0 L -6 6 z") 
            .attr("fill", (d, i) => PORTAL_COLORS[i % PORTAL_COLORS.length])
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);
    };

    drawArrowWithTail(portalSourceArrow);
    drawArrowWithTail(portalTargetArrow);

    // Guard on Source Arrow (Unified Style)
    // We attach it to the source group but we will counter-rotate it in tick()
    const portalGuardGroup = portalSourceArrow.append("g")
        .attr("class", "portal-guard")
        .style("display", d => (d.data.guardValue && d.data.guardValue > 0) ? "block" : "none");

    portalGuardGroup.append("rect")
        .attr("rx", 6).attr("ry", 6)
        .attr("x", -14).attr("y", -8)
        .attr("width", 28).attr("height", 16)
        .attr("fill", d => getGuardFillColor(d.data.guardValue || 0)) // Unified color logic
        .attr("stroke", "#0f172a") // Unified stroke
        .attr("stroke-width", 2);
    
    portalGuardGroup.append("text")
        .text(d => d.data.guardValue ? `${Math.round(d.data.guardValue/1000)}k` : "")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", "#e2e8f0") // White text
        .attr("text-anchor", "middle")
        .attr("dy", "0.3em");


    // --- Draw Nodes ---
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

    const node = nodeGroup
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node-group")
      .style("cursor", "pointer")
      .call(drag as any)
      .on("click", (event, d) => {
        if (event.defaultPrevented) return; 
        event.stopPropagation();
        onSelectNodeRef.current(d.id);
      });

    node.append("circle")
      .attr("id", d => `node-circle-${d.id}`)
      .attr("r", d => getNodeRadius(d.data.size || 1)) 
      .attr("fill", d => d.type === 'spawn' ? getPlayerColor(d.player) : '#1e293b')
      .attr("stroke", d => {
          const value = d.data.guardedContentValue || 0;
          if (value > 2000000) return "#f59e0b"; 
          if (value > 800000) return "#94a3b8"; 
          return "#475569"; 
      })
      .attr("stroke-width", d => (d.data.guardedContentValue || 0) > 2000000 ? 4 : 2)
      .style("filter", d => (d.data.guardedContentValue || 0) > 2000000 ? "drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))" : "none");

    // Node Text/Icons
    node.each(function(d) {
        const el = d3.select(this);
        const r = getNodeRadius(d.data.size || 1);
        const objects = d.data.mainObjects || [];
        const displayObjs = objects.filter(o => o.type === 'City' || o.type === 'Spawn');
        
        if (displayObjs.length === 0) {
            el.append("text").text("⌂").attr("text-anchor", "middle").attr("dy", "0.35em")
                .attr("fill", "#64748b").attr("font-size", `${r}px`).style("pointer-events", "none"); 
        } else if (displayObjs.length === 1) {
             const obj = displayObjs[0];
             let txt = "⌂";
             let color = "#e2e8f0";
             if (obj.type === 'Spawn') {
                 txt = obj.spawn?.replace('Player', 'P') || 'S';
                 color = "#fff";
             }
             el.append("text").text(txt).attr("text-anchor", "middle").attr("dy", "0.35em")
                .attr("fill", color).attr("font-size", `${r}px`).attr("font-weight", "bold").style("pointer-events", "none"); 
        } else {
            const count = displayObjs.length;
            const angleStep = (2 * Math.PI) / count;
            const subR = r * 0.5; 
            const iconSize = r * 0.6; 
            displayObjs.forEach((obj, i) => {
                const angle = i * angleStep - Math.PI / 2; 
                const ox = Math.cos(angle) * subR;
                const oy = Math.sin(angle) * subR;
                let txt = "⌂";
                let color = "#e2e8f0";
                if (obj.type === 'Spawn') {
                    txt = obj.spawn?.replace('Player', 'P') || 'S';
                    color = "#ef4444"; 
                }
                el.append("text").text(txt).attr("x", ox).attr("y", oy).attr("text-anchor", "middle").attr("dy", "0.35em")
                    .attr("fill", color).attr("font-size", `${iconSize}px`).attr("font-weight", "bold").style("pointer-events", "none"); 
            });
        }
    });

    node.append("text")
      .text(d => d.id)
      .attr("y", d => getNodeRadius(d.data.size || 1) + 16)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-size", "12px")
      .style("pointer-events", "none")
      .style("text-shadow", "2px 2px 4px #000");

    // --- Simulation Tick ---
    simulation.on("tick", () => {
      // 1. Update Physical Links
      const updateLinkPath = (d: any) => {
          const l = d as ProcessedLink;
          const src = l.source as GraphNode;
          const tgt = l.target as GraphNode;
          if (src.x === undefined || src.y === undefined || tgt.x === undefined || tgt.y === undefined) return "";
          return getLinkPath({ x: src.x, y: src.y }, { x: tgt.x, y: tgt.y }, l, 8); // 8 is gap for parallel lines
      };

      linkVisible.attr("d", updateLinkPath);
      linkHitAreas.attr("d", updateLinkPath);

      // Update Labels position with Staggering
      linkLabel.attr("transform", (d: any) => {
          const l = d as ProcessedLink;
          const src = l.source as GraphNode;
          const tgt = l.target as GraphNode;
          
          if (!src.x || !src.y || !tgt.x || !tgt.y) return "translate(0,0)";

          let midX = (src.x + tgt.x) / 2;
          let midY = (src.y + tgt.y) / 2;

          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          
          if (len > 0) {
              const nx = -dy / len;
              const ny = dx / len;
              // Parallel shift (side to side)
              if (l.linkCount > 1) {
                  const offset = (l.linkIndex - (l.linkCount - 1) / 2) * 8;
                  midX += nx * offset;
                  midY += ny * offset;
                  
                  // Longitudinal Staggering (along the line) to avoid overlap
                  // Spread them out along the line segment based on index
                  // Formula: (Index - Center) * SpreadDistance
                  const spread = (l.linkIndex - (l.linkCount - 1) / 2) * 30; // 30px spread
                  const unitDx = dx / len;
                  const unitDy = dy / len;
                  midX += unitDx * spread;
                  midY += unitDy * spread;
              }
          }

          return `translate(${midX},${midY})`;
      });
      
      linkText.each(function(d) {
          const bbox = this.getBBox();
          d3.select(this.parentNode as SVGGElement).select("rect")
            .attr("x", bbox.x - 8).attr("y", bbox.y - 4)
            .attr("width", bbox.width + 16).attr("height", bbox.height + 8);
      });

      // 2. Update Nodes
      node.attr("transform", d => `translate(${d.x},${d.y})`);
      nodes.forEach(n => { if (n.x && n.y) nodePositions.current.set(n.id, {x: n.x, y: n.y, fx: n.fx, fy: n.fy}); });

      // 3. Update Portal Arrows (Parallel Alignment)
      portalElements.each(function(d) {
          const link = d as ProcessedLink;
          const src = link.source as GraphNode;
          const tgt = link.target as GraphNode;
          if (!src.x || !src.y || !tgt.x || !tgt.y) return;

          // Canonical logic to ensure parallel lanes for bi-directional portals
          // Determine "Canonical" direction from ID comparison
          const isCanonical = src.id < tgt.id;

          const x1 = isCanonical ? src.x : tgt.x;
          const y1 = isCanonical ? src.y : tgt.y;
          const x2 = isCanonical ? tgt.x : src.x;
          const y2 = isCanonical ? tgt.y : src.y;

          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len === 0) return;

          // Unit vectors (Canonical)
          const ux = dx / len;
          const uy = dy / len;

          // Normal vectors (Canonical)
          const nx = -uy;
          const ny = ux;

          // Parallel Offset
          const gap = 12; // Gap for parallel portal lanes
          const offset = (link.linkIndex - (link.linkCount - 1) / 2) * gap;

          const shiftX = nx * offset;
          const shiftY = ny * offset;

          const TAIL_LENGTH = 24;
          const ARROW_OFFSET_FROM_CIRCLE = TAIL_LENGTH + 6; 

          // Source Arrow 
          const srcR = getNodeRadius(src.data.size || 1);
          const srcDist = srcR + ARROW_OFFSET_FROM_CIRCLE;
          
          // Direction of THIS arrow (always outward from src)
          // If isCanonical (A->B), dir is U. If not (B->A), dir is -U.
          const srcDirX = isCanonical ? ux : -ux;
          const srcDirY = isCanonical ? uy : -uy;

          const srcArrowX = src.x + shiftX + srcDirX * srcDist;
          const srcArrowY = src.y + shiftY + srcDirY * srcDist;
          
          const srcAngle = Math.atan2(srcDirY, srcDirX) * 180 / Math.PI;

          const srcGroup = d3.select(this).select(".source-arrow");
          srcGroup.attr("transform", `translate(${srcArrowX}, ${srcArrowY}) rotate(${srcAngle})`);

          // Move guard label to the empty space between arrows (in front of arrow tip)
          // x=24 pushes it forward into the gap
          srcGroup.select(".portal-guard")
             .attr("transform", `translate(24, 0) rotate(${-srcAngle})`); 

          // Target Arrow
          const tgtR = getNodeRadius(tgt.data.size || 1);
          const tgtDist = tgtR + ARROW_OFFSET_FROM_CIRCLE;
          
          // Direction of THIS arrow (always outward from tgt)
          // If isCanonical (A->B), Target is B. Outward is -U (towards A).
          // If not (B->A), Target is A. Outward is U (towards B).
          const tgtDirX = isCanonical ? -ux : ux;
          const tgtDirY = isCanonical ? -uy : uy;

          const tgtArrowX = tgt.x + shiftX + tgtDirX * tgtDist;
          const tgtArrowY = tgt.y + shiftY + tgtDirY * tgtDist;

          const tgtAngle = Math.atan2(tgtDirY, tgtDirX) * 180 / Math.PI;

          const tgtGroup = d3.select(this).select(".target-arrow");
          tgtGroup.attr("transform", `translate(${tgtArrowX}, ${tgtArrowY}) rotate(${tgtAngle})`);
      });
    });

    return () => {
      simulation.stop();
    };
  }, [data]); 

  // Effect 2: Handle Selection Styling
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    const getLinkId = (d: GraphLink) => d.data.name || `${d.data.from}-${d.data.to}`;

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
             
             // Handle Lines (Tails) -> Now Paths
             group.selectAll("path.tail-path") // Need to target the specific class or just path without head class? 
             // Currently drawArrowWithTail uses "path" for both. Let's rely on order or update drawArrowWithTail to add class if needed.
             // Actually, the previous selection logic selected ALL paths.
             // The Head is also a path. 
             // Let's refine the selector in drawArrowWithTail if we want specific styling, but here we iterate all paths in the group.
             // The tail is stroke-only (fill none). The head is fill + stroke.
             
             group.selectAll("path")
                .attr("stroke", function() {
                     // Check if it's the head or tail based on fill?
                     const fill = d3.select(this).attr("fill");
                     if (fill !== "none") {
                         // Head
                         return isSelected ? "#fff" : "#fff";
                     } else {
                         // Tail
                         if (isSelected) return "#fff";
                         return d3.select(this).attr("data-orig-stroke") || "#475569";
                     }
                })
                .attr("stroke-width", function() {
                      const fill = d3.select(this).attr("fill");
                      if (fill !== "none") {
                          // Head
                          return isSelected ? 2 : 1;
                      } else {
                          // Tail
                          const processed = d as ProcessedLink;
                          return isSelected ? (processed.data.road ? 7 : 4) : (processed.data.road ? 6 : 2);
                      }
                  });
        });

    // Reset Group Order
    svg.select(".links").lower();       
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
      
      {/* Legend */}
       <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg text-xs pointer-events-none select-none shadow-xl">
            <div className="font-bold text-slate-400 mb-2 uppercase tracking-wider">图例说明</div>
            <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-[#f59e0b] border border-slate-500 shadow-[0_0_4px_#f59e0b]"></span>
                <span className="text-amber-500">高价值区域 (>2M)</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-[#1e293b] border border-slate-500"></span>
                <span className="text-slate-300">普通区域</span>
            </div>
            <div className="h-px bg-slate-700 my-2"></div>
            <div className="flex items-center gap-2 mb-1">
                <span className="w-8 h-4 rounded bg-[#7f1d1d] flex items-center justify-center text-[8px] font-bold text-white">40k</span>
                <span className="text-red-400">强力守卫 (>=40k)</span>
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
                 {/* Wavy line simulation using SVG */}
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