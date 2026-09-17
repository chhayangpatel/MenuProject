/**
 * Inline add-to-order — dual-mode, template-agnostic (mock Options 1 + 3).
 *
 * Runs only when `window.__ORDERING_ENABLED__` is true (set by the diner
 * page's define:vars script). For every `[data-item-id]` menu card it
 * attaches ONE inline control, chosen by what the card looks like:
 *
 *  • Photo card  → overlay control: a white "ADD +" pill floats on the dish
 *    photo (container gets `.of-has-add` for the scrim); on first add it
 *    flips into a dark-glass − qty + stepper. Target: the card's image
 *    container (`[class$="-img-wrap"]` / `[class$="-item-img"]`).
 *  • Text card   → price pill: the price element itself becomes the tap
 *    target ("$8.99 +"); on first add it springs into a filled − qty +
 *    stepper showing the line's running total.
 *
 * The detail sheet never opens from a card tap in any mode (`setupDetailSheet`
 * in effects.ts is a no-op), so card taps never open a popup — the inline
 * control IS the interaction on ordering pages. Taps touch only the shared
 * cart
 * (`orders/cartStore`). Menu markup is never edited: controls are injected
 * into/onto existing elements, so any template that renders a photo gets the
 * overlay automatically and text rows get the pill. When ordering is off,
 * nothing renders here. Idempotent across astro:page-load.
 */
import { addItem, changeQty, getCart } from '../orders/cartStore';

declare global {
    interface Window {
        __RESTAURANT_ITEMS__?: Array<Record<string, unknown>>;
        /** Set by the diner page's define:vars script when enableOrdering is on. */
        __ORDERING_ENABLED__?: boolean;
        /** Currency symbol for the pill's running line total. */
        __CURRENCY_SYMBOL__?: string;
    }
}

type ItemPayload = { item_id: string; name: string; price: number };
type Entry = {
    card: HTMLElement;
    payload: ItemPayload;
    ovHost?: HTMLElement;
    priceEl?: HTMLElement;
};

const PLUS_SVG =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const MINUS_SVG =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>';

// Image containers end in "-img-wrap"/"-item-img"; modifier variants used
// by placeholder tiles (e.g. "ec-item-img ec-item-img--ph") match the
// contains-clause, so placeholder tiles get the overlay control too.
const IMAGE_SEL =
    '[class$="-img-wrap"], [class$="-item-img"], [class*="-img-wrap--"], [class*="-item-img--"]';
const PRICE_SEL = '[class$="-price"]';

const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function payloadFor(card: HTMLElement): ItemPayload | null {
    const id = card.getAttribute('data-item-id');
    if (!id) return null;
    const item = window.__RESTAURANT_ITEMS__?.find((i) => i.id === id) as
        | { id: string; name?: string; price?: number; available?: boolean }
        | undefined;
    // Sold-out items never show add controls (the RPC enforces it too).
    if (!item || item.available === false) return null;
    return {
        item_id: String(item.id),
        name: String(item.name ?? id),
        price: Number(item.price ?? 0),
    };
}

/** Overlay control on a photo (mock Option 3): ADD pill ⇄ dark-glass stepper. */
function renderOverlay(e: Entry, qty: number) {
    const host = e.ovHost!;
    const name = esc(e.payload.name);
    if (qty === 0) {
        host.innerHTML =
            `<button type="button" data-qa="add" class="of-ov-add" ` +
            `aria-label="Add ${name} to order">ADD ${PLUS_SVG}</button>`;
    } else {
        host.innerHTML =
            `<span class="of-ov-step" role="group" aria-label="Quantity of ${name} in your order">` +
            `<button type="button" data-qa="minus" class="of-minus" aria-label="Remove one ${name}">${MINUS_SVG}</button>` +
            `<b aria-live="polite">${qty}</b>` +
            `<button type="button" data-qa="plus" class="of-plus" aria-label="Add one ${name}">${PLUS_SVG}</button>` +
            `</span>`;
    }
}

/** Price-as-button control on a text row (mock Option 1): pill ⇄ stepper. */
function renderPill(e: Entry, qty: number) {
    const p = e.priceEl!;
    if (!p.dataset.qaHtml) p.dataset.qaHtml = p.innerHTML;
    const name = esc(e.payload.name);
    if (qty === 0) {
        p.classList.add('of-pill');
        p.classList.remove('of-pill-active');
        p.setAttribute('role', 'button');
        p.tabIndex = 0;
        p.setAttribute('aria-label', `Add ${name} to order`);
        p.innerHTML =
            p.dataset.qaHtml +
            `<span class="of-pill-plus" aria-hidden="true">${PLUS_SVG}</span>`;
        p.onclick = () => addItem(e.payload);
        p.onkeydown = (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                addItem(e.payload);
            }
        };
    } else {
        p.classList.add('of-pill', 'of-pill-active');
        p.setAttribute('role', 'group');
        p.setAttribute('aria-label', `Quantity of ${name} in your order`);
        p.tabIndex = -1;
        // Line total only from qty 2 up — at qty 1 it just repeats the unit
        // price next to the + button, which reads as a rendering bug.
        const total =
            qty > 1
                ? `<span class="of-pill-total">${window.__CURRENCY_SYMBOL__ ?? '$'}${(e.payload.price * qty).toFixed(2)}</span>`
                : '';
        p.innerHTML =
            `<button type="button" data-qa="minus" aria-label="Remove one ${name}">${MINUS_SVG}</button>` +
            `<span class="of-pill-qty" aria-live="polite">${qty}</span>` +
            `<button type="button" data-qa="plus" aria-label="Add one ${name}">${PLUS_SVG}</button>` +
            total;
        p.onkeydown = null;
        p.onclick = (ev) => {
            const t = (ev.target as HTMLElement).closest('[data-qa]');
            if (!t) return;
            if (t.dataset.qa === 'plus') addItem(e.payload);
            else if (t.dataset.qa === 'minus') changeQty(e.payload.item_id, -1);
        };
    }
}

/** One delegated click handler shared by both overlay modes. */
function wireOverlay(e: Entry) {
    e.ovHost!.onclick = (ev) => {
        const t = (ev.target as HTMLElement).closest('[data-qa]');
        if (!t) return;
        ev.stopPropagation();
        if (t.dataset.qa === 'add' || t.dataset.qa === 'plus') addItem(e.payload);
        else if (t.dataset.qa === 'minus') changeQty(e.payload.item_id, -1);
    };
}

/** Re-render every control from the cart (checkout edits stay in sync). */
function syncAll() {
    const byId = new Map(getCart().lines.map((l) => [l.item_id, l.qty]));
    enhanced.forEach((e) => {
        const qty = byId.get(e.payload.item_id) ?? 0;
        if (e.ovHost) renderOverlay(e, qty);
        else if (e.priceEl) renderPill(e, qty);
    });
}

/**
 * One entry PER CARD element — the same dish can appear twice on the page
 * (Must-Try carousel + its category), and every copy must stay in sync.
 */
let enhanced: Entry[] = [];
let syncAttached = false;

/** Strip every trace of a previous run so re-enhancing starts clean. */
function cleanup() {
    document.querySelectorAll<HTMLElement>('.of-ov').forEach((h) => h.remove());
    document
        .querySelectorAll<HTMLElement>('.of-has-add, .of-has-add-flat')
        .forEach((el) => {
            el.classList.remove('of-has-add', 'of-has-add-flat');
            delete el.dataset.qaSlot;
        });
    document.querySelectorAll<HTMLElement>('.of-pill').forEach((p) => {
        p.classList.remove('of-pill', 'of-pill-active');
        if (p.dataset.qaHtml !== undefined) {
            p.innerHTML = p.dataset.qaHtml;
            delete p.dataset.qaHtml;
        }
        p.removeAttribute('role');
        p.removeAttribute('aria-label');
        p.removeAttribute('tabindex');
        p.onclick = null;
        p.onkeydown = null;
    });
}

export function setupQuickAdd() {
    if (window.__ORDERING_ENABLED__ !== true) return;

    cleanup();
    enhanced = [];
    const seen = new Set<HTMLElement>();
    document.querySelectorAll<HTMLElement>('[data-item-id]').forEach((card) => {
        if (seen.has(card)) return;
        seen.add(card);
        const payload = payloadFor(card);
        if (!payload) return; // unknown or sold-out item: no control
        const entry: Entry = { card, payload };

        const img = card.querySelector<HTMLElement>(IMAGE_SEL);
        if (img && img.offsetWidth >= 56) {
            img.dataset.qaSlot = 'true';
            img.classList.add('of-has-add');
            // Placeholder/monogram tiles (modifier class with "--ph") sit on a
            // flat light surface — skip the photo scrim, the pill's own shadow
            // is enough separation.
            if (/--ph(?:\s|$)/.test(img.className))
                img.classList.add('of-has-add-flat');
            const host = document.createElement('span');
            host.className =
                'of-ov ' + (img.offsetWidth >= 140 ? 'of-ov-lg' : 'of-ov-sm');
            img.appendChild(host);
            entry.ovHost = host;
            wireOverlay(entry);
        } else if (!img) {
            entry.priceEl =
                card.querySelector<HTMLElement>(PRICE_SEL) ?? undefined;
        }

        if (entry.ovHost || entry.priceEl) enhanced.push(entry);
    });

    if (!syncAttached) {
        syncAttached = true;
        window.addEventListener('cart-changed', syncAll);
    }
    syncAll();
}

