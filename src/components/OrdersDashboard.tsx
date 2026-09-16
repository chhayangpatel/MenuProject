import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ClipboardList, LogOut, Volume2, VolumeX } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { basePath } from '../lib/base';
import {
    fetchOrders,
    getStaffProfile,
    STATUS_FLOW,
    subscribeToOrders,
    updateOrderStatus,
    type OrderRow,
    type OrderStatus,
    type StaffProfile,
} from '../lib/orders/api';

type Phase = 'boot' | 'login' | 'ready';

const STATUS_COLORS: Record<OrderStatus, { bg: string; fg: string }> = {
    new: { bg: '#3B82F6', fg: '#ffffff' },
    preparing: { bg: '#F59E0B', fg: '#0F0F0F' },
    ready: { bg: '#10B981', fg: '#0F0F0F' },
    served: { bg: '#6B7280', fg: '#ffffff' },
};

/** Humanize snapshot ids ("pane-tosti" → "Pane tosti") for the queue display. */
function prettyItemId(id: string): string {
    return id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(iso: string, nowMs = Date.now()): string {
    const mins = Math.max(0, Math.round((nowMs - new Date(iso).getTime()) / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
}

/** Queue aging: waiting time turns amber after 5 min, red after 10 —
 *  kitchens live and die by "how long has this been sitting".
 *  Only applies to `new` orders — once marked preparing, the kitchen
 *  owns it and the timestamp goes back to muted. */
function ageColor(status: OrderStatus, iso: string, nowMs = Date.now()): string {
    if (status !== 'new') return 'var(--admin-text-muted, #999)';
    const mins = (nowMs - new Date(iso).getTime()) / 60000;
    if (mins >= 10) return '#EF4444';
    if (mins >= 5) return '#F59E0B';
    return 'var(--admin-text-muted, #999)';
}

/** Shared AudioContext so the chime isn't blocked by autoplay policies:
 *  the component unlocks it on the first user gesture (tap/keypress). */
let sharedAudioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
    try {
        const Ctx = window.AudioContext
            ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return null;
        if (!sharedAudioCtx) sharedAudioCtx = new Ctx();
        return sharedAudioCtx;
    } catch {
        return null;
    }
}

function unlockAudio(): void {
    try {
        const ctx = getAudioCtx();
        if (ctx && ctx.state === 'suspended') void ctx.resume();
    } catch {
        // Audio is a nicety, not a requirement.
    }
}

/** Best-effort "new order" chime via WebAudio. Never blocks the UI. */
function playChime(): void {
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        if (ctx.state === 'suspended') void ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1175, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.75);
    } catch {
        // Audio is a nicety, not a requirement.
    }
}

/**
 * Staff order queue. Auth gate per design review §3.9: the page shell is
 * public, but the dashboard requires a Supabase Auth session linked to a
 * `staff` row; the restaurant slug is derived from that row (never ?slug=).
 * RLS makes wrong-tenant reads return empty, which is the safe failure mode.
 */
export default function OrdersDashboard() {
    const supabaseRef = useRef<SupabaseClient | null>(null);
    const [phase, setPhase] = useState<Phase>('boot');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [signingIn, setSigningIn] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const [slug, setSlug] = useState('');
    const [role, setRole] = useState('server');
    const [restaurantFilter, setRestaurantFilter] = useState('all');
    const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
    const [loadError, setLoadError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [newOrderToast, setNewOrderToast] = useState<OrderRow | null>(null);
    const [live, setLive] = useState(false);
    const [muted, setMuted] = useState<boolean>(() => {
        try { return localStorage.getItem('orders-sound-muted') === '1'; } catch { return false; }
    });
    const [showReconnect, setShowReconnect] = useState(false);
    // Ticked every 30s so "x min ago" labels stay honest without realtime noise.
    const [nowTick, setNowTick] = useState(() => Date.now());
    const mutedRef = useRef(muted);
    // IDs already rendered — lets the realtime handler know synchronously
    // whether an event is a brand-new order (state updaters run later than
    // the code around them, so "did I just add this?" can't live in setState).
    const seenIdsRef = useRef<Set<string>>(new Set());
    const baseTitleRef = useRef<string | null>(null);

    // Master login (staff.role = 'admin'): sees every restaurant's queue.
    const isMaster = role === 'admin';

    const client = useCallback((): SupabaseClient => {
        if (!supabaseRef.current) supabaseRef.current = getSupabaseClient();
        return supabaseRef.current;
    }, []);

    // Resolve the signed-in staff member's restaurant + role from their row.
    const resolveStaff = useCallback(async (): Promise<StaffProfile | null> => {
        const supabase = client();
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (!user) return null;
        return getStaffProfile(supabase, user.id);
    }, [client]);

    // Boot: restore any persisted staff session.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const profile = await resolveStaff();
                if (cancelled) return;
                if (profile) {
                    setSlug(profile.restaurantSlug);
                    setRole(profile.role);
                    setPhase('ready');
                } else {
                    setPhase('login');
                }
            } catch {
                if (!cancelled) setPhase('login');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [resolveStaff]);

    // Master admins need slug → name for the per-restaurant filter + cards.
    // restaurants.json is generated at build time from the repo configs.
    useEffect(() => {
        if (phase !== 'ready' || !isMaster) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(basePath('/restaurants.json'));
                if (!res.ok) return;
                const list = (await res.json()) as Array<{ slug: string; name: string }>;
                if (cancelled) return;
                const map: Record<string, string> = {};
                for (const r of list) map[r.slug] = r.name;
                setRestaurantNames(map);
            } catch {
                // Non-fatal: cards fall back to showing the raw slug.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [phase, isMaster]);

    // Live queue: realtime push (primary) + a slow safety poll (fallback).
    // INSERT/UPDATE events carry the full row, so changes are applied to
    // local state with zero refetch — the old 3s poll is gone (≈95% egress
    // saving). The 90s poll only catches events missed during a websocket
    // drop and keeps the free project from pausing; the queue also refetches
    // when the tab regains focus. RLS scopes every event to the caller's
    // restaurant, exactly like the REST path.
    useEffect(() => {
        if (phase !== 'ready') return;
        let cancelled = false;
        const scope = isMaster
            ? (restaurantFilter === 'all' ? null : restaurantFilter)
            : slug;

        async function load() {
            try {
                // Master admins can pass null (RLS returns every restaurant);
                // regular staff always scope to their own slug.
                const rows = await fetchOrders(client(), scope, filter);
                if (!cancelled) {
                    seenIdsRef.current = new Set(rows.map((r) => r.id));
                    setOrders(rows);
                    setLoadError(null);
                }
            } catch (e) {
                if (!cancelled) {
                    setLoadError(e instanceof Error ? e.message : 'Failed to load orders.');
                }
            }
        }

        void load();

        // Apply a realtime event's row straight into local state.
        const unsubscribe = subscribeToOrders(
            client(),
            (row, event) => {
                if (cancelled) return;
                if (scope && row.restaurant_slug !== scope) return;
                // Decided synchronously via seenIdsRef — state updaters run
                // during re-render, so "isNew" cannot be read from setState.
                const isNew = !seenIdsRef.current.has(row.id);
                if (isNew) seenIdsRef.current.add(row.id);
                setOrders((prev) => {
                    const idx = prev.findIndex((o) => o.id === row.id);
                    if (idx >= 0) {
                        // An active status filter hides rows that moved out of it.
                        if (filter !== 'all' && row.status !== filter) {
                            return prev.filter((o) => o.id !== row.id);
                        }
                        const next = [...prev];
                        next[idx] = row;
                        return next;
                    }
                    // Respect an active status filter for brand-new rows too.
                    if (filter !== 'all' && row.status !== filter) return prev;
                    return [row, ...prev].slice(0, 100);
                });
                if (event === 'INSERT' && isNew) {
                    setNewOrderToast(row);
                    if (!mutedRef.current) playChime();
                }
            },
            (status) => setLive(status === 'SUBSCRIBED'),
        );

        // Safety net: slow poll (missed events / reconnect) + refetch on
        // tab focus — staff tabs are usually backgrounded, so this keeps
        // REST traffic near zero during service.
        const poll = window.setInterval(() => void load(), 90_000);
        const refetchIfVisible = () => {
            if (document.visibilityState === 'visible') void load();
        };
        window.addEventListener('focus', refetchIfVisible);
        document.addEventListener('visibilitychange', refetchIfVisible);

        return () => {
            cancelled = true;
            unsubscribe();
            window.clearInterval(poll);
            window.removeEventListener('focus', refetchIfVisible);
            document.removeEventListener('visibilitychange', refetchIfVisible);
        };
    }, [phase, slug, filter, restaurantFilter, isMaster, client]);

    // Auto-dismiss the "new order" toast; while the tab is backgrounded,
    // flash the document title so staff notice it in the tab strip.
    useEffect(() => {
        if (baseTitleRef.current === null) baseTitleRef.current = document.title;
        const base = baseTitleRef.current;
        if (!newOrderToast) {
            document.title = base;
            return;
        }
        const dismiss = window.setTimeout(() => setNewOrderToast(null), 8_000);
        let flashId: number | undefined;
        const stopFlash = () => {
            if (flashId !== undefined) window.clearInterval(flashId);
            flashId = undefined;
            document.title = base;
        };
        const startFlash = () => {
            if (flashId !== undefined) return;
            flashId = window.setInterval(() => {
                document.title = document.title === base
                    ? `🔔 New order — Table ${newOrderToast.table_number}`
                    : base;
            }, 1_000);
        };
        const onVis = () => (document.visibilityState === 'visible' ? stopFlash() : startFlash());
        document.addEventListener('visibilitychange', onVis);
        window.addEventListener('focus', stopFlash, { once: true });
        if (document.visibilityState !== 'visible') startFlash();
        return () => {
            window.clearTimeout(dismiss);
            document.removeEventListener('visibilitychange', onVis);
            stopFlash();
        };
    }, [newOrderToast]);

    // Keep "x min ago" labels fresh.
    useEffect(() => {
        if (phase !== 'ready') return;
        const t = window.setInterval(() => setNowTick(Date.now()), 30_000);
        return () => window.clearInterval(t);
    }, [phase]);

    // Warn (after a short grace period) when the realtime channel is down.
    useEffect(() => {
        if (phase !== 'ready') return;
        if (live) {
            setShowReconnect(false);
            return;
        }
        const t = window.setTimeout(() => setShowReconnect(true), 5_000);
        return () => window.clearTimeout(t);
    }, [live, phase]);

    // Browsers only allow audio after a user gesture; unlock the shared
    // AudioContext on the first tap/keypress so the chime actually plays.
    useEffect(() => {
        if (phase !== 'ready') return;
        const unlock = () => unlockAudio();
        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        return () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
    }, [phase]);

    async function handleSignIn(e: FormEvent) {
        e.preventDefault();
        if (!email || !password || signingIn) return;
        setSigningIn(true);
        setAuthError(null);
        try {
            const supabase = client();
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (error) throw error;
            const profile = await resolveStaff();
            if (!profile) {
                await supabase.auth.signOut();
                throw new Error('This account has no staff profile. Ask your manager to add you.');
            }
            setSlug(profile.restaurantSlug);
            setRole(profile.role);
            setPhase('ready');
        } catch (err) {
            setAuthError(err instanceof Error ? err.message : 'Sign-in failed.');
        } finally {
            setSigningIn(false);
        }
    }

    function toggleMuted() {
        const next = !mutedRef.current;
        mutedRef.current = next;
        setMuted(next);
        try { localStorage.setItem('orders-sound-muted', next ? '1' : '0'); } catch { /* private mode */ }
    }

    async function handleSignOut() {
        await client().auth.signOut();
        setPhase('login');
        setSlug('');
        setRole('server');
        setRestaurantFilter('all');
        setOrders([]);
        seenIdsRef.current = new Set();
        setEmail('');
        setPassword('');
        setFilter('all');
    }

    async function handleStatusChange(orderId: string, next: OrderStatus) {
        setUpdatingId(orderId);
        try {
            const updated = await updateOrderStatus(client(), orderId, next);
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        } catch {
            setLoadError('Failed to update order status.');
        } finally {
            setUpdatingId(null);
        }
    }

    if (phase === 'boot') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted, #999)' }}>
                Loading…
            </div>
        );
    }

    if (phase === 'login') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <form
                    onSubmit={handleSignIn}
                    style={{
                        width: '100%', maxWidth: 360, background: 'var(--admin-card, #1A1A1A)',
                        border: '1px solid var(--admin-border, #2A2A2A)', borderRadius: 12, padding: 28,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <ClipboardList size={20} color="var(--admin-accent, #E8C87A)" />
                        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--admin-text, #F5F5F5)' }}>
                            Staff sign-in
                        </h1>
                    </div>
                    <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--admin-text-muted, #999)' }}>
                        Sign in to view your restaurant's live order queue.
                    </p>
                    <input
                        type="email" required placeholder="you@restaurant.com" value={email} autoComplete="email"
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', marginBottom: 12, borderRadius: 8, border: '1px solid var(--admin-border, #2A2A2A)', background: 'var(--admin-surface, #141414)', color: 'var(--admin-text, #F5F5F5)', fontSize: 14 }}
                    />
                    <input
                        type="password" required placeholder="Password" value={password} autoComplete="current-password"
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', marginBottom: 12, borderRadius: 8, border: '1px solid var(--admin-border, #2A2A2A)', background: 'var(--admin-surface, #141414)', color: 'var(--admin-text, #F5F5F5)', fontSize: 14 }}
                    />
                    {authError && (
                        <p role="alert" style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--admin-danger, #EF4444)' }}>{authError}</p>
                    )}
                    <button
                        type="submit" disabled={signingIn}
                        style={{ width: '100%', padding: '11px 14px', border: 'none', borderRadius: 8, background: 'var(--admin-accent, #E8C87A)', color: '#0F0F0F', fontSize: 14, fontWeight: 600, cursor: signingIn ? 'wait' : 'pointer', opacity: signingIn ? 0.6 : 1 }}
                    >
                        {signingIn ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', maxWidth: 760, margin: '0 auto', padding: '24px 20px 60px' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--admin-text, #F5F5F5)' }}>
                        {isMaster ? 'Order queue — all restaurants' : 'Order queue'}
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-text-muted, #999)' }}>
                        {isMaster
                            ? `master · ${restaurantFilter === 'all' ? 'every restaurant' : (restaurantNames[restaurantFilter] ?? restaurantFilter)}`
                            : slug}
                        {' · '}
                        <span style={{ fontWeight: 600, color: live ? 'var(--admin-success, #10B981)' : 'var(--admin-warning, #F59E0B)' }}>
                            {live ? '● live' : '○ connecting…'}
                        </span>
                        <span style={{ marginLeft: 6 }}>updates pushed in real time</span>
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                        onClick={toggleMuted}
                        title={muted ? 'Unmute new-order sound' : 'Mute new-order sound'}
                        aria-pressed={muted}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px',
                            background: 'transparent', color: muted ? 'var(--admin-danger, #EF4444)' : 'var(--admin-text-muted, #999)',
                            border: '1px solid var(--admin-border, #2A2A2A)', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                        }}
                    >
                        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        {muted ? 'Muted' : 'Sound'}
                    </button>
                    <button onClick={handleSignOut} title="Sign out" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'transparent', color: 'var(--admin-text-muted, #999)', border: '1px solid var(--admin-border, #2A2A2A)', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                        <LogOut size={14} /> Sign out
                    </button>
                </div>
            </header>

            {showReconnect && !live && (
                <div role="alert" style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.12)',
                    color: 'var(--admin-warning, #F59E0B)', borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                    fontWeight: 600, fontSize: 13,
                }}>
                    ○ Live connection lost — retrying. Orders still refresh every 90s.
                </div>
            )}

            {newOrderToast && (
                <div
                    role="status"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, background: '#10B981',
                        color: '#0F0F0F', borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                        fontWeight: 600, fontSize: 14,
                    }}
                >
                    🔔 New order — Table {newOrderToast.table_number} · ${Number(newOrderToast.total_price).toFixed(2)}
                </div>
            )}

            {isMaster && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <label htmlFor="restaurant-filter" style={{ fontSize: 13, color: 'var(--admin-text-muted, #999)' }}>
                        Restaurant
                    </label>
                    <select
                        id="restaurant-filter"
                        value={restaurantFilter}
                        onChange={(e) => setRestaurantFilter(e.target.value)}
                        style={{
                            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                            border: '1px solid var(--admin-border, #2A2A2A)',
                            background: 'var(--admin-surface, #141414)',
                            color: 'var(--admin-text, #F5F5F5)', fontSize: 14,
                        }}
                    >
                        <option value="all">All restaurants</option>
                        {Object.entries(restaurantNames).map(([s, name]) => (
                            <option key={s} value={s}>{name}</option>
                        ))}
                        {/* Orders may exist for slugs not in the current build. */}
                        {[...new Set(orders.map((o) => o.restaurant_slug))]
                            .filter((s) => !(s in restaurantNames))
                            .map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                    </select>
                </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                {(['all', ...STATUS_FLOW] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        style={{
                            padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            border: `1px solid ${filter === s ? 'var(--admin-accent, #E8C87A)' : 'var(--admin-border, #2A2A2A)'}`,
                            background: filter === s ? 'var(--admin-accent, #E8C87A)' : 'transparent',
                            color: filter === s ? '#0F0F0F' : 'var(--admin-text-muted, #999)',
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {loadError && (
                <p role="alert" style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', color: 'var(--admin-danger, #EF4444)', fontSize: 13 }}>
                    {loadError}
                </p>
            )}

            {orders.length === 0 && (
                <p style={{ color: 'var(--admin-text-muted, #999)', fontSize: 14 }}>
                    {filter === 'all' ? 'No orders in the queue yet.' : `No ${filter} orders.`}
                </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {orders.map((o) => (
                    <div key={o.id} style={{ background: 'var(--admin-card, #1A1A1A)', border: '1px solid var(--admin-border, #2A2A2A)', borderRadius: 12, padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <strong style={{ fontSize: 16, color: 'var(--admin-text, #F5F5F5)' }}>
                                {isMaster && (
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-accent, #E8C87A)', marginRight: 10 }}>
                                        {restaurantNames[o.restaurant_slug] ?? o.restaurant_slug}
                                    </span>
                                )}
                                Table {o.table_number}
                            </strong>
                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: STATUS_COLORS[o.status].bg, color: STATUS_COLORS[o.status].fg }}>
                                {o.status}
                            </span>
                        </div>
                        <p style={{ margin: '4px 0 10px', fontSize: 12, fontWeight: 600, color: ageColor(o.status, o.created_at, nowTick) }}>
                            {timeAgo(o.created_at, nowTick)} · #{o.id.slice(0, 4).toUpperCase()}
                        </p>
                        <ul style={{ listStyle: 'none', margin: '0 0 12px', padding: 0, fontSize: 14, color: 'var(--admin-text, #F5F5F5)' }}>
                            {o.items.map((line, i) => (
                                <li key={`${line.item_id}-${line.variant_id ?? 'base'}-${i}`}>
                                    {line.qty} × {prettyItemId(line.item_id)}
                                    {line.variant_id ? ` (${prettyItemId(line.variant_id)})` : ''}
                                </li>
                            ))}
                        </ul>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-accent, #E8C87A)' }}>
                                ${Number(o.total_price).toFixed(2)}
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {STATUS_FLOW.filter((s) => s !== o.status).map((next) => (
                                    <button
                                        key={next}
                                        onClick={() => handleStatusChange(o.id, next)}
                                        disabled={updatingId === o.id}
                                        style={{
                                            padding: '7px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                                            border: '1px solid var(--admin-border, #2A2A2A)', background: 'transparent',
                                            color: 'var(--admin-text, #F5F5F5)', opacity: updatingId === o.id ? 0.5 : 1,
                                        }}
                                    >
                                        {next}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}