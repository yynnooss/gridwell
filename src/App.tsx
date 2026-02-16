import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { CategorySelector } from './components/CategorySelector';
import { LayerBox } from './components/LayerBox';
import { SearchModal } from './components/SearchModal';
import type { AppState, SidebarItem, Category, Layer } from './types';

const STORAGE_KEY = 'admin-panel-state';
const SAVED_CONFIGS_KEY = 'admin-panel-saved-configs';
const THEME_KEY = 'gridwell-theme';
const MAX_UNDO_STEPS = 50;

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

const loadTheme = (): 'light' | 'dark' => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') return 'dark';
  } catch { /* ignore */ }
  return 'light';
};

function App() {
  const [appState, setAppState] = useState<AppState>(loadState);
  const [theme, setTheme] = useState<'light' | 'dark'>(loadTheme);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<AppState[]>([]);
  const [redoStack, setRedoStack] = useState<AppState[]>([]);

  // Track last saved state for unsaved changes detection
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>(() => JSON.stringify(loadState()));

  // Persist state to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const hasUnsavedChanges = JSON.stringify(appState) !== lastSavedSnapshot;

  // Save toast notification state
  const [saveToast, setSaveToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sidebar switch warning state
  const [pendingSidebarItemId, setPendingSidebarItemId] = useState<string | null>(null);

  // Search modal state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKey, setSearchKey] = useState(0);

  // Helper: update state with undo tracking
  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setAppState(prev => {
      setUndoStack(stack => [...stack.slice(-MAX_UNDO_STEPS + 1), prev]);
      setRedoStack([]);
      return updater(prev);
    });
  }, []);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    setUndoStack(stack => {
      if (stack.length === 0) return stack;
      const prev = stack[stack.length - 1];
      setRedoStack(redo => [...redo, structuredClone(appState)]);
      setAppState(prev);
      return stack.slice(0, -1);
    });
  }, [appState]);

  const handleRedo = useCallback(() => {
    setRedoStack(stack => {
      if (stack.length === 0) return stack;
      const next = stack[stack.length - 1];
      setUndoStack(undo => [...undo, structuredClone(appState)]);
      setAppState(next);
      return stack.slice(0, -1);
    });
  }, [appState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 's') {
        e.preventDefault();
        // Open save dialog via sidebar
        document.querySelector<HTMLButtonElement>('.sidebar-footer .btn-success')?.click();
      }
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      if (mod && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      // ⌘K — Global Search
      if (mod && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => {
          if (!prev) setSearchKey(k => k + 1);
          return !prev;
        });
      }
      // ⌘P — Print
      if (mod && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Toggle theme
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  // Export state as JSON file
  const handleExport = useCallback(() => {
    const data = JSON.stringify(appState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gridwell-${appState.projectTitle.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSaveToast({ message: 'Project exported successfully!', type: 'success' });
    setTimeout(() => setSaveToast(null), 2500);
  }, [appState]);

  // Import state from JSON file
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string) as AppState;
          if (imported.projectTitle && imported.sidebarItems) {
            const migrated = migrateState(imported);
            setUndoStack(stack => [...stack, structuredClone(appState)]);
            setRedoStack([]);
            setAppState(migrated);
            setSaveToast({ message: `Imported "${migrated.projectTitle}" successfully!`, type: 'success' });
          } else {
            setSaveToast({ message: 'Invalid file format.', type: 'error' });
          }
        } catch {
          setSaveToast({ message: 'Failed to parse file.', type: 'error' });
        }
        setTimeout(() => setSaveToast(null), 2500);
      };
      reader.readAsText(file);
    };
    input.click();
  }, [appState]);

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Sidebar Actions
  const handleUpdateProjectTitle = useCallback((newTitle: string) => {
    updateState(prev => ({ ...prev, projectTitle: newTitle }));
  }, [updateState]);

  const handleAddSidebarItem = useCallback(() => {
    const newItem: SidebarItem = {
      id: crypto.randomUUID(),
      title: 'New Item',
      categories: []
    };
    updateState(prev => ({
      ...prev,
      sidebarItems: [...prev.sidebarItems, newItem],
      activeSidebarItemId: newItem.id
    }));
  }, [updateState]);

  const handleRemoveSidebarItem = useCallback((id: string) => {
    updateState(prev => ({
      ...prev,
      sidebarItems: prev.sidebarItems.filter(item => item.id !== id),
      activeSidebarItemId: prev.activeSidebarItemId === id ? null : prev.activeSidebarItemId
    }));
  }, [updateState]);

  const handleUpdateSidebarItem = useCallback((id: string, newTitle: string) => {
    updateState(prev => ({
      ...prev,
      sidebarItems: prev.sidebarItems.map(item =>
        item.id === id ? { ...item, title: newTitle } : item
      )
    }));
  }, [updateState]);

  // Sidebar drag-to-reorder
  const handleReorderSidebarItems = useCallback((fromIndex: number, toIndex: number) => {
    updateState(prev => {
      const items = [...prev.sidebarItems];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { ...prev, sidebarItems: items };
    });
  }, [updateState]);

  const handleSelectSidebarItem = useCallback((id: string) => {
    if (id === appState.activeSidebarItemId) return;
    if (hasUnsavedChanges) {
      setPendingSidebarItemId(id);
    } else {
      setAppState(prev => ({ ...prev, activeSidebarItemId: id, activeCategoryId: null }));
    }
  }, [appState.activeSidebarItemId, hasUnsavedChanges]);

  const confirmSidebarSwitch = useCallback(() => {
    if (pendingSidebarItemId) {
      setAppState(prev => ({ ...prev, activeSidebarItemId: pendingSidebarItemId, activeCategoryId: null }));
      setPendingSidebarItemId(null);
    }
  }, [pendingSidebarItemId]);

  // Category Actions
  const handleAddCategory = useCallback((name: string) => {
    if (!appState.activeSidebarItemId) return;
    const newCategory: Category = {
      id: crypto.randomUUID(),
      title: name,
      layers: []
    };
    updateState(prev => {
      const newItems = prev.sidebarItems.map(item => {
        if (item.id === prev.activeSidebarItemId) {
          return { ...item, categories: [...item.categories, newCategory] };
        }
        return item;
      });
      return { ...prev, sidebarItems: newItems, activeCategoryId: newCategory.id };
    });
  }, [appState.activeSidebarItemId, updateState]);

  const handleUpdateCategory = useCallback((categoryId: string, newTitle: string) => {
    updateState(prev => {
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
  }, [updateState]);

  const handleDeleteCategory = useCallback((categoryId: string) => {
    updateState(prev => {
      const newItems = prev.sidebarItems.map(item => {
        return { ...item, categories: item.categories.filter(c => c.id !== categoryId) };
      });
      return {
        ...prev,
        sidebarItems: newItems,
        activeCategoryId: prev.activeCategoryId === categoryId ? null : prev.activeCategoryId
      };
    });
  }, [updateState]);

  // Layer Actions
  const handleAddLayer = useCallback(() => {
    if (!appState.activeSidebarItemId || !appState.activeCategoryId) return;
    const newLayer: Layer = {
      id: crypto.randomUUID(),
      title: 'New Layer',
      description: '',
      width: 650,
      height: 420,
      tables: []
    };
    updateState(prev => {
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
  }, [appState.activeSidebarItemId, appState.activeCategoryId, updateState]);

  const handleUpdateLayer = useCallback((layerId: string, updates: Partial<Layer> | ((prev: Layer) => Partial<Layer>)) => {
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
  }, []);

  const handleRemoveLayer = useCallback((layerId: string) => {
    updateState(prev => {
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
  }, [updateState]);

  // Duplicate Layer
  const handleDuplicateLayer = useCallback((layerId: string) => {
    updateState(prev => {
      const newItems = prev.sidebarItems.map(item => {
        if (item.id === prev.activeSidebarItemId) {
          const newCategories = item.categories.map(cat => {
            if (cat.id === prev.activeCategoryId) {
              const layerIdx = cat.layers.findIndex(l => l.id === layerId);
              if (layerIdx === -1) return cat;
              const original = cat.layers[layerIdx];
              const clone: Layer = {
                ...structuredClone(original),
                id: crypto.randomUUID(),
                title: `${original.title} (copy)`,
                tables: original.tables.map(t => ({
                  ...structuredClone(t),
                  id: crypto.randomUUID(),
                })),
              };
              const layers = [...cat.layers];
              layers.splice(layerIdx + 1, 0, clone);
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
  }, [updateState]);

  const handleReorderLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    updateState(prev => {
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
  }, [updateState]);

  // Save Layout Handler
  const handleSaveLayout = useCallback((name: string) => {
    try {
      const savedConfigs = JSON.parse(localStorage.getItem(SAVED_CONFIGS_KEY) || '{}');
      savedConfigs[name] = { ...appState, savedAt: new Date().toISOString() };
      localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(savedConfigs));
      setLastSavedSnapshot(JSON.stringify(appState));
      setSaveToast({ message: `Layout "${name}" saved!`, type: 'success' });
      setTimeout(() => setSaveToast(null), 2500);
    } catch {
      setSaveToast({ message: 'Failed to save.', type: 'error' });
      setTimeout(() => setSaveToast(null), 2500);
    }
  }, [appState]);

  // Load Layout Handler
  const handleLoadLayout = useCallback((state: { projectTitle: string; sidebarItems: AppState['sidebarItems']; activeSidebarItemId: string | null; activeCategoryId: string | null }) => {
    const newState = {
      projectTitle: state.projectTitle,
      sidebarItems: state.sidebarItems,
      activeSidebarItemId: state.activeSidebarItemId,
      activeCategoryId: state.activeCategoryId,
    };
    setUndoStack(stack => [...stack, structuredClone(appState)]);
    setRedoStack([]);
    setAppState(newState);
    setLastSavedSnapshot(JSON.stringify(newState));
  }, [appState]);

  // Search navigation handler
  const handleSearchNavigate = useCallback((result: { sidebarItemId: string; categoryId?: string }) => {
    setAppState(prev => ({
      ...prev,
      activeSidebarItemId: result.sidebarItemId,
      activeCategoryId: result.categoryId || prev.activeCategoryId,
    }));
  }, []);

  // Derived State
  const activeSidebarItem = appState.sidebarItems.find(item => item.id === appState.activeSidebarItemId);
  const activeCategory = activeSidebarItem?.categories.find(cat => cat.id === appState.activeCategoryId);

  return (
    <div className="app-container">
      {/* Mobile Warning */}
      <div className="mobile-warning" role="alert">
        <div className="mobile-warning-icon">💻</div>
        <h2>Gridwell works best on desktop</h2>
        <p>For the best experience, please use a screen wider than 768px.</p>
      </div>

      <Sidebar
        projectTitle={appState.projectTitle}
        onUpdateTitle={handleUpdateProjectTitle}
        items={appState.sidebarItems}
        activeItemId={appState.activeSidebarItemId}
        onSelectItem={handleSelectSidebarItem}
        onAddItem={handleAddSidebarItem}
        onRemoveItem={handleRemoveSidebarItem}
        onUpdateItem={handleUpdateSidebarItem}
        onReorderItems={handleReorderSidebarItems}
        onSaveLayout={handleSaveLayout}
        onLoadLayout={handleLoadLayout}
        onExport={handleExport}
        onImport={handleImport}
        onPrint={handlePrint}
        onOpenSearch={() => { setSearchKey(k => k + 1); setSearchOpen(true); }}
        theme={theme}
        onToggleTheme={toggleTheme}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <main className="main-content" role="main">
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

        <div className="layers-container">
          {activeCategory ? (
            <>
              <div style={{ marginBottom: '20px' }}>
                <button className="btn-primary" onClick={handleAddLayer} aria-label="Add new layer">+ Add Layer</button>
              </div>
              {activeCategory.layers.map((layer, idx) => (
                <LayerBox
                  key={layer.id}
                  layer={layer}
                  onUpdateLayer={handleUpdateLayer}
                  onRemoveLayer={handleRemoveLayer}
                  onDuplicateLayer={handleDuplicateLayer}
                  index={idx}
                  totalLayers={activeCategory.layers.length}
                  onReorderLayer={handleReorderLayer}
                />
              ))}
              {activeCategory.layers.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon" aria-hidden="true">📐</div>
                  <div style={{ fontWeight: 500 }}>No layers yet</div>
                  <div>Click "+ Add Layer" to get started</div>
                </div>
              )}
            </>
          ) : activeSidebarItem ? (
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">📂</div>
              <div style={{ fontWeight: 500 }}>No category selected</div>
              <div>Select or create a category above</div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">👋</div>
              <div style={{ fontWeight: 500, fontSize: '16px' }}>Welcome to Gridwell</div>
              <div>Create a sidebar item to get started</div>
            </div>
          )}
        </div>
      </main>

      {/* Search Modal (⌘K) */}
      <SearchModal
        key={searchKey}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        appState={appState}
        onNavigate={handleSearchNavigate}
      />

      {/* Unsaved Changes Warning — Sidebar Item Switch */}
      {pendingSidebarItemId && (
        <div className="modal-overlay" onClick={() => setPendingSidebarItemId(null)} role="dialog" aria-modal="true" aria-label="Unsaved changes warning">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '420px' }}>
            <h3>Unsaved Changes</h3>
            <p>
              You have unsaved changes. Switching sidebar items will not discard your changes, but they won't be saved to a layout until you click "Save Current Layout".
            </p>
            <p style={{ marginTop: '12px' }}>Continue switching?</p>
            <div className="modal-actions">
              <button onClick={() => setPendingSidebarItemId(null)}>Cancel</button>
              <button className="btn-primary" onClick={confirmSidebarSwitch}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Save Toast Notification */}
      {saveToast && (
        <div className={`toast ${saveToast.type === 'success' ? 'toast-success' : 'toast-error'}`} role="status" aria-live="polite">
          {saveToast.message}
        </div>
      )}
    </div>
  );
}

export default App;
