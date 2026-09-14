import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ChevronRight, X } from 'lucide-react';
import { getAnonClient } from '../lib/supabase';
import {
    changeQty as storeChangeQty,
    clearCart as storeClearCart,
    getCart,
    subscribeCart,
    type CartLine,
} from '../lib/orders/cartStore';

interface OrderingFlowProps {
    restaurantSlug: string;
    currencySymbol: string;
}

interface PlaceOrderResult {
    id: string;
    total_price: number;
}

/**
 * Diner ordering island. Owns the cart + checkout; communicates with the
 * rest of the page (ItemDetailSheet "Add to Order" button) via the
 * `add-to-order` window event so we don't need to thread state through
 * every template's Astro components.
 */
export default function OrderingFlow({ restaurantSlug, currencySymbol }: OrderingFlowProps) {
    // Cart state mirrors the shared store (single source of truth also used
    // by the inline quick-add steppers). Re-read on every `cart-changed`.
    //
    // NOTE: initial state is [] (NOT getCart().lines) so SSR and client
    // hydration match. The store restores a saved cart from sessionStorage at
    // module load, which only exists in the browser — reading it during the
    // server render produced a different initial tree and triggered React
    // hydration error #418. The actual cart is restored in the effect below.
    const [lines, setLines] = useState<CartLine[]>([]);
    const [open, setOpen] = useState(false);
    const [tableNumber, setTableNumber] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastOrder, setLastOrder] = useState<PlaceOrderResult | null>(null);
    const supabaseRef = useRef<ReturnType<typeof getAnonClient> | null>(null);

    // Pre-fill table number from QR URL (?t=7)
    useEffect(() => {
        const t = new URLSearchParams(window.location.search).get('t');
        if (t) setTableNumber(t);
    }, []);

    // Stay in sync with quick-add steppers + detail sheet (one write path).
    useEffect(() => {
      // Restore cart from sessionStorage after mount. The initial state above
      // is set to [] to avoid a hydration mismatch (#418); restore it now
      // that we’re in the browser.
      setLines(getCart().lines);
      setLastOrder(null);
      return subscribeCart(() => setLines(getCart().lines));
    }, []);

    const total = useMemo(
        () => lines.reduce((sum, l) => sum + l.price * l.qty, 0),
        [lines],
    );
    const lineCount = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);

    const changeQty = useCallback((itemId: string, delta: number) => {
        storeChangeQty(itemId, delta);
    }, []);

    const clearCart = useCallback(() => {
        storeClearCart();
        setOpen(false);
    }, []);

    async function handlePlaceOrder() {
        const table = tableNumber.trim();
        if (!table || lines.length === 0 || submitting) return;

        setError(null);
        setSubmitting(true);
        try {
            if (!supabaseRef.current) supabaseRef.current = getAnonClient();
            const { data, error: rpcError } = await supabaseRef.current.rpc('place_order', {
                p_table: table,
                p_items: lines.map((l) => ({ item_id: l.item_id, qty: l.qty })),
                p_restaurant: restaurantSlug,
            });
            if (rpcError) throw rpcError;

            // Show the SERVER-computed total — the snapshot is the price truth,
            // and it may have drifted from the static page (review §3.8).
            const order = Array.isArray(data) ? data[0] : data;
            setLastOrder({ id: order.id, total_price: Number(order.total_price) });
            storeClearCart();
            setOpen(false);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            // Keep the underlying error visible in the console — the UI shows a
            // friendly message, but support/debugging needs the real cause.
            console.error('[order] place_order failed:', e);
            // Postgres exceptions arrive as "{'code':...,'message':...}" sometimes;
            // try to surface just the human message.
            const friendly = msg.includes('Too many orders')
                ? 'Too many orders from this table — please wait a moment.'
                : msg.includes('unavailable')
                    ? 'One of the items in your cart just sold out. Please review your cart.'
                    : msg.includes('not accepting orders')
                        ? 'Online ordering is not available right now.'
                        : 'Could not place the order. Please try again.';
            setError(friendly);
        } finally {
            setSubmitting(false);
        }
    }

    const orderCode = lastOrder ? lastOrder.id.slice(0, 4).toUpperCase() : null;

    return (
        <>
            {/* Floating "View order" bar — appears once the cart has items.
                Spring entrance, count-chip pop on qty change, total bump on
                add. Tapping opens checkout. */}
            <AnimatePresence>
                {!open && lineCount > 0 && (
                    <motion.button
                        key="cart-bar"
                        className="of-badge"
                        onClick={() => setOpen(true)}
                        aria-label={`Open cart, ${lineCount} item${lineCount !== 1 ? 's' : ''}, total ${currencySymbol}${total.toFixed(2)}`}
                        initial={{ y: 88, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 88, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                    >
                        <span className="of-badge-left">
                            <motion.span
                                key={lineCount}
                                className="of-badge-count"
                                initial={{ scale: 1.25 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                            >
                                {lineCount}
                            </motion.span>
                            <span className="of-badge-label">View order</span>
                        </span>
                        <span className="of-badge-right">
                            <motion.span
                                key={total.toFixed(2)}
                                className="of-badge-total"
                                initial={{ scale: 1.18 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                            >
                                {currencySymbol}
                                {total.toFixed(2)}
                            </motion.span>
                            <ChevronRight size={18} className="of-badge-chev" aria-hidden="true" />
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Order-sent confirmation */}
            <AnimatePresence>
                {lastOrder && !open && (
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        className="of-toast"
                        role="status"
                    >
                        <p className="of-toast-title">
                            Order #{orderCode} sent{tableNumber.trim() ? ` to table ${tableNumber.trim()}` : ''} — thank you!
                        </p>
                        <p className="of-toast-sub">
                            Total: {currencySymbol}
                            {lastOrder.total_price.toFixed(2)}
                        </p>
                        <button className="of-toast-dismiss" onClick={() => setLastOrder(null)} aria-label="Dismiss">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Checkout sheet */}
            <AnimatePresence>
                {open && (
                    <div className="of-sheet-wrap" role="dialog" aria-label="Your order">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="of-backdrop"
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                            className="of-sheet"
                        >
                            <header className="of-sheet-head">
                                <h2>Your order</h2>
                                <button className="of-icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                                    <X size={20} />
                                </button>
                            </header>

                            {error && (
                                <p className="of-error" role="alert">
                                    {error}
                                </p>
                            )}

                            {lines.length === 0 ? (
                                <div className="of-empty">
                                    <p className="of-empty-title">Your order is empty</p>
                                    <p className="of-empty-sub">
                                        Tap any dish on the menu to add it here.
                                    </p>
                                    <button className="of-browse-btn" onClick={() => setOpen(false)}>
                                        Browse menu
                                    </button>
                                </div>
                            ) : (
                                <ul className="of-lines">
                                    {lines.map((l) => (
                                        <li key={l.item_id} className="of-line">
                                            <div className="of-line-info">
                                                <span className="of-line-name">{l.name}</span>
                                                <span className="of-line-price">
                                                    {currencySymbol}
                                                    {l.price.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="of-qty">
                                                <button onClick={() => changeQty(l.item_id, -1)} aria-label={`Remove one ${l.name}`}>
                                                    <Minus size={14} />
                                                </button>
                                                <span>{l.qty}</span>
                                                <button onClick={() => changeQty(l.item_id, 1)} aria-label={`Add one ${l.name}`}>
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="of-checkout">
                                <input
                                    className="of-table-input"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Table #"
                                    maxLength={20}
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    aria-label="Table number"
                                />
                                <button
                                    className="of-place-btn"
                                    disabled={submitting || lines.length === 0 || !tableNumber.trim()}
                                    onClick={handlePlaceOrder}
                                >
                                    {submitting ? 'Placing…' : `Place order · ${currencySymbol}${total.toFixed(2)}`}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}