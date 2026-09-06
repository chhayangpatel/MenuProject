import { useState } from 'react';
import type { Restaurant } from '../../schemas/restaurant.schema';
import type { TemplateId } from '../../lib/templates/registry';
import { basePath } from '../../lib/base';

const TEMPLATES: { id: TemplateId; label: string; description: string; mood: string }[] = [
  { id: 'editorial-classic', label: 'Editorial Classic', description: 'Refined, editorial typography', mood: 'Fine Dining' },
  { id: 'modern-minimal', label: 'Modern Minimal', description: 'Clean, understated design', mood: 'Modern' },
  { id: 'bold-street', label: 'Bold Street', description: 'Vibrant, energetic visuals', mood: 'Casual' },
  { id: 'warm-rustic', label: 'Warm Rustic', description: 'Earthy, inviting warmth', mood: 'Rustic' },
  { id: 'vibrant-playful', label: 'Vibrant Playful', description: 'Colorful and fun', mood: 'Casual' },
  { id: 'dark-luxe', label: 'Dark Luxe', description: 'Sophisticated dark aesthetic', mood: 'Fine Dining' },
  { id: 'seaside-coastal', label: 'Seaside Coastal', description: 'Breezy coastal vibes', mood: 'Casual' },
  { id: 'zen-garden', label: 'Zen Garden', description: 'Calm, minimalist focus', mood: 'Minimal' },
  { id: 'retro-diner', label: 'Retro Diner', description: 'Nostalgic Americana', mood: 'Retro' },
  { id: 'artisan-craft', label: 'Artisan Craft', description: 'Artisanal handcrafted feel', mood: 'Artisan' },
];

const BORDER_RADII = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Sm' },
  { value: 'md', label: 'Md' },
  { value: 'lg', label: 'Lg' },
  { value: 'xl', label: 'Xl' },
  { value: 'full', label: 'Full' },
] as const;

interface ThemeTabProps {
  config: Restaurant;
  updateConfig: (patch: Record<string, any>) => void;
  slug: string;
}

export default function ThemeTab({ config, updateConfig, slug }: ThemeTabProps) {
  const theme = config.theme || { primaryColor: '#1A1612', secondaryColor: '#FDFBF7', accentColor: '#C9A227', borderRadius: 'md', mode: 'light' };

  function updateTheme(patch: Record<string, any>) {
    updateConfig({ theme: { ...theme, ...patch } });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Color Palette */}
      <Section title="Color Palette">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { key: 'primaryColor', label: 'Primary Color', value: theme.primaryColor },
            { key: 'secondaryColor', label: 'Secondary Color', value: theme.secondaryColor },
            { key: 'accentColor', label: 'Accent Color', value: theme.accentColor || theme.primaryColor },
          ].map(color => (
            <ColorPicker
              key={color.key}
              label={color.label}
              value={color.value}
              onChange={v => updateTheme({ [color.key]: v })}
            />
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <LivePreview theme={theme} />
        </div>
      </Section>

      {/* Template */}
      <Section title="Design Template">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {TEMPLATES.map(t => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <button
                onClick={() => updateConfig({ template: t.id })}
                style={{
                  padding: 16,
                  background: config.template === t.id ? 'var(--admin-accent-soft)' : 'var(--admin-surface)',
                  border: `2px solid ${config.template === t.id ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  color: config.template === t.id ? 'var(--admin-accent)' : 'var(--admin-text)',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, fontFamily: 'var(--admin-font-body)' }}>{t.label}</div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 4 }}>{t.description}</div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.mood}</div>
              </button>
              <a
                href={`${basePath(`/admin/preview/${slug}/${t.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  background: 'var(--admin-surface)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: 8,
                  color: 'var(--admin-accent)',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'var(--admin-font-body)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-accent-soft)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--admin-surface)'; }}
              >
                <span style={{ fontSize: 14 }}>🔍</span>
                Preview
              </a>
            </div>
          ))}
        </div>
      </Section>

      {/* Border Radius + Mode */}
      <Section title="Style Options">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--admin-text-muted)', marginBottom: 12 }}>Border Radius</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {BORDER_RADII.map(r => (
                <button
                  key={r.value}
                  onClick={() => updateTheme({ borderRadius: r.value })}
                  style={{
                    flex: 1, padding: '8px 4px',
                    background: theme.borderRadius === r.value ? 'var(--admin-accent-soft)' : 'var(--admin-surface)',
                    border: `1px solid ${theme.borderRadius === r.value ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                    borderRadius: 6,
                    color: theme.borderRadius === r.value ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'var(--admin-font-body)',
                  }}
                >{r.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--admin-text-muted)', marginBottom: 12 }}>Mode</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['light', 'dark'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => updateTheme({ mode })}
                  style={{
                    flex: 1, padding: '10px',
                    background: theme.mode === mode ? (mode === 'dark' ? '#27272A' : 'var(--admin-surface)') : 'var(--admin-surface)',
                    border: `1px solid ${theme.mode === mode ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                    borderRadius: 8,
                    color: theme.mode === mode ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                    fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontFamily: 'var(--admin-font-body)',
                  }}
                >{mode}</button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Logo Upload */}
      <Section title="Logo">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--admin-text-muted)', marginBottom: 6 }}>Logo File</label>
            <input
              type="text"
              value={config.logo || ''}
              onChange={e => updateConfig({ logo: e.target.value })}
              placeholder="logo.svg"
              style={{ width: '100%', padding: '10px 12px', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, color: 'var(--admin-text)', fontSize: 14, outline: 'none', fontFamily: 'var(--admin-font-body)' }}
            />
            <p style={{ fontSize: 12, color: 'var(--admin-text-dim)', marginTop: 4 }}>File path in assets/ folder (e.g. logo.svg)</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100, background: theme.secondaryColor || '#FDFBF7', borderRadius: 8, border: '1px solid var(--admin-border)' }}>
            <span style={{ fontSize: 13, color: theme.primaryColor || '#1A1612', fontFamily: 'var(--admin-font-heading)', fontWeight: 500 }}>
              {config.name || 'Restaurant Name'}
            </span>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', borderRadius: 12, padding: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: 'var(--admin-text)' }}>{title}</h2>
      {children}
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text-muted)' }}>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ width: 44, height: 44, padding: 4, background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, cursor: 'pointer' }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={e => {
            const v = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
          }}
          onBlur={e => {
            const v = e.target.value;
            if (!v.startsWith('#')) onChange('#' + v);
          }}
          placeholder="#000000"
          style={{ flex: 1, padding: '10px 12px', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, color: 'var(--admin-text)', fontSize: 14, outline: 'none', fontFamily: 'monospace' }}
        />
      </div>
    </div>
  );
}

function LivePreview({ theme }: { theme: any }) {
  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text-muted)', marginBottom: 12 }}>Live Preview</p>
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center',
        padding: 20, borderRadius: 10,
        background: theme.secondaryColor || '#FDFBF7',
        border: `2px solid ${theme.primaryColor || '#1A1612'}`,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: theme.borderRadius === 'full' ? '50%' : theme.borderRadius === 'none' ? 0 : 8,
          background: theme.primaryColor || '#1A1612',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: theme.secondaryColor || '#FDFBF7',
          fontSize: 20, fontWeight: 700, fontFamily: 'var(--admin-font-heading)',
        }}>M</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: theme.primaryColor || '#1A1612', fontFamily: 'var(--admin-font-heading)' }}>Restaurant Name</div>
          <div style={{ fontSize: 13, color: theme.primaryColor ? `color-mix(in srgb, ${theme.primaryColor} 60%, black)` : '#555' }}>Menu · $ · Italian</div>
        </div>
        <div style={{ padding: '8px 16px', background: theme.accentColor || theme.primaryColor || '#C9A227', color: theme.secondaryColor || '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          View Menu
        </div>
      </div>
    </div>
  );
}
