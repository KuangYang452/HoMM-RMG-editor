import React, { useState, useEffect } from 'react';
import { RmgFile, RmgZone, RmgConnection } from '../types';
import { X, Box, Spline, Shield, Scaling, Type, Settings, Sliders, Target, Code, Save, RotateCcw, List, Info } from 'lucide-react';
import { getLocalizedName, getLocalizedDescription } from '../utils/localization';

interface PropertyEditorProps {
  type: 'zone' | 'link' | 'global' | null;
  data: any; // Dynamic based on type
  fullData?: RmgFile; // Need full data to look up references
  onClose: () => void;
  onSave: (newData: any) => void;
}

const PropertyEditor: React.FC<PropertyEditorProps> = ({ 
  type,
  data,
  fullData,
  onClose,
  onSave
}) => {
  // Local Draft State
  const [draft, setDraft] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Sync draft when prop data changes (e.g. user selects a different node)
  useEffect(() => {
    if (data) {
        setDraft(JSON.parse(JSON.stringify(data))); // Deep clone
        setIsDirty(false);
    } else {
        setDraft(null);
    }
  }, [data]);

  if (!type || !draft) return null;

  const isZone = type === 'zone';
  const isLink = type === 'link';
  const isGlobal = type === 'global';

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

  // Helper for JSON Text Area
  const JsonArea = ({ label, value, fieldName }: { label: string, value: any, fieldName: string }) => {
      const [text, setText] = useState(JSON.stringify(value, null, 2));
      const [error, setError] = useState(false);

      // Reset text if external draft value changes (e.g. reset button)
      useEffect(() => {
          setText(JSON.stringify(value, null, 2));
      }, [value]);

      const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const newVal = e.target.value;
          setText(newVal);
          try {
              const parsed = JSON.parse(newVal);
              updateDraft((prev: any) => ({ ...prev, [fieldName]: parsed }));
              setError(false);
          } catch (err) {
              setError(true);
          }
      };

      return (
          <div className="space-y-1 flex-1 flex flex-col min-h-0">
              <label className="text-xs uppercase font-bold text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-1"><Code size={12}/> {label} (JSON)</span>
                  {error && <span className="text-red-500 text-[10px]">无效的 JSON</span>}
              </label>
              <textarea 
                  className={`w-full flex-1 bg-slate-950 border rounded p-2 text-xs font-mono text-slate-300 resize-none outline-none ${error ? 'border-red-500' : 'border-slate-700 focus:border-amber-500'}`}
                  value={text}
                  onChange={handleChange}
                  spellCheck={false}
              />
          </div>
      );
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900 shrink-0">
        <h3 className="font-bold text-lg text-amber-500 flex items-center gap-2">
            {isZone && <><Box size={18} /> 编辑区域</>}
            {isLink && <><Spline size={18} /> 编辑连接</>}
            {isGlobal && <><Settings size={18} /> 地图全局设置</>}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        
        {/* === GLOBAL SETTINGS === */}
        {isGlobal && (
            <>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-slate-500">地图名称</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                            value={draft.name || ""}
                            onChange={(e) => updateDraft((d: any) => ({...d, name: e.target.value}))}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-slate-500">宽度 (X)</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                                value={draft.sizeX || 0}
                                onChange={(e) => updateDraft((d: any) => ({...d, sizeX: parseInt(e.target.value)}))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-slate-500">高度 (Z)</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                                value={draft.sizeZ || 0}
                                onChange={(e) => updateDraft((d: any) => ({...d, sizeZ: parseInt(e.target.value)}))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-slate-500">游戏模式 (Mode)</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                                value={draft.gameMode || ""}
                                onChange={(e) => updateDraft((d: any) => ({...d, gameMode: e.target.value}))}
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-slate-500">胜利条件显示</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                                value={draft.displayWinCondition || ""}
                                onChange={(e) => updateDraft((d: any) => ({...d, displayWinCondition: e.target.value}))}
                            />
                        </div>
                    </div>

                     <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-slate-500">描述 Key</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                            value={draft.description || ""}
                            onChange={(e) => updateDraft((d: any) => ({...d, description: e.target.value}))}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                    <h4 className="text-xs font-bold text-amber-500 mb-3 flex items-center gap-2"><Settings size={14}/> 变体设置 (Variant Settings)</h4>
                    <div className="space-y-4">
                        <JsonArea 
                            label="Orientation" 
                            value={draft.variants?.[0]?.orientation || {}} 
                            fieldName="variants" 
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                    <h4 className="text-xs font-bold text-amber-500 mb-3 flex items-center gap-2"><Target size={14}/> 游戏规则 (Game Rules)</h4>
                     <JsonArea 
                        label="Rules Object" 
                        value={draft.gameRules} 
                        fieldName="gameRules"
                    />
                </div>
            </>
        )}

        {/* === ZONE EDITOR === */}
        {isZone && (
          <>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1">
                        <Type size={12}/> 名称 (ID)
                    </label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                        value={draft.name}
                        onChange={(e) => updateDraft((d: any) => ({ ...d, name: e.target.value }))}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1">
                        <Scaling size={12}/> 大小 (Size)
                    </label>
                    <input 
                        type="number" 
                        step="0.1"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                        value={draft.size}
                        onChange={(e) => updateDraft((d: any) => ({ ...d, size: parseFloat(e.target.value) }))}
                    />
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1">
                 <Shield size={12}/> 守卫与资源 (Value)
              </label>
              <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                      <span className="absolute left-2 top-2 text-slate-500 text-[10px]">守卫</span>
                      <input 
                        type="number" 
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 pl-9 text-sm text-slate-200 focus:border-amber-500 outline-none"
                        value={draft.guardedContentValue || 0}
                        onChange={(e) => updateDraft((d: any) => ({ ...d, guardedContentValue: parseInt(e.target.value) }))}
                      />
                  </div>
                  <div className="relative">
                      <span className="absolute left-2 top-2 text-slate-500 text-[10px]">资源</span>
                      <input 
                        type="number" 
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 pl-9 text-sm text-slate-200 focus:border-amber-500 outline-none"
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
                        type="number" step="0.1" placeholder="Mult"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                        value={draft.guardMultiplier ?? 1}
                        onChange={(e) => updateDraft((d: any) => ({ ...d, guardMultiplier: parseFloat(e.target.value) }))}
                      />
                      <div className="text-[10px] text-slate-500 text-center mt-1">倍率</div>
                   </div>
                   <div title="Weekly Increment">
                      <input 
                        type="number" step="0.01" placeholder="Inc"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                        value={draft.guardWeeklyIncrement ?? 0}
                        onChange={(e) => updateDraft((d: any) => ({ ...d, guardWeeklyIncrement: parseFloat(e.target.value) }))}
                      />
                       <div className="text-[10px] text-slate-500 text-center mt-1">周增</div>
                   </div>
                   <div title="Cutoff Value">
                      <input 
                        type="number" placeholder="Cut"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
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
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                    value={draft.diplomacyModifier ?? 0}
                    onChange={(e) => updateDraft((d: any) => ({ ...d, diplomacyModifier: parseFloat(e.target.value) }))}
                />
            </div>
            
            <div className="space-y-2">
                 <JsonArea 
                    label="Guard Reaction Dist." 
                    value={draft.guardReactionDistribution || []} 
                    fieldName="guardReactionDistribution"
                />
            </div>

            <div className="pt-4 border-t border-slate-700">
                <h4 className="text-xs font-bold text-amber-500 mb-2 uppercase flex items-center gap-1"><List size={14}/> 必选内容 (Mandatory)</h4>
                
                {/* Visualizer for Mandatory Groups */}
                {draft.mandatoryContent && draft.mandatoryContent.length > 0 ? (
                    <div className="space-y-3 mb-4">
                        {draft.mandatoryContent.map((groupName: string, idx: number) => {
                             const group = getMandatoryGroup(groupName);
                             return (
                                 <div key={idx} className="bg-slate-900/50 p-2 rounded border border-slate-700">
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
                                                    <div key={i} className="group/item relative flex items-center gap-2 bg-slate-800 px-2 py-1.5 rounded text-xs text-slate-300 border border-slate-700/50 hover:border-amber-500/50 transition-colors">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 shrink-0"></span>
                                                        <span className="truncate">{name}</span>
                                                        {item.isMine && <span className="ml-auto text-[8px] uppercase text-blue-400 bg-blue-900/30 px-1 rounded">Mine</span>}
                                                        
                                                        {/* Tooltip */}
                                                        <div className="absolute left-0 bottom-full mb-1 w-64 bg-slate-900 border border-slate-600 p-2 rounded-md shadow-2xl z-50 hidden group-hover/item:block pointer-events-none">
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
                        label="Edit Refs (JSON)" 
                        value={draft.mandatoryContent || []} 
                        fieldName="mandatoryContent"
                     />
                 </div>
            </div>

            <div className="pt-4 border-t border-slate-700 h-64 flex flex-col">
                <JsonArea 
                    label="Main Objects (Cities/Spawns)" 
                    value={draft.mainObjects || []} 
                    fieldName="mainObjects"
                />
            </div>
          </>
        )}

        {/* === LINK EDITOR === */}
        {isLink && (
           <>
            <div className="p-2 bg-slate-900 rounded mb-4">
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
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-400"
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
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                            value={draft.guardValue || 0}
                            onChange={(e) => updateDraft((d: any) => ({ ...d, guardValue: parseInt(e.target.value) }))}
                        />
                         <input 
                            type="number" step="0.01" placeholder="Inc"
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                            value={draft.guardWeeklyIncrement || 0}
                            onChange={(e) => updateDraft((d: any) => ({ ...d, guardWeeklyIncrement: parseFloat(e.target.value) }))}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-900 border border-slate-800 rounded hover:border-slate-600 transition-colors">
                        <input 
                            type="checkbox" 
                            className="accent-amber-500 w-4 h-4 rounded"
                            checked={draft.road || false}
                            onChange={(e) => updateDraft((d: any) => ({ ...d, road: e.target.checked }))}
                        />
                        <span className="text-sm font-medium">铺设道路 (Road)</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-900 border border-slate-800 rounded hover:border-slate-600 transition-colors">
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
                            className={`flex-1 py-1 px-2 text-xs rounded border ${draft.connectionType === 'Direct' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                            onClick={() => updateDraft((d: any) => ({ ...d, connectionType: 'Direct' }))}
                        >
                            Direct
                        </button>
                        <button 
                            className={`flex-1 py-1 px-2 text-xs rounded border ${draft.connectionType === 'Proximity' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                            onClick={() => updateDraft((d: any) => ({ ...d, connectionType: 'Proximity' }))}
                        >
                            Proximity
                        </button>
                        <button 
                            className={`flex-1 py-1 px-2 text-xs rounded border ${draft.connectionType === 'Portal' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
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
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
        <button 
            onClick={handleReset}
            disabled={!isDirty}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${isDirty ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
        >
            <RotateCcw size={14} /> 重置
        </button>
        <button 
            onClick={handleApply}
            disabled={!isDirty}
            className={`flex-[2] flex items-center justify-center gap-2 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${isDirty ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
        >
            <Save size={14} /> 应用更改
        </button>
      </div>
    </div>
  );
};

export default PropertyEditor;