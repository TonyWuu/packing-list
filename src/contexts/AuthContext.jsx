import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set persistence to local (survives browser restart)
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    // Check for redirect result (for mobile sign-in)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error('Redirect result error:', error);
        // Don't show error for redirect cancelled/closed
        if (error.code !== 'auth/redirect-cancelled-by-user') {
          setError(error.message);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    setError(null);
    try {
      // Set persistence before sign in
      await setPersistence(auth, browserLocalPersistence);

      // For mobile browsers, use redirect (works better than popup)
      // Note: iOS standalone PWA is handled in the Login component
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        // Desktop: use popup
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
