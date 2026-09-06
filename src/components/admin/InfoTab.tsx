import { useState } from 'react';
import type { Restaurant } from '../../schemas/restaurant.schema';

interface InfoTabProps {
  config: Restaurant;
  updateConfig: (patch: Record<string, any>) => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const DAYS_DISPLAY: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

export default function InfoTab({ config, updateConfig }: InfoTabProps) {
  const contact = config.contact || {};
  const hours = config.hours || { regular: {} };

  function updateContact(patch: Record<string, any>) {
    updateConfig({ contact: { ...contact, ...patch } });
  }

  function updateHours(day: string, value: string) {
    updateConfig({
      hours: {
        ...hours,
        regular: { ...hours.regular, [day]: value },
      },
    });
  }

  function updateTheme(patch: Record<string, any>) {
    updateConfig({ theme: { ...config.theme, ...patch } });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Basic Info */}
      <Section title="Basic Info">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Field label="Restaurant Name">
            <Input value={config.name} onChange={v => updateConfig({ name: v })} placeholder="Bella Italia" />
          </Field>
          <Field label="Slug">
            <Input value={config.slug} disabled placeholder="bella-italia" hint="Matches folder name (read-only)" />
          </Field>
          <Field label="Tagline" className="col-span-2">
            <Input value={config.tagline || ''} onChange={v => updateConfig({ tagline: v })} placeholder="Authentic Italian Cuisine Since 1985" />
          </Field>
          <Field label="Description" className="col-span-2">
            <Textarea value={config.description || ''} onChange={v => updateConfig({ description: v })} placeholder="Family-run Italian trattoria..." rows={3} />
          </Field>
          <Field label="Cuisine Tags">
            <TagInput
              tags={config.cuisine || []}
              onChange={tags => updateConfig({ cuisine: tags })}
              placeholder="Add cuisine tag"
            />
          </Field>
          <Field label="Price Range">
            <Select value={config.priceRange || '$$'} onChange={v => updateConfig({ priceRange: v })} options={[
              { value: '$', label: '$ — Budget' },
              { value: '$$', label: '$$ — Moderate' },
              { value: '$$$', label: '$$$ — Upscale' },
              { value: '$$$$', label: '$$$$ — Fine Dining' },
            ]} />
          </Field>
        </div>
      </Section>

      {/* Cover Image */}
      <Section title="Branding">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Field label="Cover Image URL">
            <Input value={config.coverImage || ''} onChange={v => updateConfig({ coverImage: v })} placeholder="https://images.unsplash.com/..." />
          </Field>
          <Field label="Logo">
            <Input value={config.logo || ''} onChange={v => updateConfig({ logo: v })} placeholder="logo.svg" hint="File in assets/ folder" />
          </Field>
          {config.coverImage && (
            <div style={{ gridColumn: '1 / -1' }}>
              <img
                src={config.coverImage}
                alt="Cover"
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
                onError={e => (e.currentTarget as HTMLImageElement).style.display = 'none'}
              />
            </div>
          )}
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Field label="Phone">
            <Input value={contact.phone || ''} onChange={v => updateContact({ phone: v })} placeholder="+1-555-0100" />
          </Field>
          <Field label="WhatsApp">
            <Input value={contact.whatsapp || ''} onChange={v => updateContact({ whatsapp: v })} placeholder="+1-555-0100" />
          </Field>
          <Field label="Email">
            <Input value={contact.email || ''} onChange={v => updateContact({ email: v })} placeholder="info@restaurant.com" />
          </Field>
          <Field label="Address">
            <Input value={contact.address || ''} onChange={v => updateContact({ address: v })} placeholder="123 Main St, City" />
          </Field>
          <Field label="Google Maps URL" className="col-span-2">
            <Input value={contact.googleMapsUrl || ''} onChange={v => updateContact({ googleMapsUrl: v })} placeholder="https://maps.google.com/?q=..." />
          </Field>
        </div>
      </Section>

      {/* Hours */}
      <Section title="Business Hours">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DAYS.map(day => (
            <div key={day} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', gap: 12, alignItems: 'center' }}>
              <span style={{ color: 'var(--admin-text-muted)', fontSize: 14, fontWeight: 500 }}>{DAYS_DISPLAY[day]}</span>
              <Input
                value={hours.regular?.[day] || ''}
                onChange={v => updateHours(day, v)}
                placeholder="11:00-22:00 or Closed"
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={(hours.regular?.[day] || '').toLowerCase() === 'closed'}
                  onChange={e => updateHours(day, e.target.checked ? 'Closed' : '')}
                />
                Closed
              </label>
            </div>
          ))}
        </div>
      </Section>

      {/* Story */}
      <Section title="Restaurant Story">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Field label="Story Heading">
            <Input value={config.story?.heading || ''} onChange={v => updateConfig({ story: { ...config.story, heading: v, body: config.story?.body || '' } })} placeholder="Our Story" />
          </Field>
          <Field label="Story Body">
            <Textarea value={config.story?.body || ''} onChange={v => updateConfig({ story: { ...config.story, body: v } })} placeholder="Founded in 1985 by..." rows={4} />
          </Field>
        </div>
      </Section>
    </div>
  );
}

// Reusable field components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--admin-card)',
      border: '1px solid var(--admin-border)',
      borderRadius: 12,
      padding: 24,
    }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: 'var(--admin-text)' }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children, hint, className }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text-muted)' }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}>{hint}</span>}
    </div>
  );
}

function Input({ value, onChange, placeholder, disabled, hint }: {
  value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; hint?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '10px 12px',
        background: disabled ? 'var(--admin-surface)' : 'var(--admin-surface)',
        border: `1px solid ${disabled ? 'var(--admin-border)' : 'var(--admin-border)'}`,
        borderRadius: 8,
        color: disabled ? 'var(--admin-text-dim)' : 'var(--admin-text)',
        fontSize: 14,
        fontFamily: 'var(--admin-font-body)',
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'text',
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        padding: '10px 12px',
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
        borderRadius: 8,
        color: 'var(--admin-text)',
        fontSize: 14,
        fontFamily: 'var(--admin-font-body)',
        outline: 'none',
        resize: 'vertical',
      }}
    />
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '10px 12px',
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
        borderRadius: 8,
        color: 'var(--admin-text)',
        fontSize: 14,
        fontFamily: 'var(--admin-font-body)',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function TagInput({ tags, onChange, placeholder }: {
  tags: string[]; onChange: (tags: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState('');
  function addTag() {
    const t = input.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8 }}>
      {tags.map(tag => (
        <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--admin-accent-soft)', color: 'var(--admin-accent)', borderRadius: 6, fontSize: 13 }}>
          {tag}
          <button onClick={() => onChange(tags.filter(t => t !== tag))} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
        placeholder={tags.length ? '' : placeholder}
        style={{ flex: 1, minWidth: 80, background: 'none', border: 'none', color: 'var(--admin-text)', fontSize: 14, outline: 'none', fontFamily: 'var(--admin-font-body)' }}
      />
    </div>
  );
}
