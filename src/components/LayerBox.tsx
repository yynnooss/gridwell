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

const deepCloneTable = (table: TableData): TableData => {
    const newId = crypto.randomUUID();
    return {
        ...structuredClone(table),
        id: newId,
        title: `${table.title} (copy)`,
        rows: table.rows.map(row => ({
            ...structuredClone(row),
            id: `r${crypto.randomUUID().slice(0, 8)}_${newId}`,
        })),
    };
};

interface LayerBoxProps {
    layer: Layer;
    onUpdateLayer: (id: string, updates: Partial<Layer> | ((prev: Layer) => Partial<Layer>)) => void;
    onRemoveLayer: (id: string) => void;
    onDuplicateLayer: (layerId: string) => void;
    index: number;
    totalLayers: number;
    onReorderLayer: (layerId: string, direction: 'up' | 'down') => void;
}

export const LayerBox: React.FC<LayerBoxProps> = React.memo(({ layer, onUpdateLayer, onRemoveLayer, onDuplicateLayer, index, totalLayers, onReorderLayer }) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const descRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTableId, setDeleteTableId] = useState<string | null>(null);

    const [editingTableId, setEditingTableId] = useState<string | null>(null);
    const [editTableTitle, setEditTableTitle] = useState('');

    const [descFocused, setDescFocused] = useState(false);

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
        descRef.current?.focus();
        handleDescInput();
    };

    const saveTableTitle = () => {
        if (editingTableId && editTableTitle.trim()) {
            handleUpdateTable(editingTableId, { title: editTableTitle.trim() });
        }
        setEditingTableId(null);
    };

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
    const handleAddTable = useCallback(() => {
        if (layer.tables.length >= MAX_TABLES) return;
        const newTable = createDefaultTable();
        onUpdateLayer(layer.id, prev => ({ tables: [...prev.tables, newTable] }));
    }, [layer.id, layer.tables.length, onUpdateLayer]);

    const handleDuplicateTable = useCallback((tableId: string) => {
        if (layer.tables.length >= MAX_TABLES) return;
        onUpdateLayer(layer.id, prev => {
            const table = prev.tables.find(t => t.id === tableId);
            if (!table) return {};
            const cloned = deepCloneTable(table);
            const idx = prev.tables.findIndex(t => t.id === tableId);
            const newTables = [...prev.tables];
            newTables.splice(idx + 1, 0, cloned);
            return { tables: newTables };
        });
    }, [layer.id, layer.tables.length, onUpdateLayer]);

    const handleRemoveTable = useCallback((tableId: string) => {
        onUpdateLayer(layer.id, prev => ({ tables: prev.tables.filter(t => t.id !== tableId) }));
        setDeleteTableId(null);
    }, [layer.id, onUpdateLayer]);

    const handleUpdateTable = useCallback((tableId: string, updates: Partial<TableData>) => {
        onUpdateLayer(layer.id, prev => ({
            tables: prev.tables.map(t => t.id === tableId ? { ...t, ...updates } : t)
        }));
    }, [layer.id, onUpdateLayer]);

    const handleReorderTable = useCallback((tableId: string, direction: 'up' | 'down') => {
        onUpdateLayer(layer.id, prev => {
            const tables = [...prev.tables];
            const idx = tables.findIndex(t => t.id === tableId);
            if (idx === -1) return {};
            const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (swapIdx < 0 || swapIdx >= tables.length) return {};
            [tables[idx], tables[swapIdx]] = [tables[swapIdx], tables[idx]];
            return { tables };
        });
    }, [layer.id, onUpdateLayer]);

    return (
        <article
            ref={boxRef}
            className="layer-box"
            style={{
                width: layer.width || 650,
                height: layer.height || 420,
                marginBottom: '20px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
            }}
            aria-label={`Layer: ${layer.title}`}
        >
            {/* Layer Header */}
            <header className="layer-header" style={{ padding: '12px 14px', position: 'relative' }}>
                <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    {/* Reorder buttons */}
                    <div className="flex-row" style={{ gap: '2px', flexShrink: 0, marginRight: '10px' }} role="group" aria-label="Reorder layer">
                        <button
                            className="btn-icon"
                            onClick={() => onReorderLayer(layer.id, 'up')}
                            disabled={index === 0}
                            title="Move up"
                            aria-label="Move layer up"
                            style={{ fontSize: '12px' }}
                        >
                            ▲
                        </button>
                        <button
                            className="btn-icon"
                            onClick={() => onReorderLayer(layer.id, 'down')}
                            disabled={index === totalLayers - 1}
                            title="Move down"
                            aria-label="Move layer down"
                            style={{ fontSize: '12px' }}
                        >
                            ▼
                        </button>
                    </div>

                    <input
                        type="text"
                        value={layer.title}
                        onChange={(e) => onUpdateLayer(layer.id, { title: e.target.value })}
                        style={{
                            fontWeight: 600,
                            border: 'none',
                            background: 'transparent',
                            fontSize: '15px',
                            flexGrow: 1,
                            minWidth: 0,
                            color: 'var(--color-text)',
                            outline: 'none',
                            padding: 0,
                        }}
                        placeholder="Layer Title"
                        aria-label="Layer title"
                    />

                    <div className="flex-row" style={{ gap: '2px', flexShrink: 0 }}>
                        <button
                            className="btn-icon"
                            onClick={() => onDuplicateLayer(layer.id)}
                            title="Duplicate Layer"
                            aria-label="Duplicate layer"
                            style={{ fontSize: '14px' }}
                        >
                            📋
                        </button>
                        <button
                            className="btn-icon btn-icon-danger"
                            onClick={() => setShowDeleteConfirm(true)}
                            title="Remove Layer"
                            aria-label="Remove layer"
                        >
                            🗑️
                        </button>
                    </div>
                </div>

                {/* Rich Text Toolbar */}
                <div className="flex-row" style={{ gap: '4px', marginBottom: '6px' }} role="toolbar" aria-label="Text formatting">
                    <button
                        className="btn-ghost"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => execFormat('bold')}
                        title="Bold"
                        aria-label="Bold"
                        style={{ fontWeight: 700, fontSize: '12px', padding: '2px 8px' }}
                    >
                        B
                    </button>
                    <button
                        className="btn-ghost"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => execFormat('italic')}
                        title="Italic"
                        aria-label="Italic"
                        style={{ fontStyle: 'italic', fontSize: '12px', padding: '2px 8px' }}
                    >
                        I
                    </button>
                </div>

                {/* Description */}
                <div
                    ref={descRef}
                    contentEditable
                    onInput={handleDescInput}
                    onFocus={() => setDescFocused(true)}
                    onBlur={() => setDescFocused(false)}
                    style={{
                        width: '100%',
                        minHeight: '36px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '13px',
                        color: 'var(--color-text-secondary)',
                        outline: 'none',
                        lineHeight: 1.6,
                    }}
                    data-placeholder="Layer description..."
                    role="textbox"
                    aria-label="Layer description"
                    aria-multiline="true"
                />
            </header>

            {/* Tables Body */}
            <div className="layer-body" style={{
                flexGrow: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {layer.tables.length === 0 ? (
                    <div className="empty-state" style={{ flexGrow: 1, padding: '16px' }}>
                        <div style={{ fontSize: '13px' }}>No tables — standalone design element</div>
                    </div>
                ) : (
                    layer.tables.map((table, tIdx) => (
                        <div key={table.id} style={{ borderBottom: tIdx < layer.tables.length - 1 ? '2px solid var(--color-border)' : 'none' }}>
                            {/* Table header bar */}
                            <div className="table-toolbar flex-row" style={{ gap: '6px' }}>
                                <button
                                    className="btn-icon"
                                    onClick={() => handleReorderTable(table.id, 'up')}
                                    disabled={tIdx === 0}
                                    title="Move table up"
                                    aria-label="Move table up"
                                    style={{ fontSize: '10px' }}
                                >
                                    ▲
                                </button>
                                <button
                                    className="btn-icon"
                                    onClick={() => handleReorderTable(table.id, 'down')}
                                    disabled={tIdx === layer.tables.length - 1}
                                    title="Move table down"
                                    aria-label="Move table down"
                                    style={{ fontSize: '10px' }}
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
                                        aria-label="Table title"
                                        style={{
                                            fontWeight: 600,
                                            flexGrow: 1,
                                            border: 'none',
                                            background: 'transparent',
                                            outline: '2px solid var(--color-primary)',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '2px 6px',
                                            fontSize: '13px',
                                            color: 'var(--color-text)',
                                        }}
                                    />
                                ) : (
                                    <span
                                        onDoubleClick={() => {
                                            setEditingTableId(table.id);
                                            setEditTableTitle(table.title);
                                        }}
                                        style={{ fontWeight: 600, color: 'var(--color-text-secondary)', flexGrow: 1, cursor: 'text', userSelect: 'none', fontSize: '13px' }}
                                        title="Double-click to rename"
                                    >
                                        {table.title}
                                    </span>
                                )}

                                <button
                                    className="btn-icon"
                                    onClick={() => handleDuplicateTable(table.id)}
                                    title="Duplicate table"
                                    aria-label="Duplicate table"
                                    style={{ fontSize: '12px' }}
                                >
                                    📋
                                </button>
                                <button
                                    className="btn-icon btn-icon-danger"
                                    onClick={() => setDeleteTableId(table.id)}
                                    title="Delete table"
                                    aria-label="Delete table"
                                    style={{ fontSize: '13px' }}
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

                {/* Add Table */}
                {layer.tables.length < MAX_TABLES && (
                    <div style={{ padding: '10px', textAlign: 'center', borderTop: layer.tables.length > 0 ? '1px solid var(--color-border)' : 'none', position: 'relative', zIndex: 2 }}>
                        <button className="btn-primary" onClick={handleAddTable} aria-label="Add new table" style={{ fontSize: '12px', padding: '6px 16px' }}>
                            + Add Table ({layer.tables.length}/{MAX_TABLES})
                        </button>
                    </div>
                )}
            </div>

            {/* Resize Handle */}
            <div className="resize-handle" style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '16px',
                height: '16px',
                cursor: 'se-resize',
                background: 'linear-gradient(135deg, transparent 50%, var(--color-text-muted) 50%)',
                borderRadius: '0 0 var(--radius-lg) 0',
                opacity: 0.4,
                zIndex: 10,
            }} role="separator" aria-label="Resize layer" />

            {/* Delete Layer Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)} role="dialog" aria-modal="true" aria-label="Delete layer confirmation">
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '360px' }}>
                        <h3>Delete Layer "{layer.title}"?</h3>
                        <p>This will permanently delete this layer and all its tables.</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button
                                className="btn-danger"
                                onClick={() => {
                                    onRemoveLayer(layer.id);
                                    setShowDeleteConfirm(false);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Table Modal */}
            {deleteTableId && (
                <div className="modal-overlay" onClick={() => setDeleteTableId(null)} role="dialog" aria-modal="true" aria-label="Delete table confirmation">
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '360px' }}>
                        <h3>Delete Table?</h3>
                        <p>This will permanently delete this table and all its data.</p>
                        <div className="modal-actions">
                            <button onClick={() => setDeleteTableId(null)}>Cancel</button>
                            <button className="btn-danger" onClick={() => handleRemoveTable(deleteTableId)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
});

LayerBox.displayName = 'LayerBox';
