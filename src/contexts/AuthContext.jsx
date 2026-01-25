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
    let unsubscribe = () => {};

    const initAuth = async () => {
      try {
        // Set persistence to local (survives browser restart)
        await setPersistence(auth, browserLocalPersistence);

        // Check for redirect result FIRST (for mobile sign-in)
        // This must happen before onAuthStateChanged to properly capture redirect
        try {
          const result = await getRedirectResult(auth);
          if (result?.user) {
            console.log('Redirect sign-in successful:', result.user.email);
            setUser(result.user);
            setLoading(false);
          }
        } catch (redirectError) {
          console.error('Redirect result error:', redirectError);
          if (redirectError.code !== 'auth/redirect-cancelled-by-user') {
            setError(redirectError.message);
          }
        }

        // Always set up auth state listener (handles sign-out, token refresh, etc.)
        unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('Auth state changed:', user?.email || 'signed out');
          setUser(user);
          setLoading(false);
        });
      } catch (err) {
        console.error('Auth init error:', err);
        setLoading(false);
      }
    };

    initAuth();

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setError(null);
    try {
      // Set persistence before sign in
      await setPersistence(auth, browserLocalPersistence);

      // For mobile browsers, use redirect (works better than popup)
      // Note: iOS standalone PWA is handled in the Login component
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        // Store a flag to know we're expecting a redirect
        sessionStorage.setItem('authRedirectPending', 'true');
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
