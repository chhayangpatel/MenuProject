import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import type { TemplateId } from '../../lib/templates/registry';
import { createRestaurant } from '../../lib/admin/api';

const TEMPLATES: { id: TemplateId; label: string; description: string }[] = [
  { id: 'editorial-classic', label: 'Editorial Classic', description: 'Refined, editorial typography' },
  { id: 'modern-minimal', label: 'Modern Minimal', description: 'Clean, understated design' },
  { id: 'bold-street', label: 'Bold Street', description: 'Vibrant, energetic visuals' },
  { id: 'warm-rustic', label: 'Warm Rustic', description: 'Earthy, inviting warmth' },
  { id: 'vibrant-playful', label: 'Vibrant Playful', description: 'Colorful and fun' },
  { id: 'dark-luxe', label: 'Dark Luxe', description: 'Sophisticated dark aesthetic' },
  { id: 'seaside-coastal', label: 'Seaside Coastal', description: 'Breezy coastal vibes' },
  { id: 'zen-garden', label: 'Zen Garden', description: 'Calm, minimalist focus' },
  { id: 'retro-diner', label: 'Retro Diner', description: 'Nostalgic Americana' },
  { id: 'artisan-craft', label: 'Artisan Craft', description: 'Artisanal handcrafted feel' },
];

interface WizardProps {
  token: string;
  onBack: () => void;
  onCreated: (slug: string) => void;
}

type Step = 1 | 2 | 3 | 4;

export default function NewRestaurantWizard({ token, onBack, onCreated }: WizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  // Step 2
  const [template, setTemplate] = useState<TemplateId>('editorial-classic');

  // Step 3
  const [cuisine, setCuisine] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState('$$');
  const [cuisineInput, setCuisineInput] = useState('');

  function generateSlug(n: string): string {
    return n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function handleNameChange(n: string) {
    setName(n);
    if (!slug || slug === generateSlug(n)) {
      setSlug(generateSlug(n));
    }
  }

  function addCuisineTag() {
    const t = cuisineInput.trim();
    if (t && !cuisine.includes(t)) {
      setCuisine([...cuisine, t]);
      setCuisineInput('');
    }
  }

  function removeCuisineTag(t: string) {
    setCuisine(cuisine.filter(c => c !== t));
  }

  function next() {
    if (step === 1 && !name.trim()) { setError('Name is required'); return; }
    if (step === 1 && !slug.trim()) { setError('Slug is required'); return; }
    setError(null);
    if (step < 4) setStep(step + 1);
  }

  function back() {
    if (step === 1) { onBack(); return; }
    setStep(step - 1);
  }

  async function create() {
    if (!name || !slug) return;
    setLoading(true);
    setError(null);
    try {
      const config = {
        slug,
        name,
        tagline: '',
        description: '',
        logo: 'logo.svg',
        coverImage: '',
        cuisine,
        priceRange,
        moodPreset: 'fine-dining',
        template,
        theme: {
          primaryColor: '#1A1612',
          secondaryColor: '#FDFBF7',
          accentColor: '#C9A227',
          borderRadius: 'md',
          mode: 'light',
        },
        settings: {
          currency: 'USD',
          currencySymbol: '$',
          language: 'en',
          showPrices: true,
          enableSearch: true,
          enableDietaryFilters: true,
        },
        menu: [],
      };
      await createRestaurant(slug, config, token);
      onCreated(slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create restaurant');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-app" style={{ minHeight: '100vh' }}>
      <header style={{
        background: 'var(--admin-surface)',
        borderBottom: '1px solid var(--admin-border)',
        padding: '20px 32px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px',
          background: 'transparent', color: 'var(--admin-text-muted)',
          border: '1px solid var(--admin-border)', borderRadius: 8, fontSize: 14,
          cursor: 'pointer', fontFamily: 'var(--admin-font-body)',
        }}><ArrowLeft size={16} /> Back</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--admin-text)' }}>New Restaurant</h1>
      </header>

      {/* Step Indicator */}
      <nav style={{
        background: 'var(--admin-surface)',
        borderBottom: '1px solid var(--admin-border)',
        padding: '16px 32px',
        display: 'flex', gap: 24,
      }}>
        {[
          { num: 1, label: 'Basics', icon: '📝' },
          { num: 2, label: 'Template', icon: '🎨' },
          { num: 3, label: 'Details', icon: '📋' },
          { num: 4, label: 'Create', icon: '✨' },
        ].map(s => (
          <button
            key={s.num}
            disabled={step < s.num && step !== 1}
            onClick={() => { if (step >= s.num) setStep(s.num as Step); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px',
              background: step === s.num ? 'var(--admin-accent-soft)' : 'transparent',
              border: `1px solid ${step === s.num ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
              borderRadius: 8,
              color: step === s.num ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
              fontSize: 13, fontWeight: 500, cursor: step >= s.num ? 'pointer' : 'not-allowed',
              opacity: step >= s.num ? 1 : 0.5,
              fontFamily: 'var(--admin-font-body)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: step > s.num ? 'var(--admin-success)' : step === s.num ? 'var(--admin-accent)' : 'var(--admin-border)', color: step > s.num ? '#0F0F0F' : '#0F0F0F', fontSize: 11, fontWeight: 600 }}>
              {step > s.num ? <Check size={12} /> : s.num}
            </span>
            {s.label}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: 32 }}>
        <form onSubmit={e => e.preventDefault()}>
          {/* Step 1: Basics */}
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.2s' }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: 'var(--admin-text)' }}>Basic Information</h2>
              <p style={{ fontSize: 14, color: 'var(--admin-text-muted)', margin: '0 0 32px' }}>Start by giving your restaurant a name and unique identifier.</p>
              <Field label="Restaurant Name">
                <input
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Bella Italia"
                  style={inputStyle}
                />
              </Field>
              <Field label="Slug">
                <input
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="bella-italia"
                  style={inputStyle}
                />
                <span style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}>Used in URL: /r/{slug}/</span>
              </Field>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                <button type="button" onClick={next} style={buttonStyle}><ArrowRight size={16} /> Continue</button>
              </div>
            </div>
          )}

          {/* Step 2: Template */}
          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.2s' }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: 'var(--admin-text)' }}>Choose a Design Template</h2>
              <p style={{ fontSize: 14, color: 'var(--admin-text-muted)', margin: '0 0 32px' }}>Pick a visual style. You can change this later in the editor.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    style={{
                      padding: 20, textAlign: 'left',
                      background: template === t.id ? 'var(--admin-accent-soft)' : 'var(--admin-surface)',
                      border: `2px solid ${template === t.id ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                      borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: template === t.id ? 'var(--admin-accent)' : 'var(--admin-text)' }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{t.description}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                <button type="button" onClick={back} style={buttonStyleSecondary}><ArrowLeft size={16} /> Back</button>
                <button type="button" onClick={next} style={buttonStyle}><ArrowRight size={16} /> Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.2s' }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: 'var(--admin-text)' }}>Restaurant Details</h2>
              <p style={{ fontSize: 14, color: 'var(--admin-text-muted)', margin: '0 0 32px' }}>Add some basic info to get started.</p>
              <Field label="Cuisine Tags">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8 }}>
                  {cuisine.map(t => (
                    <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--admin-accent-soft)', color: 'var(--admin-accent)', borderRadius: 6, fontSize: 13 }}>
                      {t}
                      <button onClick={() => removeCuisineTag(t)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 14 }}>×</button>
                    </span>
                  ))}
                  <input
                    value={cuisineInput}
                    onChange={e => setCuisineInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCuisineTag(); } }}
                    placeholder="Add cuisine (Italian, Pizza, etc.)"
                    style={{ flex: 1, minWidth: 120, background: 'none', border: 'none', color: 'var(--admin-text)', fontSize: 14, outline: 'none', fontFamily: 'var(--admin-font-body)' }}
                  />
                </div>
              </Field>
              <Field label="Price Range">
                <select value={priceRange} onChange={e => setPriceRange(e.target.value)} style={inputStyle}>
                  <option value="$">$ — Budget</option>
                  <option value="$$">$$ — Moderate</option>
                  <option value="$$$">$$$ — Upscale</option>
                  <option value="$$$$">$$$$ — Fine Dining</option>
                </select>
              </Field>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                <button type="button" onClick={back} style={buttonStyleSecondary}><ArrowLeft size={16} /> Back</button>
                <button type="button" onClick={next} style={buttonStyle}><ArrowRight size={16} /> Continue</button>
              </div>
            </div>
          )}

          {/* Step 4: Create */}
          {step === 4 && (
            <div style={{ animation: 'fadeIn 0.2s' }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: 'var(--admin-text)' }}>Create Restaurant</h2>
              <p style={{ fontSize: 14, color: 'var(--admin-text-muted)', margin: '0 0 32px' }}>Review and create your new restaurant.</p>
              <div style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><p style={{ fontSize: 12, color: 'var(--admin-text-dim)', margin: '0 0 4px' }}>Name</p><p style={{ fontSize: 15, fontWeight: 500, color: 'var(--admin-text)', margin: 0 }}>{name}</p></div>
                  <div><p style={{ fontSize: 12, color: 'var(--admin-text-dim)', margin: '0 0 4px' }}>Slug</p><p style={{ fontSize: 15, fontWeight: 500, color: 'var(--admin-text)', margin: 0 }}>{slug}</p></div>
                  <div><p style={{ fontSize: 12, color: 'var(--admin-text-dim)', margin: '0 0 4px' }}>Template</p><p style={{ fontSize: 15, fontWeight: 500, color: 'var(--admin-text)', margin: 0 }}>{TEMPLATES.find(t => t.id === template)?.label}</p></div>
                  <div><p style={{ fontSize: 12, color: 'var(--admin-text-dim)', margin: '0 0 4px' }}>Price Range</p><p style={{ fontSize: 15, fontWeight: 500, color: 'var(--admin-text)', margin: 0 }}>{priceRange}</p></div>
                  <div><p style={{ fontSize: 12, color: 'var(--admin-text-dim)', margin: '0 0 4px' }}>Cuisine</p><p style={{ fontSize: 15, fontWeight: 500, color: 'var(--admin-text)', margin: 0 }}>{cuisine.join(', ') || '—'}</p></div>
                </div>
              </div>
              {error && (
                <div style={{ marginTop: 16, padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--admin-danger)' }}>{error}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                <button type="button" onClick={back} style={buttonStyleSecondary}><ArrowLeft size={16} /> Back</button>
                <button type="button" onClick={create} disabled={loading} style={buttonStyle}>
                  {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <></>} {loading ? 'Creating…' : 'Create Restaurant'}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: 'var(--admin-surface)', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: 'var(--admin-text)', fontSize: 14,
  fontFamily: 'var(--admin-font-body)', outline: 'none',
};

const buttonStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '12px 20px', background: 'var(--admin-accent)', color: '#0F0F0F',
  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'var(--admin-font-body)',
};

const buttonStyleSecondary: React.CSSProperties = {
  ...buttonStyle,
  background: 'transparent', color: 'var(--admin-text-muted)',
  border: '1px solid var(--admin-border)',
};