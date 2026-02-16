import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Layer, TableData } from '../types';
import { DynamicTable } from './DynamicTable';

const MAX_TABLES = 10;

const createDefaultTable = (): TableData => {
    const id = crypto.randomUUID();
    return {
        id,
        title: 'New Table',
        columns: [
            { id: 'c1', title: '1', width: 100 },
            { id: 'c2', title: '2', width: 100 },
            { id: 'c3', title: '3', width: 100 },
            { id: 'c4', title: '4', width: 100 },
            { id: 'c5', title: '5', width: 100 },
        ],
        rows: Array(5).fill(null).map((_, i) => ({
            id: `r${i}_${id}`,
            cells: {
                c1: { id: `c1r${i}`, value: '' },
                c2: { id: `c2r${i}`, value: '' },
                c3: { id: `c3r${i}`, value: '' },
                c4: { id: `c4r${i}`, value: '' },
                c5: { id: `c5r${i}`, value: '' },
            },
            height: 40
        }))
    };
};

interface LayerBoxProps {
    layer: Layer;
    onUpdateLayer: (id: string, updates: Partial<Layer> | ((prev: Layer) => Partial<Layer>)) => void;
    onRemoveLayer: (id: string) => void;
    index: number;
    totalLayers: number;
    onReorderLayer: (layerId: string, direction: 'up' | 'down') => void;
}

export const LayerBox: React.FC<LayerBoxProps> = ({ layer, onUpdateLayer, onRemoveLayer, index, totalLayers, onReorderLayer }) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const descRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTableId, setDeleteTableId] = useState<string | null>(null);

    // Table title editing state
    const [editingTableId, setEditingTableId] = useState<string | null>(null);
    const [editTableTitle, setEditTableTitle] = useState('');

    // Track whether the rich text editor is focused
    const [descFocused, setDescFocused] = useState(false);

    // Sync description HTML into contentEditable only when not focused
    useEffect(() => {
        if (descRef.current && !descFocused) {
            if (descRef.current.innerHTML !== layer.description) {
                descRef.current.innerHTML = layer.description;
            }
        }
    }, [layer.description, descFocused]);

    const handleDescInput = useCallback(() => {
        if (descRef.current) {
            onUpdateLayer(layer.id, { description: descRef.current.innerHTML });
        }
    }, [layer.id, onUpdateLayer]);

    const execFormat = (command: string) => {
        document.execCommand(command, false);
        // Refocus the editor after clicking toolbar button
        descRef.current?.focus();
        handleDescInput();
    };

    const saveTableTitle = () => {
        if (editingTableId && editTableTitle.trim()) {
            handleUpdateTable(editingTableId, { title: editTableTitle.trim() });
        }
        setEditingTableId(null);
    };

    // Resizing Logic
    useEffect(() => {
        const box = boxRef.current;
        if (!box) return;

        const handleMouseDown = (e: MouseEvent) => {
            if ((e.target as HTMLElement).classList.contains('resize-handle')) {
                setIsResizing(true);
                e.preventDefault();
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const newWidth = e.clientX - box.getBoundingClientRect().left;
            const newHeight = e.clientY - box.getBoundingClientRect().top;

            if (newWidth > 200 && newHeight > 100) {
                box.style.width = `${newWidth}px`;
                box.style.height = `${newHeight}px`;
            }
        };

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
                onUpdateLayer(layer.id, {
                    width: parseFloat(box.style.width),
                    height: parseFloat(box.style.height)
                });
            }
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        box.addEventListener('mousedown', handleMouseDown);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (box) box.removeEventListener('mousedown', handleMouseDown);
        };
    }, [isResizing, layer.id, onUpdateLayer]);

    // --- Table Management ---
    const handleAddTable = () => {
        if (layer.tables.length >= MAX_TABLES) return;
        const newTable = createDefaultTable();
        onUpdateLayer(layer.id, prev => ({ tables: [...prev.tables, newTable] }));
    };

    const handleRemoveTable = (tableId: string) => {
        onUpdateLayer(layer.id, prev => ({ tables: prev.tables.filter(t => t.id !== tableId) }));
        setDeleteTableId(null);
    };

    const handleUpdateTable = (tableId: string, updates: Partial<TableData>) => {
        onUpdateLayer(layer.id, prev => ({
            tables: prev.tables.map(t => t.id === tableId ? { ...t, ...updates } : t)
        }));
    };

    const handleReorderTable = (tableId: string, direction: 'up' | 'down') => {
        onUpdateLayer(layer.id, prev => {
            const tables = [...prev.tables];
            const idx = tables.findIndex(t => t.id === tableId);
            if (idx === -1) return {};
            const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (swapIdx < 0 || swapIdx >= tables.length) return {};
            [tables[idx], tables[swapIdx]] = [tables[swapIdx], tables[idx]];
            return { tables };
        });
    };

    const style: React.CSSProperties = {
        width: layer.width || 600,
        height: layer.height || 400,
        border: '1px solid #ccc',
        background: '#f5f5f5',
        margin: '20px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
    };

    return (
        <div ref={boxRef} style={style} className="layer-box">
            {/* Layer Header */}
            <div className="layer-header" style={{
                padding: '10px',
                borderBottom: '1px solid #ddd',
                background: '#fff',
                position: 'relative'
            }}>
                <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '5px', alignItems: 'center' }}>
                    {/* Reorder buttons */}
                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0, marginRight: '8px' }}>
                        <button
                            onClick={() => onReorderLayer(layer.id, 'up')}
                            disabled={index === 0}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: index === 0 ? 'default' : 'pointer',
                                fontSize: '14px',
                                padding: '2px 4px',
                                color: index === 0 ? '#ddd' : '#666',
                                lineHeight: 1
                            }}
                            title="Move up"
                        >
                            ▲
                        </button>
                        <button
                            onClick={() => onReorderLayer(layer.id, 'down')}
                            disabled={index === totalLayers - 1}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: index === totalLayers - 1 ? 'default' : 'pointer',
                                fontSize: '14px',
                                padding: '2px 4px',
                                color: index === totalLayers - 1 ? '#ddd' : '#666',
                                lineHeight: 1
                            }}
                            title="Move down"
                        >
                            ▼
                        </button>
                    </div>

                    <input
                        type="text"
                        value={layer.title}
                        onChange={(e) => onUpdateLayer(layer.id, { title: e.target.value })}
                        style={{
                            fontWeight: 'bold',
                            border: 'none',
                            background: 'transparent',
                            fontSize: '16px',
                            flexGrow: 1,
                            minWidth: 0
                        }}
                        placeholder="Layer Title"
                    />

                    {/* Remove layer button - fixed top-right */}
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{
                            color: '#dc3545',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '2px 6px',
                            flexShrink: 0,
                            lineHeight: 1
                        }}
                        title="Remove Layer"
                    >
                        🗑️
                    </button>
                </div>
                {/* Rich Text Description */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => execFormat('bold')}
                        style={{
                            border: '1px solid #ddd',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            color: '#666'
                        }}
                        title="Bold"
                    >
                        B
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => execFormat('italic')}
                        style={{
                            border: '1px solid #ddd',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontStyle: 'italic',
                            fontSize: '12px',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            color: '#666'
                        }}
                        title="Italic"
                    >
                        I
                    </button>
                </div>
                <div
                    ref={descRef}
                    contentEditable
                    onInput={handleDescInput}
                    onFocus={() => setDescFocused(true)}
                    onBlur={() => setDescFocused(false)}
                    style={{
                        width: '100%',
                        minHeight: '40px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '12px',
                        color: '#666',
                        outline: 'none',
                        lineHeight: 1.5
                    }}
                    data-placeholder="Layer Description..."
                />
            </div>

            {/* Tables Body */}
            <div className="layer-body" style={{
                flexGrow: 1,
                overflow: 'auto',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {layer.tables.length === 0 ? (
                    <div style={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#bbb',
                        fontSize: '14px',
                        padding: '20px'
                    }}>
                        No tables — this layer can be used as a standalone design element
                    </div>
                ) : (
                    layer.tables.map((table, tIdx) => (
                        <div key={table.id} style={{ borderBottom: tIdx < layer.tables.length - 1 ? '2px solid #e0e0e0' : 'none' }}>
                            {/* Per-table header bar */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 8px',
                                background: '#f0f2f5',
                                borderBottom: '1px solid #ddd',
                                fontSize: '13px'
                            }}>
                                {/* Table reorder buttons */}
                                <button
                                    onClick={() => handleReorderTable(table.id, 'up')}
                                    disabled={tIdx === 0}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: tIdx === 0 ? 'default' : 'pointer',
                                        fontSize: '11px',
                                        padding: '1px 3px',
                                        color: tIdx === 0 ? '#ddd' : '#666',
                                        lineHeight: 1
                                    }}
                                    title="Move table up"
                                >
                                    ▲
                                </button>
                                <button
                                    onClick={() => handleReorderTable(table.id, 'down')}
                                    disabled={tIdx === layer.tables.length - 1}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: tIdx === layer.tables.length - 1 ? 'default' : 'pointer',
                                        fontSize: '11px',
                                        padding: '1px 3px',
                                        color: tIdx === layer.tables.length - 1 ? '#ddd' : '#666',
                                        lineHeight: 1
                                    }}
                                    title="Move table down"
                                >
                                    ▼
                                </button>

                                {editingTableId === table.id ? (
                                    <input
                                        type="text"
                                        value={editTableTitle}
                                        onChange={(e) => setEditTableTitle(e.target.value)}
                                        onBlur={saveTableTitle}
                                        onKeyDown={(e) => e.key === 'Enter' && saveTableTitle()}
                                        autoFocus
                                        style={{
                                            fontWeight: 600,
                                            color: '#444',
                                            flexGrow: 1,
                                            border: 'none',
                                            background: 'transparent',
                                            outline: '1px solid #007bff',
                                            borderRadius: '2px',
                                            padding: '1px 4px',
                                            fontSize: '13px'
                                        }}
                                    />
                                ) : (
                                    <span
                                        onDoubleClick={() => {
                                            setEditingTableId(table.id);
                                            setEditTableTitle(table.title);
                                        }}
                                        style={{ fontWeight: 600, color: '#444', flexGrow: 1, cursor: 'text', userSelect: 'none' }}
                                        title="Double-click to rename"
                                    >
                                        {table.title}
                                    </span>
                                )}

                                {/* Delete table button */}
                                <button
                                    onClick={() => setDeleteTableId(table.id)}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#dc3545',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        padding: '1px 4px',
                                        lineHeight: 1
                                    }}
                                    title="Delete table"
                                >
                                    🗑️
                                </button>
                            </div>

                            <DynamicTable
                                tableData={table}
                                onUpdateTable={(updates) => handleUpdateTable(table.id, updates)}
                            />
                        </div>
                    ))
                )}

                {/* Add Table button */}
                {layer.tables.length < MAX_TABLES && (
                    <div style={{ padding: '8px', textAlign: 'center', borderTop: layer.tables.length > 0 ? '1px solid #eee' : 'none', position: 'relative', zIndex: 2 }}>
                        <button
                            onClick={handleAddTable}
                            style={{
                                background: '#007bff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 16px',
                                cursor: 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            + Add Table ({layer.tables.length}/{MAX_TABLES})
                        </button>
                    </div>
                )}
            </div>

            {/* Resize Handle */}
            <div className="resize-handle" style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '15px',
                height: '15px',
                cursor: 'se-resize',
                background: 'linear-gradient(135deg, transparent 50%, #999 50%)',
                zIndex: 10
            }} />

            {/* Delete Layer Confirmation Modal */}
            {showDeleteConfirm && (
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
                    onClick={() => setShowDeleteConfirm(false)}
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
                        <h3 style={{ margin: '0 0 20px 0' }}>Delete Layer?</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
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
                                    onRemoveLayer(layer.id);
                                    setShowDeleteConfirm(false);
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

            {/* Delete Table Confirmation Modal */}
            {deleteTableId && (
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
                    onClick={() => setDeleteTableId(null)}
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
                        <h3 style={{ margin: '0 0 20px 0' }}>Delete Table?</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                onClick={() => setDeleteTableId(null)}
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
                                onClick={() => handleRemoveTable(deleteTableId)}
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
