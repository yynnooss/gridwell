import React, { useState } from 'react';
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
    onSaveLayout: (name: string) => void;
    onLoadLayout: (state: { projectTitle: string; sidebarItems: SidebarItem[]; activeSidebarItemId: string | null; activeCategoryId: string | null }) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    projectTitle,
    onUpdateTitle,
    items,
    activeItemId,
    onSelectItem,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
    onSaveLayout,
    onLoadLayout
}) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState(projectTitle);

    // Item Editing State
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editItemTitle, setEditItemTitle] = useState('');

    // Save Layout Modal State
    const [saveStep, setSaveStep] = useState<'closed' | 'confirm' | 'name'>('closed');
    const [configName, setConfigName] = useState('');

    // Delete Confirmation State
    const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

    // Saved Layouts Modal State
    const [showSavedLayouts, setShowSavedLayouts] = useState(false);
    const [deleteLayoutName, setDeleteLayoutName] = useState<string | null>(null);

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

    return (
        <div className="sidebar">
            <div className="sidebar-header" style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
                {isEditingTitle ? (
                    <div className="flex-row" style={{ gap: '5px' }}>
                        <input
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                            autoFocus
                            className="full-width"
                        />
                    </div>
                ) : (
                    <div className="flex-row" style={{ justifyContent: 'space-between' }}>
                        <h3 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {projectTitle}
                        </h3>
                        <button onClick={() => setIsEditingTitle(true)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 5px' }}>
                            ✎
                        </button>
                    </div>
                )}
            </div>

            <div className="sidebar-items" style={{ flexGrow: 1, overflowY: 'auto', padding: '10px 0' }}>
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`sidebar-item flex-row ${activeItemId === item.id ? 'active' : ''}`}
                        onClick={() => onSelectItem(item.id)}
                        style={{
                            padding: '10px 20px',
                            cursor: 'pointer',
                            backgroundColor: activeItemId === item.id ? '#e9ecef' : 'transparent',
                            justifyContent: 'space-between',
                            transition: 'background-color 0.2s'
                        }}
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
                            />
                        ) : (
                            <span
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    startEditingItem(item);
                                }}
                                style={{ fontWeight: activeItemId === item.id ? 'bold' : 'normal', flexGrow: 1, userSelect: 'none' }}
                                title="Double click to rename"
                            >
                                {item.title}
                            </span>
                        )}
                        <div className="flex-row" style={{ gap: '2px', flexShrink: 0 }}>
                            {editingItemId !== item.id && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingItem(item);
                                    }}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#999',
                                        padding: '0 4px',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        lineHeight: 1
                                    }}
                                    title="Rename Item"
                                >
                                    ✎
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteItemId(item.id);
                                }}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#999',
                                    padding: '0 5px',
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    lineHeight: 1
                                }}
                                title="Remove Item"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteItemId && (
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
                    onClick={() => setDeleteItemId(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#fff',
                            borderRadius: '8px',
                            padding: '24px',
                            width: '360px',
                            maxWidth: '90vw',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                        }}
                    >
                        <h3 style={{ margin: '0 0 20px 0' }}>Delete Sidebar Item?</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                onClick={() => setDeleteItemId(null)}
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
                                onClick={() => {
                                    onRemoveItem(deleteItemId);
                                    setDeleteItemId(null);
                                }}
                                style={{
                                    padding: '8px 24px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    background: '#dc3545',
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

            <div className="sidebar-footer" style={{ padding: '20px', borderTop: '1px solid #ddd' }}>
                <button className="full-width" onClick={onAddItem}>
                    + Add New
                </button>
                <button
                    className="full-width"
                    onClick={() => setSaveStep('confirm')}
                    style={{ marginTop: '8px', background: '#28a745', color: '#fff', border: 'none' }}
                >
                    Save Current Layout
                </button>
                <button
                    className="full-width"
                    onClick={() => setShowSavedLayouts(true)}
                    style={{ marginTop: '8px', background: '#17a2b8', color: '#fff', border: 'none' }}
                >
                    Saved Layouts
                </button>
            </div>

            {/* Save Layout Modal */}
            {saveStep !== 'closed' && (
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
                    onClick={() => { setSaveStep('closed'); setConfigName(''); }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#fff',
                            borderRadius: '8px',
                            padding: '24px',
                            width: '400px',
                            maxWidth: '90vw',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                        }}
                    >
                        {saveStep === 'confirm' && (
                            <>
                                <h3 style={{ margin: '0 0 20px 0' }}>Save Current Configuration?</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <button
                                        onClick={() => { setSaveStep('closed'); setConfigName(''); }}
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
                                        onClick={() => setSaveStep('name')}
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
                            </>
                        )}

                        {saveStep === 'name' && (
                            <>
                                <h3 style={{ margin: '0 0 16px 0' }}>Name Your Configuration</h3>
                                <input
                                    type="text"
                                    placeholder="Configuration name"
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
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        marginBottom: '20px'
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <button
                                        onClick={() => { setSaveStep('closed'); setConfigName(''); }}
                                        style={{
                                            padding: '8px 24px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            background: '#f8f9fa',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (configName.trim()) {
                                                onSaveLayout(configName.trim());
                                                setSaveStep('closed');
                                                setConfigName('');
                                            }
                                        }}
                                        style={{
                                            padding: '8px 24px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            background: '#28a745',
                                            color: '#fff',
                                            cursor: 'pointer'
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
                        onClick={() => setShowSavedLayouts(false)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#fff',
                                borderRadius: '8px',
                                padding: '24px',
                                width: '500px',
                                maxWidth: '90vw',
                                maxHeight: '70vh',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                            }}
                        >
                            <h3 style={{ margin: '0 0 16px 0' }}>Saved Layouts</h3>

                            {entries.length === 0 ? (
                                <p style={{ color: '#888', textAlign: 'center', padding: '20px 0' }}>
                                    No saved layouts yet.
                                </p>
                            ) : (
                                <div style={{ overflowY: 'auto', flexGrow: 1 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                                                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '13px', color: '#666', fontWeight: 600 }}>
                                                    Layout Name
                                                </th>
                                                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '13px', color: '#666', fontWeight: 600 }}>
                                                    Snapshot Date
                                                </th>
                                                <th style={{ width: '40px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entries.map(([name, config]) => (
                                                <tr
                                                    key={name}
                                                    onClick={() => {
                                                        onLoadLayout({
                                                            projectTitle: config.projectTitle,
                                                            sidebarItems: config.sidebarItems,
                                                            activeSidebarItemId: config.activeSidebarItemId,
                                                            activeCategoryId: config.activeCategoryId
                                                        });
                                                        setShowSavedLayouts(false);
                                                    }}
                                                    style={{
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid #f0f0f0',
                                                        transition: 'background-color 0.15s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                                                        {name}
                                                    </td>
                                                    <td style={{ padding: '10px 12px', color: '#666', fontSize: '13px' }}>
                                                        {formatDate(config.savedAt)}
                                                    </td>
                                                    <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteLayoutName(name);
                                                            }}
                                                            style={{
                                                                border: 'none',
                                                                background: 'transparent',
                                                                color: '#dc3545',
                                                                cursor: 'pointer',
                                                                fontSize: '16px',
                                                                padding: '0 4px',
                                                                lineHeight: 1
                                                            }}
                                                            title="Delete Layout"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div style={{ marginTop: '16px', textAlign: 'right' }}>
                                <button
                                    onClick={() => setShowSavedLayouts(false)}
                                    style={{
                                        padding: '8px 24px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        background: '#f8f9fa',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Delete Saved Layout Confirmation Modal */}
            {deleteLayoutName && (
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
                        zIndex: 3000
                    }}
                    onClick={() => setDeleteLayoutName(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#fff',
                            borderRadius: '8px',
                            padding: '24px',
                            width: '360px',
                            maxWidth: '90vw',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                        }}
                    >
                        <h3 style={{ margin: '0 0 20px 0' }}>Delete Saved Layout?</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                onClick={() => setDeleteLayoutName(null)}
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
                                onClick={() => {
                                    try {
                                        const configs = getSavedConfigs();
                                        delete configs[deleteLayoutName];
                                        localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(configs));
                                    } catch { /* ignore */ }
                                    setDeleteLayoutName(null);
                                }}
                                style={{
                                    padding: '8px 24px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    background: '#dc3545',
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
        </div>
    );
};
