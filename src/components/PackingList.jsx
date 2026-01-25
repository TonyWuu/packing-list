import { useState, useMemo, useRef, useCallback } from 'react';
import { usePackingList } from '../hooks/usePackingList';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './PackingList.css';

function CategorySection({
  category,
  items,
  isUncategorized,
  isEditing,
  isCollapsed,
  onToggleCollapse,
  editingCategoryName,
  setEditingCategoryName,
  handleRenameCategory,
  startEditingCategory,
  handleDeleteCategory,
  handleCategoryAdd,
  categoryInputs,
  setCategoryInputs,
  toggleItem,
  deleteItem,
  setEditingCategory,
  onDragStart,
  draggedItem,
  onDrop,
}) {
  const checkedCount = items.filter(i => i.checked).length;
  const isDropTarget = draggedItem && draggedItem.category !== category;

  return (
    <section
      className={`category ${isCollapsed ? 'collapsed' : ''} ${isDropTarget ? 'drag-over' : ''}`}
      data-category={category}
      onTouchEnd={() => draggedItem && onDrop(category)}
      onMouseUp={() => draggedItem && onDrop(category)}
    >
      <div className="category-header">
        <div className="category-header-left">
          <button
            className="collapse-toggle"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </button>
          {isEditing ? (
            <input
              type="text"
              className="category-edit-input"
              value={editingCategoryName}
              onChange={(e) => setEditingCategoryName(e.target.value)}
              onBlur={() => handleRenameCategory(category)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameCategory(category);
                if (e.key === 'Escape') setEditingCategory(null);
              }}
              autoFocus
            />
          ) : (
            <h2
              className="category-name"
              onClick={() => !isUncategorized && startEditingCategory(category)}
              title={isUncategorized ? '' : 'Click to rename'}
            >
              {category}
              {!isUncategorized && <span className="edit-hint">✎</span>}
            </h2>
          )}
          <span className="category-count">{checkedCount}/{items.length}</span>
        </div>
        <div className="category-header-right">
          {!isUncategorized && !isEditing && (
            <button
              onClick={() => handleDeleteCategory(category)}
              className="category-delete"
              title="Delete category"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <ul className="items">
        {items.map(item => (
          <li
            key={item.id}
            className={`item ${item.checked ? 'checked' : ''} ${draggedItem?.id === item.id ? 'dragging' : ''}`}
            onTouchStart={(e) => onDragStart(e, item)}
            onMouseDown={(e) => onDragStart(e, item)}
          >
            <label onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(item.id)}
              />
              <span className="item-name">{item.name}</span>
            </label>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteItem(item.id);
              }}
              className="item-delete"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {!isUncategorized && (
        <form
          onSubmit={(e) => handleCategoryAdd(category, e)}
          className="category-add"
        >
          <input
            type="text"
            placeholder="Add item..."
            value={categoryInputs[category] || ''}
            onChange={(e) => setCategoryInputs(prev => ({
              ...prev,
              [category]: e.target.value
            }))}
          />
        </form>
      )}
    </section>
  );
}

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
    reorderItems,
    updateSettings,
    generateShareToken,
  } = usePackingList();

  const [categoryInputs, setCategoryInputs] = useState({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Drag state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const dragTimeout = useRef(null);
  const isDragging = useRef(false);
  const justDragged = useRef(false);

  // Group items by category, sorted by order
  const groupedItems = useMemo(() => {
    const groups = {};
    settings.categories.forEach(cat => {
      groups[cat] = [];
    });
    groups['Uncategorized'] = [];

    items.forEach(item => {
      if (groups[item.category]) {
        groups[item.category].push(item);
      } else {
        groups['Uncategorized'].push(item);
      }
    });

    // Sort each category by order
    Object.keys(groups).forEach(cat => {
      groups[cat].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });

    return groups;
  }, [items, settings.categories]);

  const handleDragStart = useCallback((e, item) => {
    // Ignore if clicking on checkbox or delete button
    if (e.target.type === 'checkbox' || e.target.classList.contains('item-delete')) {
      return;
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const startX = clientX;
    const startY = clientY;

    // Start drag after a longer delay (to allow scrolling)
    dragTimeout.current = setTimeout(() => {
      isDragging.current = true;
      setDraggedItem(item);
      setDragPos({ x: clientX, y: clientY });
      if (navigator.vibrate) navigator.vibrate(30);
    }, 350);

    const handleMove = (moveEvent) => {
      const x = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const y = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

      // If not dragging yet, check if user moved too much (they want to scroll)
      if (!isDragging.current) {
        const distance = Math.sqrt((x - startX) ** 2 + (y - startY) ** 2);
        if (distance > 10) {
          // User is scrolling, cancel the drag
          clearTimeout(dragTimeout.current);
          document.removeEventListener('touchmove', handleMove);
          document.removeEventListener('touchend', handleEnd);
          document.removeEventListener('mousemove', handleMove);
          document.removeEventListener('mouseup', handleEnd);
        }
        return;
      }

      moveEvent.preventDefault();
      setDragPos({ x, y });
    };

    const handleEnd = () => {
      clearTimeout(dragTimeout.current);
      const wasDragging = isDragging.current;
      isDragging.current = false;
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);

      // Prevent checkbox toggle after drag
      if (wasDragging) {
        justDragged.current = true;
        setTimeout(() => {
          justDragged.current = false;
          setDraggedItem(null);
        }, 100);
      }
    };

    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
  }, []);

  const handleDrop = useCallback(async (targetCategory) => {
    if (!draggedItem || draggedItem.category === targetCategory) return;

    // Move item to new category
    await updateItem(draggedItem.id, { category: targetCategory });
  }, [draggedItem, updateItem]);

  // Safe toggle that ignores clicks right after dragging
  const safeToggleItem = useCallback((itemId) => {
    if (justDragged.current) return;
    toggleItem(itemId);
  }, [toggleItem]);

  const handleCategoryAdd = (category, e) => {
    e.preventDefault();
    const value = categoryInputs[category];
    if (!value?.trim()) return;
    setCategoryInputs(prev => ({ ...prev, [category]: '' }));
    addItem(value.trim(), category, []);
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
  };

  const handleDeleteCategory = async (category) => {
    if (!confirm(`Delete "${category}"? Items will move to Uncategorized.`)) return;
    await updateSettings({
      ...settings,
      categories: settings.categories.filter(c => c !== category)
    });
  };

  const handleRenameCategory = async (oldName) => {
    if (!editingCategoryName.trim() || editingCategoryName === oldName) {
      setEditingCategory(null);
      return;
    }
    if (settings.categories.includes(editingCategoryName.trim())) {
      alert('Category name already exists');
      return;
    }

    const newCategories = settings.categories.map(c =>
      c === oldName ? editingCategoryName.trim() : c
    );
    await updateSettings({ ...settings, categories: newCategories });

    const itemsToUpdate = items.filter(item => item.category === oldName);
    for (const item of itemsToUpdate) {
      await updateItem(item.id, { category: editingCategoryName.trim() });
    }

    setEditingCategory(null);
  };

  const startEditingCategory = (category) => {
    setEditingCategory(category);
    setEditingCategoryName(category);
  };

  const handleShare = async () => {
    if (shareToken) {
      await navigator.clipboard.writeText(
        `${window.location.origin}${window.location.pathname}#/share/${shareToken}`
      );
      alert('Share link copied!');
    } else {
      const token = await generateShareToken();
      await navigator.clipboard.writeText(
        `${window.location.origin}${window.location.pathname}#/share/${token}`
      );
      alert('Share link created and copied!');
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
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
                </svg>
              )}
            </button>
            <button onClick={handleShare} className="icon-btn" title="Share">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
              </svg>
            </button>
            <button onClick={logout} className="icon-btn" title="Sign out">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: totalCount ? `${(checkedCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
          <span className="progress-text">{checkedCount}/{totalCount}</span>
          <button onClick={resetAllChecks} className="reset-btn" title="Reset all">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleAddCategory} className="new-category">
          <input
            type="text"
            placeholder="New category name..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button type="submit" disabled={!newCategoryName.trim()}>
            + Add
          </button>
        </form>
      </header>

      <main className="categories">
        {allCategories.map(category => {
          const categoryItems = groupedItems[category] || [];
          const isUncategorized = category === 'Uncategorized';
          const isEditing = editingCategory === category;
          const isCollapsed = collapsedCategories[category] || false;

          return (
            <CategorySection
              key={category}
              category={category}
              items={categoryItems}
              isUncategorized={isUncategorized}
              isEditing={isEditing}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => setCollapsedCategories(prev => ({
                ...prev,
                [category]: !prev[category]
              }))}
              editingCategoryName={editingCategoryName}
              setEditingCategoryName={setEditingCategoryName}
              handleRenameCategory={handleRenameCategory}
              startEditingCategory={startEditingCategory}
              handleDeleteCategory={handleDeleteCategory}
              handleCategoryAdd={handleCategoryAdd}
              categoryInputs={categoryInputs}
              setCategoryInputs={setCategoryInputs}
              toggleItem={safeToggleItem}
              deleteItem={deleteItem}
              setEditingCategory={setEditingCategory}
              onDragStart={handleDragStart}
              draggedItem={draggedItem}
              onDrop={handleDrop}
            />
          );
        })}
      </main>

      {/* Floating drag overlay */}
      {draggedItem && (
        <div
          className="drag-overlay"
          style={{
            left: dragPos.x,
            top: dragPos.y,
          }}
        >
          <span className="item-name">{draggedItem.name}</span>
        </div>
      )}
    </div>
  );
}
