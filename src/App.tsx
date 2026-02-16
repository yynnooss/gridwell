import { useState, useEffect } from 'react';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { CategorySelector } from './components/CategorySelector';
import { LayerBox } from './components/LayerBox';
import type { AppState, SidebarItem, Category, Layer } from './types';

const STORAGE_KEY = 'admin-panel-state';
const SAVED_CONFIGS_KEY = 'admin-panel-saved-configs';

// Legacy layer shape before migration to tables[]
interface LegacyLayer {
  id: string;
  title: string;
  description: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  tableData?: { columns: { id: string; title: string; width?: number }[]; rows: { id: string; cells: Record<string, { id: string; value: string }>; height?: number }[] };
  tables?: Layer['tables'];
}

// Migrate old single-tableData layers to new tables[] format
const migrateState = (state: AppState): AppState => {
  return {
    ...state,
    sidebarItems: state.sidebarItems.map(item => ({
      ...item,
      categories: item.categories.map(cat => ({
        ...cat,
        layers: (cat.layers as LegacyLayer[]).map(layer => {
          if (layer.tableData && !layer.tables) {
            const { tableData, ...rest } = layer;
            return {
              ...rest,
              tables: [{ ...tableData, id: crypto.randomUUID(), title: 'Table 1' }]
            } as Layer;
          }
          if (!layer.tables) {
            return { ...layer, tables: [] } as Layer;
          }
          return layer as Layer;
        })
      }))
    }))
  };
};

const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return migrateState(JSON.parse(saved));
  } catch { /* ignore parse errors */ }
  return {
    projectTitle: 'My Project',
    sidebarItems: [],
    activeSidebarItemId: null,
    activeCategoryId: null,
  };
};

function App() {
  const [appState, setAppState] = useState<AppState>(loadState);

  // Track last saved state for unsaved changes detection
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>(() => JSON.stringify(loadState()));

  // Persist state to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  const hasUnsavedChanges = JSON.stringify(appState) !== lastSavedSnapshot;

  // Save toast notification state
  const [saveToast, setSaveToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sidebar switch warning state
  const [pendingSidebarItemId, setPendingSidebarItemId] = useState<string | null>(null);

  // Sidebar Actions
  const handleUpdateProjectTitle = (newTitle: string) => {
    setAppState(prev => ({ ...prev, projectTitle: newTitle }));
  };

  const handleAddSidebarItem = () => {
    const newItem: SidebarItem = {
      id: crypto.randomUUID(),
      title: 'New Item',
      categories: []
    };
    setAppState(prev => ({
      ...prev,
      sidebarItems: [...prev.sidebarItems, newItem],
      activeSidebarItemId: newItem.id
    }));
  };

  const handleRemoveSidebarItem = (id: string) => {
    setAppState(prev => ({
      ...prev,
      sidebarItems: prev.sidebarItems.filter(item => item.id !== id),
      activeSidebarItemId: prev.activeSidebarItemId === id ? null : prev.activeSidebarItemId
    }));
  };

  const handleUpdateSidebarItem = (id: string, newTitle: string) => {
    setAppState(prev => ({
      ...prev,
      sidebarItems: prev.sidebarItems.map(item =>
        item.id === id ? { ...item, title: newTitle } : item
      )
    }));
  };

  const handleSelectSidebarItem = (id: string) => {
    if (id === appState.activeSidebarItemId) return;
    if (hasUnsavedChanges) {
      setPendingSidebarItemId(id);
    } else {
      setAppState(prev => ({ ...prev, activeSidebarItemId: id, activeCategoryId: null }));
    }
  };

  const confirmSidebarSwitch = () => {
    if (pendingSidebarItemId) {
      setAppState(prev => ({ ...prev, activeSidebarItemId: pendingSidebarItemId, activeCategoryId: null }));
      setPendingSidebarItemId(null);
    }
  };

  // Category Actions
  const handleAddCategory = (name: string) => {
    if (!appState.activeSidebarItemId) return;
    const newCategory: Category = {
      id: crypto.randomUUID(),
      title: name,
      layers: []
    };

    setAppState(prev => {
      const newItems = prev.sidebarItems.map(item => {
        if (item.id === prev.activeSidebarItemId) {
          return { ...item, categories: [...item.categories, newCategory] };
        }
        return item;
      });
      return { ...prev, sidebarItems: newItems, activeCategoryId: newCategory.id };
    });
  };

  const handleUpdateCategory = (categoryId: string, newTitle: string) => {
    setAppState(prev => {
      const newItems = prev.sidebarItems.map(item => {
        const categoryIndex = item.categories.findIndex(c => c.id === categoryId);
        if (categoryIndex !== -1) {
          const newCategories = [...item.categories];
          newCategories[categoryIndex] = { ...newCategories[categoryIndex], title: newTitle };
          return { ...item, categories: newCategories };
        }
        return item;
      });
      return { ...prev, sidebarItems: newItems };
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    setAppState(prev => {
      const newItems = prev.sidebarItems.map(item => {
        return { ...item, categories: item.categories.filter(c => c.id !== categoryId) };
      });
      return {
        ...prev,
        sidebarItems: newItems,
        activeCategoryId: prev.activeCategoryId === categoryId ? null : prev.activeCategoryId
      };
    });
  };


  // Layer Actions
  const handleAddLayer = () => {
    if (!appState.activeSidebarItemId || !appState.activeCategoryId) return;

    const newLayer: Layer = {
      id: crypto.randomUUID(),
      title: 'New Layer',
      description: '',
      width: 600,
      height: 400,
      tables: []
    };

    setAppState(prev => {
      const newItems = prev.sidebarItems.map(item => {
        if (item.id === prev.activeSidebarItemId) {
          const newCategories = item.categories.map(cat => {
            if (cat.id === prev.activeCategoryId) {
              return { ...cat, layers: [...cat.layers, newLayer] };
            }
            return cat;
          });
          return { ...item, categories: newCategories };
        }
        return item;
      });
      return { ...prev, sidebarItems: newItems };
    });
  };

  const handleUpdateLayer = (layerId: string, updates: Partial<Layer> | ((prev: Layer) => Partial<Layer>)) => {
    setAppState(prev => {
      const newItems = prev.sidebarItems.map(item => {
        if (item.id === prev.activeSidebarItemId) {
          const newCategories = item.categories.map(cat => {
            if (cat.id === prev.activeCategoryId) {
              const newLayers = cat.layers.map(layer => {
                if (layer.id === layerId) {
                  const resolvedUpdates = typeof updates === 'function' ? updates(layer) : updates;
                  return { ...layer, ...resolvedUpdates };
                }
                return layer;
              });
              return { ...cat, layers: newLayers };
            }
            return cat;
          });
          return { ...item, categories: newCategories };
        }
        return item;
      });
      return { ...prev, sidebarItems: newItems };
    });
  };

  const handleRemoveLayer = (layerId: string) => {
    setAppState(prev => {
      const newItems = prev.sidebarItems.map(item => {
        if (item.id === prev.activeSidebarItemId) {
          const newCategories = item.categories.map(cat => {
            if (cat.id === prev.activeCategoryId) {
              return { ...cat, layers: cat.layers.filter(l => l.id !== layerId) };
            }
            return cat;
          });
          return { ...item, categories: newCategories };
        }
        return item;
      });
      return { ...prev, sidebarItems: newItems };
    });
  };

  const handleReorderLayer = (layerId: string, direction: 'up' | 'down') => {
    setAppState(prev => {
      const newItems = prev.sidebarItems.map(item => {
        if (item.id === prev.activeSidebarItemId) {
          const newCategories = item.categories.map(cat => {
            if (cat.id === prev.activeCategoryId) {
              const layers = [...cat.layers];
              const idx = layers.findIndex(l => l.id === layerId);
              if (idx === -1) return cat;
              const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
              if (swapIdx < 0 || swapIdx >= layers.length) return cat;
              [layers[idx], layers[swapIdx]] = [layers[swapIdx], layers[idx]];
              return { ...cat, layers };
            }
            return cat;
          });
          return { ...item, categories: newCategories };
        }
        return item;
      });
      return { ...prev, sidebarItems: newItems };
    });
  };

  // Save Layout Handler
  const handleSaveLayout = (name: string) => {
    try {
      const savedConfigs = JSON.parse(localStorage.getItem(SAVED_CONFIGS_KEY) || '{}');
      savedConfigs[name] = { ...appState, savedAt: new Date().toISOString() };
      localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(savedConfigs));
      setLastSavedSnapshot(JSON.stringify(appState));
      setSaveToast({ message: `Configuration "${name}" saved successfully!`, type: 'success' });
      setTimeout(() => setSaveToast(null), 2500);
    } catch {
      setSaveToast({ message: 'Failed to save configuration.', type: 'error' });
      setTimeout(() => setSaveToast(null), 2500);
    }
  };

  // Load Layout Handler
  const handleLoadLayout = (state: { projectTitle: string; sidebarItems: AppState['sidebarItems']; activeSidebarItemId: string | null; activeCategoryId: string | null }) => {
    const newState = {
      projectTitle: state.projectTitle,
      sidebarItems: state.sidebarItems,
      activeSidebarItemId: state.activeSidebarItemId,
      activeCategoryId: state.activeCategoryId,
    };
    setAppState(newState);
    setLastSavedSnapshot(JSON.stringify(newState));
  };

  // Derived State
  const activeSidebarItem = appState.sidebarItems.find(item => item.id === appState.activeSidebarItemId);
  const activeCategory = activeSidebarItem?.categories.find(cat => cat.id === appState.activeCategoryId);

  return (
    <div className="app-container">
      <Sidebar
        projectTitle={appState.projectTitle}
        onUpdateTitle={handleUpdateProjectTitle}
        items={appState.sidebarItems}
        activeItemId={appState.activeSidebarItemId}
        onSelectItem={handleSelectSidebarItem}
        onAddItem={handleAddSidebarItem}
        onRemoveItem={handleRemoveSidebarItem}
        onUpdateItem={handleUpdateSidebarItem}
        onSaveLayout={handleSaveLayout}
        onLoadLayout={handleLoadLayout}
      />
      <div className="main-content">
        {activeSidebarItem && (
          <CategorySelector
            categories={activeSidebarItem.categories}
            activeCategoryId={appState.activeCategoryId}
            onSelectCategory={(id) => setAppState(prev => ({ ...prev, activeCategoryId: id }))}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        )}

        <div className="layers-container" style={{ flexGrow: 1, overflow: 'auto', padding: '20px' }}>
          {activeCategory ? (
            <>
              <div style={{ marginBottom: '20px' }}>
                <button onClick={handleAddLayer} style={{ background: '#007bff', color: 'white', border: 'none' }}>+ Add Layer</button>
              </div>
              {activeCategory.layers.map((layer, idx) => (
                <LayerBox
                  key={layer.id}
                  layer={layer}
                  onUpdateLayer={handleUpdateLayer}
                  onRemoveLayer={handleRemoveLayer}
                  index={idx}
                  totalLayers={activeCategory.layers.length}
                  onReorderLayer={handleReorderLayer}
                />
              ))}
            </>
          ) : (
            <div style={{ padding: 20, color: '#888' }}>Select a category to view layers</div>
          )}
        </div>
      </div>

      {/* Unsaved Changes Warning — Sidebar Item Switch */}
      {pendingSidebarItemId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={() => setPendingSidebarItemId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '24px',
              width: '420px',
              maxWidth: '90vw',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
          >
            <h3 style={{ margin: '0 0 12px 0' }}>Unsaved Changes</h3>
            <p style={{ margin: '0 0 20px 0', color: '#555', lineHeight: 1.5 }}>
              You have unsaved changes. Switching sidebar items will not discard your changes, but they won't be saved to a layout until you click "Save Current Layout".
            </p>
            <p style={{ margin: '0 0 20px 0', color: '#555' }}>Continue switching?</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setPendingSidebarItemId(null)}
                style={{
                  padding: '8px 24px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: '#f8f9fa',
                  cursor: 'pointer'
                }}
              >
                No
              </button>
              <button
                onClick={confirmSidebarSwitch}
                style={{
                  padding: '8px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#007bff',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Toast Notification */}
      {saveToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '14px 24px',
            borderRadius: '8px',
            background: saveToast.type === 'success' ? '#28a745' : '#dc3545',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 3000,
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {saveToast.message}
        </div>
      )}
    </div>
  );
}

export default App;
