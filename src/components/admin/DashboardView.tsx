import { useEffect, useState } from 'react';
import { LogOut, ExternalLink, Settings, Plus } from 'lucide-react';
import { getRestaurants, getRestaurantConfig } from '../../lib/admin/api';
import { BASE_PATH } from '../../lib/base';
import { clearStoredToken } from './LoginScreen';

interface DashboardProps {
  token: string;
  onSelectRestaurant: (slug: string) => void;
  onNewRestaurant: () => void;
}

interface RestaurantSummary {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  template?: string;
  menuItemCount: number;
  categoryCount: number;
}

export default function DashboardView({ token, onSelectRestaurant, onNewRestaurant }: DashboardProps) {
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const slugs = await getRestaurants();
      const summaries = await Promise.all(
        slugs.map(async (slug) => {
          const config = await getRestaurantConfig(slug);
          return {
            slug,
            name: config.name,
            tagline: config.tagline,
            description: config.description,
            template: config.template,
            menuItemCount: (config.menu || []).reduce((sum: number, c: any) => sum + (c.items?.length || 0), 0),
            categoryCount: config.menu?.length || 0,
          } as RestaurantSummary;
        })
      );
      setRestaurants(summaries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearStoredToken();
    window.location.reload();
  }

  const totalItems = restaurants.reduce((s, r) => s + r.menuItemCount, 0);
  const totalCategories = restaurants.reduce((s, r) => s + r.categoryCount, 0);

  return (
    <div className="admin-app" style={{ minHeight: '100vh' }}>
      <header style={{
        background: 'var(--admin-surface)',
        borderBottom: '1px solid var(--admin-border)',
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--admin-text)', fontFamily: 'var(--admin-font-body)' }}>
            MenuProject Admin
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
            Manage all your restaurants from one place
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={onNewRestaurant} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 16px',
            background: 'var(--admin-accent)', color: '#0F0F0F',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--admin-font-body)',
          }}><Plus size={16} /> New Restaurant</button>
          <button onClick={handleLogout} title="Log out" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 14px',
            background: 'transparent', color: 'var(--admin-text-muted)',
            border: '1px solid var(--admin-border)', borderRadius: 8, fontSize: 14,
            cursor: 'pointer', fontFamily: 'var(--admin-font-body)',
          }}><LogOut size={16} /> Logout</button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}>
          {[
            { label: 'Restaurants', value: restaurants.length },
            { label: 'Menu Items', value: totalItems },
            { label: 'Categories', value: totalCategories },
            { label: 'Avg items / restaurant', value: restaurants.length ? Math.round(totalItems / restaurants.length) : 0 },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'var(--admin-card)',
              border: '1px solid var(--admin-border)',
              borderRadius: 12,
              padding: 20,
            }}>
              <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 32, fontWeight: 600, color: 'var(--admin-text)', fontFamily: 'var(--admin-font-heading)' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--admin-text)' }}>Your Restaurants</h2>

        {loading && <p style={{ color: 'var(--admin-text-muted)' }}>Loading…</p>}
        {error && <p style={{ color: 'var(--admin-danger)' }}>{error}</p>}

        {!loading && !error && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}>
            {restaurants.map((r) => (
              <div key={r.slug} style={{
                background: 'var(--admin-card)',
                border: '1px solid var(--admin-border)',
                borderRadius: 12,
                padding: 20,
                transition: 'border-color 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    background: 'var(--admin-accent-soft)',
                    color: 'var(--admin-accent)',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>{r.template || 'default'}</div>
                  <button
                    onClick={() => window.open(`${BASE_PATH}/r/${r.slug}/`, '_blank')}
                    title="View public menu"
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--admin-text-muted)', cursor: 'pointer',
                      padding: 4, display: 'flex', alignItems: 'center',
                    }}><ExternalLink size={16} /></button>
                </div>
                <h3 style={{ margin: '0 0 4px', fontSize: 20, color: 'var(--admin-text)', fontFamily: 'var(--admin-font-heading)', fontWeight: 500 }}>
                  {r.name}
                </h3>
                {r.tagline && (
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--admin-text-muted)' }}>{r.tagline}</p>
                )}
                <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 13, color: 'var(--admin-text-dim)' }}>
                  <span>{r.menuItemCount} items</span>
                  <span>·</span>
                  <span>{r.categoryCount} categories</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                  <button onClick={() => onSelectRestaurant(r.slug)} style={{
                    flex: 1, padding: '10px 14px',
                    background: 'var(--admin-accent)', color: '#0F0F0F',
                    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--admin-font-body)',
                  }}>Edit</button>
                  <button onClick={() => window.open(`${BASE_PATH}/r/${r.slug}/`, '_blank')} style={{
                    padding: '10px 14px',
                    background: 'transparent', color: 'var(--admin-text-muted)',
                    border: '1px solid var(--admin-border)', borderRadius: 8, fontSize: 14,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: 'var(--admin-font-body)',
                  }}><Settings size={14} /> Preview</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
