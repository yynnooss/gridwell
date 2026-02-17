import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { TableData } from '../types';
import { X, Plus } from './Icons';

interface DynamicTableProps {
    tableData: TableData;
    onUpdateTable: (updates: Partial<TableData>) => void;
}

export const DynamicTable: React.FC<DynamicTableProps> = React.memo(({ tableData, onUpdateTable }) => {
    const [resizingCol, setResizingCol] = useState<string | null>(null);
    const [resizingRow, setResizingRow] = useState<string | null>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    const [editingCell, setEditingCell] = useState<{ rowId: string, colId: string } | null>(null);
    const [editValue, setEditValue] = useState('');

    const [editingColId, setEditingColId] = useState<string | null>(null);
    const [editColTitle, setEditColTitle] = useState('');

    const handleMouseDownCol = useCallback((e: React.MouseEvent, colId: string) => {
        setResizingCol(colId);
        e.preventDefault();
    }, []);

    const handleMouseDownRow = useCallback((e: React.MouseEvent, rowId: string) => {
        setResizingRow(rowId);
        e.preventDefault();
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (resizingCol) {
            const columnIndex = tableData.columns.findIndex(c => c.id === resizingCol);
            if (columnIndex !== -1) {
                const newColumns = [...tableData.columns];
                const currentWidth = newColumns[columnIndex].width || 100;
                const newWidth = Math.max(50, currentWidth + e.movementX);
                newColumns[columnIndex] = { ...newColumns[columnIndex], width: newWidth };
                onUpdateTable({ columns: newColumns });
            }
        } else if (resizingRow) {
            const rowIndex = tableData.rows.findIndex(r => r.id === resizingRow);
            if (rowIndex !== -1) {
                const newRows = [...tableData.rows];
                const currentHeight = newRows[rowIndex].height || 40;
                const newHeight = Math.max(30, currentHeight + e.movementY);
                newRows[rowIndex] = { ...newRows[rowIndex], height: newHeight };
                onUpdateTable({ rows: newRows });
            }
        }
    }, [resizingCol, resizingRow, tableData, onUpdateTable]);

    const handleMouseUp = useCallback(() => {
        setResizingCol(null);
        setResizingRow(null);
    }, []);

    useEffect(() => {
        if (resizingCol || resizingRow) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingCol, resizingRow, handleMouseMove, handleMouseUp]);

    const startEditing = useCallback((rowId: string, colId: string, value: string) => {
        setEditingCell({ rowId, colId });
        setEditValue(value);
    }, []);

    const saveEdit = useCallback(() => {
        if (editingCell) {
            const newRows = tableData.rows.map(row => {
                if (row.id === editingCell.rowId) {
                    return {
                        ...row,
                        cells: {
                            ...row.cells,
                            [editingCell.colId]: { ...row.cells[editingCell.colId], value: editValue }
                        }
                    };
                }
                return row;
            });
            onUpdateTable({ rows: newRows });
            setEditingCell(null);
        }
    }, [editingCell, editValue, tableData.rows, onUpdateTable]);

    const startEditingCol = useCallback((colId: string, title: string) => {
        setEditingColId(colId);
        setEditColTitle(title);
    }, []);

    const saveColTitle = useCallback(() => {
        if (editingColId && editColTitle.trim()) {
            const newColumns = tableData.columns.map(col => {
                if (col.id === editingColId) {
                    return { ...col, title: editColTitle.trim() };
                }
                return col;
            });
            onUpdateTable({ columns: newColumns });
        }
        setEditingColId(null);
    }, [editingColId, editColTitle, tableData.columns, onUpdateTable]);

    const addColumn = useCallback(() => {
        const newColId = `c${Date.now()}`;
        const newColumns = [...tableData.columns, { id: newColId, title: `${tableData.columns.length + 1}`, width: 100 }];
        const newRows = tableData.rows.map(row => ({
            ...row,
            cells: {
                ...row.cells,
                [newColId]: { id: `${newColId}${row.id}`, value: '' }
            }
        }));
        onUpdateTable({ columns: newColumns, rows: newRows });
    }, [tableData, onUpdateTable]);

    const addRow = useCallback(() => {
        const newRowId = `r${Date.now()}`;
        const newCells: Record<string, { id: string; value: string }> = {};
        tableData.columns.forEach(col => {
            newCells[col.id] = { id: `${col.id}${newRowId}`, value: '' };
        });
        const newRows = [...tableData.rows, { id: newRowId, cells: newCells, height: 40 }];
        onUpdateTable({ rows: newRows });
    }, [tableData, onUpdateTable]);

    const removeColumn = useCallback((colId: string) => {
        if (tableData.columns.length <= 1) return;
        const newColumns = tableData.columns.filter(c => c.id !== colId);
        const newRows = tableData.rows.map(row => {
            const newCells = { ...row.cells };
            delete newCells[colId];
            return { ...row, cells: newCells };
        });
        onUpdateTable({ columns: newColumns, rows: newRows });
    }, [tableData, onUpdateTable]);

    const removeRow = useCallback((rowId: string) => {
        if (tableData.rows.length <= 1) return;
        const newRows = tableData.rows.filter(r => r.id !== rowId);
        onUpdateTable({ rows: newRows });
    }, [tableData, onUpdateTable]);

    const headerBg = 'var(--color-surface-alt)';
    const borderColor = 'var(--color-border)';
    const cellBorder = `1px solid ${borderColor}`;

    return (
        <div className="dynamic-table-container" ref={tableRef} style={{ display: 'flex', flexDirection: 'column' }} role="region" aria-label={`Table: ${tableData.title}`}>
            {/* Toolbar */}
            <div className="table-toolbar flex-row" style={{ gap: '8px' }} role="toolbar" aria-label="Table structure controls">
                <button onClick={addColumn} aria-label="Add column" style={{ fontSize: '12px', padding: '3px 10px' }}>
                    <Plus size={11} style={{ marginRight: '3px', verticalAlign: '-2px' }} /> Col
                </button>
                <button onClick={addRow} aria-label="Add row" style={{ fontSize: '12px', padding: '3px 10px' }}>
                    <Plus size={11} style={{ marginRight: '3px', verticalAlign: '-2px' }} /> Row
                </button>
            </div>

            {/* Table Area */}
            <div style={{ overflow: 'auto', flexGrow: 1, position: 'relative' }} role="grid" aria-label={tableData.title}>
                <div style={{ display: 'flex', minWidth: 'fit-content' }} role="row">
                    {/* Corner */}
                    <div style={{ width: '40px', flexShrink: 0, borderRight: cellBorder, borderBottom: cellBorder, background: headerBg }} role="columnheader" aria-label="Row actions" />

                    {/* Column Headers */}
                    {tableData.columns.map(col => (
                        <div key={col.id} role="columnheader" className="table-col-header" style={{
                            width: col.width,
                            borderRight: cellBorder,
                            borderBottom: cellBorder,
                            padding: '5px 6px',
                            background: headerBg,
                            fontWeight: 600,
                            textAlign: 'center',
                            position: 'relative',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2px',
                            fontSize: '12px',
                            color: 'var(--color-text-secondary)',
                        }}>
                            {editingColId === col.id ? (
                                <input
                                    type="text"
                                    value={editColTitle}
                                    onChange={(e) => setEditColTitle(e.target.value)}
                                    onBlur={saveColTitle}
                                    onKeyDown={(e) => e.key === 'Enter' && saveColTitle()}
                                    autoFocus
                                    aria-label="Column title"
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        fontWeight: 600,
                                        textAlign: 'center',
                                        width: '100%',
                                        outline: '2px solid var(--color-primary)',
                                        borderRadius: '3px',
                                        padding: '1px 2px',
                                        color: 'var(--color-text)',
                                        fontSize: '12px',
                                    }}
                                />
                            ) : (
                                <span
                                    onDoubleClick={() => startEditingCol(col.id, col.title)}
                                    style={{ cursor: 'text', flexGrow: 1, userSelect: 'none' }}
                                    title="Double-click to rename"
                                >
                                    {col.title}
                                </span>
                            )}
                            {tableData.columns.length > 1 && (
                                <button
                                    className="btn-icon btn-icon-danger col-delete-btn"
                                    onClick={(e) => { e.stopPropagation(); removeColumn(col.id); }}
                                    title="Delete column"
                                    aria-label={`Delete column ${col.title}`}
                                >
                                    <X size={12} />
                                </button>
                            )}
                            <div
                                className="col-resizer"
                                onMouseDown={(e) => handleMouseDownCol(e, col.id)}
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: '5px',
                                    cursor: 'col-resize',
                                    zIndex: 1,
                                }}
                                role="separator"
                                aria-label={`Resize column ${col.title}`}
                            />
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {tableData.rows.map((row, rIdx) => (
                    <div key={row.id} style={{ display: 'flex', minWidth: 'fit-content' }} role="row">
                        {/* Row Header */}
                        <div role="rowheader" className="table-row-header" style={{
                            width: '40px',
                            height: row.height,
                            borderRight: cellBorder,
                            borderBottom: cellBorder,
                            background: headerBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            position: 'relative',
                            fontSize: '11px',
                            color: 'var(--color-text-muted)',
                        }}>
                            {tableData.rows.length > 1 ? (
                                <button
                                    className="btn-icon btn-icon-danger row-delete-btn"
                                    onClick={() => removeRow(row.id)}
                                    title="Delete row"
                                    aria-label={`Delete row ${rIdx + 1}`}
                                >
                                    <X size={12} />
                                </button>
                            ) : (
                                <span>{rIdx + 1}</span>
                            )}
                            <div
                                className="row-resizer"
                                onMouseDown={(e) => handleMouseDownRow(e, row.id)}
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    height: '5px',
                                    cursor: 'row-resize',
                                    zIndex: 1,
                                }}
                                role="separator"
                                aria-label={`Resize row ${rIdx + 1}`}
                            />
                        </div>

                        {/* Data Cells */}
                        {tableData.columns.map(col => {
                            const cell = row.cells[col.id];
                            const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;

                            return (
                                <div key={col.id} role="gridcell" style={{
                                    width: col.width,
                                    height: row.height,
                                    borderRight: cellBorder,
                                    borderBottom: cellBorder,
                                    padding: '4px 6px',
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'text',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text)',
                                    fontSize: '13px',
                                    transition: 'background var(--transition-fast)',
                                }}
                                    onClick={() => !isEditing && startEditing(row.id, col.id, cell?.value || '')}
                                    onMouseEnter={(e) => { if (!isEditing) e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface)'; }}
                                    tabIndex={0}
                                    aria-label={`Cell ${col.title}, row ${rIdx + 1}`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isEditing) {
                                            startEditing(row.id, col.id, cell?.value || '');
                                        }
                                    }}
                                >
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={saveEdit}
                                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                            autoFocus
                                            aria-label={`Edit cell ${col.title}, row ${rIdx + 1}`}
                                            style={{
                                                border: 'none',
                                                width: '100%',
                                                outline: 'none',
                                                padding: 0,
                                                background: 'transparent',
                                                color: 'var(--color-text)',
                                                fontSize: '13px',
                                            }}
                                        />
                                    ) : (
                                        <div style={{ width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {cell?.value}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
});

DynamicTable.displayName = 'DynamicTable';
