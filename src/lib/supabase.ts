import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Public Supabase client for the browser (diner ordering + staff dashboard).
 *
 * Only the publishable anon key is used here — the service-role key lives
 * exclusively in the Cloudflare Worker (secrets). All access rules are
 * enforced by RLS + the place_order() RPC, never the client.
 *
 * Note: the slug param is intentionally accepted but unused today (single
 * Supabase project for all restaurants). Keeping the parameter preserves the
 * seam for per-tenant projects later (design review §1 Option C).
 */
export function getSupabaseClient(_restaurantSlug?: string): SupabaseClient {
    return createClientWithAuth({ persistSession: true });
}

/**
 * Anonymous (diner) client. NEVER reads or attaches a stored auth session.
 *
 * Why this exists: place_order() is granted to `anon` only (execute is
 * revoked from `authenticated`). The diner page shares localStorage with
 * the staff dashboard (same origin), so a persisted session there would be
 * attached as the Authorization header and the RPC would fail with 401 —
 * diners saw "Could not place the order" whenever staff had signed in on
 * the same browser. persistSession:false keeps diner requests truly anon.
 */
export function getAnonClient(): SupabaseClient {
    return createClientWithAuth({ persistSession: false });
}

function createClientWithAuth(opts: { persistSession: boolean }): SupabaseClient {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

    if (!url || !anonKey) {
        throw new Error(
            "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        );
    }

    return createClient(url, anonKey, {
        auth: {
            // Staff sessions persist via localStorage (dashboard sign-in).
            // Diners must NOT pick that session up — see getAnonClient().
            autoRefreshToken: opts.persistSession,
            persistSession: opts.persistSession,
            detectSessionInUrl: false,
        },
    });
}