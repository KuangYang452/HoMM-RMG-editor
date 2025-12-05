import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { Activity, ChevronDown, ChevronRight, Terminal, Trash2, X, RefreshCw, Search } from 'lucide-react';

// === Core Logic (Global Singleton) ===

type DebugStore = Record<string, any>;
type Listener = () => void;

let store: DebugStore = {};
const listeners = new Set<Listener>();

const emitChange = () => {
  listeners.forEach((l) => l());
};

// Expose to Window for Direct Console Access
declare global {
    interface Window {
        __RMG_DEBUG__: DebugStore;
    }
}
// Init global object
if (typeof window !== 'undefined') {
    window.__RMG_DEBUG__ = store;
}

/**
 * Track a variable in the debug monitor by reference.
 */
export const debugTrack = (key: string, value: any) => {
  store[key] = value;
  // Sync global
  if (typeof window !== 'undefined') {
      window.__RMG_DEBUG__ = store;
  }
  emitChange();
};

export const debugRemove = (key: string) => {
  delete store[key];
  emitChange();
};

export const debugClear = () => {
  for (const key in store) delete store[key];
  emitChange();
};

const useDebugStore = () => {
  const subscribe = (callback: Listener) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };
  const getSnapshot = () => store;
  return useSyncExternalStore(subscribe, getSnapshot);
};

// === JSON Tree Component for Deep Inspection ===

const JsonNode: React.FC<{ name: string; value: any; depth?: number }> = ({ name, value, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(depth < 1); // Auto-expand top level only
    
    const isObject = value !== null && typeof value === 'object';
    const isArray = Array.isArray(value);
    const isEmpty = isObject && Object.keys(value).length === 0;
    
    const toggle = () => setIsExpanded(!isExpanded);

    const logToConsole = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log(`[DEBUG] ${name}:`, value);
    };

    if (!isObject) {
        let displayValue = String(value);
        let color = "text-amber-200";
        if (typeof value === 'string') {
            displayValue = `"${value}"`;
            color = "text-green-300";
        } else if (typeof value === 'number') {
            color = "text-blue-300";
        } else if (typeof value === 'boolean') {
            color = "text-purple-300";
        } else if (value === null || value === undefined) {
            color = "text-slate-500";
        }

        return (
            <div className="flex items-start gap-2 font-mono text-xs hover:bg-slate-800/50 rounded px-1 group">
                <span className="text-slate-400 select-none min-w-[4px]"></span>
                <span className="text-slate-300 font-semibold">{name}:</span>
                <span className={`${color} break-all`}>{displayValue}</span>
            </div>
        );
    }

    return (
        <div className="font-mono text-xs">
             <div 
                className="flex items-center gap-1 hover:bg-slate-800/50 rounded px-1 cursor-pointer group py-0.5"
                onClick={toggle}
             >
                <span className="text-slate-500 w-4 flex justify-center">
                    {!isEmpty && (isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />)}
                </span>
                <span className="text-amber-500 font-bold">{name}</span>
                <span className="text-slate-500">
                    {isArray ? `Array(${value.length})` : '{...}'}
                </span>
                
                {/* Actions */}
                <button 
                    onClick={logToConsole}
                    className="opacity-0 group-hover:opacity-100 ml-auto p-0.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-opacity"
                    title="Log reference to Console"
                >
                    <Terminal size={10} />
                </button>
             </div>

             {isExpanded && !isEmpty && (
                 <div className="pl-4 border-l border-slate-800 ml-2">
                     {Object.entries(value).map(([key, val]) => (
                         <JsonNode key={key} name={key} value={val} depth={depth + 1} />
                     ))}
                 </div>
             )}
        </div>
    );
};

// === Main Overlay ===

const DebugOverlay: React.FC = () => {
  const data = useDebugStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true); 
  const [searchTerm, setSearchTerm] = useState("");
  const [, setTick] = useState(0); 

  // Force update occasionally to catch mutation-based changes (like D3 simulations)
  useEffect(() => {
      if(!isOpen) return;
      const interval = setInterval(() => setTick(t => t + 1), 1000);
      return () => clearInterval(interval);
  }, [isOpen]);

  // Filter Data
  const filteredData = Object.entries(data).filter(([key, value]) => {
      return key.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 h-full z-[9999] pointer-events-none flex flex-col items-start pl-0 pt-16 pb-4">
        
      {/* Panel */}
      {isOpen ? (
        <div className="pointer-events-auto bg-slate-950/95 backdrop-blur border-r border-t border-b border-slate-700 shadow-2xl w-[400px] h-full flex flex-col transition-all animate-in slide-in-from-left-4">
          <div className="flex flex-col gap-3 p-3 border-b border-slate-800 bg-slate-900/50 shrink-0">
            {/* Header Toolbar */}
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-amber-500 flex items-center gap-2 text-sm font-mono">
                <Activity size={14} /> 
                RUNTIME INSPECTOR
                </h3>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => setTick(t => t + 1)}
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors"
                        title="Force Refresh"
                    >
                        <RefreshCw size={12} />
                    </button>
                    <button 
                        onClick={debugClear}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                        title="Clear All"
                    >
                        <Trash2 size={12} />
                    </button>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Search Input */}
            <div className="relative group">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search variables..." 
                    className="w-full bg-slate-950 border border-slate-700 rounded-md py-1.5 pl-8 pr-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
             <div className="text-[10px] text-slate-500 mb-2 px-2 pb-2 border-b border-slate-800">
                 Global Access: <span className="text-amber-500 font-mono">window.__RMG_DEBUG__</span>
             </div>
            
            {filteredData.length === 0 && (
                <div className="text-slate-600 italic text-center py-10 text-xs">
                    {Object.keys(data).length === 0 ? "No active trackers..." : "No matching variables found."}
                </div>
            )}
            
            {filteredData.map(([key, value]) => (
                <div key={key} className="mb-2 border-b border-slate-800/50 pb-2">
                     <JsonNode name={key} value={value} />
                </div>
            ))}
          </div>
        </div>
      ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="pointer-events-auto mt-2 ml-2 bg-slate-800/80 hover:bg-amber-600/90 text-slate-400 hover:text-white border border-slate-600 backdrop-blur rounded-full p-2 shadow-lg transition-all flex items-center gap-2 pr-4 group"
        >
            <Activity size={16} className="group-hover:animate-pulse" />
            <span className="text-xs font-bold">DEBUG</span>
        </button>
      )}
    </div>
  );
};

export default DebugOverlay;