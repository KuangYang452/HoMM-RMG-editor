
import React from 'react';
import { RmgFile } from '../types';
import { Map as MapIcon, Info, Hash, Monitor, FileText, Settings, Trophy } from 'lucide-react';
import { getGameModes, getWinConditions, getTemplateDescriptions } from '../utils/localization';

interface MapInfoPanelProps {
  data: RmgFile;
  onUpdate: (newData: RmgFile) => void;
  minimapRef: React.RefObject<SVGSVGElement | null>;
  onOpenGlobalSettings: (tab: 'rules' | 'layouts' | 'variants' | 'content') => void;
}

// 8 Player Colors Helper for Legend
const getPlayerColor = (i: number) => {
    switch (i) {
        case 1: return '#ef4444'; // Red-500
        case 2: return '#3b82f6'; // Blue-500
        case 3: return '#22c55e'; // Green-500
        case 4: return '#f97316'; // Orange-500
        case 5: return '#a855f7'; // Purple-500
        case 6: return '#22d3ee'; // Cyan-400
        case 7: return '#ec4899'; // Pink-500
        case 8: return '#cbd5e1'; // Slate-300
        default: return '#94a3b8'; // Slate-400
    }
};

const MapInfoPanel: React.FC<MapInfoPanelProps> = ({ data, onUpdate, minimapRef, onOpenGlobalSettings }) => {
  
  const updateField = (field: keyof RmgFile, value: any) => {
      onUpdate({ ...data, [field]: value });
  };

  const gameModes = getGameModes();
  const winConditions = getWinConditions();
  const templateDescriptions = getTemplateDescriptions();

  return (
    <div className="w-full h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="h-14 border-b border-slate-700 flex justify-between items-center px-4 bg-slate-800 shrink-0">
        <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
           <Info size={16} className="text-amber-500"/>
           <span>地图概览 (Map Info)</span>
        </h3>
        {/* Global Settings Button (Moved to Header) */}
        <button 
            onClick={() => onOpenGlobalSettings('rules')}
            className="p-2 bg-amber-600 hover:bg-amber-500 text-white rounded shadow-md transition-colors"
            title="全局设定 (Global Settings)"
        >
            <Settings size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
        
        {/* Minimap & Legend Container */}
        <div className="flex gap-2 h-48 bg-slate-950 border border-slate-700 rounded-lg p-2">
            
            {/* Left: Minimap */}
            <div className="flex-1 h-full relative border-r border-slate-800 pr-2">
                <div className="absolute top-0 left-0 text-[10px] font-bold text-slate-500 flex items-center gap-1 z-10 pointer-events-none">
                    <MapIcon size={10} /> 
                    <span>{data.sizeX}x{data.sizeZ}</span>
                </div>
                <svg 
                    ref={minimapRef as any}
                    className="w-full h-full block cursor-crosshair hover:opacity-90 transition-opacity"
                />
            </div>

            {/* Right: Legend */}
            <div className="w-32 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pl-1">
                <div className="font-bold text-slate-500 text-[9px] mb-2 uppercase tracking-wider sticky top-0 bg-slate-950 pb-1">图例 (Legend)</div>
                <div className="flex flex-col gap-2 text-[9px]">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#f59e0b] border border-slate-500 shadow-[0_0_2px_#f59e0b] shrink-0"></span>
                        <span className="text-amber-500 leading-tight">高价值 ({'>'}2M)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#1e293b] border border-slate-500 shrink-0"></span>
                        <span className="text-slate-300 leading-tight">普通区域</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-2.5 rounded bg-[#7f1d1d] flex items-center justify-center text-[6px] font-bold text-white shrink-0">40k</span>
                        <span className="text-red-400 leading-tight">强守卫</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-2.5 rounded bg-[#14532d] flex items-center justify-center text-[6px] font-bold text-white shrink-0">2k</span>
                        <span className="text-green-400 leading-tight">弱守卫</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-0 border-b-[2px] border-slate-500 shrink-0"></span>
                        <span className="text-slate-400 leading-tight">道路</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg width="16" height="4" className="overflow-visible shrink-0">
                            <path d="M 0 2 Q 4 5, 8 2 T 16 2" fill="none" stroke="#64748b" strokeWidth="1" />
                        </svg>
                        <span className="text-slate-400 leading-tight">野外</span>
                    </div>
                    
                    <div className="h-px bg-slate-800 my-0.5"></div>
                    
                    <div className="flex flex-col gap-1">
                        <span className="text-slate-400 font-bold">P1-P8</span>
                        <div className="grid grid-cols-4 gap-1">
                            {[1,2,3,4,5,6,7,8].map(i => (
                                <span key={i} className="w-2 h-2 rounded-full" style={{background: getPlayerColor(i)}} title={`Player ${i}`}></span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Map Metadata Inputs */}
        <div className="space-y-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
            
            {/* Map Name */}
            <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <FileText size={10} /> 地图名称
                </label>
                <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:border-amber-500 outline-none"
                    value={data.name || ""}
                    onChange={(e) => updateField('name', e.target.value)}
                />
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                        <Hash size={10} /> 宽 (X)
                    </label>
                    <input 
                        type="number" 
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:border-amber-500 outline-none font-mono"
                        value={data.sizeX || 0}
                        onChange={(e) => updateField('sizeX', parseInt(e.target.value))}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                        <Hash size={10} /> 高 (Z)
                    </label>
                    <input 
                        type="number" 
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:border-amber-500 outline-none font-mono"
                        value={data.sizeZ || 0}
                        onChange={(e) => updateField('sizeZ', parseInt(e.target.value))}
                    />
                </div>
            </div>

            {/* Game Mode (Dropdown) */}
             <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <Monitor size={10} /> 游戏模式 (Mode)
                </label>
                <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:border-amber-500 outline-none appearance-none"
                    value={data.gameMode || "Classic"}
                    onChange={(e) => updateField('gameMode', e.target.value)}
                >
                    {gameModes.map(mode => (
                        <option key={mode.value} value={mode.value}>{mode.label}</option>
                    ))}
                </select>
            </div>

            {/* Win Condition (Dropdown) */}
            <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <Trophy size={10} /> 胜利条件 (Win Condition)
                </label>
                <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:border-amber-500 outline-none appearance-none"
                    value={data.displayWinCondition || ""}
                    onChange={(e) => updateField('displayWinCondition', e.target.value)}
                >
                    <option value="" disabled>选择胜利条件...</option>
                    {winConditions.map(wc => (
                        <option key={wc.value} value={wc.value}>{wc.label}</option>
                    ))}
                </select>
            </div>

            {/* Description (Dropdown) */}
             <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <FileText size={10} /> 描述模板 (Description)
                </label>
                <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-400 focus:border-amber-500 outline-none appearance-none"
                    value={data.description || ""}
                    onChange={(e) => updateField('description', e.target.value)}
                >
                    <option value="" disabled>选择描述...</option>
                    {templateDescriptions.map(desc => (
                        <option key={desc.value} value={desc.value}>{desc.label}</option>
                    ))}
                    {/* Allow custom/unknown values if currently set but not in list */}
                    {data.description && !templateDescriptions.find(d => d.value === data.description) && (
                        <option value={data.description}>{data.description} (Custom)</option>
                    )}
                </select>
            </div>
        </div>

      </div>
    </div>
  );
};

export default MapInfoPanel;
