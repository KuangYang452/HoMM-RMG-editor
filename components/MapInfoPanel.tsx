
import React from 'react';
import { RmgFile } from '../types';
import { Map as MapIcon, Settings, Info, Hash, Monitor, FileText } from 'lucide-react';

interface MapInfoPanelProps {
  data: RmgFile;
  onUpdate: (newData: RmgFile) => void;
  minimapRef: React.RefObject<SVGSVGElement | null>;
  onOpenGlobalSettings: () => void;
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

  return (
    <div className="w-full h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="h-14 border-b border-slate-700 flex justify-between items-center px-4 bg-slate-800 shrink-0">
        <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
           <Info size={16} className="text-amber-500"/>
           <span>地图概览 (Map Info)</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
        
        {/* Minimap Section */}
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-2">
                        <MapIcon size={12} /> 小地图预览
                </label>
                <span className="text-[10px] font-mono text-slate-500">{data.sizeX}x{data.sizeZ}</span>
            </div>
            <div className="aspect-video w-full bg-slate-950 border border-slate-700 rounded-lg overflow-hidden relative shadow-inner group">
                <svg 
                    ref={minimapRef as any}
                    className="w-full h-full block cursor-crosshair group-hover:opacity-90 transition-opacity"
                />
            </div>
        </div>

        {/* Basic Metadata Inputs */}
        <div className="space-y-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
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

             <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <Monitor size={10} /> 游戏模式 (Mode)
                </label>
                <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:border-amber-500 outline-none"
                    value={data.gameMode || ""}
                    onChange={(e) => updateField('gameMode', e.target.value)}
                />
            </div>
             <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <FileText size={10} /> 描述 Key
                </label>
                <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-400 focus:border-amber-500 outline-none"
                    value={data.description || ""}
                    onChange={(e) => updateField('description', e.target.value)}
                />
            </div>
        </div>

        {/* Global Settings Trigger */}
        <button 
            onClick={onOpenGlobalSettings}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
            <Settings size={18} />
            编辑全局设定 (Global Settings)
        </button>

        {/* Legend Section */}
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
            <div className="font-bold text-slate-500 text-[10px] mb-2 uppercase tracking-wider">图例说明 (Legend)</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[10px]">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] border border-slate-500 shadow-[0_0_2px_#f59e0b]"></span>
                    <span className="text-amber-500">高价值 ({'>'}2M)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b] border border-slate-500"></span>
                    <span className="text-slate-300">普通区域</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-6 h-3 rounded bg-[#7f1d1d] flex items-center justify-center text-[7px] font-bold text-white">40k</span>
                    <span className="text-red-400">强守卫</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-6 h-3 rounded bg-[#14532d] flex items-center justify-center text-[7px] font-bold text-white">2k</span>
                    <span className="text-green-400">弱守卫</span>
                </div>
                
                {/* Lines */}
                <div className="flex items-center gap-2">
                    <span className="w-6 h-0 border-b-[3px] border-slate-500"></span>
                    <span className="text-slate-400">道路</span>
                </div>
                    <div className="flex items-center gap-2">
                    <svg width="24" height="4" className="overflow-visible">
                        <path d="M 0 2 Q 6 5, 12 2 T 24 2" fill="none" stroke="#64748b" strokeWidth="1.5" />
                    </svg>
                    <span className="text-slate-400">野外</span>
                </div>

                    <div className="col-span-2 h-px bg-slate-800 my-1"></div>

                    <div className="col-span-2 flex items-center gap-1.5">
                        <span className="text-slate-300 font-bold">⌂</span>
                        <span className="text-slate-400">城市/出生点 (P1-P8)</span>
                    </div>
                    <div className="col-span-2 grid grid-cols-4 gap-2 mt-0.5">
                    {[1,2,3,4,5,6,7,8].map(i => (
                        <div key={i} className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{background: getPlayerColor(i)}}></span>
                            <span className="text-[9px] text-slate-500">P{i}</span>
                        </div>
                    ))}
                    </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MapInfoPanel;
