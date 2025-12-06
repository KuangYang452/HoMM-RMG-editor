
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { RmgFile, RmgZone, RmgConnection } from '../types';
import { X, Box, Spline, Shield, Scaling, Type, Settings, Sliders, List, Layers, Database, ChevronDown, Trash2, Code, RotateCcw, Save, Plus, ArrowRight, MoreHorizontal, Link, Castle, Flag } from 'lucide-react';
import { getLocalizedName, getLocalizedDescription } from '../utils/localization';
import { BASIC_CONTENT_LISTS } from '../data/basic_content_lists';

interface PropertyEditorProps {
  type: 'zone' | 'link' | null;
  data: any; 
  fullData?: RmgFile; 
  onSave: (newData: any) => void;
  onOpenGlobalSettings?: (tab: 'rules' | 'layouts' | 'variants' | 'content' | 'raw') => void;
}

type ZoneTab = 'settings' | 'data' | 'content';

// Helper: Portal Tooltip Component
const TooltipPortal = ({ item, rect, fullData }: { item: any, rect: DOMRect, fullData?: RmgFile }) => {
    // 1. Resolve Content Logic (Copied from previous renderGridItem to ensure consistency)
    const resolveListContent = (listName: string): any[] | null => {
        const userList = fullData?.contentLists?.find((l: any) => l.name === listName);
        if (userList) return userList.content;
        const basicList = BASIC_CONTENT_LISTS.find(l => l.name === listName);
        if (basicList) return basicList.content;
        return null;
    };

    let contentNode: React.ReactNode = null;
    const count = item.count || 1;

    // Type A: Included Lists
    if (item.includeLists && Array.isArray(item.includeLists)) {
        const resolvedContents = item.includeLists.map((name: string) => {
            const content = resolveListContent(name);
            return { name, content };
        });

        const tooltipLines: string[] = [];
        resolvedContents.forEach((rc: any) => {
            if (rc.content) {
                rc.content.forEach((c: any) => {
                    tooltipLines.push(getLocalizedName(c.sid));
                });
            } else {
                tooltipLines.push(`${rc.name} (Not Found)`);
            }
        });
        const MAX_TOOLTIP_ITEMS = 15;
        const displayTooltip = tooltipLines.slice(0, MAX_TOOLTIP_ITEMS);
        const remainder = tooltipLines.length - MAX_TOOLTIP_ITEMS;

        contentNode = (
            <>
                <div className="font-bold text-blue-400 text-xs mb-1.5 flex justify-between">
                    <span>Included Content</span>
                    {count > 1 && <span className="text-slate-400 font-normal">x{count}</span>}
                </div>
                <ul className="text-[10px] text-slate-300 space-y-0.5 list-disc pl-3">
                    {displayTooltip.map((line, i) => <li key={i}>{line}</li>)}
                    {remainder > 0 && <li className="text-slate-500 italic pt-1">... +{remainder} more</li>}
                </ul>
            </>
        );
    } 
    // Type B: Main Object (City/Spawn)
    else if (item.type) {
        contentNode = (
            <>
                <div className="font-bold text-emerald-400 text-xs mb-1 flex justify-between items-start gap-2">
                    <span>{item.type}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mb-2">
                    {item.spawn || item.owner || (item.id ? `ID: ${item.id}` : '')}
                </div>
                <div className="text-[9px] text-slate-500 italic border-t border-slate-700 pt-1">
                    点击编辑属性 (JSON)
                </div>
            </>
        );
    }
    // Type C: Regular Item
    else {
        const name = getLocalizedName(item.sid);
        const description = getLocalizedDescription(item.sid);
        const isMine = item.isMine;
        const isGuarded = item.isGuarded;

        contentNode = (
            <>
                <div className="font-bold text-amber-500 text-xs mb-1 flex justify-between items-start gap-2">
                    <span>{name}</span>
                    {count > 1 && <span className="text-slate-400 font-normal whitespace-nowrap">x{count}</span>}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mb-2">{item.sid}</div>
                
                {description && (
                    <div className="text-[10px] text-slate-300 italic mb-2 border-t border-slate-700 pt-2 leading-relaxed">
                        {description}
                    </div>
                )}

                <div className="flex flex-wrap gap-1 mt-1">
                    {isMine && <span className="text-[9px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">Mine</span>}
                    {isGuarded === false && <span className="text-[9px] bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded border border-green-800">Unguarded</span>}
                </div>
            </>
        );
    }

    // 2. Positioning Logic
    const tooltipWidth = 220; // Approx max width
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    
    // Default: Top Center
    let top = rect.top - 8;
    let left = rect.left + rect.width / 2;
    let transform = "translate(-50%, -100%)";

    // If too close to top, show at bottom
    if (rect.top < 200) {
        top = rect.bottom + 8;
        transform = "translate(-50%, 0)";
    }

    // Edge Detection
    if (left - tooltipWidth/2 < 10) {
        // Too far left
        left = rect.left;
        transform = transform.replace("-50%", "0"); // Align left edge
    } else if (left + tooltipWidth/2 > screenW - 10) {
        // Too far right
        left = rect.right;
        transform = transform.replace("-50%", "-100%"); // Align right edge
    }

    const style: React.CSSProperties = {
        position: 'fixed',
        top: top,
        left: left,
        transform: transform,
        zIndex: 9999,
        pointerEvents: 'none',
        width: 'max-content',
        maxWidth: '240px'
    };

    return createPortal(
        <div style={style} className="bg-slate-950 border border-slate-600 p-3 rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.7)] backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100">
            {contentNode}
        </div>,
        document.body
    );
};

// Internal Modal for Object Editing
const ObjectJsonEditor = ({ data, onSave, onClose, onDelete, isNew }: { data: any, onSave: (val: any) => void, onClose: () => void, onDelete?: () => void, isNew?: boolean }) => {
    const [json, setJson] = useState(JSON.stringify(data, null, 2));
    const [error, setError] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Sync with external data changes if any
    useEffect(() => {
        setJson(JSON.stringify(data, null, 2));
    }, [data]);

    const handleSave = () => {
        if (!json.trim()) {
            // Cannot save empty content
            setError(true);
            return;
        }
        try {
            const parsed = JSON.parse(json);
            onSave(parsed);
            onClose();
        } catch (e) {
            setError(true);
        }
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirmDelete) {
            if (onDelete) onDelete();
        } else {
            setConfirmDelete(true);
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-slate-900/95 flex flex-col p-4 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2 shrink-0">
                <h4 className="text-amber-500 font-bold text-sm flex items-center gap-2">
                    <Code size={16}/> {isNew ? '创建新对象' : '编辑对象属性'}
                </h4>
                <button onClick={onClose} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-full transition-colors"><X size={18}/></button>
            </div>
            <div className="relative flex-1 flex flex-col min-h-0">
                <textarea
                    className={`flex-1 bg-slate-950 border ${error ? 'border-red-500' : 'border-slate-700'} rounded p-3 text-xs font-mono text-slate-300 resize-none outline-none mb-2 focus:border-amber-500 transition-colors`}
                    value={json}
                    onChange={e => { setJson(e.target.value); setError(false); }}
                    spellCheck={false}
                />
                {error && <div className="absolute bottom-4 right-4 text-red-400 text-xs font-bold bg-slate-900/80 px-2 py-1 rounded">{!json.trim() ? "Cannot be empty" : "Invalid JSON"}</div>}
            </div>
            <div className="flex gap-2 shrink-0">
                {onDelete && !isNew && (
                    <button 
                        onClick={handleDelete} 
                        onMouseLeave={() => setConfirmDelete(false)}
                        className={`mr-auto py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-2 border transition-all ${confirmDelete ? 'bg-red-600 text-white border-red-500 hover:bg-red-700' : 'bg-red-900/20 hover:bg-red-900/50 text-red-400 border-red-900/30'}`}
                    >
                        <Trash2 size={14} /> {confirmDelete ? '确认删除 (Confirm)?' : '删除'}
                    </button>
                )}
                <button onClick={handleSave} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20">
                    <Save size={14} /> {isNew ? '创建 (Create)' : '保存 (Save)'}
                </button>
            </div>
        </div>
    );
}

// Helper Component defined outside to preserve state/focus
const JsonArea = ({ label, value, onChange }: { label: string, value: any, onChange: (val: any) => void }) => {
    // Initialize with function to avoid heavy stringify on every render
    const [text, setText] = useState(() => JSON.stringify(value, null, 2));
    const [error, setError] = useState(false);

    // Only update text from value if the CONTENT has changed, not just the reference
    useEffect(() => {
        const newText = JSON.stringify(value, null, 2);
        if (newText !== text) {
            setText(newText);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setText(newVal);
        try {
            const parsed = JSON.parse(newVal);
            onChange(parsed);
            setError(false);
        } catch (err) {
            setError(true);
        }
    };

    return (
        <div className="space-y-1 flex-1 flex flex-col min-h-0">
            <label className="text-xs uppercase font-bold text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1"><Code size={12}/> {label}</span>
                {error && <span className="text-red-500 text-[10px]">Invalid JSON</span>}
            </label>
            <textarea 
                className={`w-full h-32 bg-slate-950 border rounded p-2 text-xs font-mono text-slate-300 resize-none outline-none ${error ? 'border-red-500' : 'border-slate-700 focus:border-amber-500'}`}
                value={text}
                onChange={handleChange}
                spellCheck={false}
            />
        </div>
    );
};

const PropertyEditor: React.FC<PropertyEditorProps> = ({ 
  type,
  data,
  fullData,
  onSave,
  onOpenGlobalSettings
}) => {
  const [draft, setDraft] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<ZoneTab>('settings');
  
  // Tooltip & Modal State
  const [hoveredItem, setHoveredItem] = useState<{ item: any, rect: DOMRect } | null>(null);
  const [editMainObjectIndex, setEditMainObjectIndex] = useState<number | null>(null); // -1 for new

  useEffect(() => {
    if (data) {
        setDraft(JSON.parse(JSON.stringify(data)));
        setIsDirty(false);
        // Keep tab context when switching between similar types if desired, but for stability reset to settings
        setActiveTab('settings');
    } else {
        setDraft(null);
    }
  }, [data]);

  const updateDraft = (updater: (prev: any) => any) => {
      setDraft((prev: any) => {
          const next = updater(prev);
          setIsDirty(true);
          return next;
      });
  };

  const handleApply = () => {
      onSave(draft);
      setIsDirty(false);
  };

  const handleReset = () => {
      if (data) {
          setDraft(JSON.parse(JSON.stringify(data)));
          setIsDirty(false);
      }
  };

  // Pre-calculate derived state to use in Hooks
  const isZone = type === 'zone';
  const isLink = type === 'link';

  // --- Content Resolving Helpers ---
  
  // Flatten and Group selected mandatory groups
  // HOOK MUST BE CALLED BEFORE CONDITIONAL RETURN
  const aggregatedContent = useMemo(() => {
      if (!isZone || !draft || !draft.mandatoryContent || !fullData?.mandatoryContent) return [];
      
      const itemMap = new Map<string, any>();
      const getMandatoryGroup = (name: string) => {
          return fullData.mandatoryContent?.find(g => g.name === name);
      };

      draft.mandatoryContent.forEach((groupName: string) => {
          const group = getMandatoryGroup(groupName);
          if (group && group.content) {
              group.content.forEach((originalItem: any) => {
                  const item = { ...originalItem };
                  let key = "";
                  
                  // Generate key for grouping
                  if (item.includeLists) {
                      // Group lists by their content similarity (simplified to sorted names)
                      key = "LIST::" + JSON.stringify(item.includeLists.slice().sort());
                  } else if (item.sid) {
                      // Group items by SID. Note: this merges guarded/unguarded versions visually
                      key = "SID::" + item.sid;
                  } else {
                      return; // Skip unknown items
                  }

                  if (itemMap.has(key)) {
                      const existing = itemMap.get(key);
                      existing.count = (existing.count || 1) + 1;
                  } else {
                      item.count = 1;
                      itemMap.set(key, item);
                  }
              });
          }
      });
      return Array.from(itemMap.values());
  }, [isZone, draft, fullData]);

  // Render a specific content item cell
  const renderGridItem = (item: any, idx: number) => {
      const count = item.count || 1;

      // Type 1: Bundled Lists
      if (item.includeLists && Array.isArray(item.includeLists)) {
          return (
              <div 
                key={idx} 
                className="group/griditem relative aspect-square bg-slate-800 border border-slate-700 rounded-md flex flex-col items-center justify-center p-1 hover:border-amber-500/50 transition-colors cursor-help"
                onMouseEnter={(e) => setHoveredItem({ item, rect: e.currentTarget.getBoundingClientRect() })}
                onMouseLeave={() => setHoveredItem(null)}
              >
                  <Layers className="text-blue-400 mb-1" size={18} />
                  <span className="text-[10px] text-slate-400 text-center leading-tight line-clamp-2 w-full break-words">Included Lists</span>
                  
                  {/* Quantity Badge */}
                  {count > 1 && (
                      <div className="absolute top-0 right-0 bg-amber-600 text-white text-[8px] font-bold px-1 rounded-bl-md shadow-sm z-10 border-l border-b border-slate-800">
                          {count}
                      </div>
                  )}
              </div>
          );
      }

      // Type 2: Regular Item
      const name = getLocalizedName(item.sid);
      const isMine = item.isMine;
      const isGuarded = item.isGuarded;

      return (
          <div 
            key={idx} 
            className="group/griditem relative aspect-square bg-slate-900 border border-slate-800 rounded-md flex flex-col items-center justify-center p-1 hover:border-amber-500/50 transition-colors"
            onMouseEnter={(e) => setHoveredItem({ item, rect: e.currentTarget.getBoundingClientRect() })}
            onMouseLeave={() => setHoveredItem(null)}
          >
              <Box className={isMine ? "text-blue-500" : "text-slate-500"} size={18} />
              <span className="text-[10px] text-slate-300 text-center leading-tight mt-1 line-clamp-2 w-full break-words">{name}</span>
              
              {/* Quantity Badge */}
              {count > 1 && (
                  <div className="absolute top-0 right-0 bg-amber-600 text-white text-[8px] font-bold px-1 rounded-bl-md shadow-sm z-10 border-l border-b border-slate-800">
                      {count}
                  </div>
              )}

              {/* Safe Badge */}
              {isGuarded === false && (
                  <div className="absolute top-0 left-0 bg-green-600/90 text-white text-[7px] font-bold px-1 py-0.5 rounded-br-sm z-10 shadow-sm leading-none backdrop-blur-[1px]">
                      SAFE
                  </div>
              )}
          </div>
      );
  };

  const renderMainObjectItem = (item: any, idx: number) => {
      let Icon = Box;
      let label = item.type;
      let subLabel = "";

      if (item.type === 'City') {
          Icon = Castle;
          subLabel = item.owner || "Neutral";
      } else if (item.type === 'Spawn') {
          Icon = Flag;
          subLabel = item.spawn || "Player";
      }

      return (
          <div 
              key={`mo-${idx}`} 
              className="group/griditem relative aspect-square bg-slate-900 border border-slate-700 rounded-md flex flex-col items-center justify-center p-1 hover:border-emerald-500/50 hover:bg-slate-800 transition-colors cursor-pointer"
              onMouseEnter={(e) => setHoveredItem({ item, rect: e.currentTarget.getBoundingClientRect() })}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => setEditMainObjectIndex(idx)}
          >
              <Icon className="text-emerald-500 mb-1" size={18} />
              <span className="text-[10px] text-slate-300 text-center leading-tight w-full truncate font-bold">{label}</span>
              {subLabel && <span className="text-[8px] text-slate-500 text-center w-full truncate">{subLabel}</span>}
          </div>
      );
  };

  const TabButton = ({ id, label, icon: Icon }: { id: ZoneTab, label: string, icon: any }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex-1 py-2 text-xs font-bold uppercase flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === id ? 'border-amber-500 text-amber-500 bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
      >
          <Icon size={14} />
          {label}
      </button>
  );

  // Early return MUST happen after all hooks
  if (!type || !draft) return null;

  // Grid calculation constants
  const MAX_GRID_ITEMS = 12;
  const showMoreButton = aggregatedContent.length > MAX_GRID_ITEMS;
  const visibleItems = showMoreButton ? aggregatedContent.slice(0, MAX_GRID_ITEMS - 1) : aggregatedContent.slice(0, MAX_GRID_ITEMS);

  // Main Objects Grid Calculation
  const mainObjects = draft.mainObjects || [];
  const MAX_VISIBLE_MO = 7; // 8 slots max, 1 reserved for button
  const showMoreMO = mainObjects.length > MAX_VISIBLE_MO;
  const visibleMO = showMoreMO ? mainObjects.slice(0, MAX_VISIBLE_MO) : mainObjects;

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 relative">
      {/* Header */}
      <div className="h-14 border-b border-slate-700 flex justify-between items-center px-4 bg-slate-800 shrink-0">
        <h3 className="font-bold text-base text-slate-200 flex items-center gap-2 truncate">
            {isZone && <span className="text-amber-500 flex items-center gap-2"><Box size={16} /> {draft.name}</span>}
            {isLink && <span className="text-amber-500 flex items-center gap-2"><Spline size={16} /> 连接属性</span>}
        </h3>
      </div>

      {/* Tabs (Only for Zone) */}
      {isZone && (
          <div className="flex bg-slate-900 border-b border-slate-700 shrink-0">
              <TabButton id="settings" label="设定" icon={Settings} />
              <TabButton id="data" label="数据" icon={Database} />
              <TabButton id="content" label="内容" icon={Layers} />
          </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-700 relative">
        
        {/* === ZONE EDITOR - TAB 1: SETTINGS === */}
        {isZone && activeTab === 'settings' && (
            <div className="space-y-5">
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1">
                        <Type size={12}/> 区域名称 (ID)
                    </label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                        value={draft.name}
                        onChange={(e) => updateDraft((d: any) => ({ ...d, name: e.target.value }))}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1">
                        <Scaling size={12}/> 区域大小 (Size)
                    </label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            step="0.1"
                            className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                            value={draft.size}
                            onChange={(e) => updateDraft((d: any) => ({ ...d, size: parseFloat(e.target.value) }))}
                        />
                        <div className="text-xs text-slate-500">Multiplier</div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1">
                        <Box size={12}/> 布局类型 (Layout)
                    </label>
                    <div className="relative">
                        <select
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none appearance-none"
                            value={draft.layout || ""}
                            onChange={(e) => updateDraft((d: any) => ({ ...d, layout: e.target.value }))}
                        >
                            <option value="" disabled>选择布局...</option>
                            {fullData?.zoneLayouts?.map((l: any) => (
                                <option key={l.name} value={l.name}>{l.name}</option>
                            ))}
                            {/* Fallback if current value is not in list */}
                            {draft.layout && fullData?.zoneLayouts && !fullData.zoneLayouts.find((l:any) => l.name === draft.layout) && (
                                <option value={draft.layout}>{draft.layout} (Unknown)</option>
                            )}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                            <ChevronDown size={14} />
                        </div>
                    </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                     <JsonArea 
                        label="Zone Biome (JSON)" 
                        value={draft.zoneBiome || {}} 
                        onChange={(val) => updateDraft((d: any) => ({...d, zoneBiome: val}))}
                    />
                </div>
            </div>
        )}

        {/* === ZONE EDITOR - TAB 2: DATA === */}
        {isZone && activeTab === 'data' && (
            <div className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1">
                        <Shield size={12}/> 价值设定 (Values)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <span className="text-[10px] text-slate-400">守卫价值</span>
                            <input 
                                type="number" 
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none font-mono"
                                value={draft.guardedContentValue || 0}
                                onChange={(e) => updateDraft((d: any) => ({ ...d, guardedContentValue: parseInt(e.target.value) }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-slate-400">资源价值</span>
                            <input 
                                type="number" 
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none font-mono"
                                value={draft.resourcesValue || 0}
                                onChange={(e) => updateDraft((d: any) => ({ ...d, resourcesValue: parseInt(e.target.value) }))}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1">
                        <Sliders size={12}/> 守卫参数 (Guard Params)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <div title="Guard Multiplier">
                            <input 
                                type="number" step="0.1"
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none text-center"
                                value={draft.guardMultiplier ?? 1}
                                onChange={(e) => updateDraft((d: any) => ({ ...d, guardMultiplier: parseFloat(e.target.value) }))}
                            />
                            <div className="text-[10px] text-slate-500 text-center mt-1">倍率</div>
                        </div>
                        <div title="Weekly Increment">
                            <input 
                                type="number" step="0.01"
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none text-center"
                                value={draft.guardWeeklyIncrement ?? 0}
                                onChange={(e) => updateDraft((d: any) => ({ ...d, guardWeeklyIncrement: parseFloat(e.target.value) }))}
                            />
                            <div className="text-[10px] text-slate-500 text-center mt-1">周增</div>
                        </div>
                        <div title="Cutoff Value">
                            <input 
                                type="number"
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none text-center"
                                value={draft.guardCutoffValue ?? 0}
                                onChange={(e) => updateDraft((d: any) => ({ ...d, guardCutoffValue: parseInt(e.target.value) }))}
                            />
                            <div className="text-[10px] text-slate-500 text-center mt-1">阈值</div>
                        </div>
                    </div>
                </div>

                 <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1">
                        外交修正 (Diplomacy)
                    </label>
                    <input 
                        type="number" step="0.1"
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                        value={draft.diplomacyModifier ?? 0}
                        onChange={(e) => updateDraft((d: any) => ({ ...d, diplomacyModifier: parseFloat(e.target.value) }))}
                    />
                </div>
                
                <div className="space-y-2 pt-2 border-t border-slate-800">
                     <JsonArea 
                        label="Guard Reaction Dist. (JSON)" 
                        value={draft.guardReactionDistribution || []} 
                        onChange={(val) => updateDraft((d: any) => ({...d, guardReactionDistribution: val}))}
                    />
                </div>
            </div>
        )}

        {/* === ZONE EDITOR - TAB 3: CONTENT === */}
        {isZone && activeTab === 'content' && (
            <div className="space-y-6">
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-amber-500 uppercase flex items-center gap-1"><List size={14}/> 必选内容 (Mandatory)</h4>
                        <button 
                            onClick={() => updateDraft((d: any) => ({ ...d, mandatoryContent: [...(d.mandatoryContent || []), fullData?.mandatoryContent?.[0]?.name || ""] }))}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                            title="Add Group"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    
                    {/* Mandatory Content Editor (List of Dropdowns) */}
                    <div className="space-y-2 mb-6">
                        {draft.mandatoryContent && draft.mandatoryContent.length > 0 ? (
                            draft.mandatoryContent.map((groupName: string, idx: number) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <div className="relative flex-1">
                                        <select
                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:border-amber-500 outline-none appearance-none"
                                            value={groupName}
                                            onChange={(e) => {
                                                const newArr = [...draft.mandatoryContent];
                                                newArr[idx] = e.target.value;
                                                updateDraft((d: any) => ({ ...d, mandatoryContent: newArr }));
                                            }}
                                        >
                                            {fullData?.mandatoryContent?.map((g: any) => (
                                                <option key={g.name} value={g.name}>{g.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <ChevronDown size={12} />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newArr = [...draft.mandatoryContent];
                                            newArr.splice(idx, 1);
                                            updateDraft((d: any) => ({ ...d, mandatoryContent: newArr }));
                                        }}
                                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-slate-500 italic p-2 border border-dashed border-slate-800 rounded">无必选内容 (Click + to add)</div>
                        )}
                    </div>

                    {/* Details Window / Visualizer */}
                    <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase flex items-center gap-1">
                        详情预览 (Details Preview)
                    </h4>
                    
                    <div className="bg-slate-950 rounded border border-slate-800 p-2">
                        {aggregatedContent.length === 0 ? (
                            <div className="text-xs text-slate-600 text-center py-4">No content items</div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {visibleItems.map((item, idx) => renderGridItem(item, idx))}
                                
                                {showMoreButton && (
                                    <button 
                                        onClick={() => onOpenGlobalSettings && onOpenGlobalSettings('content')}
                                        className="aspect-square bg-slate-800 border border-slate-700 border-dashed rounded-md flex flex-col items-center justify-center hover:bg-slate-700 hover:text-amber-500 transition-colors group"
                                        title="Manage Mandatory Content"
                                    >
                                        <Link size={18} className="text-slate-500 group-hover:text-amber-500 mb-1" />
                                        <span className="text-[8px] text-slate-500 group-hover:text-amber-500 font-bold">More...</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Main Objects Section - OPTIMIZED */}
                    <div className="relative py-2 mt-4">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-slate-900 px-2 text-[10px] text-slate-500 uppercase tracking-wider font-bold">主要对象 (Main Objects)</span>
                        </div>
                    </div>
                    
                    <div className="bg-slate-950 rounded border border-slate-800 p-2">
                        <div className="grid grid-cols-4 gap-2">
                            {visibleMO.map((obj: any, idx: number) => renderMainObjectItem(obj, idx))}
                            
                            {/* Logic for the 8th slot: Either "Add" or "More" */}
                            {showMoreMO ? (
                                <button 
                                    onClick={() => onOpenGlobalSettings && onOpenGlobalSettings('raw')}
                                    className="aspect-square bg-slate-800 border border-slate-700 border-dashed rounded-md flex flex-col items-center justify-center hover:bg-slate-700 hover:text-amber-500 transition-colors group"
                                    title="View All in Raw Editor"
                                >
                                    <MoreHorizontal size={18} className="text-slate-500 group-hover:text-amber-500 mb-1" />
                                    <span className="text-[8px] text-slate-500 group-hover:text-amber-500 font-bold text-center leading-tight">显示更多<br/>(Raw)</span>
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setEditMainObjectIndex(-1)}
                                    className="aspect-square bg-slate-900 border border-slate-800 border-dashed rounded-md flex flex-col items-center justify-center hover:bg-slate-800 hover:text-emerald-500 transition-colors group"
                                    title="Add Main Object"
                                >
                                    <Plus size={18} className="text-slate-600 group-hover:text-emerald-500" />
                                    <span className="text-[9px] text-slate-600 group-hover:text-emerald-500 mt-1">Add</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* === LINK EDITOR === */}
        {isLink && (
           <>
            <div className="p-3 bg-slate-950 rounded mb-4 border border-slate-800">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>From</span>
                    <span>To</span>
                </div>
                <div className="flex justify-between font-bold text-amber-500 text-sm">
                    <span>{draft.from}</span>
                    <span>→</span>
                    <span>{draft.to}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800">
                    <label className="text-[10px] text-slate-500 block mb-1">Connection ID</label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-400"
                        value={draft.name || `${draft.from}-${draft.to}`}
                        onChange={(e) => updateDraft((d: any) => ({ ...d, name: e.target.value }))}
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1">
                        <Shield size={12}/> 守卫设置
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <input 
                            type="number" placeholder="Value"
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                            value={draft.guardValue || 0}
                            onChange={(e) => updateDraft((d: any) => ({ ...d, guardValue: parseInt(e.target.value) }))}
                        />
                         <input 
                            type="number" step="0.01" placeholder="Inc"
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                            value={draft.guardWeeklyIncrement || 0}
                            onChange={(e) => updateDraft((d: any) => ({ ...d, guardWeeklyIncrement: parseFloat(e.target.value) }))}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-950 border border-slate-800 rounded hover:border-slate-600 transition-colors">
                        <input 
                            type="checkbox" 
                            className="accent-amber-500 w-4 h-4 rounded"
                            checked={draft.road || false}
                            onChange={(e) => updateDraft((d: any) => ({ ...d, road: e.target.checked }))}
                        />
                        <span className="text-sm font-medium">铺设道路 (Road)</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-950 border border-slate-800 rounded hover:border-slate-600 transition-colors">
                        <input 
                            type="checkbox" 
                            className="accent-amber-500 w-4 h-4 rounded"
                            checked={draft.guardEscape || false}
                            onChange={(e) => updateDraft((d: any) => ({ ...d, guardEscape: e.target.checked }))}
                        />
                        <span className="text-sm font-medium">守卫可逃跑 (Escape)</span>
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500">连接类型</label>
                    <div className="flex gap-2">
                        <button 
                            className={`flex-1 py-1 px-2 text-xs rounded border ${draft.connectionType === 'Direct' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}
                            onClick={() => updateDraft((d: any) => ({ ...d, connectionType: 'Direct' }))}
                        >
                            Direct
                        </button>
                        <button 
                            className={`flex-1 py-1 px-2 text-xs rounded border ${draft.connectionType === 'Proximity' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}
                            onClick={() => updateDraft((d: any) => ({ ...d, connectionType: 'Proximity' }))}
                        >
                            Proximity
                        </button>
                        <button 
                            className={`flex-1 py-1 px-2 text-xs rounded border ${draft.connectionType === 'Portal' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}
                            onClick={() => updateDraft((d: any) => ({ ...d, connectionType: 'Portal' }))}
                        >
                            Portal
                        </button>
                    </div>
                </div>
            </div>
           </> 
        )}

      </div>
      
      {/* Footer / Actions */}
      <div className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2 shrink-0">
        <button 
            onClick={handleReset}
            disabled={!isDirty}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${isDirty ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-900 text-slate-600 cursor-not-allowed'}`}
        >
            <RotateCcw size={14} /> 重置
        </button>
        <button 
            onClick={handleApply}
            disabled={!isDirty}
            className={`flex-[2] flex items-center justify-center gap-2 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${isDirty ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20' : 'bg-slate-900 text-slate-600 cursor-not-allowed'}`}
        >
            <Save size={14} /> 应用
        </button>
      </div>

      {/* Render Portal Tooltip if Hovered */}
      {hoveredItem && (
          <TooltipPortal 
            item={hoveredItem.item} 
            rect={hoveredItem.rect} 
            fullData={fullData}
          />
      )}

      {/* Render Main Object Editor Modal */}
      {editMainObjectIndex !== null && (
          <ObjectJsonEditor 
            data={editMainObjectIndex === -1 ? { type: "City", owner: "Player1", spawn: undefined } : (draft.mainObjects?.[editMainObjectIndex] || {})}
            isNew={editMainObjectIndex === -1}
            onClose={() => setEditMainObjectIndex(null)}
            onSave={(newObj) => {
                updateDraft((d: any) => {
                    const newArr = [...(d.mainObjects || [])];
                    if (editMainObjectIndex === -1) {
                        newArr.push(newObj);
                    } else {
                        newArr[editMainObjectIndex] = newObj;
                    }
                    return { ...d, mainObjects: newArr };
                });
            }}
            onDelete={editMainObjectIndex !== -1 ? () => {
                updateDraft((d: any) => {
                    const newArr = [...(d.mainObjects || [])];
                    // Ensure index is valid number within bounds
                    if (typeof editMainObjectIndex === 'number' && editMainObjectIndex >= 0 && editMainObjectIndex < newArr.length) {
                        newArr.splice(editMainObjectIndex, 1);
                    }
                    return { ...d, mainObjects: newArr };
                });
                setEditMainObjectIndex(null);
            } : undefined}
          />
      )}
    </div>
  );
};

export default PropertyEditor;
