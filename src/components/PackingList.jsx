import { useState, useMemo } from 'react';
import { usePackingList } from '../hooks/usePackingList';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './PackingList.css';

export default function PackingList() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    items,
    settings,
    shareToken,
    loading,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    resetAllChecks,
    updateSettings,
    generateShareToken,
    revokeShareToken
  } = usePackingList();

  const [selectedTripType, setSelectedTripType] = useState('');
  const [quickAddValue, setQuickAddValue] = useState('');
  const [categoryInputs, setCategoryInputs] = useState({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverCategory, setDragOverCategory] = useState(null);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {};
    settings.categories.forEach(cat => {
      groups[cat] = [];
    });
    // Add Uncategorized group
    groups['Uncategorized'] = [];

    items
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(item => {
        if (groups[item.category]) {
          groups[item.category].push(item);
        } else {
          groups['Uncategorized'].push(item);
        }
      });

    return groups;
  }, [items, settings.categories]);

  // Check if item matches selected trip type filter
  const itemMatchesFilter = (item) => {
    if (!selectedTripType) return true;
    if (item.tripTypes.length === 0) return true;
    return item.tripTypes.includes(selectedTripType);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddValue.trim()) return;
    await addItem(quickAddValue.trim(), 'Uncategorized', []);
    setQuickAddValue('');
  };

  const handleCategoryAdd = async (category, e) => {
    e.preventDefault();
    const value = categoryInputs[category];
    if (!value?.trim()) return;
    await addItem(value.trim(), category, []);
    setCategoryInputs(prev => ({ ...prev, [category]: '' }));
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    if (settings.categories.includes(newCategoryName.trim())) return;
    await updateSettings({
      ...settings,
      categories: [...settings.categories, newCategoryName.trim()]
    });
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const handleDeleteCategory = async (category) => {
    if (!confirm(`Delete "${category}" category? Items will become uncategorized.`)) return;
    await updateSettings({
      ...settings,
      categories: settings.categories.filter(c => c !== category)
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, category) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCategory(category);
  };

  const handleDragLeave = () => {
    setDragOverCategory(null);
  };

  const handleDrop = async (e, category) => {
    e.preventDefault();
    setDragOverCategory(null);
    if (draggedItem && draggedItem.category !== category) {
      await updateItem(draggedItem.id, { category });
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverCategory(null);
  };

  const handleShare = async () => {
    if (shareToken) {
      await navigator.clipboard.writeText(
        `${window.location.origin}${window.location.pathname}#/share/${shareToken}`
      );
      alert('Share link copied to clipboard!');
    } else {
      const token = await generateShareToken();
      await navigator.clipboard.writeText(
        `${window.location.origin}${window.location.pathname}#/share/${token}`
      );
      alert('Share link created and copied to clipboard!');
    }
  };

  const handleRevokeShare = async () => {
    if (confirm('Revoke share link? Anyone with the current link will lose access.')) {
      await revokeShareToken();
    }
  };

  const checkedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const allCategories = [...settings.categories];
  if (groupedItems['Uncategorized']?.length > 0) {
    allCategories.push('Uncategorized');
  }

  return (
    <div className="packing-list">
      <header className="header">
        <div className="header-top">
          <h1>Packing List</h1>
          <div className="header-actions">
            <button onClick={toggleTheme} className="icon-btn" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
                </svg>
              )}
            </button>
            <button onClick={logout} className="icon-btn" title="Sign out">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: totalCount ? `${(checkedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>
        <div className="progress-text">{checkedCount} / {totalCount} packed</div>

        <div className="controls">
          <form onSubmit={handleQuickAdd} className="quick-add-form">
            <input
              type="text"
              placeholder="Quick add item..."
              value={quickAddValue}
              onChange={(e) => setQuickAddValue(e.target.value)}
              className="quick-add-input"
            />
            <button type="submit" className="btn primary">Add</button>
          </form>
          <select
            value={selectedTripType}
            onChange={(e) => setSelectedTripType(e.target.value)}
            className="filter-select"
          >
            <option value="">All trips</option>
            {settings.tripTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="action-buttons">
          <button onClick={resetAllChecks} className="btn secondary">
            Reset All
          </button>
          <button onClick={handleShare} className="btn secondary">
            Share
          </button>
          {shareToken && (
            <button onClick={handleRevokeShare} className="btn danger">
              Revoke Link
            </button>
          )}
        </div>
      </header>

      <main className="items-container">
        {allCategories.map(category => {
          const categoryItems = groupedItems[category] || [];
          const isUncategorized = category === 'Uncategorized';
          const isDragOver = dragOverCategory === category;

          return (
            <section
              key={category}
              className={`category-section ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, category)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, category)}
            >
              <div className="category-header">
                <h2 className="category-title">{category}</h2>
                {!isUncategorized && (
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="category-delete-btn"
                    title="Delete category"
                  >
                    ×
                  </button>
                )}
              </div>

              <ul className="items-list">
                {categoryItems.map(item => {
                  const matches = itemMatchesFilter(item);
                  return (
                    <li
                      key={item.id}
                      className={`item ${item.checked ? 'checked' : ''} ${!matches ? 'grayed' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="drag-handle">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                      </div>
                      <label className="item-label">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleItem(item.id)}
                        />
                        <span className="item-name">{item.name}</span>
                        {item.tripTypes.length > 0 && (
                          <span className="item-tags">
                            {item.tripTypes.map(t => (
                              <span key={t} className="tag">{t}</span>
                            ))}
                          </span>
                        )}
                      </label>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="item-btn delete"
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {!isUncategorized && (
                <form
                  onSubmit={(e) => handleCategoryAdd(category, e)}
                  className="category-add-form"
                >
                  <input
                    type="text"
                    placeholder={`Add to ${category}...`}
                    value={categoryInputs[category] || ''}
                    onChange={(e) => setCategoryInputs(prev => ({
                      ...prev,
                      [category]: e.target.value
                    }))}
                    className="category-add-input"
                  />
                  <button type="submit" className="category-add-btn">+</button>
                </form>
              )}
            </section>
          );
        })}

        {/* Add Category Section */}
        <div className="add-category-section">
          {showAddCategory ? (
            <form onSubmit={handleAddCategory} className="add-category-form">
              <input
                type="text"
                placeholder="Category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="add-category-input"
                autoFocus
              />
              <button type="submit" className="btn primary">Add</button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                }}
                className="btn secondary"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddCategory(true)}
              className="btn secondary add-category-btn"
            >
              + Add Category
            </button>
          )}
        </div>

        {items.length === 0 && settings.categories.length === 0 && (
          <div className="empty-state">
            <p>No items yet. Add a category to get started!</p>
          </div>
        )}
      </main>
    </div>
  );
}
