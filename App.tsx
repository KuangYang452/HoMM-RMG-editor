
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Upload, Download, FileJson } from 'lucide-react';
import MapGraph from './components/MapGraph';
import PropertyEditor from './components/PropertyEditor';
import MapInfoPanel from './components/MapInfoPanel';
import GlobalSettingsModal from './components/GlobalSettingsModal';
import DebugOverlay, { debugTrack } from './components/DebugMonitor'; 
import { RmgFile, RmgZone, RmgConnection } from './types';
import { DEFAULT_RMG_DATA } from './constants';

type SelectionType = 'zone' | 'link' | null;

const App: React.FC = () => {
  const [data, setData] = useState<RmgFile>(DEFAULT_RMG_DATA);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectionType, setSelectionType] = useState<SelectionType>(null);
  const [fileName, setFileName] = useState<string>("SmallLand.json");
  
  // Modal State
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [globalSettingsTab, setGlobalSettingsTab] = useState<'rules' | 'layouts' | 'variants' | 'content' | 'raw'>('rules');

  // Shared Ref for the Minimap SVG element
  const minimapRef = useRef<SVGSVGElement>(null);

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

  const handleOpenGlobalSettings = (tab: 'rules' | 'layouts' | 'variants' | 'content' | 'raw' = 'rules') => {
      setGlobalSettingsTab(tab);
      setIsGlobalSettingsOpen(true);
  };

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
          // Reset to global view on load
          setSelectedId(null);
          setSelectionType(null);
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

  // Logic to extract object to edit
  const editingData = useMemo(() => {
      if (!data.variants || data.variants.length === 0) return null;

      const variant = data.variants[0];

      if (selectionType === 'zone' && selectedId) {
          return variant.zones.find(z => z.name === selectedId) || null;
      }

      if (selectionType === 'link' && selectedId) {
          return variant.connections.find(c => c.name === selectedId || `${c.from}-${c.to}` === selectedId) || null;
      }

      return null;
  }, [data, selectedId, selectionType]);

  // Handle Save (Apply Changes from PropertyEditor)
  const handlePropertySave = useCallback((newData: any) => {
      if (selectionType === 'zone') {
          const newZone = newData as RmgZone;
          const oldName = selectedId; 

          setData(prevData => {
              const nextData = { ...prevData };
              if (nextData.variants.length > 0) {
                  const zones = [...nextData.variants[0].zones];
                  const idx = zones.findIndex(z => z.name === oldName);
                  if (idx !== -1) {
                      zones[idx] = newZone;
                      nextData.variants[0].zones = zones;

                      // Cascade Update Connections if name changed
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
          
          if (oldName !== newZone.name) {
              setSelectedId(newZone.name);
          }
      } else if (selectionType === 'link') {
          const newConn = newData as RmgConnection;
          setData(prevData => {
              const nextData = { ...prevData };
              if (nextData.variants.length > 0) {
                  const connections = [...nextData.variants[0].connections];
                  const idx = connections.findIndex(c => c.name === selectedId || `${c.from}-${c.to}` === selectedId);
                  if (idx !== -1) {
                      connections[idx] = newConn;
                      nextData.variants[0].connections = connections;
                  }
              }
              return nextData;
          });
          
          const newId = newConn.name || `${newConn.from}-${newConn.to}`;
          if (selectedId !== newId) {
              setSelectedId(newId);
          }
      }
  }, [selectionType, selectedId]);

  // Handle Delete
  const handleDelete = useCallback(() => {
      if (!selectedId || !selectionType) return;

      setData(prevData => {
          const nextData = { ...prevData };
          if (!nextData.variants || nextData.variants.length === 0) return nextData;

          const variant = nextData.variants[0];

          if (selectionType === 'zone') {
              // Remove Zone
              variant.zones = variant.zones.filter(z => z.name !== selectedId);
              // Remove associated connections
              variant.connections = variant.connections.filter(c => c.from !== selectedId && c.to !== selectedId);
          } else if (selectionType === 'link') {
              variant.connections = variant.connections.filter(c => 
                  (c.name && c.name !== selectedId) && 
                  `${c.from}-${c.to}` !== selectedId
              );
          }

          nextData.variants[0] = variant;
          return nextData;
      });

      setSelectedId(null);
      setSelectionType(null);
  }, [selectedId, selectionType]);

  // Handle Add Zone
  const handleAddZone = useCallback(() => {
      setData(prevData => {
          const nextData = { ...prevData };
          if (!nextData.variants || nextData.variants.length === 0) {
              nextData.variants = [{ zones: [], connections: [] }];
          }
          const variant = nextData.variants[0];
          
          let newName = "New Zone";
          let counter = 1;
          while (variant.zones.some(z => z.name === newName)) {
              newName = `New Zone ${counter++}`;
          }

          const newZone: RmgZone = {
              name: newName,
              size: 1,
              layout: "zone_layout_default",
              mainObjects: []
          };

          variant.zones = [...variant.zones, newZone];
          nextData.variants[0] = variant;
          
          // Select the new zone immediately
          setTimeout(() => {
              setSelectedId(newName);
              setSelectionType('zone');
          }, 0);

          return nextData;
      });
  }, []);

  // Handle Add Connection
  const handleAddConnection = useCallback((sourceId: string, targetId: string) => {
      if (!sourceId || !targetId || sourceId === targetId) return;

      setData(prevData => {
          const nextData = { ...prevData };
          if (!nextData.variants || nextData.variants.length === 0) return nextData;
          const variant = nextData.variants[0];

          // Check if exists
          const exists = variant.connections.some(c => 
              (c.from === sourceId && c.to === targetId) || 
              (c.from === targetId && c.to === sourceId)
          );

          if (exists) {
              alert("Connection already exists!");
              return nextData;
          }

          const newConnection: RmgConnection = {
              name: `${sourceId}-${targetId}`,
              from: sourceId,
              to: targetId,
              connectionType: "Direct",
              road: true,
              guardValue: 0
          };

          variant.connections = [...variant.connections, newConnection];
          nextData.variants[0] = variant;
          return nextData;
      });
  }, []);

  // Handle Update from MapInfoPanel or GlobalSettingsModal
  const handleGlobalUpdate = useCallback((newData: RmgFile) => {
      setData(newData);
  }, []);

  const handleBackgroundClick = () => {
      setSelectedId(null);
      setSelectionType(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-slate-100 font-sans">
      <DebugOverlay />
      <GlobalSettingsModal 
          isOpen={isGlobalSettingsOpen} 
          onClose={() => setIsGlobalSettingsOpen(false)} 
          data={data}
          onSave={handleGlobalUpdate}
          initialTab={globalSettingsTab}
      />
      
      {/* Toolbar */}
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

      {/* Main Workspace - Fixed Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Visualization (Flexible Width) */}
        <div className="flex-1 relative border-r border-slate-800">
            <MapGraph 
                data={data} 
                onSelectNode={(id) => { 
                    if (id) {
                        setSelectedId(id); 
                        setSelectionType('zone');
                    } else {
                        handleBackgroundClick();
                    }
                }}
                onSelectLink={(id) => { 
                    if (id) {
                        setSelectedId(id); 
                        setSelectionType('link');
                    } else {
                        handleBackgroundClick();
                    }
                }}
                onAddZone={handleAddZone}
                onAddConnection={handleAddConnection}
                selectedId={selectedId}
                minimapRef={minimapRef}
            />
        </div>

        {/* Right: Property Inspector OR Map Info (Fixed Width) */}
        <div className="w-[400px] bg-slate-900 flex flex-col z-20 shadow-xl transition-all">
            {selectionType ? (
                 <PropertyEditor 
                    type={selectionType}
                    data={editingData}
                    fullData={data}
                    onSave={handlePropertySave}
                    onDelete={handleDelete}
                    onOpenGlobalSettings={handleOpenGlobalSettings}
                />
            ) : (
                <MapInfoPanel 
                    data={data} 
                    onUpdate={handleGlobalUpdate}
                    minimapRef={minimapRef}
                    onOpenGlobalSettings={() => handleOpenGlobalSettings('rules')}
                />
            )}
        </div>

      </div>
    </div>
  );
};

export default App;