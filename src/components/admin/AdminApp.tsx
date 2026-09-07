import { useState, useEffect } from 'react';
import { getStoredToken } from './LoginScreen';
import LoginScreen from './LoginScreen';
import DashboardView from './DashboardView';
import RestaurantEditor from './RestaurantEditor';
import NewRestaurantWizard from './NewRestaurantWizard';

type AdminView = 'dashboard' | 'editor' | 'new';

export default function AdminApp() {
  // Start with null so the prerendered HTML (no token) matches the first
  // client render — reading localStorage during initial render causes a
  // React hydration mismatch. We sync from storage after mount instead.
  const [token, setToken] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [view, setView] = useState<AdminView>('dashboard');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    // Restore persisted token after mount (hydration-safe)
    const stored = getStoredToken();
    if (stored) {
      setToken(stored);
      localStorage.setItem('menu_admin_token', stored);
    }

    // When the API layer detects a fully-expired session (refresh failed),
    // it clears the stale token and emits this event — return to login
    // with a friendly notice instead of leaving the user on a broken screen.
    function handleSessionExpired() {
      setToken(null);
      setSessionExpired(true);
      setView('dashboard');
      setSelectedSlug(null);
    }
    window.addEventListener('menu_admin_session_expired', handleSessionExpired);
    return () => window.removeEventListener('menu_admin_session_expired', handleSessionExpired);
  }, []);

  function handleLogin() {
    setToken(getStoredToken());
    setSessionExpired(false);
    setView('dashboard');
  }

  function handleSelectRestaurant(slug: string) {
    setSelectedSlug(slug);
    setView('editor');
  }

  function handleNewRestaurant() {
    setView('new');
  }

  function handleBackToDashboard() {
    setView('dashboard');
    setSelectedSlug(null);
  }

  if (!token) {
    return <LoginScreen onLogin={handleLogin} sessionExpired={sessionExpired} />;
  }

  if (view === 'editor' && selectedSlug) {
    return (
      <RestaurantEditor
        slug={selectedSlug}
        token={token}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (view === 'new') {
    return (
      <NewRestaurantWizard
        token={token}
        onBack={handleBackToDashboard}
        onCreated={(slug) => {
          setSelectedSlug(slug);
          setView('editor');
        }}
      />
    );
  }

  return (
    <DashboardView
      token={token}
      onSelectRestaurant={handleSelectRestaurant}
      onNewRestaurant={handleNewRestaurant}
    />
  );
}
