import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  browserLocalPersistence,
  setPersistence,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
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
  const [emailLinkSent, setEmailLinkSent] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};

    const initAuth = async () => {
      try {
        // Set persistence to local (survives browser restart)
        await setPersistence(auth, browserLocalPersistence);

        // Check if this is an email link sign-in
        if (isSignInWithEmailLink(auth, window.location.href)) {
          let email = window.localStorage.getItem('emailForSignIn');
          if (!email) {
            // User opened the link on a different device, ask for email
            email = window.prompt('Please provide your email for confirmation');
          }
          if (email) {
            try {
              const result = await signInWithEmailLink(auth, email, window.location.href);
              console.log('Email link sign-in successful:', result.user.email);
              window.localStorage.removeItem('emailForSignIn');
              // Clean up the URL
              window.history.replaceState(null, '', window.location.pathname);
              setUser(result.user);
              setLoading(false);
              return;
            } catch (emailLinkError) {
              console.error('Email link sign-in error:', emailLinkError);
              setError(emailLinkError.message);
            }
          }
        }

        // Check for redirect result (for mobile sign-in)
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

      // Try popup first (works on most browsers including mobile Safari)
      // Fall back to redirect if popup is blocked
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (popupError) {
        console.log('Popup failed, trying redirect:', popupError.code);
        // If popup was blocked or failed, try redirect
        if (popupError.code === 'auth/popup-blocked' ||
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, googleProvider);
        } else {
          throw popupError;
        }
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

  const sendEmailLink = async (email) => {
    setError(null);
    const actionCodeSettings = {
      // URL to redirect to after email link is clicked
      url: window.location.origin + window.location.pathname,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Save the email locally to complete sign-in if opened on same device
      window.localStorage.setItem('emailForSignIn', email);
      setEmailLinkSent(true);
      return true;
    } catch (error) {
      console.error('Send email link error:', error);
      setError(error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    emailLinkSent,
    login,
    logout,
    sendEmailLink
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
