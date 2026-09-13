-- ============================================================================
-- 003_master_admin.sql
-- Master admin: platform-level staff role with visibility across ALL
-- restaurants' order queues (one login for the operator/owner).
--
-- Design: staff.role gains an 'admin' value; two new PERMISSIVE policies on
-- orders (OR-combined with the existing per-restaurant ones) let role=admin
-- staff read and update every restaurant's orders. The `staff` table itself
-- stays per-user-row (RLS staff_see_own_profile), so an admin can never read
-- other users' profiles — only orders, which is the point.
-- ============================================================================

-- Widen the role constraint (existing rows unaffected).
alter table staff drop constraint staff_role_check;
alter table staff add constraint staff_role_check
  check (role in ('server', 'kitchen', 'manager', 'admin'));

-- Master admin read: every restaurant's orders.
drop policy if exists "master_admin_see_all_orders" on orders;
create policy "master_admin_see_all_orders"
  on orders for select
  using (
    exists (
      select 1 from staff
      where id = auth.uid() and role = 'admin'
    )
  );

-- Master admin update: advance/rollback any order (with check mirrors using
-- so a mutated row can never escape policy on re-check).
drop policy if exists "master_admin_update_all_orders" on orders;
create policy "master_admin_update_all_orders"
  on orders for update
  using (
    exists (
      select 1 from staff
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from staff
      where id = auth.uid() and role = 'admin'
    )
  );
