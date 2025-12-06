
import React, { useState, useEffect } from 'react';
import { RmgFile } from '../types';
import { X, Target, LayoutTemplate, Layers, Settings, Code, Plus, Trash2, Save } from 'lucide-react';

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RmgFile;
  onSave: (newData: RmgFile) => void;
}

type GlobalTab = 'rules' | 'layouts' | 'variants';

const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ isOpen, onClose, data, onSave }) => {
  const [activeTab, setActiveTab] = useState<GlobalTab>('rules');
  const [draft, setDraft] = useState<RmgFile | null>(null);
  
  // Zone Layouts State
  const [activeLayoutIndex, setActiveLayoutIndex] = useState(0);

  useEffect(() => {
    if (isOpen && data) {
      setDraft(JSON.parse(JSON.stringify(data)));
      setActiveLayoutIndex(0);
    }
  }, [isOpen, data]);

  const updateDraft = (updater: (prev: RmgFile) => RmgFile) => {
      setDraft((prev) => prev ? updater(prev) : prev);
  };

  const handleSave = () => {
    if (draft) {
      onSave(draft);
      onClose();
    }
  };

  if (!isOpen || !draft) return null;

  // JSON Text Area Helper
  const JsonEditor = ({ value, onChange, className }: { value: any, onChange: (val: any) => void, className?: string }) => {
    const [text, setText] = useState(JSON.stringify(value, null, 2));
    const [error, setError] = useState(false);

    useEffect(() => { setText(JSON.stringify(value, null, 2)); }, [value]);

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
        <div className={`flex flex-col h-full ${className}`}>
             {error && <div className="bg-red-900/50 text-red-200 text-xs px-2 py-1">Invalid JSON</div>}
            <textarea 
                className={`w-full h-full bg-slate-950 p-3 font-mono text-xs text-slate-300 outline-none resize-none border ${error ? 'border-red-500' : 'border-transparent'}`}
                value={text}
                onChange={handleChange}
                spellCheck={false}
            />
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
      <div className="bg-slate-900 w-full max-w-6xl h-full max-h-[90vh] rounded-xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="h-14 border-b border-slate-700 flex justify-between items-center px-6 bg-slate-800 shrink-0">
          <div className="flex items-center gap-3">
              <div className="bg-amber-600 p-1.5 rounded text-white">
                  <Settings size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-100">全局设定 (Global Settings)</h2>
          </div>
          <div className="flex items-center gap-3">
               <button 
                  onClick={handleSave}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded flex items-center gap-2 transition-colors"
                >
                  <Save size={16} /> 保存更改
                </button>
                <div className="h-6 w-px bg-slate-600 mx-1"></div>
                <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex flex-1 overflow-hidden">
            
            {/* Sidebar Navigation */}
            <div className="w-64 bg-slate-800/50 border-r border-slate-700 flex flex-col p-2 space-y-1">
                <button 
                    onClick={() => setActiveTab('rules')}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'rules' ? 'bg-amber-600/20 text-amber-500 border border-amber-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                    <Target size={18} />
                    游戏规则 (Game Rules)
                </button>
                <button 
                    onClick={() => setActiveTab('variants')}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'variants' ? 'bg-amber-600/20 text-amber-500 border border-amber-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                    <Layers size={18} />
                    变体配置 (Variants)
                </button>
                <button 
                    onClick={() => setActiveTab('layouts')}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'layouts' ? 'bg-amber-600/20 text-amber-500 border border-amber-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                    <LayoutTemplate size={18} />
                    区域布局 (Zone Layouts)
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-slate-900 overflow-hidden flex flex-col">
                
                {/* --- TAB: GAME RULES --- */}
                {activeTab === 'rules' && (
                    <div className="flex flex-col h-full">
                         <div className="px-6 py-3 border-b border-slate-800 bg-slate-800/30">
                            <h3 className="font-bold text-amber-500 flex items-center gap-2"><Target size={16}/> Game Rules Definition</h3>
                            <p className="text-xs text-slate-500 mt-1">Define win conditions, hero limits, and general gameplay flags.</p>
                         </div>
                         <div className="flex-1 p-0">
                             <JsonEditor 
                                value={draft.gameRules} 
                                onChange={(val) => updateDraft((d) => ({...d, gameRules: val}))}
                                className="h-full border-none"
                             />
                         </div>
                    </div>
                )}

                {/* --- TAB: VARIANTS --- */}
                {activeTab === 'variants' && (
                    <div className="flex flex-col h-full">
                        <div className="px-6 py-3 border-b border-slate-800 bg-slate-800/30">
                            <h3 className="font-bold text-amber-500 flex items-center gap-2"><Layers size={16}/> Map Variants</h3>
                            <p className="text-xs text-slate-500 mt-1">Configure global orientation, borders, and default noises. Currently editing Variant [0].</p>
                         </div>
                         <div className="flex-1 grid grid-cols-2 divide-x divide-slate-800">
                             <div className="flex flex-col h-full">
                                 <div className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-950 border-b border-slate-800">ORIENTATION</div>
                                 <JsonEditor 
                                    value={draft.variants?.[0]?.orientation || {}} 
                                    onChange={(val) => updateDraft((d) => {
                                        const v = [...(d.variants || [])];
                                        if(!v[0]) v[0] = {zones:[], connections:[]};
                                        v[0].orientation = val;
                                        return {...d, variants: v};
                                    })}
                                 />
                             </div>
                             <div className="flex flex-col h-full">
                                 <div className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-950 border-b border-slate-800">BORDER</div>
                                 <JsonEditor 
                                    value={draft.variants?.[0]?.border || {}} 
                                    onChange={(val) => updateDraft((d) => {
                                        const v = [...(d.variants || [])];
                                        if(!v[0]) v[0] = {zones:[], connections:[]};
                                        v[0].border = val;
                                        return {...d, variants: v};
                                    })}
                                 />
                             </div>
                         </div>
                    </div>
                )}

                {/* --- TAB: ZONE LAYOUTS --- */}
                {activeTab === 'layouts' && (
                     <div className="flex h-full">
                        {/* List Sidebar */}
                        <div className="w-56 border-r border-slate-800 flex flex-col bg-slate-950">
                             <div className="p-3 border-b border-slate-800 flex justify-between items-center">
                                 <span className="text-xs font-bold text-slate-400">Layouts List</span>
                                 <button 
                                    onClick={() => {
                                        const newLayout = { name: `new_layout_${Date.now()}`, inherits: "zone_layout_default" };
                                        updateDraft((d) => ({ ...d, zoneLayouts: [...(d.zoneLayouts || []), newLayout] }));
                                        setActiveLayoutIndex((draft.zoneLayouts?.length || 0));
                                    }}
                                    className="p-1 hover:bg-slate-800 rounded text-amber-500"
                                >
                                     <Plus size={14} />
                                 </button>
                             </div>
                             <div className="flex-1 overflow-y-auto">
                                 {draft.zoneLayouts?.map((layout: any, idx: number) => (
                                     <div 
                                        key={idx}
                                        onClick={() => setActiveLayoutIndex(idx)}
                                        className={`group px-3 py-2 text-xs cursor-pointer flex justify-between items-center border-b border-slate-800/50 ${activeLayoutIndex === idx ? 'bg-amber-900/20 text-amber-500 border-l-2 border-l-amber-500' : 'text-slate-400 hover:bg-slate-900'}`}
                                     >
                                         <span className="truncate">{layout.name || `Layout ${idx}`}</span>
                                         <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if(confirm('Delete layout?')) {
                                                    updateDraft(d => {
                                                        const l = [...(d.zoneLayouts || [])];
                                                        l.splice(idx, 1);
                                                        return {...d, zoneLayouts: l};
                                                    });
                                                    setActiveLayoutIndex(0);
                                                }
                                            }}
                                            className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                                        >
                                            <Trash2 size={12} />
                                         </button>
                                     </div>
                                 ))}
                             </div>
                        </div>
                        
                        {/* Editor Area */}
                        <div className="flex-1 flex flex-col h-full bg-slate-900">
                             {draft.zoneLayouts && draft.zoneLayouts[activeLayoutIndex] ? (
                                <>
                                    <div className="h-10 border-b border-slate-800 flex items-center px-4 bg-slate-800/30 justify-between">
                                        <div className="flex items-center gap-2 text-xs font-mono text-amber-500">
                                            <Code size={12} />
                                            {draft.zoneLayouts[activeLayoutIndex].name}
                                        </div>
                                        <div className="text-[10px] text-slate-500">JSON Editor</div>
                                    </div>
                                    <div className="flex-1 relative">
                                        <JsonEditor 
                                            key={`layout-editor-${activeLayoutIndex}`}
                                            value={draft.zoneLayouts[activeLayoutIndex]} 
                                            onChange={(val) => updateDraft((d) => {
                                                const l = [...(d.zoneLayouts || [])];
                                                l[activeLayoutIndex] = val;
                                                return {...d, zoneLayouts: l};
                                            })}
                                            className="h-full border-none bg-slate-900"
                                        />
                                    </div>
                                </>
                             ) : (
                                 <div className="flex items-center justify-center h-full text-slate-600 text-sm italic">
                                     Select or create a layout to edit
                                 </div>
                             )}
                        </div>
                     </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettingsModal;
