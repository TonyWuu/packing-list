import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function usePackingList() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState({
    categories: ['Clothes', 'Toiletries', 'Electronics', 'Documents', 'Misc'],
    tripTypes: ['Leisure', 'Business']
  });
  const [shareToken, setShareToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to items
  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const itemsRef = collection(db, 'users', user.uid, 'items');
    const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Listen to settings
  useEffect(() => {
    if (!user) return;

    const settingsRef = doc(db, 'users', user.uid, 'config', 'settings');
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data());
      }
    });

    return unsubscribe;
  }, [user]);

  // Listen to share token
  useEffect(() => {
    if (!user) return;

    const shareRef = doc(db, 'users', user.uid, 'config', 'share');
    const unsubscribe = onSnapshot(shareRef, (snapshot) => {
      if (snapshot.exists()) {
        setShareToken(snapshot.data().token);
      }
    });

    return unsubscribe;
  }, [user]);

  const addItem = async (name, category, tripTypes = []) => {
    if (!user) return;
    // Find max order in this category to add at end
    const categoryItems = items.filter(i => i.category === category);
    const maxOrder = categoryItems.reduce((max, i) => Math.max(max, i.order ?? 0), -1);

    const itemRef = doc(collection(db, 'users', user.uid, 'items'));
    await setDoc(itemRef, {
      name,
      category,
      tripTypes,
      checked: false,
      order: maxOrder + 1,
      createdAt: Date.now()
    });
  };

  const updateItem = async (itemId, updates) => {
    if (!user) return;
    const itemRef = doc(db, 'users', user.uid, 'items', itemId);
    await updateDoc(itemRef, updates);
  };

  const deleteItem = async (itemId) => {
    if (!user) return;
    const itemRef = doc(db, 'users', user.uid, 'items', itemId);
    await deleteDoc(itemRef);
  };

  const toggleItem = async (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      await updateItem(itemId, { checked: !item.checked });
    }
  };

  const resetAllChecks = async () => {
    if (!user || items.length === 0) return;
    const batch = writeBatch(db);
    items.forEach(item => {
      const itemRef = doc(db, 'users', user.uid, 'items', item.id);
      batch.update(itemRef, { checked: false });
    });
    await batch.commit();
  };

  const reorderItems = async (orderedIds, category) => {
    if (!user) return;
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      const itemRef = doc(db, 'users', user.uid, 'items', id);
      batch.update(itemRef, { order: index, category });
    });
    await batch.commit();
  };

  const batchUpdateItems = async (itemIds, updates) => {
    if (!user || itemIds.length === 0) return;
    const batch = writeBatch(db);
    itemIds.forEach(id => {
      const itemRef = doc(db, 'users', user.uid, 'items', id);
      batch.update(itemRef, updates);
    });
    await batch.commit();
  };

  const updateSettings = async (newSettings) => {
    if (!user) return;
    const settingsRef = doc(db, 'users', user.uid, 'config', 'settings');
    await setDoc(settingsRef, newSettings);
  };

  const generateShareToken = async () => {
    if (!user) return null;
    const token = crypto.randomUUID();
    const shareRef = doc(db, 'users', user.uid, 'config', 'share');
    await setDoc(shareRef, { token, userId: user.uid });

    // Also create a public lookup document
    const publicRef = doc(db, 'shares', token);
    await setDoc(publicRef, { userId: user.uid });

    return token;
  };

  const revokeShareToken = async () => {
    if (!user || !shareToken) return;
    const shareRef = doc(db, 'users', user.uid, 'config', 'share');
    const publicRef = doc(db, 'shares', shareToken);
    await deleteDoc(publicRef);
    await deleteDoc(shareRef);
  };

  return {
    items,
    settings,
    shareToken,
    loading,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    resetAllChecks,
    reorderItems,
    batchUpdateItems,
    updateSettings,
    generateShareToken,
    revokeShareToken
  };
}

// Hook for viewing shared lists (no auth required)
export function useSharedList(token) {
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchSharedList = async () => {
      try {
        // Look up the user ID from the share token
        const shareRef = doc(db, 'shares', token);
        const shareSnap = await getDoc(shareRef);

        if (!shareSnap.exists()) {
          setError('Share link not found or expired');
          setLoading(false);
          return;
        }

        const { userId } = shareSnap.data();

        // Listen to their items
        const itemsRef = collection(db, 'users', userId, 'items');
        const unsubItems = onSnapshot(itemsRef, (snapshot) => {
          const itemsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setItems(itemsData);
          setLoading(false);
        });

        // Get their settings
        const settingsRef = doc(db, 'users', userId, 'config', 'settings');
        const unsubSettings = onSnapshot(settingsRef, (snapshot) => {
          if (snapshot.exists()) {
            setSettings(snapshot.data());
          }
        });

        return () => {
          unsubItems();
          unsubSettings();
        };
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSharedList();
  }, [token]);

  return { items, settings, loading, error };
}
