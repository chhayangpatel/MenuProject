import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical, Star, Flame, X } from 'lucide-react';
import type { Restaurant, MenuCategory, MenuItem } from '../../schemas/restaurant.schema';

interface MenuTabProps {
  config: Restaurant;
  updateConfig: (patch: Record<string, any>) => void;
}

const DIETARY_TAGS = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
  'nut-free', 'halal', 'kosher', 'organic', 'house-made', 'seasonal'
] as const;

const POPULARITY_OPTIONS = [
  { value: 'most-ordered', label: 'Most Ordered' },
  { value: 'staff-favorite', label: 'Staff Favorite' },
  { value: 'new', label: 'New' },
  { value: 'trending', label: 'Trending' },
] as const;

function generateId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function MenuTab({ config, updateConfig }: MenuTabProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    config.menu?.[0]?.id || null
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(config.menu?.map((c: MenuCategory) => c.id) || [])
  );

  const menu = config.menu || [];

  function updateMenu(newMenu: MenuCategory[]) {
    updateConfig({ menu: newMenu });
  }

  const selectedCategory = menu.find((c: MenuCategory) => c.id === selectedCategoryId);

  function toggleCategory(id: string) {
    const next = new Set(expandedCategories);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCategories(next);
    setSelectedCategoryId(id);
  }

  function addCategory() {
    const name = prompt('Category name:');
    if (!name) return;
    const id = generateId(name);
    if (menu.some((c: MenuCategory) => c.id === id)) {
      alert('Category with this ID already exists.');
      return;
    }
    const newCategory: MenuCategory = { id, name, items: [] };
    updateMenu([...menu, newCategory]);
    setSelectedCategoryId(id);
    setExpandedCategories(prev => new Set([...prev, id]));
  }

  function deleteCategory(id: string) {
    if (!confirm('Delete this category and all its items?')) return;
    updateMenu(menu.filter((c: MenuCategory) => c.id !== id));
    if (selectedCategoryId === id) setSelectedCategoryId(null);
  }

  function updateCategory(id: string, patch: Partial<MenuCategory>) {
    updateMenu(menu.map((c: MenuCategory) => c.id === id ? { ...c, ...patch } : c));
  }

  function addItem() {
    if (!selectedCategoryId) { alert('Select a category first.'); return; }
    const name = prompt('Item name:');
    if (!name) return;
    const id = generateId(name);
    const category = menu.find((c: MenuCategory) => c.id === selectedCategoryId);
    if (category?.items.some((i: MenuItem) => i.id === id)) {
      alert('Item with this ID already exists in this category.');
      return;
    }
    const newItem: MenuItem = {
      id,
      name,
      description: '',
      price: 0,
      available: true,
      featured: false,
      spicyLevel: 0,
      tags: [],
    };
    updateMenu(menu.map((c: MenuCategory) =>
      c.id === selectedCategoryId ? { ...c, items: [...(c.items || []), newItem] } : c
    ));
  }

  function updateItem(categoryId: string, itemId: string, patch: Partial<MenuItem>) {
    updateMenu(menu.map((c: MenuCategory) =>
      c.id === categoryId
        ? { ...c, items: c.items.map((i: MenuItem) => i.id === itemId ? { ...i, ...patch } : i) }
        : c
    ));
  }

  function deleteItem(categoryId: string, itemId: string) {
    if (!confirm('Delete this item?')) return;
    updateMenu(menu.map((c: MenuCategory) =>
      c.id === categoryId ? { ...c, items: c.items.filter((i: MenuItem) => i.id !== itemId) } : c
    ));
  }

  function moveItem(categoryId: string, itemId: string, direction: 'up' | 'down') {
    const category = menu.find((c: MenuCategory) => c.id === categoryId);
    if (!category) return;
    const items = [...category.items];
    const idx = items.findIndex((i: MenuItem) => i.id === itemId);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === items.length - 1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
    updateMenu(menu.map((c: MenuCategory) => c.id === categoryId ? { ...c, items } : c));
  }

  function toggleTag(categoryId: string, itemId: string, tag: string) {
    const category = menu.find((c: MenuCategory) => c.id === categoryId);
    const item = category?.items.find((i: MenuItem) => i.id === itemId);
    if (!item) return;
    const tags = item.tags.includes(tag as any)
      ? (item.tags as any[]).filter((t: string) => t !== tag)
      : [...item.tags, tag];
    updateItem(categoryId, itemId, { tags });
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 0, minHeight: 600 }}>
      {/* Category Sidebar */}
      <div style={{ borderRight: '1px solid var(--admin-border)', paddingRight: 0 }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--admin-border)',
          background: 'var(--admin-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Categories</span>
          <button onClick={addCategory} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 10px',
            background: 'var(--admin-accent)', color: '#0F0F0F',
            border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--admin-font-body)',
          }}><Plus size={13} /> Add</button>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 540 }}>
          {menu.map((cat: MenuCategory) => (
            <div key={cat.id}>
              <button
                onClick={() => toggleCategory(cat.id)}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: selectedCategoryId === cat.id ? 'var(--admin-accent-soft)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--admin-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', textAlign: 'left',
                  borderLeft: `3px solid ${selectedCategoryId === cat.id ? 'var(--admin-accent)' : 'transparent'}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: selectedCategoryId === cat.id ? 'var(--admin-accent)' : 'var(--admin-text)' }}>
                    {cat.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', marginTop: 2 }}>
                    {cat.items?.length || 0} items
                  </div>
                </div>
                {expandedCategories.has(cat.id) ? <ChevronDown size={16} color="var(--admin-text-dim)" /> : <ChevronRight size={16} color="var(--admin-text-dim)" />}
              </button>
              {expandedCategories.has(cat.id) && (
                <div style={{ padding: '8px 16px 8px 28px' }}>
                  <input
                    type="text"
                    value={cat.name}
                    onChange={e => updateCategory(cat.id, { name: e.target.value })}
                    placeholder="Category name"
                    style={{
                      width: '100%', padding: '8px 10px', marginBottom: 8,
                      background: 'var(--admin-surface)', border: '1px solid var(--admin-border)',
                      borderRadius: 6, color: 'var(--admin-text)', fontSize: 13,
                      fontFamily: 'var(--admin-font-body)', outline: 'none',
                    }}
                  />
                  <textarea
                    value={cat.description || ''}
                    onChange={e => updateCategory(cat.id, { description: e.target.value })}
                    placeholder="Category description"
                    rows={2}
                    style={{
                      width: '100%', padding: '8px 10px', marginBottom: 8,
                      background: 'var(--admin-surface)', border: '1px solid var(--admin-border)',
                      borderRadius: 6, color: 'var(--admin-text)', fontSize: 12,
                      fontFamily: 'var(--admin-font-body)', outline: 'none', resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={addItem} style={{
                      flex: 1, padding: '7px', fontSize: 12,
                      background: 'var(--admin-surface)', color: 'var(--admin-text)',
                      border: '1px solid var(--admin-border)', borderRadius: 6, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      fontFamily: 'var(--admin-font-body)',
                    }}><Plus size={12} /> Item</button>
                    <button onClick={() => deleteCategory(cat.id)} style={{
                      padding: '7px 8px', fontSize: 12,
                      background: 'transparent', color: 'var(--admin-danger)',
                      border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, cursor: 'pointer',
                    }}><Trash2 size={12} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {menu.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--admin-text-dim)', fontSize: 13 }}>
              No categories yet.<br />Click "Add" to create one.
            </div>
          )}
        </div>
      </div>

      {/* Items Panel */}
      <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 640 }}>
        {!selectedCategory ? (
          <div style={{ textAlign: 'center', color: 'var(--admin-text-dim)', fontSize: 14, marginTop: 80 }}>
            Select a category to manage items
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--admin-text)' }}>
                {selectedCategory.name} — {selectedCategory.items?.length || 0} items
              </h3>
              <button onClick={addItem} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 14px',
                background: 'var(--admin-accent)', color: '#0F0F0F',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--admin-font-body)',
              }}><Plus size={14} /> Add Item</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(selectedCategory.items || []).map((item: MenuItem, idx: number) => (
                <ItemEditor
                  key={item.id}
                  item={item}
                  categoryId={selectedCategory.id}
                  idx={idx}
                  onUpdate={(patch) => updateItem(selectedCategory.id, item.id, patch)}
                  onDelete={() => deleteItem(selectedCategory.id, item.id)}
                  onMoveUp={() => moveItem(selectedCategory.id, item.id, 'up')}
                  onMoveDown={() => moveItem(selectedCategory.id, item.id, 'down')}
                  onToggleTag={(tag) => toggleTag(selectedCategory.id, item.id, tag)}
                />
              ))}
            </div>

            {(!selectedCategory.items || selectedCategory.items.length === 0) && (
              <div style={{ textAlign: 'center', color: 'var(--admin-text-dim)', fontSize: 13, padding: 40 }}>
                No items in this category yet. Click "Add Item" above.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ItemEditor({
  item, categoryId, idx, onUpdate, onDelete, onMoveUp, onMoveDown, onToggleTag,
}: {
  item: MenuItem;
  categoryId: string;
  idx: number;
  onUpdate: (patch: Partial<MenuItem>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleTag: (tag: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: 'var(--admin-card)',
      border: '1px solid var(--admin-border)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer',
      }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, color: 'var(--admin-text-dim)' }}>
          <button onClick={e => { e.stopPropagation(); onMoveUp(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}>
            <ChevronRight size={14} style={{ transform: 'rotate(-90deg)' }} />
          </button>
          <button onClick={e => { e.stopPropagation(); onMoveDown(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}>
            <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--admin-text)' }}>{item.name}</span>
            {item.featured && <Star size={12} color="var(--admin-accent)" fill="var(--admin-accent)" />}
            {item.spicyLevel > 0 && (
              <span style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: item.spicyLevel }).map((_, i) => (
                  <Flame key={i} size={12} color="var(--admin-danger)" />
                ))}
              </span>
            )}
            {!item.available && (
              <span style={{ padding: '2px 8px', background: 'rgba(239,68,68,0.15)', color: 'var(--admin-danger)', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                Unavailable
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-dim)', marginTop: 2 }}>
            {item.description?.slice(0, 60)}{item.description?.length > 60 ? '…' : ''}
            {item.tags?.length > 0 && ` · ${item.tags.join(', ')}`}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-accent)', fontFamily: 'var(--admin-font-body)' }}>
            ${item.price?.toFixed(2)}
          </span>
          {expanded ? <ChevronDown size={16} color="var(--admin-text-dim)" /> : <ChevronRight size={16} color="var(--admin-text-dim)" />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--admin-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <FieldGroup label="Name">
              <input type="text" value={item.name} onChange={e => onUpdate({ name: e.target.value })} style={inputStyle} />
            </FieldGroup>
            <FieldGroup label="Price ($)">
              <input type="number" value={item.price} onChange={e => onUpdate({ price: parseFloat(e.target.value) || 0 })} min={0} step={0.01} style={inputStyle} />
            </FieldGroup>
            <FieldGroup label="Description" className="col-span-2">
              <textarea value={item.description || ''} onChange={e => onUpdate({ description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </FieldGroup>
            <FieldGroup label="Spicy Level">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {[0, 1, 2, 3].map(level => (
                  <button key={level} onClick={() => onUpdate({ spicyLevel: level })} style={{
                    padding: '8px 12px',
                    background: item.spicyLevel === level ? 'var(--admin-danger)' : 'var(--admin-surface)',
                    border: `1px solid ${item.spicyLevel === level ? 'var(--admin-danger)' : 'var(--admin-border)'}`,
                    borderRadius: 6, color: item.spicyLevel === level ? '#fff' : 'var(--admin-text-muted)',
                    cursor: 'pointer', fontSize: 13, fontFamily: 'var(--admin-font-body)',
                  }}>
                    {level === 0 ? '—' : Array(level).fill('🌶️').join('')}
                  </button>
                ))}
              </div>
            </FieldGroup>
            <FieldGroup label="Popularity">
              <select value={item.popularity || ''} onChange={e => onUpdate({ popularity: e.target.value as any || undefined })} style={inputStyle}>
                <option value="">None</option>
                {POPULARITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="Toggles">
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={item.featured} onChange={e => onUpdate({ featured: e.target.checked })} />
                  Featured
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={item.available} onChange={e => onUpdate({ available: e.target.checked })} />
                  Available
                </label>
              </div>
            </FieldGroup>
          </div>

          {/* Dietary Tags */}
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text-muted)', margin: '0 0 8px' }}>Dietary Tags</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DIETARY_TAGS.map(tag => (
                <button key={tag} onClick={() => onToggleTag(tag)} style={{
                  padding: '5px 10px',
                  background: item.tags?.includes(tag as any) ? 'var(--admin-accent-soft)' : 'var(--admin-surface)',
                  border: `1px solid ${item.tags?.includes(tag as any) ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                  borderRadius: 6, color: item.tags?.includes(tag as any) ? 'var(--admin-accent)' : 'var(--admin-text-dim)',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'var(--admin-font-body)',
                  transition: 'all 0.1s',
                }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onDelete} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              background: 'transparent', color: 'var(--admin-danger)',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, fontSize: 13,
              cursor: 'pointer', fontFamily: 'var(--admin-font-body)',
            }}><Trash2 size={14} /> Delete Item</button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: 'var(--admin-surface)', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: 'var(--admin-text)', fontSize: 13,
  fontFamily: 'var(--admin-font-body)', outline: 'none',
};

function FieldGroup({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: className === 'col-span-2' ? '1 / -1' : undefined }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--admin-text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}
