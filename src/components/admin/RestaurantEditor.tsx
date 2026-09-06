import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Info, Palette, Settings as SettingsIcon, Utensils } from 'lucide-react';
import { getRestaurantConfig, saveRestaurant } from '../../lib/admin/api';
import InfoTab from './InfoTab';
import ThemeTab from './ThemeTab';
import SettingsTab from './SettingsTab';
import MenuTab from './MenuTab';

interface RestaurantEditorProps {
  slug: string;
  token: string;
  onBack: () => void;
}

type Tab = 'info' | 'theme' | 'menu' | 'settings';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'info', label: 'Info', icon: Info },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'menu', label: 'Menu', icon: Utensils },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function RestaurantEditor({ slug, token, onBack }: RestaurantEditorProps) {
  const [config, setConfig] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, [slug]);

  async function loadConfig() {
    try {
      const data = await getRestaurantConfig(slug);
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setSaveStatus('saving');
    try {
      await saveRestaurant(slug, config, token);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  function updateConfig(patch: Record<string, any>) {
    setConfig((prev: any) => ({ ...prev, ...patch }));
  }

  if (error) {
    return (
      <div className="admin-app" style={{ padding: 32, color: 'var(--admin-danger)' }}>
        Error: {error}
      </div>
    );
  }

  if (!config) {
    return <div className="admin-app" style={{ padding: 32, color: 'var(--admin-text-muted)' }}>Loading…</div>;
  }

  return (
    <div className="admin-app" style={{ minHeight: '100vh' }}>
      <header style={{
        background: 'var(--admin-surface)',
        borderBottom: '1px solid var(--admin-border)',
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px',
            background: 'transparent', color: 'var(--admin-text-muted)',
            border: '1px solid var(--admin-border)', borderRadius: 8, fontSize: 14,
            cursor: 'pointer', fontFamily: 'var(--admin-font-body)',
          }}><ArrowLeft size={16} /> Back</button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--admin-text)' }}>
              {config.name}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-text-muted)' }}>
              /{config.slug}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px',
            background: saveStatus === 'saved' ? 'var(--admin-success)' : 'var(--admin-accent)',
            color: '#0F0F0F',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            transition: 'background 0.2s',
            fontFamily: 'var(--admin-font-body)',
          }}
        >
          <Save size={16} />
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'error' ? 'Failed' : 'Save Changes'}
        </button>
      </header>

      <nav style={{
        background: 'var(--admin-surface)',
        borderBottom: '1px solid var(--admin-border)',
        padding: '0 32px',
        display: 'flex',
        gap: 4,
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 18px',
              background: 'transparent', color: isActive ? 'var(--admin-text)' : 'var(--admin-text-muted)',
              border: 'none', borderBottom: `2px solid ${isActive ? 'var(--admin-accent)' : 'transparent'}`,
              fontSize: 14, fontWeight: isActive ? 600 : 500,
              cursor: 'pointer', fontFamily: 'var(--admin-font-body)',
              transition: 'all 0.15s',
            }}>
              <Icon size={16} />{tab.label}
            </button>
          );
        })}
      </nav>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        {activeTab === 'info' && <InfoTab config={config} updateConfig={updateConfig} />}
        {activeTab === 'theme' && <ThemeTab config={config} updateConfig={updateConfig} />}
        {activeTab === 'menu' && <MenuTab config={config} updateConfig={updateConfig} />}
        {activeTab === 'settings' && <SettingsTab config={config} updateConfig={updateConfig} />}
      </main>
    </div>
  );
}
