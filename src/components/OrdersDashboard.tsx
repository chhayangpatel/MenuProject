import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ClipboardList, LogOut } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { basePath } from '../lib/base';
import {
    fetchOrders,
    getStaffProfile,
    STATUS_FLOW,
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

function timeAgo(iso: string): string {
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
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

    // Poll the queue every 3s while the dashboard is open.
    useEffect(() => {
        if (phase !== 'ready') return;
        let cancelled = false;
        async function poll() {
            try {
                // Master admins can pass null (RLS returns every restaurant);
                // regular staff always scope to their own slug.
                const scope = isMaster
                    ? (restaurantFilter === 'all' ? null : restaurantFilter)
                    : slug;
                const rows = await fetchOrders(client(), scope, filter);
                if (!cancelled) {
                    setOrders(rows);
                    setLoadError(null);
                }
            } catch (e) {
                if (!cancelled) {
                    setLoadError(e instanceof Error ? e.message : 'Failed to load orders.');
                }
            }
        }
        poll();
        const id = setInterval(poll, 3000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [phase, slug, filter, restaurantFilter, isMaster, client]);

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

    async function handleSignOut() {
        await client().auth.signOut();
        setPhase('login');
        setSlug('');
        setRole('server');
        setRestaurantFilter('all');
        setOrders([]);
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
                            ? `master · ${restaurantFilter === 'all' ? 'every restaurant' : (restaurantNames[restaurantFilter] ?? restaurantFilter)} · live, refreshes every 3s`
                            : `${slug} · live, refreshes every 3s`}
                    </p>
                </div>
                <button onClick={handleSignOut} title="Sign out" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'transparent', color: 'var(--admin-text-muted, #999)', border: '1px solid var(--admin-border, #2A2A2A)', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                    <LogOut size={14} /> Sign out
                </button>
            </header>

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
                        <p style={{ margin: '4px 0 10px', fontSize: 12, color: 'var(--admin-text-muted, #999)' }}>
                            {timeAgo(o.created_at)} · #{o.id.slice(0, 4).toUpperCase()}
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