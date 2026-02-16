import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Category } from '../types';

interface CategorySelectorProps {
    categories: Category[];
    activeCategoryId: string | null;
    onSelectCategory: (id: string) => void;
    onAddCategory: (name: string) => void;
    onUpdateCategory: (id: string, newTitle: string) => void;
    onDeleteCategory: (id: string) => void;
    hasUnsavedChanges: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = React.memo(({
    categories,
    activeCategoryId,
    onSelectCategory,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
    hasUnsavedChanges,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const [pendingSwitchId, setPendingSwitchId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const filteredCategories = useMemo(() => {
        return categories.filter(cat =>
            cat.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [categories, searchTerm]);

    const activeCategory = categories.find(c => c.id === activeCategoryId);
    const pendingCategory = categories.find(c => c.id === pendingSwitchId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectAttempt = (category: Category) => {
        if (category.id === activeCategoryId) {
            setIsOpen(false);
            return;
        }
        if (hasUnsavedChanges) {
            setPendingSwitchId(category.id);
            setIsOpen(false);
        } else {
            onSelectCategory(category.id);
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    const confirmSwitch = () => {
        if (pendingSwitchId) {
            onSelectCategory(pendingSwitchId);
            setPendingSwitchId(null);
            setSearchTerm('');
        }
    };

    const startEditing = () => {
        if (activeCategory) {
            setEditTitle(activeCategory.title);
            setIsEditing(true);
        }
    };

    const saveTitle = () => {
        if (activeCategoryId && editTitle.trim()) {
            onUpdateCategory(activeCategoryId, editTitle);
        }
        setIsEditing(false);
    };

    const handleOpenAddModal = () => {
        setNewCategoryName('');
        setShowAddModal(true);
    };

    const handleDeploy = () => {
        if (newCategoryName.trim()) {
            onAddCategory(newCategoryName.trim());
            setShowAddModal(false);
            setNewCategoryName('');
        }
    };

    const handleCancelAdd = () => {
        setShowAddModal(false);
        setNewCategoryName('');
    };

    return (
        <div className="category-selector" role="region" aria-label="Category management">
            <div className="flex-row" style={{ gap: '10px' }}>

                {/* Custom Dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative', width: '260px' }}>
                    <div
                        onClick={() => setIsOpen(!isOpen)}
                        role="combobox"
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                        aria-label="Select category"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(!isOpen); } }}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-surface)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: 'var(--color-text)',
                            fontSize: '14px',
                            transition: 'border-color var(--transition-fast)',
                        }}
                    >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {activeCategory?.title || 'Select Category'}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginLeft: '8px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }} aria-hidden="true">▼</span>
                    </div>

                    {isOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-surface)',
                            zIndex: 1000,
                            marginTop: '4px',
                            boxShadow: 'var(--shadow-lg)',
                            overflow: 'hidden',
                            animation: 'fadeIn 0.15s ease',
                        }}>
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: 'none',
                                    borderBottom: '1px solid var(--color-border)',
                                    borderRadius: 0,
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text)',
                                    fontSize: '13px',
                                }}
                            />
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }} role="listbox" aria-label="Categories">
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map(cat => (
                                        <div
                                            key={cat.id}
                                            onClick={() => handleSelectAttempt(cat)}
                                            style={{
                                                padding: '9px 12px',
                                                cursor: 'pointer',
                                                background: cat.id === activeCategoryId ? 'var(--color-primary-light)' : 'transparent',
                                                color: cat.id === activeCategoryId ? 'var(--color-primary)' : 'var(--color-text)',
                                                fontWeight: cat.id === activeCategoryId ? 600 : 400,
                                                fontSize: '13px',
                                                transition: 'background var(--transition-fast)',
                                            }}
                                            onMouseEnter={(e) => { if (cat.id !== activeCategoryId) e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = cat.id === activeCategoryId ? 'var(--color-primary-light)' : 'transparent'; }}
                                        >
                                            {cat.title}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '12px', color: 'var(--color-text-muted)', textAlign: 'center', fontSize: '13px' }}>No results</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-row" style={{ gap: '6px', marginLeft: 'auto' }}>
                    {activeCategoryId && (
                        <>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onBlur={saveTitle}
                                    onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                                    autoFocus
                                    style={{ width: '160px' }}
                                />
                            ) : (
                                <button className="btn-ghost" onClick={startEditing} title="Rename Category" aria-label="Rename category">✎ Rename</button>
                            )}
                            <button className="btn-ghost btn-icon-danger" onClick={() => setShowDeleteConfirm(true)} title="Delete Category" aria-label="Delete category" style={{ color: 'var(--color-danger)' }}>
                                🗑️
                            </button>
                        </>
                    )}
                    <button className="btn-primary" onClick={handleOpenAddModal} aria-label="Add new category">+ Add Category</button>
                </div>
            </div>

            {/* Unsaved Changes Warning */}
            {pendingSwitchId && (
                <div className="modal-overlay" onClick={() => setPendingSwitchId(null)} role="dialog" aria-modal="true" aria-label="Unsaved changes warning">
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '420px' }}>
                        <h3>Unsaved Changes</h3>
                        <p>
                            Switching from "<strong>{activeCategory?.title || 'None'}</strong>" to "<strong>{pendingCategory?.title}</strong>" will not discard your changes, but they won't be saved to a layout until you click "Save Current Layout".
                        </p>
                        <p style={{ marginTop: '12px' }}>Continue switching?</p>
                        <div className="modal-actions">
                            <button onClick={() => setPendingSwitchId(null)}>Cancel</button>
                            <button className="btn-primary" onClick={confirmSwitch}>Continue</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)} role="dialog" aria-modal="true" aria-label="Delete category confirmation">
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '360px' }}>
                        <h3>Delete Category "{activeCategory?.title}"?</h3>
                        <p>This will permanently delete this category and all its layers and tables.</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button
                                className="btn-danger"
                                onClick={() => {
                                    if (activeCategoryId) onDeleteCategory(activeCategoryId);
                                    setShowDeleteConfirm(false);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Category Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={handleCancelAdd} role="dialog" aria-modal="true" aria-label="Add category">
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '400px' }}>
                        <h3>Add New Category</h3>
                        <input
                            type="text"
                            placeholder="Category name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleDeploy()}
                            autoFocus
                            style={{ marginBottom: '20px' }}
                        />
                        <div className="modal-actions">
                            <button onClick={handleCancelAdd}>Cancel</button>
                            <button className="btn-primary" onClick={handleDeploy}>Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

CategorySelector.displayName = 'CategorySelector';
