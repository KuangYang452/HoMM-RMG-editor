import { MAP_OBJECTS_CN } from '../data/Lang/zhCN/mapObjects';

const tokens = (MAP_OBJECTS_CN as any).tokens || [];
const lookup = new Map<string, string>();

tokens.forEach((t: any) => {
    if (t.sid && t.text) {
        lookup.set(t.sid, t.text);
    }
});

export const getLocalizedName = (sid: string): string => {
    // Try explicit name key first (e.g. "mine_wood_name")
    const nameKey = `${sid}_name`;
    if (lookup.has(nameKey)) return lookup.get(nameKey)!;
    
    // Fallback to direct sid if it exists
    if (lookup.has(sid)) return lookup.get(sid)!;

    return sid;
};

export const getLocalizedDescription = (sid: string): string => {
    // Try standard description
    const descKey = `${sid}_description`;
    if (lookup.has(descKey)) return lookup.get(descKey)!;

    // Try narrative description
    const narrKey = `${sid}_narrativeDescription`;
    if (lookup.has(narrKey)) return lookup.get(narrKey)!;

    return "";
};
