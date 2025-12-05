
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Upload, Download, FileJson, Settings } from 'lucide-react';
import MapGraph from './components/MapGraph';
import PropertyEditor from './components/PropertyEditor';
import DebugOverlay, { debugTrack } from './components/DebugMonitor'; // Import Debug Module
import { RmgFile, RmgZone, RmgConnection, GraphNode, GraphLink } from './types';
import { DEFAULT_RMG_DATA } from './constants';

type SelectionType = 'zone' | 'link' | 'global' | null;

const App: React.FC = () => {
  const [data, setData] = useState<RmgFile>(DEFAULT_RMG_DATA);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectionType, setSelectionType] = useState<SelectionType>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false); // 仅用于 UI 状态切换，实际数据走 global 逻辑
  const [fileName, setFileName] = useState<string>("SmallLand.json");
  
  // Ref for file input to trigger it programmatically via shortcut
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug: Track Complete App State
  useEffect(() => {
    debugTrack('AppData (Full)', data);
    debugTrack('AppSelection', {
        type: selectionType,
        id: selectedId,
        file: fileName
    });
  }, [data, selectionType, selectedId, fileName]);

  // Handle File Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          setData(json);
          setSelectedId(null);
          setSelectionType(null);
          setShowSettings(false);
        } catch (error) {
          alert("无效的 JSON 文件");
        }
      };
      reader.readAsText(file);
    }
  };

  // Handle File Download
  const handleDownload = useCallback(() => {
    const jsonString = JSON.stringify(data, null, 4); // Pretty print
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, fileName]);
  
  // Keyboard Shortcuts (Ctrl+S, Ctrl+O)
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // Check for Ctrl (Windows/Linux) or Command (Mac)
          const isModifier = e.ctrlKey || e.metaKey;
          
          if (isModifier && e.key.toLowerCase() === 's') {
              e.preventDefault();
              handleDownload();
          }
          
          if (isModifier && e.key.toLowerCase() === 'o') {
              e.preventDefault();
              fileInputRef.current?.click();
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDownload]);

  // 核心逻辑：根据 ID 和类型，从当前 data 中提取要编辑的对象
  // 这确保了编辑器总是能获取到最新的数据源，或者在重绘后重新绑定
  const editingData = useMemo(() => {
      if (selectionType === 'global') return data;
      if (!data.variants || data.variants.length === 0) return null;

      const variant = data.variants[0];

      if (selectionType === 'zone' && selectedId) {
          return variant.zones.find(z => z.name === selectedId) || null;
      }

      if (selectionType === 'link' && selectedId) {
          // Link ID 可能是 name，或者构造的复合 ID
          return variant.connections.find(c => c.name === selectedId || `${c.from}-${c.to}` === selectedId) || null;
      }

      return null;
  }, [data, selectedId, selectionType]);

  // Track the object being edited
  useEffect(() => {
      debugTrack('EditingData (Source)', editingData);
  }, [editingData]);

  // Handle Save (Apply Changes)
  const handleSave = useCallback((newData: any) => {
      if (selectionType === 'global') {
          setData(newData as RmgFile);
      } else if (selectionType === 'zone') {
          const newZone = newData as RmgZone;
          const oldName = selectedId; // 当前选中的 ID (旧名)

          setData(prevData => {
              const nextData = { ...prevData };
              if (nextData.variants.length > 0) {
                  const zones = [...nextData.variants[0].zones];
                  const idx = zones.findIndex(z => z.name === oldName);
                  if (idx !== -1) {
                      zones[idx] = newZone;
                      nextData.variants[0].zones = zones;

                      // 如果名字改了，需要级联更新连接
                      if (oldName !== newZone.name) {
                          const connections = [...nextData.variants[0].connections];
                          connections.forEach(conn => {
                              if (conn.from === oldName) conn.from = newZone.name;
                              if (conn.to === oldName) conn.to = newZone.name;
                          });
                          nextData.variants[0].connections = connections;
                      }
                  }
              }
              return nextData;
          });
          
          // 如果名字改变了，更新选中的 ID，防止编辑器丢失焦点
          if (oldName !== newZone.name) {
              setSelectedId(newZone.name);
          }
      } else if (selectionType === 'link') {
          const newConn = newData as RmgConnection;
          // 对于连接，我们主要替换匹配的那一条
          setData(prevData => {
              const nextData = { ...prevData };
              if (nextData.variants.length > 0) {
                  const connections = [...nextData.variants[0].connections];
                  // 尝试通过 ID 匹配 (可能是 name 或 组合键)
                  const idx = connections.findIndex(c => c.name === selectedId || `${c.from}-${c.to}` === selectedId);
                  if (idx !== -1) {
                      connections[idx] = newConn;
                      nextData.variants[0].connections = connections;
                  }
              }
              return nextData;
          });
          
          // 更新选中的 ID (以防 name 变了)
          const newId = newConn.name || `${newConn.from}-${newConn.to}`;
          if (selectedId !== newId) {
              setSelectedId(newId);
          }
      }
  }, [selectionType, selectedId]);

  const openSettings = () => {
      setSelectionType('global');
      setSelectedId('global'); // Dummy ID
      setShowSettings(true);
  };

  const closeEditor = () => {
      setSelectionType(null);
      setSelectedId(null);
      setShowSettings(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-slate-100">
      <DebugOverlay />
      
      {/* Toolbar */}
      {/* Added 'app-region: drag' style via inline CSS for Electron draggable support if we were using frameless window, 
          but keeping standard header for now. To enable drag: style={{ WebkitAppRegion: 'drag' } as any} */}
      <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center px-4 justify-between shrink-0 z-30 shadow-md select-none">
        <div className="flex items-center gap-3">
            <div className="bg-amber-600 p-1.5 rounded-lg">
                <FileJson className="text-white" size={20} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">
                上古纪元 <span className="text-amber-500">RMG 编辑器</span>
            </h1>
        </div>

        <div className="flex items-center gap-4">
            <button 
                onClick={openSettings}
                className={`flex items-center gap-2 text-sm font-medium py-1.5 px-3 rounded transition-colors ${selectionType === 'global' ? 'bg-amber-600/20 text-amber-500 border border-amber-600/50' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}
            >
                <Settings size={16} />
                地图设置
            </button>

            <div className="h-6 w-px bg-slate-700 mx-2"></div>

            <div className="text-sm text-slate-400 bg-slate-900 py-1 px-3 rounded border border-slate-700 max-w-[150px] truncate">
                {fileName}
            </div>
            
            <label className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-1.5 px-4 rounded cursor-pointer transition-colors" title="Ctrl+O">
                <Upload size={16} />
                加载
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            <button 
                onClick={handleDownload}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold py-1.5 px-4 rounded transition-colors shadow-lg shadow-amber-900/20"
                title="Ctrl+S"
            >
                <Download size={16} />
                导出
            </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Visualizer */}
        <div className="flex-1 relative">
            <MapGraph 
                data={data} 
                onSelectNode={(id) => { 
                    setSelectedId(id); 
                    setSelectionType(id ? 'zone' : null);
                    if(id) setShowSettings(false);
                }}
                onSelectLink={(id) => { 
                    setSelectedId(id); 
                    setSelectionType(id ? 'link' : null);
                    if(id) setShowSettings(false);
                }}
                selectedId={selectedId}
            />
        </div>

        {/* Property Inspector */}
        <div className={`transition-all duration-300 ease-in-out bg-slate-800 border-l border-slate-700 z-20 ${selectionType ? 'w-96' : 'w-0'}`}>
            <PropertyEditor 
                type={selectionType}
                data={editingData}
                fullData={data}
                onClose={closeEditor}
                onSave={handleSave}
            />
        </div>

      </div>
    </div>
  );
};

export default App;
