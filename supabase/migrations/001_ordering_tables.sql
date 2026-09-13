-- ============================================================================
-- 001_ordering_tables.sql
-- Per-table ordering: menu snapshots, orders, staff + place_order() RPC.
-- Design: docs/superpowers/specs/2026-09-08-per-table-ordering-design.md (v2)
-- Review: docs/superpowers/reviews/2026-09-08-per-table-ordering-design-review.md
--
-- Multi-tenancy principle: ONE shared orders table; per-restaurant isolation
-- is enforced by RLS on restaurant_slug, NOT per-restaurant tables.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Menu snapshots: denormalized prices per restaurant (synced from GitHub
-- config.json on every admin save via PostgREST upsert from the Worker).
-- One row per restaurant. Item shape:
--   [{"id":"bruschetta","price":8.5,"available":true,
--     "variants":[{"id":"large","priceModifier":3}]}]
-- available + variants are REQUIRED for the RPC to enforce price parity
-- with the diner UI (review §3.2, §3.3).
-- ---------------------------------------------------------------------------
create table if not exists menu_snapshots (
  restaurant_slug text primary key,
  updated_at timestamp with time zone not null default now(),
  items jsonb not null
);

alter table menu_snapshots enable row level security;

-- No policies on menu_snapshots: clients never read it directly.
-- The SECURITY DEFINER place_order() function reads it as the table owner.

-- ---------------------------------------------------------------------------
-- Orders: ONE row per order; line items (incl. variant pricing basis) in a
-- single jsonb column. menu_snapshot_at records the price basis for
-- dispute resolution (review §3.8).
-- ---------------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_slug text not null references menu_snapshots(restaurant_slug),
  table_number text not null,
  items jsonb not null,
  total_price numeric(10,2) not null,
  status text not null default 'new'
    constraint orders_status_check
    check (status in ('new', 'preparing', 'ready', 'served')),
  menu_snapshot_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

alter table orders enable row level security;

-- Dashboard + purge query paths (review §3.6)
create index if not exists idx_orders_restaurant_status_created
  on orders (restaurant_slug, status, created_at desc);
create index if not exists idx_orders_created_at
  on orders (created_at);

-- ---------------------------------------------------------------------------
-- Staff: maps Supabase Auth users to a restaurant. One row per user
-- (single-store staff; promote to a join table when multi-store is needed).
-- Created BEFORE the orders policies below — policy expressions resolve
-- referenced tables at creation time.
-- ---------------------------------------------------------------------------
create table if not exists staff (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurant_slug text not null references menu_snapshots(restaurant_slug),
  name text not null,
  role text not null default 'server'
    constraint staff_role_check check (role in ('server', 'kitchen', 'manager'))
);

alter table staff enable row level security;

drop policy if exists "staff_see_own_profile" on staff;
create policy "staff_see_own_profile"
  on staff for select
  using (id = auth.uid());

drop policy if exists "staff_update_own_profile" on staff;
create policy "staff_update_own_profile"
  on staff for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Staff see only their own restaurant's orders.
-- (drop-if-exists keeps this migration re-runnable)
drop policy if exists "staff_can_see_own_restaurant_orders" on orders;
create policy "staff_can_see_own_restaurant_orders"
  on orders for select
  using (
    restaurant_slug in (
      select restaurant_slug from staff where id = auth.uid()
    )
  );

-- Staff update only their own restaurant's orders; with check mirrors using
-- so a mutated row can never move across the tenant boundary (review §3.5).
drop policy if exists "staff_can_update_own_restaurant_orders" on orders;
create policy "staff_can_update_own_restaurant_orders"
  on orders for update
  using (
    restaurant_slug in (
      select restaurant_slug from staff where id = auth.uid()
    )
  )
  with check (
    restaurant_slug in (
      select restaurant_slug from staff where id = auth.uid()
    )
  );

-- Anonymous diners: NO direct table access. Only the place_order() RPC.

-- ---------------------------------------------------------------------------
-- place_order(p_table, p_items, p_restaurant)
--
-- SECURITY DEFINER so it can read menu_snapshots regardless of caller RLS.
-- - Prices are computed SERVER-SIDE from the snapshot; the client never
--   supplies a total.
-- - Supports optional per-line variant_id (price = base + priceModifier).
-- - REJECTS any line containing fields outside {item_id, qty, variant_id}
--   so unpriced extras (modifiers, etc.) can't be smuggled in (review §3.3).
-- - Input caps: <= 50 lines, qty 1..20, item_id <= 100 chars (review §3.4).
-- - Soft rate limit: max 10 orders per (restaurant, table) per 2 minutes
--   to blunt QR-prank floods.
-- ---------------------------------------------------------------------------
create or replace function place_order(
  p_table text,
  p_items jsonb,
  p_restaurant text
)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  base_menu jsonb;
  snapshot_at timestamp with time zone;
  total numeric := 0;
  out_order orders;
  line jsonb;
  line_keys text[];
  item_id text;
  qty int;
  variant_id text;
  menu_item jsonb;
  variant jsonb;
  item_price numeric;
begin
  -- ---- input validation ---------------------------------------------------
  if p_table is null or length(btrim(p_table)) = 0 or length(p_table) > 20 then
    raise exception 'Invalid table number';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception 'items must be a non-empty array of at most 50 lines';
  end if;

  -- ---- soft rate limit: 10 orders / table / 2 min --------------------------
  if (
    select count(*) from orders
    where restaurant_slug = p_restaurant
      and table_number = btrim(p_table)
      and created_at > now() - interval '2 minutes'
  ) >= 10 then
    raise exception 'Too many orders from this table — please wait a moment';
  end if;

  -- ---- snapshot lookup -----------------------------------------------------
  select s.items, s.updated_at into base_menu, snapshot_at
  from menu_snapshots s
  where s.restaurant_slug = p_restaurant;

  if base_menu is null then
    raise exception 'Restaurant % is not accepting orders', p_restaurant;
  end if;

  -- ---- price each line server-side ----------------------------------------
  for line in select * from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(line) <> 'object' then
      raise exception 'Each item line must be an object';
    end if;

    -- Reject unpriced fields: only item_id / qty / variant_id allowed.
    line_keys := array(select jsonb_object_keys(line));
    if exists (
      select 1 from unnest(line_keys) k
      where k not in ('item_id', 'qty', 'variant_id')
    ) then
      raise exception 'Unsupported field in item line: %',
        (select k from unnest(line_keys) k
         where k not in ('item_id', 'qty', 'variant_id') limit 1);
    end if;

    item_id := line->>'item_id';
    if item_id is null or length(item_id) = 0 or length(item_id) > 100 then
      raise exception 'Invalid item_id';
    end if;

    if line->>'qty' is null or line->>'qty' !~ '^[0-9]+$' then
      raise exception 'Invalid qty for item %', item_id;
    end if;
    qty := (line->>'qty')::int;
    if qty < 1 or qty > 20 then
      raise exception 'qty for item % must be between 1 and 20', item_id;
    end if;

    select value into menu_item
    from jsonb_array_elements(base_menu) as value
    where value->>'id' = item_id;

    if menu_item is null then
      raise exception 'Invalid item %', item_id;
    end if;

    -- Sold-out enforcement is SERVER-side: the diner page may be a stale
    -- static build, so the snapshot is the source of truth (review §3.2).
    if coalesce((menu_item->>'available')::boolean, true) is not true then
      raise exception 'Item % is unavailable', item_id;
    end if;

    item_price := (menu_item->>'price')::numeric;

    -- Optional variant (size). Priced via snapshot priceModifier.
    variant_id := line->>'variant_id';
    if variant_id is not null then
      select v into variant
      from jsonb_array_elements(
        coalesce(menu_item->'variants', '[]'::jsonb)
      ) as v
      where v->>'id' = variant_id;

      if variant is null then
        raise exception 'Invalid variant % for item %', variant_id, item_id;
      end if;

      item_price := item_price + coalesce(
        (variant->>'priceModifier')::numeric, 0
      );
    end if;

    total := total + item_price * qty;
  end loop;

  -- ---- insert ---------------------------------------------------------------
  insert into orders (restaurant_slug, table_number, items, total_price, menu_snapshot_at)
  values (
    p_restaurant,
    btrim(p_table),
    jsonb_strip_nulls(p_items),
    round(total, 2),
    snapshot_at
  )
  returning * into out_order;

  return out_order;
end;
$$;

-- Explicit grants: never rely on Postgres defaults. Only ANON diners may
-- call place_order(); staff/admin cannot (and need not) (review §3.1).
revoke execute on function place_order(text, jsonb, text) from public;
revoke execute on function place_order(text, jsonb, text) from anon;
revoke execute on function place_order(text, jsonb, text) from authenticated;
grant execute on function place_order(text, jsonb, text) to anon;