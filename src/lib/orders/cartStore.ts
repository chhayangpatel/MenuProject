/**
 * Cart store: the single source of truth for the diner's cart.
 *
 * Why this exists (not React state inside OrderingFlow): the menu cards are
 * static Astro markup (10 different templates), and ItemDetailSheet — a
 * separate React island — needs to share cart writes with the checkout
 * island (`OrderingFlow`). Both read/write here, staying in sync via window
 * events — no prop threading through every template, no duplicate state.
 *
 * Events:
 *  - `cart-changed`  → fired after every mutation; all UI re-reads.
 *  - `add-to-order`  → legacy single-add (routed through addItem so there is
 *    exactly ONE write path).
 *
 * Persistence: sessionStorage (per-tab = one diner/table), keyed per
 * restaurant slug so the cart survives reloads but never leaks across
 * restaurants on the same device.
 */
export interface CartLine {
    item_id: string;
    name: string;
    price: number;
    qty: number;
}

export interface CartSnapshot {
    lines: CartLine[];
    count: number;
    total: number;
}

const MAX_QTY = 20;

function storageKey(): string {
    const slug =
        (typeof window !== 'undefined' && window.__RESTAURANT_SLUG__) || 'default';
    return `of-cart:${slug}`;
}

declare global {
    interface Window {
        __RESTAURANT_SLUG__?: string;
    }
}

let lines: CartLine[] = [];

if (typeof window !== 'undefined') {
    // Restore a saved cart for this tab (one tab = one table).
    try {
        const raw = sessionStorage.getItem(storageKey());
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) {
            lines = parsed.filter(
                (l): l is CartLine =>
                    !!l &&
                    typeof l.item_id === 'string' &&
                    typeof l.name === 'string' &&
                    typeof l.price === 'number' &&
                    typeof l.qty === 'number' &&
                    l.qty > 0,
            );
        }
    } catch {
        /* corrupted storage — start empty */
    }
}

function persist() {
    try {
        sessionStorage.setItem(storageKey(), JSON.stringify(lines));
    } catch {
        /* private mode / quota — cart still works in-memory */
    }
}

function snapshot(): CartSnapshot {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    return { lines: lines.map((l) => ({ ...l })), count, total };
}

function emit() {
    persist();
    const snap = snapshot();
    // Cross-island sync: OrderingFlow + ItemDetailSheet listen for this.
    window.dispatchEvent(new CustomEvent<CartSnapshot>('cart-changed', { detail: snap }));
}

export function subscribeCart(fn: () => void): () => void {
    const handler = () => fn();
    window.addEventListener('cart-changed', handler);
    return () => {
        window.removeEventListener('cart-changed', handler);
    };
}

export function getCart(): CartSnapshot {
    return snapshot();
}

export function getQty(itemId: string): number {
    return lines.find((l) => l.item_id === itemId)?.qty ?? 0;
}

/** Single write path for adding one unit. Returns the new qty. */
export function addItem(item: { item_id: string; name: string; price: number }): number {
    if (!item.item_id) return 0;
    const existing = lines.find((l) => l.item_id === item.item_id);
    if (existing) {
        existing.qty = Math.min(existing.qty + 1, MAX_QTY);
    } else {
        lines.push({ item_id: item.item_id, name: item.name, price: item.price, qty: 1 });
    }
    emit();
    return getQty(item.item_id);
}

/** Change qty by delta; removes the line at 0. Returns the new qty. */
export function changeQty(itemId: string, delta: number): number {
    lines = lines
        .map((l) =>
            l.item_id === itemId ? { ...l, qty: Math.max(0, Math.min(MAX_QTY, l.qty + delta)) } : l,
        )
        .filter((l) => l.qty > 0);
    emit();
    return getQty(itemId);
}

export function clearCart() {
    lines = [];
    emit();
}

// Legacy compat: ItemDetailSheet dispatches `add-to-order`; route it through
// the single write path so the sheet and the inline steppers share state.
if (typeof window !== 'undefined') {
    window.addEventListener('add-to-order', (e: Event) => {
        const detail = (e as CustomEvent<{ item_id: string; name: string; price: number }>).detail;
        if (detail?.item_id) addItem(detail);
    });
}
