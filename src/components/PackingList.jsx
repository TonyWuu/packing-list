import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  TouchSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePackingList } from '../hooks/usePackingList';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './PackingList.css';

function SortableItem({ item, activeId, toggleItem, deleteItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { item, type: 'item' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    visibility: isDragging ? 'hidden' : 'visible',
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`item ${item.checked ? 'checked' : ''}`}
      {...listeners}
      {...attributes}
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
  );
}

function CategorySection({ category, items, isUncategorized, isDragOver, isEditing, isCollapsed, onToggleCollapse, editingCategoryName, setEditingCategoryName, handleRenameCategory, startEditingCategory, handleDeleteCategory, handleCategoryAdd, categoryInputs, setCategoryInputs, activeId, toggleItem, deleteItem, setEditingCategory }) {
  const itemIds = items.map(item => item.id);

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `category-${category}`,
    data: { category, type: 'category' },
  });

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <section className={`category ${isDragOver ? 'drag-over' : ''} ${isCollapsed ? 'collapsed' : ''}`} data-category={category}>
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

      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <ul className="items" ref={setDroppableRef}>
          {items.map(item => (
            <SortableItem
              key={item.id}
              item={item}
              activeId={activeId}
              toggleItem={toggleItem}
              deleteItem={deleteItem}
            />
          ))}
        </ul>
      </SortableContext>

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
  const [activeId, setActiveId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [overCategory, setOverCategory] = useState(null);
  const [localItems, setLocalItems] = useState(null); // Temporary state during drag

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150,
      tolerance: 5,
    },
  });

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const sensors = useSensors(touchSensor, pointerSensor);

  // Group items by category, sorted by order
  // Use localItems during drag for real-time reordering visuals
  const groupedItems = useMemo(() => {
    const itemsToUse = localItems || items;
    const groups = {};
    settings.categories.forEach(cat => {
      groups[cat] = [];
    });
    groups['Uncategorized'] = [];

    itemsToUse.forEach(item => {
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
  }, [items, settings.categories, localItems]);

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveItem(active.data.current.item);
    setLocalItems([...items]); // Start with current items
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || !localItems) {
      return;
    }

    const activeItemData = active.data.current?.item;
    if (!activeItemData) return;

    // Determine target category and position
    const overData = over.data.current;
    let targetCategory = null;
    let overItemId = null;

    if (overData?.type === 'category') {
      // Hovering over empty category area
      targetCategory = overData.category;
    } else if (overData?.item) {
      // Hovering over an item
      targetCategory = overData.item.category;
      overItemId = over.id;
    }

    if (!targetCategory) {
      return;
    }

    setOverCategory(targetCategory);

    // Find current position of active item in localItems
    const activeIndex = localItems.findIndex(i => i.id === active.id);
    if (activeIndex === -1) return;

    const currentItem = localItems[activeIndex];
    const currentCategory = currentItem.category;

    // Skip if hovering over itself
    if (overItemId === active.id) return;

    // Check if we need to move
    const overIndex = overItemId ? localItems.findIndex(i => i.id === overItemId) : -1;

    // Only update if actually changing position or category
    if (currentCategory === targetCategory && (overIndex === -1 || overIndex === activeIndex)) return;

    // Create new items array with the move applied
    const newItems = localItems.map(item => ({ ...item })); // Deep copy
    const movedItem = { ...newItems[activeIndex], category: targetCategory };
    newItems.splice(activeIndex, 1);

    // Find where to insert
    if (overItemId && overIndex !== -1) {
      // Adjust index since we removed an item
      const adjustedIndex = overIndex > activeIndex ? overIndex - 1 : overIndex;
      newItems.splice(adjustedIndex, 0, movedItem);
    } else {
      // Add to end of category (for empty categories or dropping on category itself)
      let insertIndex = newItems.length;
      let foundCategory = false;
      for (let i = newItems.length - 1; i >= 0; i--) {
        if (newItems[i].category === targetCategory) {
          insertIndex = i + 1;
          foundCategory = true;
          break;
        }
      }
      // If category is empty, just push to the end
      if (!foundCategory) {
        insertIndex = newItems.length;
      }
      newItems.splice(insertIndex, 0, movedItem);
    }

    setLocalItems(newItems);
  };

  const handleDragEnd = async (event) => {
    const { active } = event;

    if (!localItems || !active.data.current?.item) {
      setActiveId(null);
      setActiveItem(null);
      setOverCategory(null);
      setLocalItems(null);
      return;
    }

    // Get all affected categories by comparing original and local items
    const originalItem = items.find(i => i.id === active.id);
    const movedItem = localItems.find(i => i.id === active.id);

    if (originalItem && movedItem) {
      const affectedCategories = new Set([originalItem.category, movedItem.category]);

      // Save each affected category's order
      for (const cat of affectedCategories) {
        const categoryItems = localItems.filter(i => i.category === cat);
        if (categoryItems.length > 0) {
          await reorderItems(categoryItems.map(i => i.id), cat);
        }
      }
    }

    setActiveId(null);
    setActiveItem(null);
    setOverCategory(null);
    setLocalItems(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveItem(null);
    setOverCategory(null);
    setLocalItems(null);
  };

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <main className="categories">
          {allCategories.map(category => {
            const categoryItems = groupedItems[category] || [];
            const isUncategorized = category === 'Uncategorized';
            const isDragOver = overCategory === category;
            const isEditing = editingCategory === category;
            const isCollapsed = collapsedCategories[category] || false;

            return (
              <CategorySection
                key={category}
                category={category}
                items={categoryItems}
                isUncategorized={isUncategorized}
                isDragOver={isDragOver}
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
                activeId={activeId}
                toggleItem={toggleItem}
                deleteItem={deleteItem}
                setEditingCategory={setEditingCategory}
              />
            );
          })}
        </main>

        <DragOverlay dropAnimation={null}>
          {activeItem ? (
            <div className="item item-overlay">
              <label>
                <input type="checkbox" checked={activeItem.checked} readOnly />
                <span className="item-name">{activeItem.name}</span>
              </label>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
