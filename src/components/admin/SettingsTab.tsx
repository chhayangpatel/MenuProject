import type { Restaurant } from '../../schemas/restaurant.schema';

interface SettingsTabProps {
  config: Restaurant;
  updateConfig: (patch: Record<string, any>) => void;
}

export default function SettingsTab({ config, updateConfig }: SettingsTabProps) {
  const settings = config.settings || {
    currency: 'USD',
    currencySymbol: '$',
    language: 'en',
    showPrices: true,
    enableSearch: true,
    enableDietaryFilters: true,
  };

  function updateSettings(patch: Record<string, any>) {
    updateConfig({ settings: { ...settings, ...patch } });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <Section title="Regional Settings">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <Field label="Currency">
            <Select value={settings.currency} onChange={v => updateSettings({ currency: v })} options={[
              { value: 'USD', label: 'USD — US Dollar' },
              { value: 'EUR', label: 'EUR — Euro' },
              { value: 'GBP', label: 'GBP — British Pound' },
              { value: 'CAD', label: 'CAD — Canadian Dollar' },
              { value: 'AUD', label: 'AUD — Australian Dollar' },
              { value: 'INR', label: 'INR — Indian Rupee' },
              { value: 'JPY', label: 'JPY — Japanese Yen' },
              { value: 'CNY', label: 'CNY — Chinese Yuan' },
            ]} />
          </Field>
          <Field label="Currency Symbol">
            <Input value={settings.currencySymbol} onChange={v => updateSettings({ currencySymbol: v })} placeholder="$" />
          </Field>
          <Field label="Language">
            <Select value={settings.language} onChange={v => updateSettings({ language: v })} options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español' },
              { value: 'fr', label: 'Français' },
              { value: 'de', label: 'Deutsch' },
              { value: 'it', label: 'Italiano' },
              { value: 'pt', label: 'Português' },
              { value: 'zh', label: '中文' },
              { value: 'ja', label: '日本語' },
            ]} />
          </Field>
        </div>
      </Section>

      <Section title="Menu Display">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Toggle
            label="Show Prices"
            description="Display menu item prices in the public menu"
            checked={settings.showPrices}
            onChange={v => updateSettings({ showPrices: v })}
          />
          <Toggle
            label="Enable Search"
            description="Show a search bar at the top of the menu page"
            checked={settings.enableSearch}
            onChange={v => updateSettings({ enableSearch: v })}
          />
          <Toggle
            label="Enable Dietary Filters"
            description="Show vegetarian, vegan, gluten-free filter chips"
            checked={settings.enableDietaryFilters}
            onChange={v => updateSettings({ enableDietaryFilters: v })}
          />
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 12px',
        background: 'var(--admin-surface)', border: '1px solid var(--admin-border)',
        borderRadius: 8, color: 'var(--admin-text)', fontSize: 14,
        fontFamily: 'var(--admin-font-body)', outline: 'none',
      }}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '10px 12px',
        background: 'var(--admin-surface)', border: '1px solid var(--admin-border)',
        borderRadius: 8, color: 'var(--admin-text)', fontSize: 14,
        fontFamily: 'var(--admin-font-body)', outline: 'none', cursor: 'pointer',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--admin-surface)', borderRadius: 10 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--admin-text)' }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginTop: 2 }}>{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        style={{
          width: 48, height: 28, borderRadius: 14, position: 'relative',
          background: checked ? 'var(--admin-accent)' : 'var(--admin-border)',
          border: 'none', cursor: 'pointer', transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <span style={{
          display: 'block', width: 22, height: 22, borderRadius: '50%',
          background: checked ? '#0F0F0F' : '#888',
          position: 'absolute', top: 3,
          left: checked ? 23 : 3,
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );
}
