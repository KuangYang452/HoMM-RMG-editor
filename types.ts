import * as d3 from 'd3';

// Simplified types based on the provided JSON structure

export interface RmgFile {
    name: string;
    gameMode?: string;
    description?: string;
    displayWinCondition?: string;
    sizeX?: number;
    sizeZ?: number;
    gameRules?: any;
    variants: RmgVariant[];
    zoneLayouts?: any[];
    mandatoryContent?: RmgMandatoryContentGroup[];
    contentCountLimits?: any[];
    contentPools?: any[];
    contentLists?: any[];
}

export interface RmgVariant {
    orientation?: any;
    border?: any;
    zones: RmgZone[];
    connections: RmgConnection[];
}

export interface RmgZone {
    name: string;
    size: number;
    layout: string;
    guardCutoffValue?: number;
    guardMultiplier?: number;
    guardWeeklyIncrement?: number;
    guardReactionDistribution?: number[];
    diplomacyModifier?: number;
    guardedContentValue?: number;
    unguardedContentValue?: number;
    resourcesValue?: number;
    mainObjects?: RmgMainObject[];
    mandatoryContent?: string[]; // References to mandatoryContent definitions
    // Additional fields can be added as needed
    [key: string]: any; 
}

export interface RmgMainObject {
    type: string; // e.g., "Spawn", "City"
    spawn?: string; // e.g., "Player1"
    [key: string]: any;
}

export interface RmgConnection {
    name?: string;
    from: string;
    to: string;
    connectionType: string; // "Direct", "Proximity"
    road?: boolean;
    guardValue?: number;
    guardWeeklyIncrement?: number;
    guardEscape?: boolean;
    length?: number; // For proximity
    [key: string]: any;
}

export interface RmgMandatoryContentGroup {
    name: string;
    content: RmgMandatoryContentItem[];
}

export interface RmgMandatoryContentItem {
    sid: string;
    isGuarded?: boolean;
    isMine?: boolean;
    [key: string]: any;
}

// Internal types for the Graph
export interface GraphNode extends d3.SimulationNodeDatum {
    id: string; // matches zone name
    data: RmgZone;
    type: 'spawn' | 'city' | 'empty';
    player?: string; // e.g., Player1
    // D3 Simulation properties
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
    index?: number;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    data: RmgConnection;
    source: string | GraphNode;
    target: string | GraphNode;
}