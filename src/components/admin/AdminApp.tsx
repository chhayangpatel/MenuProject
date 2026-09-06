import { useState, useEffect } from 'react';
import { getStoredToken } from './LoginScreen';
import LoginScreen from './LoginScreen';
import DashboardView from './DashboardView';
import RestaurantEditor from './RestaurantEditor';
import NewRestaurantWizard from './NewRestaurantWizard';

type AdminView = 'dashboard' | 'editor' | 'new';

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [view, setView] = useState<AdminView>('dashboard');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    // Check if token is still valid on mount
    if (token) {
      localStorage.setItem('menu_admin_token', token);
    }
  }, [token]);

  function handleLogin() {
    setToken(getStoredToken());
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
    return <LoginScreen onLogin={handleLogin} />;
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
