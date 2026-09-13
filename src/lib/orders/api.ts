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
    menu_snapshot_at: string | null;
    created_at: string;
}

/** Fetch orders (newest first). RLS scopes results to the caller's restaurant.
 *  A master admin (staff.role = 'admin') may pass `null` to fetch ALL
 *  restaurants' orders; the permissive master policies allow it. */
export async function fetchOrders(
    supabase: SupabaseClient,
    restaurantSlug: string | null,
    status: OrderStatus | 'all' = 'all',
): Promise<OrderRow[]> {
    let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
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