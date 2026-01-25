import { useState, useEffect } from 'react';
import { usePackingList } from '../hooks/usePackingList';
import './Modal.css';

export default function AddItemModal({ item, onClose }) {
  const { settings, addItem, updateItem } = usePackingList();
  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState(item?.category || settings.categories[0] || '');
  const [selectedTripTypes, setSelectedTripTypes] = useState(item?.tripTypes || []);

  useEffect(() => {
    if (!category && settings.categories.length > 0) {
      setCategory(settings.categories[0]);
    }
  }, [settings.categories, category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (item) {
      await updateItem(item.id, {
        name: name.trim(),
        category,
        tripTypes: selectedTripTypes
      });
    } else {
      await addItem(name.trim(), category, selectedTripTypes);
    }
    onClose();
  };

  const toggleTripType = (type) => {
    setSelectedTripTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{item ? 'Edit Item' : 'Add Item'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Item Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Toothbrush"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {settings.categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Trip Types (optional)</label>
            <p className="form-hint">Leave empty to show on all trips</p>
            <div className="trip-types-grid">
              {settings.tripTypes.map(type => (
                <label key={type} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTripTypes.includes(type)}
                    onChange={() => toggleTripType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn secondary">
              Cancel
            </button>
            <button type="submit" className="btn primary">
              {item ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
