import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { TableData } from '../types';

interface DynamicTableProps {
    tableData: TableData;
    onUpdateTable: (updates: Partial<TableData>) => void;
}

export const DynamicTable: React.FC<DynamicTableProps> = ({ tableData, onUpdateTable }) => {
    // State for resizing
    const [resizingCol, setResizingCol] = useState<string | null>(null);
    const [resizingRow, setResizingRow] = useState<string | null>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    // Editing State
    const [editingCell, setEditingCell] = useState<{ rowId: string, colId: string } | null>(null);
    const [editValue, setEditValue] = useState('');

    // Column Header Editing State
    const [editingColId, setEditingColId] = useState<string | null>(null);
    const [editColTitle, setEditColTitle] = useState('');

    // --- Resizing Logic ---
    const handleMouseDownCol = (e: React.MouseEvent, colId: string) => {
        setResizingCol(colId);
        e.preventDefault();
    };

    const handleMouseDownRow = (e: React.MouseEvent, rowId: string) => {
        setResizingRow(rowId);
        e.preventDefault();
    };

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


    // --- Cell Editing Logic ---
    const startEditing = (rowId: string, colId: string, value: string) => {
        setEditingCell({ rowId, colId });
        setEditValue(value);
    };

    const saveEdit = () => {
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
    };

    // --- Column Header Editing ---
    const startEditingCol = (colId: string, title: string) => {
        setEditingColId(colId);
        setEditColTitle(title);
    };

    const saveColTitle = () => {
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
    };

    // --- Structure Modification ---
    const addColumn = () => {
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
    };

    const addRow = () => {
        const newRowId = `r${Date.now()}`;
        const newCells: Record<string, { id: string; value: string }> = {};
        tableData.columns.forEach(col => {
            newCells[col.id] = { id: `${col.id}${newRowId}`, value: '' };
        });
        const newRows = [...tableData.rows, { id: newRowId, cells: newCells, height: 40 }];
        onUpdateTable({ rows: newRows });
    };

    const removeColumn = (colId: string) => {
        if (tableData.columns.length <= 1) return; // Keep at least 1 column
        const newColumns = tableData.columns.filter(c => c.id !== colId);
        const newRows = tableData.rows.map(row => {
            const newCells = { ...row.cells };
            delete newCells[colId];
            return { ...row, cells: newCells };
        });
        onUpdateTable({ columns: newColumns, rows: newRows });
    };

    const removeRow = (rowId: string) => {
        if (tableData.rows.length <= 1) return; // Keep at least 1 row
        const newRows = tableData.rows.filter(r => r.id !== rowId);
        onUpdateTable({ rows: newRows });
    };

    return (
        <div className="dynamic-table-container" ref={tableRef} style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Toolbar */}
            <div className="table-toolbar" style={{ padding: '5px', borderBottom: '1px solid #ddd', display: 'flex', gap: '10px' }}>
                <button onClick={addColumn}>+ Col</button>
                <button onClick={addRow}>+ Row</button>
            </div>

            {/* Table Area */}
            <div style={{ overflow: 'auto', flexGrow: 1, position: 'relative' }}>
                <div style={{ display: 'flex', minWidth: 'fit-content' }}>
                    {/* Corner */}
                    <div style={{ width: '40px', flexShrink: 0, borderRight: '1px solid #ddd', borderBottom: '1px solid #ddd', background: '#f8f9fa' }}></div>

                    {/* Headers */}
                    {tableData.columns.map(col => (
                        <div key={col.id} style={{
                            width: col.width,
                            borderRight: '1px solid #ddd',
                            borderBottom: '1px solid #ddd',
                            padding: '4px 5px',
                            background: '#f8f9fa',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            position: 'relative',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2px'
                        }}>
                            {editingColId === col.id ? (
                                <input
                                    type="text"
                                    value={editColTitle}
                                    onChange={(e) => setEditColTitle(e.target.value)}
                                    onBlur={saveColTitle}
                                    onKeyDown={(e) => e.key === 'Enter' && saveColTitle()}
                                    autoFocus
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        width: '100%',
                                        outline: '1px solid #007bff',
                                        borderRadius: '2px',
                                        padding: '1px 2px'
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
                            {/* Delete column button */}
                            {tableData.columns.length > 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeColumn(col.id); }}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#ccc',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        padding: '0 2px',
                                        lineHeight: 1,
                                        flexShrink: 0
                                    }}
                                    title="Delete column"
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#dc3545'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#ccc'}
                                >
                                    ×
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
                                    zIndex: 1
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {tableData.rows.map(row => (
                    <div key={row.id} style={{ display: 'flex', minWidth: 'fit-content' }}>
                        {/* Row Header/Index */}
                        <div style={{
                            width: '40px',
                            height: row.height,
                            borderRight: '1px solid #ddd',
                            borderBottom: '1px solid #ddd',
                            background: '#f8f9fa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            position: 'relative'
                        }}>
                            {/* Delete row button */}
                            {tableData.rows.length > 1 && (
                                <button
                                    onClick={() => removeRow(row.id)}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#ccc',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        padding: 0,
                                        lineHeight: 1
                                    }}
                                    title="Delete row"
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#dc3545'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#ccc'}
                                >
                                    ×
                                </button>
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
                                    zIndex: 1
                                }}
                            />
                        </div>

                        {/* Cells */}
                        {tableData.columns.map(col => {
                            const cell = row.cells[col.id];
                            const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;

                            return (
                                <div key={col.id} style={{
                                    width: col.width,
                                    height: row.height,
                                    borderRight: '1px solid #ddd',
                                    borderBottom: '1px solid #ddd',
                                    padding: '5px',
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                    onClick={() => !isEditing && startEditing(row.id, col.id, cell?.value || '')}
                                >
                                    {isEditing ? (
                                        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={saveEdit}
                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                                autoFocus
                                                style={{ border: 'none', width: '100%', outline: 'none', padding: 0, background: 'transparent' }}
                                            />
                                        </div>
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
};
