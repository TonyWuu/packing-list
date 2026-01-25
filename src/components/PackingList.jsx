import { useState, useMemo } from 'react';
import { usePackingList } from '../hooks/usePackingList';
import { useAuth } from '../contexts/AuthContext';
import AddItemModal from './AddItemModal';
import Settings from './Settings';
import './PackingList.css';

export default function PackingList() {
  const { user, logout } = useAuth();
  const {
    items,
    settings,
    shareToken,
    loading,
    toggleItem,
    deleteItem,
    resetAllChecks,
    generateShareToken,
    revokeShareToken
  } = usePackingList();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTripType, setSelectedTripType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {};
    settings.categories.forEach(cat => {
      groups[cat] = [];
    });

    items
      .filter(item => {
        if (!searchQuery) return true;
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(item => {
        if (groups[item.category]) {
          groups[item.category].push(item);
        } else {
          if (!groups['Misc']) groups['Misc'] = [];
          groups['Misc'].push(item);
        }
      });

    return groups;
  }, [items, settings.categories, searchQuery]);

  // Check if item matches selected trip type filter
  const itemMatchesFilter = (item) => {
    if (!selectedTripType) return true;
    if (item.tripTypes.length === 0) return true; // No conditions = always show
    return item.tripTypes.includes(selectedTripType);
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

  if (showSettings) {
    return <Settings onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="packing-list">
      <header className="header">
        <div className="header-top">
          <h1>Packing List</h1>
          <div className="header-actions">
            <button onClick={() => setShowSettings(true)} className="icon-btn" title="Settings">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
              </svg>
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
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
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
          <button onClick={() => setShowAddModal(true)} className="btn primary">
            + Add Item
          </button>
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
        {settings.categories.map(category => {
          const categoryItems = groupedItems[category] || [];
          if (categoryItems.length === 0) return null;

          return (
            <section key={category} className="category-section">
              <h2 className="category-title">{category}</h2>
              <ul className="items-list">
                {categoryItems.map(item => {
                  const matches = itemMatchesFilter(item);
                  return (
                    <li
                      key={item.id}
                      className={`item ${item.checked ? 'checked' : ''} ${!matches ? 'grayed' : ''}`}
                    >
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
                      <div className="item-actions">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="item-btn edit"
                          title="Edit"
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="item-btn delete"
                          title="Delete"
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        {items.length === 0 && (
          <div className="empty-state">
            <p>No items yet. Add your first packing item!</p>
          </div>
        )}
      </main>

      {(showAddModal || editingItem) && (
        <AddItemModal
          item={editingItem}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
