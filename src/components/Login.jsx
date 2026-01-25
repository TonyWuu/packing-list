import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

// Detect if we're in standalone PWA mode on iOS
const isIOSStandalone = () => {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  return isIOS && isStandalone;
};

export default function Login() {
  const { login, error } = useAuth();
  const [showPWAHelp, setShowPWAHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLogin = async () => {
    // For iOS standalone PWA, show help message
    if (isIOSStandalone()) {
      setShowPWAHelp(true);
      return;
    }

    try {
      await login();
    } catch (error) {
      console.error('Failed to login:', error);
    }
  };

  const copyUrl = async () => {
    const url = window.location.origin + window.location.pathname;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Packing List</h1>
        <p>Track what to pack. Never forget anything again.</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {showPWAHelp ? (
          <div className="pwa-help">
            <p className="pwa-help-title">Sign in via Safari</p>
            <p className="pwa-help-text">
              To sign in, please open this app in Safari:
            </p>
            <ol className="pwa-help-steps">
              <li>Copy the link below</li>
              <li>Open <strong>Safari</strong> and paste the link</li>
              <li>Sign in with Google</li>
              <li>Return to this app - you'll be signed in!</li>
            </ol>
            <button onClick={copyUrl} className="google-btn copy-btn">
              {copied ? (
                <>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                  Copy Link
                </>
              )}
            </button>
            <button onClick={() => setShowPWAHelp(false)} className="back-link">
              Back
            </button>
          </div>
        ) : (
          <button onClick={handleLogin} className="google-btn">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  );
}
