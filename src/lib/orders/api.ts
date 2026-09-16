import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Staff order-queue data access. All queries hit the shared `orders` table;
 * per-restaurant isolation is enforced by RLS (staff_can_see/update_own_
 * restaurant_orders) — the restaurantSlug filter below is a UX convenience,
 * not the security boundary.
 */

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served';

export const STATUS_FLOW: OrderStatus[] = ['new', 'preparing', 'ready', 'served'];

export interface OrderItemLine {
    item_id: string;
    qty: number;
    variant_id?: string;
}

export interface OrderRow {
    id: string;
    restaurant_slug: string;
    table_number: string;
    items: OrderItemLine[];
    total_price: number;
    status: OrderStatus;
    /** Not rendered by the dashboard; omitted from its narrowed fetch. */
    menu_snapshot_at?: string | null;
    created_at: string;
}

/** Columns the staff queue actually renders — keeps REST payloads (and the
 *  fallback poll's egress) to ~1KB per order instead of full rows. */
const ORDER_COLUMNS = 'id, restaurant_slug, table_number, items, total_price, status, created_at';

/** Fetch orders (newest first). RLS scopes results to the caller's restaurant.
 *  A master admin (staff.role = 'admin') may pass `null` to fetch ALL
 *  restaurants' orders; the permissive master policies allow it.
 *  Payload-narrowed (ORDER_COLUMNS) + capped at active-window rows because
 *  this doubles as the dashboard's safety poll on the free plan's 5GB egress. */
export async function fetchOrders(
    supabase: SupabaseClient,
    restaurantSlug: string | null,
    status: OrderStatus | 'all' = 'all',
    limit = 100,
): Promise<OrderRow[]> {
    let query = supabase
        .from('orders')
        .select(ORDER_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(limit);
    if (restaurantSlug) {
        query = query.eq('restaurant_slug', restaurantSlug);
    }
    if (status !== 'all') {
        query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as OrderRow[];
}

/**
 * Realtime push for the staff queue (postgres_changes on `orders`).
 *
 * Requires the table to be in the `supabase_realtime` publication
 * (supabase/migrations/004_realtime.sql — run once in the SQL editor).
 *
 * INSERT/UPDATE events carry the full new row, so callers can apply the
 * change to local state without a refetch. RLS is enforced per-subscriber
 * by Realtime, so each dashboard only ever receives its own restaurant's
 * rows (master admins receive all — same policies as the REST path).
 *
 * Returns an unsubscribe function; always call it on unmount/sign-out so
 * the websocket doesn't leak a slot in the free plan's 200-connection pool.
 */
export function subscribeToOrders(
    supabase: SupabaseClient,
    onChange: (order: OrderRow, event: 'INSERT' | 'UPDATE') => void,
    onStatus?: (status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED') => void,
): () => void {
    const channel = supabase
        .channel('staff-orders')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'orders' },
            (payload) => {
                const row = payload.new as OrderRow | null;
                if (row?.id) onChange(row, 'INSERT');
            },
        )
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'orders' },
            (payload) => {
                const row = payload.new as OrderRow | null;
                if (row?.id) onChange(row, 'UPDATE');
            },
        )
        .subscribe((state) => {
            if (state !== 'SUBSCRIBED') onStatus?.(state);
            else onStatus?.('SUBSCRIBED');
        });
    return () => {
        void supabase.removeChannel(channel);
    };
}

/** Advance an order's status. RLS rejects updates outside the caller's restaurant. */
export async function updateOrderStatus(
    supabase: SupabaseClient,
    orderId: string,
    status: OrderStatus,
): Promise<OrderRow> {
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();
    if (error) throw error;
    return data as OrderRow;
}

/**
 * Resolve which restaurant a signed-in staff member belongs to, plus their
 * role. `staff` RLS (staff_see_own_profile) means a user can only ever read
 * their own row, so this is safe with the publishable key.
 *
 * role === 'admin' marks a MASTER login: the master_admin_* RLS policies on
 * orders let this account read/update every restaurant's queue.
 */
export interface StaffProfile {
    restaurantSlug: string;
    role: string;
}

export async function getStaffProfile(
    supabase: SupabaseClient,
    userId: string,
): Promise<StaffProfile | null> {
    const { data, error } = await supabase
        .from('staff')
        .select('restaurant_slug, role')
        .eq('id', userId)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
        restaurantSlug: data.restaurant_slug,
        role: data.role ?? 'server',
    };
}

/**
 * Back-compat wrapper — the dashboard used this before master admins existed.
 */
export async function getStaffRestaurant(
    supabase: SupabaseClient,
    userId: string,
): Promise<string | null> {
    const profile = await getStaffProfile(supabase, userId);
    return profile?.restaurantSlug ?? null;
}