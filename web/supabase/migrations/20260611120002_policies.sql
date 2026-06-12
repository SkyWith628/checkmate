-- ╔══════════════════════════════════════════════════════════╗
-- ║ RLS 정책                                                   ║
-- ╚══════════════════════════════════════════════════════════╝

-- 관리자 판별 (security definer → profiles 조회 시 RLS 우회, 재귀 방지)
create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- RLS 활성화
alter table profiles              enable row level security;
alter table categories            enable row level security;
alter table products              enable row level security;
alter table product_options       enable row level security;
alter table product_option_values enable row level security;
alter table coupons               enable row level security;
alter table user_coupons          enable row level security;
alter table orders                enable row level security;
alter table order_items           enable row level security;
alter table reviews               enable row level security;
alter table review_votes          enable row level security;
alter table faqs                  enable row level security;
alter table restock_alerts        enable row level security;
alter table notifications         enable row level security;
alter table addresses             enable row level security;
alter table wishlists             enable row level security;
alter table point_ledger          enable row level security;
alter table product_questions     enable row level security;
alter table inquiries             enable row level security;
alter table inquiry_messages      enable row level security;
alter table shipments             enable row level security;
alter table order_returns         enable row level security;
alter table promotions            enable row level security;
alter table site_settings         enable row level security;

-- ── profiles ────────────────────────────────────────────────
create policy profiles_read   on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_update on profiles for update using (id = auth.uid() or is_admin())
                                              with check (id = auth.uid() or is_admin());
create policy profiles_delete on profiles for delete using (is_admin());
-- INSERT는 handle_new_user 트리거(security definer)가 담당 → 공개 정책 없음

-- ── categories ──────────────────────────────────────────────
create policy categories_read  on categories for select using (true);
create policy categories_write on categories for all using (is_admin()) with check (is_admin());

-- ── products & options ──────────────────────────────────────
create policy products_read  on products for select using (is_active or is_admin());
create policy products_write on products for all using (is_admin()) with check (is_admin());

create policy popt_read  on product_options for select using (true);
create policy popt_write on product_options for all using (is_admin()) with check (is_admin());

create policy poptv_read  on product_option_values for select using (true);
create policy poptv_write on product_option_values for all using (is_admin()) with check (is_admin());

-- ── coupons ─────────────────────────────────────────────────
create policy coupons_read  on coupons for select using (is_active or is_admin());
create policy coupons_write on coupons for all using (is_admin()) with check (is_admin());

create policy ucoupons_read   on user_coupons for select using (user_id = auth.uid() or is_admin());
create policy ucoupons_insert on user_coupons for insert with check (user_id = auth.uid());
create policy ucoupons_delete on user_coupons for delete using (user_id = auth.uid() or is_admin());
-- used_at 갱신은 place_order RPC(definer)가 수행

-- ── orders / order_items ────────────────────────────────────
create policy orders_read   on orders for select using (user_id = auth.uid() or is_admin());
create policy orders_update on orders for update using (is_admin());
-- INSERT 정책 없음 → place_order RPC로만 생성

create policy oitems_read on order_items for select using (
  exists (select 1 from orders o
          where o.id = order_id and (o.user_id = auth.uid() or is_admin()))
);
-- INSERT 정책 없음 → place_order RPC로만 생성

-- ── reviews ─────────────────────────────────────────────────
create policy reviews_read   on reviews for select using (true);
create policy reviews_insert on reviews for insert with check (user_id = auth.uid());
create policy reviews_delete on reviews for delete using (user_id = auth.uid() or is_admin());

create policy rvotes_all on review_votes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── faqs ────────────────────────────────────────────────────
create policy faqs_read  on faqs for select using (true);
create policy faqs_write on faqs for all using (is_admin()) with check (is_admin());

-- ── restock_alerts ──────────────────────────────────────────
create policy restock_read  on restock_alerts for select using (user_id = auth.uid() or is_admin());
create policy restock_write on restock_alerts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── notifications ───────────────────────────────────────────
create policy notif_read   on notifications for select using (user_id = auth.uid() or is_admin());
create policy notif_update on notifications for update using (user_id = auth.uid())
                                            with check (user_id = auth.uid());
create policy notif_insert on notifications for insert with check (is_admin());
create policy notif_delete on notifications for delete using (user_id = auth.uid() or is_admin());

-- ── addresses / wishlists ───────────────────────────────────
create policy addr_all on addresses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy wish_all on wishlists for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── point_ledger (조회만 본인, 적립/차감은 RPC·관리자) ───────
create policy points_read   on point_ledger for select using (user_id = auth.uid() or is_admin());
create policy points_insert on point_ledger for insert with check (is_admin());

-- ── product_questions ───────────────────────────────────────
create policy pq_read   on product_questions for select
  using (not is_secret or user_id = auth.uid() or is_admin());
create policy pq_insert on product_questions for insert with check (user_id = auth.uid());
create policy pq_update on product_questions for update using (user_id = auth.uid() or is_admin())
                                             with check (user_id = auth.uid() or is_admin());
create policy pq_delete on product_questions for delete using (user_id = auth.uid() or is_admin());

-- ── inquiries / messages ────────────────────────────────────
create policy inq_read   on inquiries for select using (user_id = auth.uid() or is_admin());
create policy inq_insert on inquiries for insert with check (user_id = auth.uid());
create policy inq_update on inquiries for update using (user_id = auth.uid() or is_admin())
                                       with check (user_id = auth.uid() or is_admin());

create policy inqmsg_read on inquiry_messages for select using (
  exists (select 1 from inquiries i
          where i.id = inquiry_id and (i.user_id = auth.uid() or is_admin()))
);
create policy inqmsg_insert on inquiry_messages for insert with check (
  is_admin()
  or exists (select 1 from inquiries i
             where i.id = inquiry_id and i.user_id = auth.uid())
);

-- ── shipments ───────────────────────────────────────────────
create policy ship_read  on shipments for select using (
  exists (select 1 from orders o
          where o.id = order_id and (o.user_id = auth.uid() or is_admin()))
);
create policy ship_write on shipments for all using (is_admin()) with check (is_admin());

-- ── order_returns ───────────────────────────────────────────
create policy ret_read   on order_returns for select using (user_id = auth.uid() or is_admin());
create policy ret_insert on order_returns for insert with check (user_id = auth.uid());
create policy ret_update on order_returns for update using (is_admin());

-- ── promotions / site_settings ──────────────────────────────
create policy promo_read  on promotions for select using (is_active or is_admin());
create policy promo_write on promotions for all using (is_admin()) with check (is_admin());

create policy settings_read  on site_settings for select using (true);
create policy settings_write on site_settings for all using (is_admin()) with check (is_admin());
