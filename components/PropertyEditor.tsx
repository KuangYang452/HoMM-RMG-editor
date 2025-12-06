
import React, { useState, useEffect } from 'react';
import { RmgFile, RmgZone, RmgConnection } from '../types';
import { X, Box, Spline, Shield, Scaling, Type, Settings, Sliders, List, Layers, Database, ChevronDown, Trash2, Code, RotateCcw, Save } from 'lucide-react';
import { getLocalizedName, getLocalizedDescription } from '../utils/localization';

interface PropertyEditorProps {
  type: 'zone' | 'link' | null;
  data: any; 
  fullData?: RmgFile; 
  onSave: (newData: any) => void;
}

type ZoneTab = 'settings' | 'data' | 'content';

const PropertyEditor: React.FC<PropertyEditorProps> = ({ 
  type,
  data,
  fullData,
  onSave
}) => {
  const [draft, setDraft] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<ZoneTab>('settings');

  useEffect(() => {
    if (data) {
        setDraft(JSON.parse(JSON.stringify(data)));
        setIsDirty(false);
        setActiveTab('settings');
    } else {
        setDraft(null);
    }
  }, [data]);

  if (!type || !draft) return null;

  const isZone = type === 'zone';
  const isLink = type === 'link';

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

  const getMandatoryGroup = (name: string) => {
      return fullData?.mandatoryContent?.find(g => g.name === name);
  };

  const JsonArea = ({ label, value, onChange }: { label: string, value: any, onChange: (val: any) => void }) => {
      const [text, setText] = useState(JSON.stringify(value, null, 2));
      const [error, setError] = useState(false);

      useEffect(() => {
          setText(JSON.stringify(value, null, 2));
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

  const TabButton = ({ id, label, icon: Icon }: { id: ZoneTab, label: string, icon: any }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex-1 py-2 text-xs font-bold uppercase flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === id ? 'border-amber-500 text-amber-500 bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
      >
          <Icon size={14} />
          {label}
      </button>
  );

  return (
    <div className="w-full h-full flex flex-col bg-slate-900">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
        
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
                    <h4 className="text-xs font-bold text-amber-500 mb-2 uppercase flex items-center gap-1"><List size={14}/> 必选内容 (Mandatory)</h4>
                    
                    {/* Visualizer for Mandatory Groups */}
                    {draft.mandatoryContent && draft.mandatoryContent.length > 0 ? (
                        <div className="space-y-3 mb-4">
                            {draft.mandatoryContent.map((groupName: string, idx: number) => {
                                 const group = getMandatoryGroup(groupName);
                                 return (
                                     <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800">
                                         <div className="text-[10px] font-bold text-slate-400 mb-1 flex justify-between">
                                             <span>{groupName}</span>
                                             <span className="text-slate-600">{group?.content?.length || 0} items</span>
                                         </div>
                                         {group ? (
                                            <div className="flex flex-col gap-1">
                                                {group.content.map((item: any, i: number) => {
                                                    const name = getLocalizedName(item.sid);
                                                    const desc = getLocalizedDescription(item.sid);
                                                    return (
                                                        <div key={i} className="group/item relative flex items-center gap-2 bg-slate-900 px-2 py-1.5 rounded text-xs text-slate-300 border border-slate-800 hover:border-amber-500/50 transition-colors">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 shrink-0"></span>
                                                            <span className="truncate">{name}</span>
                                                            {item.isMine && <span className="ml-auto text-[8px] uppercase text-blue-400 bg-blue-900/30 px-1 rounded">Mine</span>}
                                                            
                                                            {/* Tooltip */}
                                                            <div className="absolute left-0 bottom-full mb-1 w-64 bg-slate-950 border border-slate-700 p-2 rounded-md shadow-2xl z-50 hidden group-hover/item:block pointer-events-none">
                                                                <div className="font-bold text-amber-500 mb-1 text-xs">{name}</div>
                                                                {desc && <div className="text-slate-300 text-[10px] leading-relaxed">{desc}</div>}
                                                                <div className="text-slate-500 text-[9px] mt-1 font-mono">SID: {item.sid}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                         ) : (
                                             <div className="text-xs text-red-400 italic">Group definition not found in global data.</div>
                                         )}
                                     </div>
                                 );
                            })}
                        </div>
                    ) : (
                        <div className="text-xs text-slate-500 italic mb-2">无必选内容 (No mandatory content assigned)</div>
                    )}

                     <div className="space-y-1">
                         <JsonArea 
                            label="Mandatory Refs (JSON)" 
                            value={draft.mandatoryContent || []} 
                            onChange={(val) => updateDraft((d: any) => ({...d, mandatoryContent: val}))}
                         />
                     </div>
                </div>

                <div className="pt-4 border-t border-slate-700 flex flex-col">
                    <JsonArea 
                        label="Main Objects (Cities/Spawns) JSON" 
                        value={draft.mainObjects || []} 
                        onChange={(val) => updateDraft((d: any) => ({...d, mainObjects: val}))}
                    />
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
    </div>
  );
};

export default PropertyEditor;
