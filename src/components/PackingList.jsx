import { useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import Fuse from 'fuse.js';
import { usePackingList, useSharedList } from '../hooks/usePackingList';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './PackingList.css';

// Smart categorization mapping with synonyms and variations
const categoryKeywords = {
  Clothes: [
    'shirt', 'shirts', 'pants', 'jeans', 'shorts', 'dress', 'skirt', 'jacket', 'coat',
    'sweater', 'hoodie', 'socks', 'underwear', 'boxers', 'briefs', 'bra',
    'pajamas', 'pyjamas', 'pjs', 'sleepwear', 'nightgown', 'robe', 'bathrobe',
    'swimsuit', 'bikini', 'trunks', 'swim', 'swimming',
    'hat', 'cap', 'beanie', 'scarf', 'gloves', 'mittens', 'belt', 'tie', 'suit',
    'blazer', 'cardigan', 'vest', 'leggings', 'tights', 'blouse', 'polo',
    't-shirt', 'tshirt', 'tee', 'tank top', 'tanktop', 'sweatshirt', 'sweatpants',
    'joggers', 'tracksuit', 'raincoat', 'windbreaker', 'parka', 'fleece',
    'thermal', 'base layer', 'compression', 'sports bra', 'athletic',
    'workout clothes', 'gym clothes', 'running shorts', 'yoga pants',
    'clothes', 'clothing', 'outfit', 'outfits', 'attire', 'apparel', 'wear',
    'top', 'tops', 'bottom', 'bottoms', 'layers', 'undershirt', 'underpants',
    'long sleeve', 'short sleeve', 'sleeveless', 'button down', 'button up',
    'formal', 'casual', 'denim', 'khaki', 'chinos', 'slacks', 'trousers',
    'romper', 'jumpsuit', 'overalls', 'dungarees', 'onesie',
    'jersey', 'uniform', 'costume', 'gown', 'tunic', 'kimono', 'poncho'
  ],
  Shoes: [
    'shoes', 'sneakers', 'boots', 'sandals', 'flip flops', 'flipflops',
    'heels', 'flats', 'loafers', 'slippers', 'trainers', 'running shoes',
    'hiking boots', 'dress shoes', 'oxfords', 'moccasins', 'espadrilles',
    'wedges', 'pumps', 'cleats', 'crocs', 'slides'
  ],
  Toiletries: [
    'toothbrush', 'toothpaste', 'floss', 'mouthwash', 'shampoo', 'conditioner',
    'soap', 'body wash', 'deodorant', 'razor', 'shaving cream', 'aftershave',
    'lotion', 'moisturizer', 'sunscreen', 'sunblock', 'lip balm', 'chapstick',
    'makeup', 'mascara', 'lipstick', 'foundation', 'concealer', 'eyeliner',
    'eyeshadow', 'blush', 'bronzer', 'primer', 'setting spray', 'makeup remover',
    'face wash', 'cleanser', 'toner', 'serum', 'eye cream', 'face cream',
    'hair gel', 'hair spray', 'mousse', 'hair oil', 'dry shampoo', 'comb',
    'brush', 'hair dryer', 'straightener', 'curling iron', 'tweezers',
    'nail clipper', 'nail file', 'cotton swabs', 'q-tips', 'cotton pads',
    'tissues', 'wet wipes', 'hand sanitizer', 'perfume', 'cologne', 'fragrance',
    'contact lens', 'contact solution', 'glasses', 'retainer',
    'bidet', 'toilet paper', 'bathroom', 'shower', 'bath', 'towel', 'washcloth',
    'exfoliant', 'scrub', 'mask', 'face mask', 'sheet mask', 'retinol', 'spf',
    'body lotion', 'hand cream', 'foot cream', 'cuticle', 'nail polish',
    'hair tie', 'hair clip', 'bobby pin', 'headband', 'shower cap',
    'menstrual', 'tampon', 'pad', 'menstrual cup', 'panty liner',
    'electric toothbrush', 'waterpik', 'dental', 'denture', 'night guard'
  ],
  Electronics: [
    'phone', 'charger', 'laptop', 'tablet', 'ipad', 'kindle', 'e-reader',
    'camera', 'gopro', 'drone', 'headphones', 'earbuds', 'airpods', 'earphones',
    'speaker', 'bluetooth', 'power bank', 'battery pack', 'portable charger',
    'cable', 'usb', 'usb-c', 'lightning', 'adapter', 'converter', 'plug adapter',
    'extension cord', 'power strip', 'watch', 'smartwatch', 'fitbit',
    'apple watch', 'garmin', 'tripod', 'selfie stick', 'sd card', 'memory card',
    'hard drive', 'flash drive', 'usb drive', 'mouse', 'keyboard', 'monitor',
    'gaming', 'nintendo', 'switch', 'controller', 'console', 'vr', 'oculus',
    'iphone', 'android', 'macbook', 'chromebook', 'airdrop', 'wireless',
    'hdmi', 'displayport', 'ethernet', 'wifi', 'hotspot', 'router', 'modem',
    'battery', 'batteries', 'aa', 'aaa', 'rechargeable', 'charging',
    'apple', 'samsung', 'sony', 'bose', 'anker', 'belkin'
  ],
  Documents: [
    'passport', 'id', 'license', 'drivers license', 'visa', 'boarding pass',
    'ticket', 'itinerary', 'reservation', 'confirmation', 'insurance',
    'travel insurance', 'credit card', 'debit card', 'cash', 'money', 'currency',
    'wallet', 'purse', 'documents', 'papers', 'certificate', 'vaccination',
    'vaccine card', 'covid', 'test results', 'prescription', 'medical records',
    'emergency contacts', 'copies', 'photocopies'
  ],
  Medicine: [
    'medicine', 'medication', 'meds', 'pills', 'vitamins', 'supplements', 'aspirin',
    'ibuprofen', 'tylenol', 'advil', 'aleve', 'painkiller', 'pain relief', 'antibiotic',
    'allergy', 'antihistamine', 'benadryl', 'claritin', 'zyrtec', 'allegra', 'inhaler',
    'epipen', 'insulin', 'prescription', 'rx', 'first aid', 'bandaid', 'band-aid',
    'bandage', 'gauze', 'antiseptic', 'neosporin', 'thermometer', 'cold medicine',
    'cough drops', 'throat lozenges', 'antacid', 'tums', 'pepto', 'dramamine',
    'motion sickness', 'melatonin', 'sleep aid', 'eye drops', 'nasal spray',
    'dayquil', 'nyquil', 'sudafed', 'mucinex', 'robitussin', 'cough syrup',
    'imodium', 'laxative', 'fiber', 'probiotic', 'omega', 'fish oil', 'vitamin',
    'zinc', 'elderberry', 'echinacea', 'emergen-c', 'airborne',
    'heating pad', 'ice pack', 'ace bandage', 'splint', 'brace', 'sling',
    'sunburn', 'hydrocortisone', 'calamine', 'antiitch', 'bug bite'
  ],
  Accessories: [
    'jewelry', 'necklace', 'bracelet', 'earrings', 'ring', 'watch', 'sunglasses',
    'glasses case', 'bag', 'backpack', 'purse', 'handbag', 'tote', 'duffel',
    'luggage', 'suitcase', 'carry-on', 'packing cubes', 'travel pillow',
    'neck pillow', 'eye mask', 'sleep mask', 'earplugs', 'umbrella', 'keychain',
    'lanyard', 'wallet', 'money belt', 'fanny pack', 'crossbody'
  ],
  'Beach & Pool': [
    'towel', 'beach towel', 'sunscreen', 'sunblock', 'sunglasses', 'hat',
    'sun hat', 'beach bag', 'cooler', 'snorkel', 'goggles', 'fins', 'flippers',
    'floatie', 'inflatable', 'beach chair', 'umbrella', 'beach umbrella',
    'boogie board', 'surfboard', 'paddleboard', 'kayak', 'life jacket',
    'rash guard', 'water shoes', 'reef safe', 'aloe', 'after sun'
  ],
  'Work & Office': [
    'laptop', 'notebook', 'planner', 'pen', 'pencil', 'highlighter', 'marker',
    'stapler', 'paper clips', 'sticky notes', 'post-it', 'folder', 'binder',
    'business cards', 'portfolio', 'briefcase', 'work bag', 'lanyard',
    'badge', 'name tag', 'presentation', 'usb', 'flash drive', 'charger'
  ],
  Entertainment: [
    'book', 'books', 'magazine', 'journal', 'diary', 'cards', 'playing cards',
    'games', 'board game', 'puzzle', 'coloring book', 'crayons', 'markers',
    'sketchbook', 'drawing', 'knitting', 'crafts', 'music', 'instrument',
    'guitar', 'ukulele', 'headphones', 'kindle', 'e-reader', 'tablet'
  ],
  Snacks: [
    'snacks', 'food', 'granola', 'protein bar', 'energy bar', 'nuts', 'trail mix',
    'chips', 'crackers', 'cookies', 'candy', 'chocolate', 'fruit', 'dried fruit',
    'jerky', 'gum', 'mints', 'water bottle', 'drinks', 'coffee', 'tea'
  ]
};

// Build a flat list of all keywords with their categories for Fuse.js
const keywordList = Object.entries(categoryKeywords).flatMap(([category, keywords]) =>
  keywords.map(keyword => ({ keyword, category }))
);

// Configure Fuse.js for fuzzy matching - stricter settings
const fuse = new Fuse(keywordList, {
  keys: ['keyword'],
  threshold: 0.3, // Stricter matching (0.0 = exact, 1.0 = match anything)
  distance: 50,   // How far to search for matches within the string
  minMatchCharLength: 3,
  includeScore: true,
});

function detectCategory(itemName, existingCategories) {
  const lowerName = itemName.toLowerCase().trim();

  // Skip very short inputs
  if (lowerName.length < 2) {
    const isNew = !existingCategories.includes('Misc');
    return { category: 'Misc', isNew };
  }

  // Split input into words (filter out short words and common articles)
  const stopWords = ['a', 'an', 'the', 'my', 'for', 'to', 'of', 'and', 'or', 'in', 'on', 'with'];
  const words = lowerName.split(/\s+/).filter(w => w.length >= 2 && !stopWords.includes(w));

  // Track all matches with scores
  const matches = [];

  // 1. Check for exact word matches first (highest priority)
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      // Check if any word in input exactly matches a keyword
      for (const word of words) {
        if (word === keyword || word === keyword + 's' || word + 's' === keyword) {
          matches.push({ category, score: 0, type: 'exact' });
        }
      }
      // Check if a multi-word keyword matches the input
      if (keyword.includes(' ') && lowerName.includes(keyword)) {
        matches.push({ category, score: 0, type: 'exact-phrase' });
      }
    }
  }

  // 2. Check for substring matches (keyword contained in input)
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      // Only match if keyword is at least 4 chars and contained in input
      if (keyword.length >= 4 && lowerName.includes(keyword)) {
        matches.push({ category, score: 0.1, type: 'substring' });
      }
    }
  }

  // 3. Use fuzzy matching for remaining cases
  for (const word of words) {
    if (word.length >= 3) {
      const fuzzyResults = fuse.search(word);
      for (const result of fuzzyResults.slice(0, 3)) {
        if (result.score < 0.3) {
          matches.push({ category: result.item.category, score: result.score + 0.2, type: 'fuzzy' });
        }
      }
    }
  }

  // If no matches found, return Misc
  if (matches.length === 0) {
    const isNew = !existingCategories.includes('Misc');
    return { category: 'Misc', isNew };
  }

  // Sort matches: prioritize existing categories, then by score
  matches.sort((a, b) => {
    const aExists = existingCategories.includes(a.category);
    const bExists = existingCategories.includes(b.category);
    // Prioritize existing categories
    if (aExists && !bExists) return -1;
    if (!aExists && bExists) return 1;
    // Then by score (lower is better)
    return a.score - b.score;
  });

  const bestMatch = matches[0];
  const isNew = !existingCategories.includes(bestMatch.category);
  return { category: bestMatch.category, isNew };
}

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
  updateItem,
  setEditingCategory,
  onDragStart,
  draggedItem,
  hoveredCategory,
  onCategoryDragStart,
  draggedCategory,
  onToggleAllItems,
}) {
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemName, setEditingItemName] = useState('');

  const startEditingItem = (item) => {
    setEditingItemId(item.id);
    setEditingItemName(item.name);
  };

  const saveItemName = async () => {
    if (editingItemId && editingItemName.trim()) {
      await updateItem(editingItemId, { name: editingItemName.trim() });
    }
    setEditingItemId(null);
    setEditingItemName('');
  };

  const checkedCount = items.filter(i => i.checked).length;
  const allChecked = items.length > 0 && checkedCount === items.length;
  const someChecked = checkedCount > 0 && checkedCount < items.length;
  const isDropTarget = draggedItem && hoveredCategory === category && draggedItem.category !== category;
  const isCategoryDropTarget = draggedCategory && draggedCategory !== category && !isUncategorized;
  const isCategoryDragging = draggedCategory === category;

  return (
    <section
      className={`category ${isCollapsed ? 'collapsed' : ''} ${isDropTarget ? 'drag-over' : ''} ${isCategoryDropTarget ? 'category-drop-target' : ''} ${isCategoryDragging ? 'category-dragging' : ''}`}
      data-category={category}
    >
      <div className="category-header">
        <div className="category-header-left">
          {!isUncategorized && (
            <div
              className="category-drag-handle"
              onTouchStart={(e) => onCategoryDragStart(e, category)}
              onMouseDown={(e) => onCategoryDragStart(e, category)}
              title="Drag to reorder"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </div>
          )}
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
          {items.length > 0 && (
            <button
              onClick={() => onToggleAllItems(category, !allChecked)}
              className={`category-check-all ${allChecked ? 'all-checked' : ''} ${someChecked ? 'some-checked' : ''}`}
              title={allChecked ? 'Unpack all' : 'Pack all'}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                {allChecked ? (
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                ) : (
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17.99 9l-1.41-1.42-6.59 6.59-2.58-2.57-1.42 1.41 4 3.99z"/>
                )}
              </svg>
              <span className="check-all-label">{allChecked ? 'Unpack' : 'Pack all'}</span>
            </button>
          )}
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
        {items.length === 0 ? (
          <li className="empty-category">
            No items yet — add some using the field below
          </li>
        ) : (
          items.map(item => (
            <li
              key={item.id}
              className={`item ${item.checked ? 'checked' : ''} ${draggedItem?.id === item.id ? 'dragging' : ''}`}
              onTouchStart={(e) => {
                if (editingItemId !== item.id) onDragStart(e, item);
              }}
              onMouseDown={(e) => {
                if (editingItemId !== item.id) onDragStart(e, item);
              }}
            >
              <label onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem(item.id)}
                />
                {editingItemId === item.id ? (
                  <input
                    type="text"
                    className="item-edit-input"
                    value={editingItemName}
                    onChange={(e) => setEditingItemName(e.target.value)}
                    onBlur={saveItemName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveItemName();
                      } else if (e.key === 'Escape') {
                        setEditingItemId(null);
                        setEditingItemName('');
                      }
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="item-name"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      startEditingItem(item);
                    }}
                  >
                    {item.name}
                  </span>
                )}
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
          ))
        )}
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

// Read-only partner list component
function PartnerList({ items, settings, ownerName, loading, error, onRemove }) {
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const groupedItems = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      const cat = item.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    // Sort items within each category by order
    Object.keys(groups).forEach(cat => {
      groups[cat].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
    return groups;
  }, [items]);

  const categories = settings?.categories || [];
  const allCategories = useMemo(() => {
    const itemCategories = Object.keys(groupedItems);
    const ordered = categories.filter(c => itemCategories.includes(c));
    const unordered = itemCategories.filter(c => !categories.includes(c) && c !== 'Uncategorized');
    return [...ordered, ...unordered, ...(groupedItems['Uncategorized'] ? ['Uncategorized'] : [])];
  }, [categories, groupedItems]);

  const { checked, total } = useMemo(() => {
    const checked = items.filter(i => i.checked).length;
    return { checked, total: items.length };
  }, [items]);

  const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

  if (loading) {
    return (
      <div className="partner-list">
        <div className="partner-header">
          <h2>{ownerName || 'Partner'}'s Packing List</h2>
        </div>
        <div className="partner-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="partner-list">
        <div className="partner-header">
          <h2>{ownerName || 'Partner'}'s Packing List</h2>
          <button className="icon-btn" onClick={onRemove} title="Remove partner list">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="partner-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="partner-list">
      <div className="partner-header">
        <h2>{ownerName || 'Partner'}'s Packing List</h2>
        <button className="icon-btn" onClick={onRemove} title="Remove partner list">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="progress-section">
        <span className="progress-label">Progress</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-text">{checked}/{total}</span>
      </div>

      <div className="categories">
        {allCategories.map(category => {
          const categoryItems = groupedItems[category] || [];
          const isCollapsed = collapsedCategories[category] || false;
          const checkedCount = categoryItems.filter(i => i.checked).length;

          return (
            <div
              key={category}
              className={`category partner-category ${isCollapsed ? 'collapsed' : ''}`}
            >
              <div className="category-header">
                <div className="category-header-left">
                  <button
                    className="collapse-toggle"
                    onClick={() => setCollapsedCategories(prev => ({
                      ...prev,
                      [category]: !prev[category]
                    }))}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <h3 className="category-name">{category}</h3>
                </div>
                <div className="category-header-right">
                  <span className="category-count">{checkedCount}/{categoryItems.length}</span>
                </div>
              </div>

              {!isCollapsed && (
                <ul className="items">
                  {categoryItems.map(item => (
                    <li key={item.id} className={`item ${item.checked ? 'checked' : ''}`}>
                      <label>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          disabled
                          readOnly
                        />
                        <span className="item-name">{item.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
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
    batchUpdateItems,
  } = usePackingList();

  const [categoryInputs, setCategoryInputs] = useState({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [quickAddInput, setQuickAddInput] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [showAddCategory, setShowAddCategory] = useState(false);
  const addCategoryInputRef = useRef(null);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const prevAllChecked = useRef(false);

  // Partner list state (desktop only)
  const [partnerToken, setPartnerToken] = useState(() =>
    localStorage.getItem('partnerShareToken') || ''
  );
  const [showPartnerList, setShowPartnerList] = useState(() =>
    localStorage.getItem('showPartnerList') === 'true'
  );
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerTokenInput, setPartnerTokenInput] = useState('');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Fetch partner's list data
  const {
    items: partnerItems,
    settings: partnerSettings,
    ownerName: partnerName,
    loading: partnerLoading,
    error: partnerError
  } = useSharedList(showPartnerList ? partnerToken : null);

  // Track desktop screen size
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save partner preferences to localStorage
  useEffect(() => {
    localStorage.setItem('partnerShareToken', partnerToken);
  }, [partnerToken]);

  useEffect(() => {
    localStorage.setItem('showPartnerList', showPartnerList.toString());
  }, [showPartnerList]);

  // Item drag state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const dragTimeout = useRef(null);
  const isDragging = useRef(false);
  const justDragged = useRef(false);
  const autoScrollInterval = useRef(null);

  // Auto-scroll when dragging near edges
  const startAutoScroll = useCallback((y) => {
    const edgeThreshold = 80; // pixels from edge to start scrolling
    const maxScrollSpeed = 12; // max pixels per frame

    // Clear any existing interval
    if (autoScrollInterval.current) {
      cancelAnimationFrame(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }

    const scroll = () => {
      const viewportHeight = window.innerHeight;
      let scrollAmount = 0;

      if (y < edgeThreshold) {
        // Near top - scroll up
        const intensity = 1 - (y / edgeThreshold);
        scrollAmount = -maxScrollSpeed * intensity;
      } else if (y > viewportHeight - edgeThreshold) {
        // Near bottom - scroll down
        const intensity = 1 - ((viewportHeight - y) / edgeThreshold);
        scrollAmount = maxScrollSpeed * intensity;
      }

      if (scrollAmount !== 0) {
        window.scrollBy(0, scrollAmount);
        autoScrollInterval.current = requestAnimationFrame(scroll);
      } else {
        autoScrollInterval.current = null;
      }
    };

    scroll();
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollInterval.current) {
      cancelAnimationFrame(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  }, []);

  // Category drag state
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [categoryDragPos, setCategoryDragPos] = useState({ x: 0, y: 0 });
  const [previewCategoryOrder, setPreviewCategoryOrder] = useState(null);
  const previewCategoryOrderRef = useRef(null); // Ref to access latest value in event handlers
  const categoryDragTimeout = useRef(null);
  const isCategoryDragging = useRef(false);
  const categoriesContainerRef = useRef(null);
  const categoryPositions = useRef({});
  const preDragCollapsedRef = useRef(null); // Store collapsed state before category drag
  const lastReorderTime = useRef(0); // Debounce rapid reorders
  const lastTargetCategory = useRef(null); // Track last swap target to prevent flip-flopping

  // Keep ref in sync with state
  useEffect(() => {
    previewCategoryOrderRef.current = previewCategoryOrder;
  }, [previewCategoryOrder]);

  // Store positions before reorder for FLIP animation
  const storeCategoryPositions = useCallback(() => {
    if (!categoriesContainerRef.current) return;
    const categories = categoriesContainerRef.current.querySelectorAll('[data-category]');
    const positions = {};
    categories.forEach(el => {
      const category = el.dataset.category;
      const rect = el.getBoundingClientRect();
      positions[category] = { top: rect.top, left: rect.left };
    });
    categoryPositions.current = positions;
  }, []);

  // FLIP animation after reorder
  useLayoutEffect(() => {
    if (!categoriesContainerRef.current || !previewCategoryOrder) return;

    const categories = categoriesContainerRef.current.querySelectorAll('[data-category]');
    const oldPositions = categoryPositions.current;

    categories.forEach(el => {
      const category = el.dataset.category;
      if (category === draggedCategory) return; // Don't animate the dragged one

      const oldPos = oldPositions[category];
      if (!oldPos) return;

      const newRect = el.getBoundingClientRect();
      const deltaY = oldPos.top - newRect.top;

      if (Math.abs(deltaY) > 1) {
        // Apply inverse transform (FLIP: Invert)
        el.style.transform = `translateY(${deltaY}px)`;
        el.style.transition = 'none';

        // Force reflow
        el.offsetHeight;

        // Animate to final position (FLIP: Play)
        el.style.transition = 'transform 0.25s ease-out';
        el.style.transform = '';
      }
    });

    // Store new positions for next animation
    storeCategoryPositions();
  }, [previewCategoryOrder, draggedCategory, storeCategoryPositions]);

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

    // Only handle mouse events here, not touch (let touch scroll naturally)
    if (e.touches) {
      // For touch, we use a different approach - only start tracking after long press
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;

      let lastTouchPos = { x: startX, y: startY };
      const MOVE_THRESHOLD = 15; // Allow small movements during hold

      const handleTouchMove = (moveEvent) => {
        const t = moveEvent.touches[0];
        lastTouchPos = { x: t.clientX, y: t.clientY };

        // If drag hasn't started yet, check if movement exceeds threshold (user is scrolling)
        if (!isDragging.current) {
          const dx = Math.abs(t.clientX - startX);
          const dy = Math.abs(t.clientY - startY);
          if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
            clearTimeout(dragTimeout.current);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
          }
          return;
        }
        // Prevent scrolling while dragging
        moveEvent.preventDefault();
        // If dragging, update position and trigger auto-scroll
        setDragPos({ x: t.clientX, y: t.clientY });
        startAutoScroll(t.clientY);

        // Update hovered category
        const elementUnder = document.elementFromPoint(t.clientX, t.clientY);
        const categorySection = elementUnder?.closest('[data-category]');
        setHoveredCategory(categorySection?.dataset.category || null);
      };

      const handleTouchEnd = () => {
        clearTimeout(dragTimeout.current);
        stopAutoScroll();
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        // Restore scrolling
        document.body.style.touchAction = '';
        document.body.style.overflow = '';

        if (isDragging.current) {
          // Find the element under the last touch point to determine drop target
          const elementUnder = document.elementFromPoint(lastTouchPos.x, lastTouchPos.y);
          const categorySection = elementUnder?.closest('[data-category]');
          const targetCategory = categorySection?.dataset.category;

          if (targetCategory && targetCategory !== item.category) {
            updateItem(item.id, { category: targetCategory });
          }

          justDragged.current = true;
          isDragging.current = false;
          setHoveredCategory(null);
          setTimeout(() => {
            justDragged.current = false;
            setDraggedItem(null);
          }, 100);
        }
      };

      // Start drag after hold
      dragTimeout.current = setTimeout(() => {
        isDragging.current = true;
        setDraggedItem(item);
        setDragPos({ x: lastTouchPos.x, y: lastTouchPos.y });
        if (navigator.vibrate) navigator.vibrate(30);
        // Prevent scrolling while dragging by setting touch-action on body
        document.body.style.touchAction = 'none';
        document.body.style.overflow = 'hidden';
      }, 400);

      // Non-passive to allow preventDefault when dragging
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return;
    }

    // Mouse handling (desktop)
    const clientX = e.clientX;
    const clientY = e.clientY;

    const handleMouseMove = (moveEvent) => {
      if (!isDragging.current) return;
      setDragPos({ x: moveEvent.clientX, y: moveEvent.clientY });
      startAutoScroll(moveEvent.clientY);

      // Update hovered category
      const elementUnder = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const categorySection = elementUnder?.closest('[data-category]');
      setHoveredCategory(categorySection?.dataset.category || null);
    };

    const handleMouseUp = (upEvent) => {
      clearTimeout(dragTimeout.current);
      stopAutoScroll();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (isDragging.current) {
        // Find the element under the mouse to determine drop target
        const elementUnder = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        const categorySection = elementUnder?.closest('[data-category]');
        const targetCategory = categorySection?.dataset.category;

        if (targetCategory && targetCategory !== item.category) {
          updateItem(item.id, { category: targetCategory });
        }

        justDragged.current = true;
        isDragging.current = false;
        setHoveredCategory(null);
        setTimeout(() => {
          justDragged.current = false;
          setDraggedItem(null);
        }, 100);
      }
    };

    dragTimeout.current = setTimeout(() => {
      isDragging.current = true;
      setDraggedItem(item);
      setDragPos({ x: clientX, y: clientY });
    }, 200);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateItem, startAutoScroll, stopAutoScroll]);

  // Safe toggle that ignores clicks right after dragging
  const safeToggleItem = useCallback((itemId) => {
    if (justDragged.current) return;
    toggleItem(itemId);
  }, [toggleItem]);

  // Toggle all items in a category
  const handleToggleAllItems = useCallback(async (category, checked) => {
    const categoryItems = items.filter(item => item.category === category && item.checked !== checked);
    const itemIds = categoryItems.map(item => item.id);
    if (itemIds.length > 0) {
      await batchUpdateItems(itemIds, { checked });
    }
  }, [items, batchUpdateItems]);

  // Update preview category order based on current drag position
  const updatePreviewOrder = useCallback((draggedCat, x, y) => {
    // Debounce: prevent reorders happening too quickly (causes jumping)
    const now = Date.now();
    if (now - lastReorderTime.current < 150) {
      return;
    }

    const elementUnder = document.elementFromPoint(x, y);
    const categorySection = elementUnder?.closest('[data-category]');
    const targetCategory = categorySection?.dataset.category;

    if (targetCategory && targetCategory !== draggedCat && targetCategory !== 'Uncategorized') {
      // Use ref to get latest order
      const currentOrder = previewCategoryOrderRef.current || settings.categories;
      const oldIndex = currentOrder.indexOf(draggedCat);
      const newIndex = currentOrder.indexOf(targetCategory);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // Prevent flip-flopping: if we just swapped with this target, require moving to a different one first
        if (lastTargetCategory.current === targetCategory) {
          return;
        }

        // Store positions before reorder for FLIP animation
        storeCategoryPositions();

        const newOrder = [...currentOrder];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, draggedCat);
        setPreviewCategoryOrder(newOrder);

        lastReorderTime.current = now;
        lastTargetCategory.current = targetCategory;
      }
    } else {
      // Clear last target when not over a valid swap target
      lastTargetCategory.current = null;
    }
  }, [settings.categories, storeCategoryPositions]);

  // Category drag handler
  const handleCategoryDragStart = useCallback((e, category) => {
    // Ignore if it's not the drag handle
    if (!e.target.closest('.category-drag-handle')) return;

    if (e.touches) {
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;
      let lastTouchPos = { x: startX, y: startY };

      const handleTouchMove = (moveEvent) => {
        const t = moveEvent.touches[0];
        lastTouchPos = { x: t.clientX, y: t.clientY };

        if (!isCategoryDragging.current) {
          clearTimeout(categoryDragTimeout.current);
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);
          return;
        }
        // Prevent scrolling while dragging category
        moveEvent.preventDefault();
        setCategoryDragPos({ x: t.clientX, y: t.clientY });
        updatePreviewOrder(category, t.clientX, t.clientY);
        startAutoScroll(t.clientY);
      };

      const handleTouchEnd = () => {
        clearTimeout(categoryDragTimeout.current);
        stopAutoScroll();
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.body.style.touchAction = '';
        document.body.style.overflow = '';

        if (isCategoryDragging.current) {
          // Save the preview order as the final order (use ref for latest value)
          const finalOrder = previewCategoryOrderRef.current;
          if (finalOrder) {
            updateSettings({ ...settings, categories: finalOrder });
          }

          // Restore collapsed state
          if (preDragCollapsedRef.current) {
            setCollapsedCategories(preDragCollapsedRef.current);
            preDragCollapsedRef.current = null;
          }

          isCategoryDragging.current = false;
          setPreviewCategoryOrder(null);
          setTimeout(() => setDraggedCategory(null), 100);
        }
      };

      categoryDragTimeout.current = setTimeout(() => {
        isCategoryDragging.current = true;
        lastReorderTime.current = 0;
        lastTargetCategory.current = null;
        setDraggedCategory(category);
        setPreviewCategoryOrder(settings.categories);
        setCategoryDragPos({ x: lastTouchPos.x, y: lastTouchPos.y });
        if (navigator.vibrate) navigator.vibrate(30);
        document.body.style.touchAction = 'none';
        document.body.style.overflow = 'hidden';
        // Collapse all categories for easier reordering
        preDragCollapsedRef.current = { ...collapsedCategories };
        const allCollapsed = {};
        settings.categories.forEach(cat => { allCollapsed[cat] = true; });
        setCollapsedCategories(allCollapsed);
      }, 300);

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return;
    }

    // Mouse handling
    const clientX = e.clientX;
    const clientY = e.clientY;

    const handleMouseMove = (moveEvent) => {
      if (!isCategoryDragging.current) return;
      setCategoryDragPos({ x: moveEvent.clientX, y: moveEvent.clientY });
      updatePreviewOrder(category, moveEvent.clientX, moveEvent.clientY);
      startAutoScroll(moveEvent.clientY);
    };

    const handleMouseUp = () => {
      clearTimeout(categoryDragTimeout.current);
      stopAutoScroll();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (isCategoryDragging.current) {
        // Save the preview order as the final order (use ref for latest value)
        const finalOrder = previewCategoryOrderRef.current;
        if (finalOrder) {
          updateSettings({ ...settings, categories: finalOrder });
        }

        // Restore collapsed state
        if (preDragCollapsedRef.current) {
          setCollapsedCategories(preDragCollapsedRef.current);
          preDragCollapsedRef.current = null;
        }

        isCategoryDragging.current = false;
        setPreviewCategoryOrder(null);
        setTimeout(() => setDraggedCategory(null), 100);
      }
    };

    categoryDragTimeout.current = setTimeout(() => {
      isCategoryDragging.current = true;
      lastReorderTime.current = 0;
      lastTargetCategory.current = null;
      setDraggedCategory(category);
      setPreviewCategoryOrder(settings.categories);
      setCategoryDragPos({ x: clientX, y: clientY });
      // Collapse all categories for easier reordering
      preDragCollapsedRef.current = { ...collapsedCategories };
      const allCollapsed = {};
      settings.categories.forEach(cat => { allCollapsed[cat] = true; });
      setCollapsedCategories(allCollapsed);
    }, 150);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [settings, updateSettings, updatePreviewOrder, startAutoScroll, stopAutoScroll, collapsedCategories]);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const itemName = quickAddInput.trim();
    if (!itemName) return;

    // Clear input immediately for responsiveness
    setQuickAddInput('');

    // Detect the category
    const { category, isNew } = detectCategory(itemName, settings.categories);

    // Create the category if it doesn't exist
    if (isNew) {
      await updateSettings({
        ...settings,
        categories: [...settings.categories, category]
      });
    }

    // Add the item
    await addItem(itemName, category, []);

    // Ensure the category is not collapsed so user can see the new item
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: false
    }));
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
    setShowAddCategory(false);
  };

  // Focus input when showing add category
  useEffect(() => {
    if (showAddCategory && addCategoryInputRef.current) {
      addCategoryInputRef.current.focus();
    }
  }, [showAddCategory]);

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
  const allPacked = totalCount > 0 && checkedCount === totalCount;

  // Show celebration when all items become checked
  useEffect(() => {
    if (allPacked && !prevAllChecked.current) {
      setShowCelebration(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
    prevAllChecked.current = allPacked;
  }, [allPacked]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Use preview order during drag, otherwise use settings
  const displayCategories = previewCategoryOrder || settings.categories;
  const allCategories = [...displayCategories];
  if (groupedItems['Uncategorized']?.length > 0) {
    allCategories.push('Uncategorized');
  }

  const handleRemovePartner = () => {
    setShowPartnerList(false);
    setPartnerToken('');
  };

  const handleAddPartner = (e) => {
    e.preventDefault();
    const token = partnerTokenInput.trim();
    if (token) {
      setPartnerToken(token);
      setShowPartnerList(true);
      setShowPartnerModal(false);
    }
  };

  // Check if all categories are collapsed
  const allCategoriesCollapsed = allCategories.length > 0 &&
    allCategories.every(cat => collapsedCategories[cat]);

  const toggleCollapseAll = () => {
    if (allCategoriesCollapsed) {
      // Expand all
      setCollapsedCategories({});
    } else {
      // Collapse all
      const allCollapsed = {};
      allCategories.forEach(cat => { allCollapsed[cat] = true; });
      setCollapsedCategories(allCollapsed);
    }
  };

  return (
    <div className={`packing-list-container ${showPartnerList && partnerToken && isDesktop ? 'side-by-side' : ''}`}>
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
            <button
              onClick={toggleCollapseAll}
              className="icon-btn"
              title={allCategoriesCollapsed ? 'Expand all' : 'Collapse all'}
            >
              {allCategoriesCollapsed ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M7.41 18.59L8.83 20 12 16.83 15.17 20l1.41-1.41L12 14l-4.59 4.59zm9.18-13.18L15.17 4 12 7.17 8.83 4 7.41 5.41 12 10l4.59-4.59z"/>
                </svg>
              )}
            </button>
            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              className={`icon-btn ${showAddCategory ? 'active' : ''}`}
              title="Add category"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
            <button onClick={handleShare} className="icon-btn" title="Share">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
              </svg>
            </button>
            {isDesktop && (
              <button
                onClick={() => {
                  if (partnerToken && showPartnerList) {
                    setShowPartnerList(false);
                  } else if (partnerToken) {
                    setShowPartnerList(true);
                  } else {
                    setPartnerTokenInput('');
                    setShowPartnerModal(true);
                  }
                }}
                className={`icon-btn ${showPartnerList && partnerToken ? 'active' : ''}`}
                title={showPartnerList ? "Hide partner's list" : "Show partner's list"}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </button>
            )}
            <button onClick={logout} className="icon-btn" title="Sign out">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="progress-section">
          <span className="progress-label">Packing Progress</span>
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

        <form onSubmit={handleQuickAdd} className="quick-add">
          <input
            type="text"
            placeholder="Add item (e.g., toothbrush, charger, passport)..."
            value={quickAddInput}
            onChange={(e) => setQuickAddInput(e.target.value)}
          />
        </form>

        {showAddCategory && (
          <form onSubmit={handleAddCategory} className="add-category-inline">
            <input
              ref={addCategoryInputRef}
              type="text"
              placeholder="New category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onBlur={() => {
                if (!newCategoryName.trim()) {
                  setShowAddCategory(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setNewCategoryName('');
                  setShowAddCategory(false);
                }
              }}
            />
            <button type="submit" disabled={!newCategoryName.trim()}>
              Add
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setNewCategoryName('');
                setShowAddCategory(false);
              }}
            >
              ×
            </button>
          </form>
        )}
      </header>

      <main className="categories" ref={categoriesContainerRef}>
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
              updateItem={updateItem}
              setEditingCategory={setEditingCategory}
              onDragStart={handleDragStart}
              draggedItem={draggedItem}
              hoveredCategory={hoveredCategory}
              onCategoryDragStart={handleCategoryDragStart}
              draggedCategory={draggedCategory}
              onToggleAllItems={handleToggleAllItems}
            />
          );
        })}
      </main>

      {/* Floating drag overlay for items */}
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

      {/* Floating drag overlay for categories */}
      {draggedCategory && (
        <div
          className="drag-overlay category-drag-overlay"
          style={{
            left: categoryDragPos.x,
            top: categoryDragPos.y,
          }}
        >
          <div className="category-drag-header">
            <span className="category-drag-name">{draggedCategory}</span>
            <span className="category-drag-count">
              {groupedItems[draggedCategory]?.length || 0} items
            </span>
          </div>
        </div>
      )}

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="celebration-overlay" onClick={() => setShowCelebration(false)}>
          <div className="celebration-content">
            <div className="celebration-icon">✓</div>
            <h2>All Packed!</h2>
            <p>You're ready for your trip</p>
            <button className="celebration-dismiss" onClick={() => setShowCelebration(false)}>
              Let's Go!
            </button>
          </div>
          <div className="confetti">
            {[...Array(50)].map((_, i) => (
              <div key={i} className="confetti-piece" style={{
                '--delay': `${Math.random() * 3}s`,
                '--x': `${Math.random() * 100}vw`,
                '--color': ['#6366f1', '#ec4899', '#10b981', '#f97316', '#8b5cf6'][Math.floor(Math.random() * 5)]
              }} />
            ))}
          </div>
        </div>
      )}
      </div>

      {/* Partner's list (desktop only) */}
      {showPartnerList && partnerToken && isDesktop && (
        <PartnerList
          items={partnerItems}
          settings={partnerSettings}
          ownerName={partnerName}
          loading={partnerLoading}
          error={partnerError}
          onRemove={handleRemovePartner}
        />
      )}

      {/* Partner token modal */}
      {showPartnerModal && (
        <div className="modal-overlay" onClick={() => setShowPartnerModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add Partner's List</h2>
            <p>Enter your partner's share token to view their packing list side by side.</p>
            <form onSubmit={handleAddPartner}>
              <input
                type="text"
                value={partnerTokenInput}
                onChange={e => setPartnerTokenInput(e.target.value)}
                placeholder="Paste share token here"
                autoFocus
              />
              <div className="modal-actions">
                <button type="button" className="modal-btn secondary" onClick={() => setShowPartnerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn primary" disabled={!partnerTokenInput.trim()}>
                  Add Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
