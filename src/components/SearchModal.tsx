import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { AppState } from '../types';

interface SearchResult {
    type: 'sidebarItem' | 'category' | 'layer' | 'table' | 'cell';
    label: string;
    breadcrumb: string;
    sidebarItemId: string;
    categoryId?: string;
    layerId?: string;
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    appState: AppState;
    onNavigate: (result: SearchResult) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, appState, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Focus input when modal appears
    const focusInput = useCallback(() => {
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    // When modal becomes visible, reset and focus
    useEffect(() => {
        if (isOpen) {
            focusInput();
        }
    }, [isOpen, focusInput]);

    // Build search index
    const results = useMemo((): SearchResult[] => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        const matches: SearchResult[] = [];

        for (const item of appState.sidebarItems) {
            if (item.title.toLowerCase().includes(q)) {
                matches.push({
                    type: 'sidebarItem',
                    label: item.title,
                    breadcrumb: 'Sidebar',
                    sidebarItemId: item.id,
                });
            }
            for (const cat of item.categories) {
                if (cat.title.toLowerCase().includes(q)) {
                    matches.push({
                        type: 'category',
                        label: cat.title,
                        breadcrumb: `${item.title}`,
                        sidebarItemId: item.id,
                        categoryId: cat.id,
                    });
                }
                for (const layer of cat.layers) {
                    if (layer.title.toLowerCase().includes(q)) {
                        matches.push({
                            type: 'layer',
                            label: layer.title,
                            breadcrumb: `${item.title} → ${cat.title}`,
                            sidebarItemId: item.id,
                            categoryId: cat.id,
                            layerId: layer.id,
                        });
                    }
                    for (const table of layer.tables) {
                        if (table.title.toLowerCase().includes(q)) {
                            matches.push({
                                type: 'table',
                                label: table.title,
                                breadcrumb: `${item.title} → ${cat.title} → ${layer.title}`,
                                sidebarItemId: item.id,
                                categoryId: cat.id,
                                layerId: layer.id,
                            });
                        }
                        // Search cell values
                        for (const row of table.rows) {
                            for (const col of table.columns) {
                                const cell = row.cells[col.id];
                                if (cell?.value && cell.value.toLowerCase().includes(q)) {
                                    matches.push({
                                        type: 'cell',
                                        label: `"${cell.value.length > 40 ? cell.value.slice(0, 40) + '…' : cell.value}"`,
                                        breadcrumb: `${item.title} → ${cat.title} → ${table.title}`,
                                        sidebarItemId: item.id,
                                        categoryId: cat.id,
                                        layerId: layer.id,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        // Limit results
        return matches.slice(0, 20);
    }, [query, appState]);

    // Clamp selected index
    const effectiveIndex = Math.min(selectedIndex, Math.max(0, results.length - 1));

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selected = listRef.current.children[effectiveIndex] as HTMLElement;
            selected?.scrollIntoView({ block: 'nearest' });
        }
    }, [effectiveIndex]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && results[effectiveIndex]) {
            e.preventDefault();
            onNavigate(results[effectiveIndex]);
            onClose();
        } else if (e.key === 'Escape') {
            onClose();
        }
    }, [results, effectiveIndex, onNavigate, onClose]);

    const typeIcons: Record<string, string> = {
        sidebarItem: '📁',
        category: '📂',
        layer: '📐',
        table: '📊',
        cell: '🔤',
    };

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
        >
            <div
                className="search-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="search-input-wrapper">
                    <span className="search-icon" aria-hidden="true">🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search items, categories, layers, tables, cells..."
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                        onKeyDown={handleKeyDown}
                        className="search-input"
                        aria-label="Search query"
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <kbd className="kbd" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}>ESC</kbd>
                </div>

                {query.trim() && (
                    <div className="search-results" ref={listRef} role="listbox" aria-label="Search results">
                        {results.length > 0 ? (
                            results.map((result, idx) => (
                                <div
                                    key={`${result.type}-${result.sidebarItemId}-${result.categoryId}-${result.layerId}-${idx}`}
                                    className={`search-result-item ${idx === effectiveIndex ? 'selected' : ''}`}
                                    onClick={() => { onNavigate(result); onClose(); }}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    role="option"
                                    aria-selected={idx === effectiveIndex}
                                >
                                    <span className="search-result-icon" aria-hidden="true">{typeIcons[result.type]}</span>
                                    <div className="search-result-content">
                                        <div className="search-result-label">{result.label}</div>
                                        <div className="search-result-breadcrumb">{result.breadcrumb}</div>
                                    </div>
                                    <span className="search-result-type">{result.type === 'sidebarItem' ? 'Item' : result.type.charAt(0).toUpperCase() + result.type.slice(1)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="search-no-results">
                                <span>No results for "{query}"</span>
                            </div>
                        )}
                    </div>
                )}

                {!query.trim() && (
                    <div className="search-hints">
                        <span>Search across all sidebar items, categories, layers, tables, and cell values</span>
                    </div>
                )}
            </div>
        </div>
    );
};
