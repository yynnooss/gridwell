import React, { useState, useCallback, useRef } from 'react';
import type { SidebarItem } from '../types';

interface SavedConfig {
    savedAt: string;
    projectTitle: string;
    sidebarItems: SidebarItem[];
    activeSidebarItemId: string | null;
    activeCategoryId: string | null;
}

const SAVED_CONFIGS_KEY = 'admin-panel-saved-configs';

interface SidebarProps {
    projectTitle: string;
    onUpdateTitle: (newTitle: string) => void;
    items: SidebarItem[];
    activeItemId: string | null;
    onSelectItem: (id: string) => void;
    onAddItem: () => void;
    onRemoveItem: (id: string) => void;
    onUpdateItem: (id: string, newTitle: string) => void;
    onReorderItems: (fromIndex: number, toIndex: number) => void;
    onSaveLayout: (name: string) => void;
    onLoadLayout: (state: { projectTitle: string; sidebarItems: SidebarItem[]; activeSidebarItemId: string | null; activeCategoryId: string | null }) => void;
    onExport: () => void;
    onImport: () => void;
    onPrint: () => void;
    onOpenSearch: () => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
    projectTitle,
    onUpdateTitle,
    items,
    activeItemId,
    onSelectItem,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
    onReorderItems,
    onSaveLayout,
    onLoadLayout,
    onExport,
    onImport,
    onPrint,
    onOpenSearch,
    theme,
    onToggleTheme,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
}) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState(projectTitle);

    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editItemTitle, setEditItemTitle] = useState('');

    const [saveStep, setSaveStep] = useState<'closed' | 'confirm' | 'name'>('closed');
    const [configName, setConfigName] = useState('');

    const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

    const [showSavedLayouts, setShowSavedLayouts] = useState(false);
    const [deleteLayoutName, setDeleteLayoutName] = useState<string | null>(null);

    // Drag-to-reorder state
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragCounter = useRef(0);

    const getSavedConfigs = (): Record<string, SavedConfig> => {
        try {
            return JSON.parse(localStorage.getItem(SAVED_CONFIGS_KEY) || '{}');
        } catch { return {}; }
    };

    const formatDate = (iso: string): string => {
        const d = new Date(iso);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}/${mm}/${dd}, ${hh}:${min}`;
    };

    const handleTitleSave = () => {
        if (tempTitle.trim()) {
            onUpdateTitle(tempTitle);
        } else {
            setTempTitle(projectTitle);
        }
        setIsEditingTitle(false);
    };

    const startEditingItem = (item: SidebarItem) => {
        setEditingItemId(item.id);
        setEditItemTitle(item.title);
    };

    const saveItemTitle = (id: string) => {
        if (editItemTitle.trim()) {
            onUpdateItem(id, editItemTitle);
        }
        setEditingItemId(null);
    };

    // Drag handlers
    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
        // Make drag image semi-transparent
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    }, []);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
        setDragIndex(null);
        setDragOverIndex(null);
        dragCounter.current = 0;
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        dragCounter.current++;
        setDragOverIndex(index);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setDragOverIndex(null);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        dragCounter.current = 0;
        if (dragIndex !== null && dragIndex !== toIndex) {
            onReorderItems(dragIndex, toIndex);
        }
        setDragIndex(null);
        setDragOverIndex(null);
    }, [dragIndex, onReorderItems]);

    return (
        <nav className="sidebar" role="navigation" aria-label="Main navigation">
            {/* Sidebar Header */}
            <div className="sidebar-header">
                {isEditingTitle ? (
                    <input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                        autoFocus
                        className="full-width"
                        aria-label="Project title"
                    />
                ) : (
                    <div className="flex-row" style={{ justifyContent: 'space-between' }}>
                        <h3 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>
                            {projectTitle}
                        </h3>
                        <div className="flex-row" style={{ gap: '4px', flexShrink: 0 }}>
                            <button className="btn-icon" onClick={() => setIsEditingTitle(true)} title="Rename project" aria-label="Rename project" style={{ color: 'var(--color-sidebar-text)' }}>
                                ✎
                            </button>
                            <button className="theme-toggle" onClick={onToggleTheme} title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} role="switch" aria-checked={theme === 'dark'} />
                        </div>
                    </div>
                )}
            </div>

            {/* Toolbar */}
            <div className="flex-row" style={{ padding: '8px 20px', gap: '4px', borderBottom: '1px solid var(--color-sidebar-divider)' }} role="toolbar" aria-label="Actions toolbar">
                <button
                    className="btn-icon"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Undo (⌘Z)"
                    aria-label="Undo"
                    style={{ color: canUndo ? 'var(--color-sidebar-text)' : 'var(--color-sidebar-divider)', fontSize: '14px' }}
                >
                    ↩
                </button>
                <button
                    className="btn-icon"
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="Redo (⌘⇧Z)"
                    aria-label="Redo"
                    style={{ color: canRedo ? 'var(--color-sidebar-text)' : 'var(--color-sidebar-divider)', fontSize: '14px' }}
                >
                    ↪
                </button>
                <div style={{ flexGrow: 1 }} />
                <button
                    className="btn-icon"
                    onClick={onOpenSearch}
                    title="Search (⌘K)"
                    aria-label="Open global search"
                    style={{ color: 'var(--color-sidebar-text)', fontSize: '13px' }}
                >
                    🔍
                </button>
                <button
                    className="btn-icon"
                    onClick={onPrint}
                    title="Print layout"
                    aria-label="Print current layout"
                    style={{ color: 'var(--color-sidebar-text)', fontSize: '13px' }}
                >
                    🖨️
                </button>
                <button
                    className="btn-icon"
                    onClick={onExport}
                    title="Export as JSON"
                    aria-label="Export project as JSON"
                    style={{ color: 'var(--color-sidebar-text)', fontSize: '13px' }}
                >
                    ↓
                </button>
                <button
                    className="btn-icon"
                    onClick={onImport}
                    title="Import from JSON"
                    aria-label="Import project from JSON"
                    style={{ color: 'var(--color-sidebar-text)', fontSize: '13px' }}
                >
                    ↑
                </button>
            </div>

            {/* Sidebar Items (with drag-to-reorder) */}
            <div className="sidebar-items" role="list" aria-label="Sidebar items">
                {items.length === 0 && (
                    <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--color-sidebar-text)', fontSize: '13px', opacity: 0.6 }}>
                        No items yet. Click "+ Add New" to start.
                    </div>
                )}
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className={`sidebar-item ${activeItemId === item.id ? 'active' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                        onClick={() => onSelectItem(item.id)}
                        role="listitem"
                        aria-current={activeItemId === item.id ? 'true' : undefined}
                        draggable={editingItemId !== item.id}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                    >
                        {editingItemId === item.id ? (
                            <input
                                type="text"
                                value={editItemTitle}
                                onChange={(e) => setEditItemTitle(e.target.value)}
                                onBlur={() => saveItemTitle(item.id)}
                                onKeyDown={(e) => e.key === 'Enter' && saveItemTitle(item.id)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Edit item name"
                            />
                        ) : (
                            <div className="flex-row" style={{ justifyContent: 'space-between', width: '100%' }}>
                                <span className="flex-row" style={{ gap: '6px', flexGrow: 1, overflow: 'hidden' }}>
                                    <span className="drag-handle" aria-hidden="true" title="Drag to reorder" style={{ cursor: 'grab', opacity: 0.5, fontSize: '10px', flexShrink: 0 }}>⠿</span>
                                    <span
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            startEditingItem(item);
                                        }}
                                        style={{ flexGrow: 1, userSelect: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                        title={item.title}
                                    >
                                        {item.title}
                                    </span>
                                </span>
                                <div className="flex-row" style={{ gap: '2px', flexShrink: 0 }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startEditingItem(item);
                                        }}
                                        title="Rename"
                                        aria-label={`Rename ${item.title}`}
                                        style={{ fontSize: '13px' }}
                                    >
                                        ✎
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteItemId(item.id);
                                        }}
                                        title="Delete"
                                        aria-label={`Delete ${item.title}`}
                                        style={{ fontSize: '16px' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Delete Sidebar Item Modal */}
            {deleteItemId && (
                <div className="modal-overlay" onClick={() => setDeleteItemId(null)} role="dialog" aria-modal="true" aria-label="Delete confirmation">
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '360px' }}>
                        <h3>Delete Sidebar Item?</h3>
                        <p>This will permanently delete this item and all its categories, layers, and tables.</p>
                        <div className="modal-actions">
                            <button onClick={() => setDeleteItemId(null)}>Cancel</button>
                            <button
                                className="btn-danger"
                                onClick={() => {
                                    onRemoveItem(deleteItemId);
                                    setDeleteItemId(null);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar Footer */}
            <div className="sidebar-footer">
                <button onClick={onAddItem} style={{ background: 'var(--color-sidebar-surface)', color: 'var(--color-sidebar-text-bright)', border: '1px solid var(--color-sidebar-divider)' }} aria-label="Add new sidebar item">
                    + Add New
                </button>
                <button
                    className="btn-success"
                    onClick={() => setSaveStep('confirm')}
                    aria-label="Save current layout"
                >
                    💾 Save Layout <span className="kbd">⌘S</span>
                </button>
                <button
                    className="btn-info"
                    onClick={() => setShowSavedLayouts(true)}
                    aria-label="View saved layouts"
                >
                    📋 Saved Layouts
                </button>
            </div>

            {/* Save Layout Modal */}
            {saveStep !== 'closed' && (
                <div className="modal-overlay" onClick={() => { setSaveStep('closed'); setConfigName(''); }} role="dialog" aria-modal="true" aria-label="Save layout">
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '400px' }}>
                        {saveStep === 'confirm' && (
                            <>
                                <h3>Save Current Layout?</h3>
                                <p>This will save a snapshot of your current workspace that you can restore later.</p>
                                <div className="modal-actions">
                                    <button onClick={() => { setSaveStep('closed'); setConfigName(''); }}>Cancel</button>
                                    <button className="btn-primary" onClick={() => setSaveStep('name')}>Continue</button>
                                </div>
                            </>
                        )}

                        {saveStep === 'name' && (
                            <>
                                <h3>Name Your Layout</h3>
                                <input
                                    type="text"
                                    placeholder="e.g., Sprint 3 Setup"
                                    value={configName}
                                    onChange={(e) => setConfigName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && configName.trim()) {
                                            onSaveLayout(configName.trim());
                                            setSaveStep('closed');
                                            setConfigName('');
                                        }
                                    }}
                                    autoFocus
                                    aria-label="Layout name"
                                    style={{ marginBottom: '20px' }}
                                />
                                <div className="modal-actions">
                                    <button onClick={() => { setSaveStep('closed'); setConfigName(''); }}>Cancel</button>
                                    <button
                                        className="btn-success"
                                        onClick={() => {
                                            if (configName.trim()) {
                                                onSaveLayout(configName.trim());
                                                setSaveStep('closed');
                                                setConfigName('');
                                            }
                                        }}
                                    >
                                        Save
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Saved Layouts Modal */}
            {showSavedLayouts && (() => {
                const configs = getSavedConfigs();
                const entries = Object.entries(configs).sort(
                    ([, a], [, b]) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
                );

                return (
                    <div className="modal-overlay" onClick={() => setShowSavedLayouts(false)} role="dialog" aria-modal="true" aria-label="Saved layouts">
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '500px', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
                            <h3>Saved Layouts</h3>

                            {entries.length === 0 ? (
                                <div className="empty-state" style={{ padding: '20px 0' }}>
                                    <div>No saved layouts yet.</div>
                                </div>
                            ) : (
                                <div style={{ overflowY: 'auto', flexGrow: 1 }}>
                                    {entries.map(([name, config]) => (
                                        <div
                                            key={name}
                                            onClick={() => {
                                                onLoadLayout({
                                                    projectTitle: config.projectTitle,
                                                    sidebarItems: config.sidebarItems,
                                                    activeSidebarItemId: config.activeSidebarItemId,
                                                    activeCategoryId: config.activeCategoryId,
                                                });
                                                setShowSavedLayouts(false);
                                            }}
                                            style={{
                                                padding: '14px 16px',
                                                borderRadius: 'var(--radius-md)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'background var(--transition-fast)',
                                                marginBottom: '4px',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`Load layout: ${name}`}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>{name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{formatDate(config.savedAt)}</div>
                                            </div>
                                            <button
                                                className="btn-icon btn-icon-danger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteLayoutName(name);
                                                }}
                                                title="Delete Layout"
                                                aria-label={`Delete layout: ${name}`}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="modal-actions" style={{ marginTop: '16px' }}>
                                <button onClick={() => setShowSavedLayouts(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Delete Layout Confirmation */}
            {deleteLayoutName && (
                <div className="modal-overlay" onClick={() => setDeleteLayoutName(null)} style={{ zIndex: 3000 }} role="dialog" aria-modal="true" aria-label="Delete layout confirmation">
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '360px' }}>
                        <h3>Delete Layout "{deleteLayoutName}"?</h3>
                        <p>This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button onClick={() => setDeleteLayoutName(null)}>Cancel</button>
                            <button
                                className="btn-danger"
                                onClick={() => {
                                    try {
                                        const configs = getSavedConfigs();
                                        delete configs[deleteLayoutName];
                                        localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(configs));
                                    } catch { /* ignore */ }
                                    setDeleteLayoutName(null);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
});

Sidebar.displayName = 'Sidebar';
