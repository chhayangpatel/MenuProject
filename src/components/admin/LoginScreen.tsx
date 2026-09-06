import { useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { apiFetch } from '../../lib/admin/api';
import {
  getStoredToken,
  setStoredToken,
} from '../../lib/admin/token';

// Re-exported for backward compatibility with existing imports
export { getStoredToken, setStoredToken, clearStoredToken } from '../../lib/admin/token';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error || 'Authentication failed');
        return;
      }
      const data = await res.json() as { token: string };
      setStoredToken(data.token);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-app" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--admin-card)',
        border: '1px solid var(--admin-border)',
        borderRadius: 16,
        padding: 48,
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          margin: '0 auto 24px',
          background: 'var(--admin-accent-soft)',
          borderRadius: 16,
        }}>
          <Lock size={28} color="var(--admin-accent)" />
        </div>
        <h1 style={{
          fontFamily: 'var(--admin-font-heading)',
          fontSize: 28,
          fontWeight: 500,
          textAlign: 'center',
          margin: '0 0 8px',
          color: 'var(--admin-text)',
        }}>Admin Access</h1>
        <p style={{
          textAlign: 'center',
          color: 'var(--admin-text-muted)',
          margin: '0 0 32px',
          fontSize: 14,
        }}>Enter your password to manage restaurants</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
              borderRadius: 8,
              color: 'var(--admin-text)',
              fontSize: 15,
              fontFamily: 'var(--admin-font-body)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--admin-accent)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}
          />
          {error && (
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 6,
              color: 'var(--admin-danger)',
              fontSize: 13,
            }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '14px',
              background: 'var(--admin-accent)',
              color: '#0F0F0F',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !password ? 0.5 : 1,
              transition: 'opacity 0.2s',
              fontFamily: 'var(--admin-font-body)',
            }}
          >{loading ? 'Verifying…' : 'Access Admin'}</button>
        </form>
      </div>
    </div>
  );
}
