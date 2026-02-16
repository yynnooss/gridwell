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

export const CategorySelector: React.FC<CategorySelectorProps> = ({
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

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');

    // Add Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Switch Confirmation Modal State
    const [pendingSwitchId, setPendingSwitchId] = useState<string | null>(null);

    // Delete Confirmation Modal State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const filteredCategories = useMemo(() => {
        return categories.filter(cat =>
            cat.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [categories, searchTerm]);

    const activeCategory = categories.find(c => c.id === activeCategoryId);
    const pendingCategory = categories.find(c => c.id === pendingSwitchId);

    // Close dropdown when clicking outside
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
            // Show custom confirmation modal
            setPendingSwitchId(category.id);
            setIsOpen(false);
        } else {
            // No unsaved changes — switch instantly
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
        <div className="category-selector" style={{ padding: '10px 20px', borderBottom: '1px solid #ddd', background: '#f8f9fa' }}>
            <div className="flex-row" style={{ gap: '10px', alignItems: 'center' }}>

                {/* Custom Dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative', width: '250px' }}>
                    {/* Trigger */}
                    <div
                        onClick={() => setIsOpen(!isOpen)}
                        style={{
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            background: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <span>{activeCategory?.title || 'Select Category'}</span>
                        <span style={{ fontSize: '12px' }}>▼</span>
                    </div>

                    {/* Dropdown Content */}
                    {isOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            background: '#fff',
                            zIndex: 1000,
                            marginTop: '4px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: 'none',
                                    borderBottom: '1px solid #eee',
                                    outline: 'none'
                                }}
                            />
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map(cat => (
                                        <div
                                            key={cat.id}
                                            onClick={() => handleSelectAttempt(cat)}
                                            style={{
                                                padding: '8px',
                                                cursor: 'pointer',
                                                background: cat.id === activeCategoryId ? '#f0f8ff' : 'transparent',
                                                borderBottom: '1px solid #f9f9f9'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = cat.id === activeCategoryId ? '#f0f8ff' : 'transparent'}
                                        >
                                            {cat.title}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '8px', color: '#999', textAlign: 'center' }}>No results</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-row" style={{ gap: '5px', marginLeft: 'auto' }}>
                    {activeCategoryId && (
                        <>
                            {isEditing ? (
                                <div className="flex-row" style={{ gap: '5px' }}>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onBlur={saveTitle}
                                        onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <button onClick={startEditing} title="Edit Category">✎</button>
                            )}
                            <button onClick={() => setShowDeleteConfirm(true)} title="Delete Category" style={{ color: 'red' }}>🗑️</button>
                        </>
                    )}
                    <button onClick={handleOpenAddModal} title="Add Category">[+] Add</button>
                </div>
            </div>

            {/* Unsaved Changes Warning Modal (category switch) */}
            {pendingSwitchId && (
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
                    onClick={() => setPendingSwitchId(null)}
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
                            You have unsaved changes. Switching from "<strong>{activeCategory?.title || 'None'}</strong>" to "<strong>{pendingCategory?.title}</strong>" will not discard your changes, but they won't be saved to a layout until you click "Save Current Layout".
                        </p>
                        <p style={{ margin: '0 0 20px 0', color: '#555' }}>Continue switching?</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                onClick={() => setPendingSwitchId(null)}
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
                                onClick={confirmSwitch}
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

            {/* Delete Category Confirmation Modal */}
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
                        <h3 style={{ margin: '0 0 20px 0' }}>Delete Category?</h3>
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
                                    if (activeCategoryId) {
                                        onDeleteCategory(activeCategoryId);
                                    }
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

            {/* Add Category Modal */}
            {showAddModal && (
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
                    onClick={handleCancelAdd}
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
                        <h3 style={{ margin: '0 0 16px 0' }}>Add New Category</h3>
                        <input
                            type="text"
                            placeholder="Category name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleDeploy()}
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
                                onClick={handleCancelAdd}
                                style={{
                                    padding: '8px 20px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    background: '#f8f9fa',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeploy}
                                style={{
                                    padding: '8px 20px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    background: '#007bff',
                                    color: '#fff',
                                    cursor: 'pointer'
                                }}
                            >
                                Deploy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
