import { useState } from 'react';
import { usePackingList } from '../hooks/usePackingList';
import './Settings.css';

export default function Settings({ onClose }) {
  const { settings, updateSettings } = usePackingList();
  const [categories, setCategories] = useState(settings.categories);
  const [tripTypes, setTripTypes] = useState(settings.tripTypes);
  const [newCategory, setNewCategory] = useState('');
  const [newTripType, setNewTripType] = useState('');

  const handleSave = async () => {
    await updateSettings({ categories, tripTypes });
    onClose();
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const removeCategory = (cat) => {
    setCategories(categories.filter(c => c !== cat));
  };

  const addTripType = () => {
    if (newTripType.trim() && !tripTypes.includes(newTripType.trim())) {
      setTripTypes([...tripTypes, newTripType.trim()]);
      setNewTripType('');
    }
  };

  const removeTripType = (type) => {
    setTripTypes(tripTypes.filter(t => t !== type));
  };

  return (
    <div className="settings">
      <header className="settings-header">
        <button onClick={onClose} className="back-btn">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1>Settings</h1>
        <button onClick={handleSave} className="save-btn">Save</button>
      </header>

      <main className="settings-content">
        <section className="settings-section">
          <h2>Categories</h2>
          <p className="section-hint">Organize your packing items into categories</p>

          <div className="tags-list">
            {categories.map(cat => (
              <div key={cat} className="tag-item">
                <span>{cat}</span>
                <button onClick={() => removeCategory(cat)} className="remove-btn">×</button>
              </div>
            ))}
          </div>

          <div className="add-row">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
            />
            <button onClick={addCategory} className="add-btn">Add</button>
          </div>
        </section>

        <section className="settings-section">
          <h2>Trip Types</h2>
          <p className="section-hint">Filter your list based on the type of trip</p>

          <div className="tags-list">
            {tripTypes.map(type => (
              <div key={type} className="tag-item">
                <span>{type}</span>
                <button onClick={() => removeTripType(type)} className="remove-btn">×</button>
              </div>
            ))}
          </div>

          <div className="add-row">
            <input
              type="text"
              value={newTripType}
              onChange={(e) => setNewTripType(e.target.value)}
              placeholder="New trip type..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTripType())}
            />
            <button onClick={addTripType} className="add-btn">Add</button>
          </div>
        </section>
      </main>
    </div>
  );
}
