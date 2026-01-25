import { useMemo } from 'react';
import { useSharedList } from '../hooks/usePackingList';
import './PackingList.css';

export default function SharedView({ token }) {
  const { items, settings, loading, error } = useSharedList(token);

  const groupedItems = useMemo(() => {
    if (!settings) return {};
    const groups = {};
    settings.categories.forEach(cat => {
      groups[cat] = [];
    });

    items
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
  }, [items, settings]);

  const checkedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;

  if (loading) {
    return <div className="loading">Loading shared list...</div>;
  }

  if (error) {
    return (
      <div className="loading">
        <p>{error}</p>
        <a href="./">Go to login</a>
      </div>
    );
  }

  return (
    <div className="packing-list">
      <header className="header">
        <div className="header-top">
          <h1>Shared Packing List</h1>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: totalCount ? `${(checkedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>
        <div className="progress-text">{checkedCount} / {totalCount} packed</div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          This is a read-only view. Changes are made by the list owner.
        </p>
      </header>

      <main className="items-container">
        {settings?.categories.map(category => {
          const categoryItems = groupedItems[category] || [];
          if (categoryItems.length === 0) return null;

          return (
            <section key={category} className="category-section">
              <h2 className="category-title">{category}</h2>
              <ul className="items-list">
                {categoryItems.map(item => (
                  <li
                    key={item.id}
                    className={`item ${item.checked ? 'checked' : ''}`}
                    style={{ cursor: 'default' }}
                  >
                    <label className="item-label" style={{ cursor: 'default' }}>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        disabled
                        style={{ cursor: 'default' }}
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
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
    </div>
  );
}
