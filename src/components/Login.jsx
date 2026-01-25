import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

// Detect if we're in standalone PWA mode
const isStandalonePWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
};

export default function Login() {
  const { login, error, sendEmailLink, emailLinkSent } = useAuth();
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(isStandalonePWA());
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Failed to login:', error);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSendingEmail(true);
    try {
      await sendEmailLink(email.trim());
    } catch (error) {
      console.error('Failed to send email link:', error);
    } finally {
      setSendingEmail(false);
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

        {emailLinkSent ? (
          <div className="email-sent">
            <div className="email-sent-icon">✉️</div>
            <p className="email-sent-title">Check your email</p>
            <p className="email-sent-text">
              We sent a sign-in link to <strong>{email}</strong>.
              Click the link in the email to sign in.
            </p>
            <button onClick={() => window.location.reload()} className="back-link">
              Try again
            </button>
          </div>
        ) : showEmailForm ? (
          <div className="email-form">
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
                autoComplete="email"
                autoFocus
              />
              <button
                type="submit"
                className="google-btn email-btn"
                disabled={sendingEmail || !email.trim()}
              >
                {sendingEmail ? (
                  'Sending...'
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    Send Sign-in Link
                  </>
                )}
              </button>
            </form>
            <button onClick={() => setShowEmailForm(false)} className="back-link">
              Sign in with Google instead
            </button>
          </div>
        ) : (
          <div className="login-options">
            <button onClick={handleLogin} className="google-btn">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
            <button onClick={() => setShowEmailForm(true)} className="back-link">
              Sign in with Email instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
