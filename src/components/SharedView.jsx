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

  const allCategories = [...(settings?.categories || [])];
  if (groupedItems['Uncategorized']?.length > 0) {
    allCategories.push('Uncategorized');
  }

  return (
    <div className="packing-list">
      <header className="header">
        <div className="header-top">
          <h1>Shared List</h1>
        </div>

        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: totalCount ? `${(checkedCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
          <span className="progress-text">{checkedCount}/{totalCount}</span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 8px 0' }}>
          Read-only view
        </p>
      </header>

      <main className="categories">
        {allCategories.map(category => {
          const categoryItems = groupedItems[category] || [];
          if (categoryItems.length === 0) return null;

          return (
            <section key={category} className="category">
              <div className="category-header">
                <h2 className="category-name" style={{ cursor: 'default' }}>
                  {category}
                </h2>
              </div>
              <ul className="items">
                {categoryItems.map(item => (
                  <li
                    key={item.id}
                    className={`item ${item.checked ? 'checked' : ''}`}
                    style={{ cursor: 'default' }}
                  >
                    <label style={{ cursor: 'default' }}>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        disabled
                        style={{ cursor: 'default' }}
                      />
                      <span className="item-name">{item.name}</span>
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
