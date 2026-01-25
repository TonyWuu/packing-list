import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import PackingList from './components/PackingList';
import SharedView from './components/SharedView';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/share/:token" element={<ShareRoute />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <PackingList />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function ShareRoute() {
  const token = window.location.hash.split('/share/')[1];
  return <SharedView token={token} />;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}
