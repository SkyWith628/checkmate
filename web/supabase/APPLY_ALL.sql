-- ════════════════════════════════════════════════════════
-- CHECKMATE — 전체 마이그레이션 (SQL Editor 붙여넣기용)
-- 순서대로 실행. 한 번에 전체 실행 가능.
-- ════════════════════════════════════════════════════════

-- ▼▼▼ migrations/20260611120001_schema.sql ▼▼▼
-- ╔══════════════════════════════════════════════════════════╗
-- ║ CHECKMATE 스키마 (코어 + 확장)                              ║
-- ║ 금액=정수(원), 시간=timestamptz, PK=uuid                    ║
-- ╚══════════════════════════════════════════════════════════╝

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;     -- 한글 부분검색

-- ── 공통: updated_at 자동 갱신 ──────────────────────────────
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ── enums ───────────────────────────────────────────────────
create type user_role      as enum ('user', 'admin');
create type user_grade     as enum ('bronze', 'silver', 'gold', 'vip');
create type discount_type  as enum ('amount', 'percent');
create type order_status   as enum ('pending','paid','preparing','shipped','delivered','cancelled');
create type point_reason   as enum ('earn_order','use_order','review_bonus','signup_bonus','admin_adjust','refund');
create type inquiry_status as enum ('open','answered','closed');
create type notif_type     as enum ('order_status','restock','coupon','answer','point','notice');
create type return_type    as enum ('return','exchange');
create type return_status  as enum ('requested','approved','rejected','completed');

-- ── profiles ────────────────────────────────────────────────
create table profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  name           text,
  phone          text,
  role           user_role  not null default 'user',
  grade          user_grade not null default 'bronze',
  points_balance integer    not null default 0 check (points_balance >= 0),
  is_banned      boolean    not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger t_profiles_touch before update on profiles
  for each row execute function touch_updated_at();

-- ── categories ──────────────────────────────────────────────
create table categories (
  slug        text primary key,
  name        text not null,
  description text,
  sort_order  int  not null default 0
);

-- ── products ────────────────────────────────────────────────
create table products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  category_slug   text references categories(slug) on delete set null,
  material        text,
  description     text,
  price           integer not null check (price >= 0),
  sale_price      integer check (sale_price >= 0),
  stock           integer not null default 0,
  images          text[]  not null default '{}',
  is_sold_out     boolean not null default false,
  is_active       boolean not null default true,
  -- 주얼리 특화
  allow_engraving boolean not null default false,
  needs_ring_size boolean not null default false,
  gift_wrap       boolean not null default false,
  care_guide      text,
  view_count      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index products_category_idx  on products (category_slug);
create index products_active_idx     on products (is_active);
create index products_name_trgm      on products using gin (name gin_trgm_ops);
create trigger t_products_touch before update on products
  for each row execute function touch_updated_at();

-- 옵션 그룹 / 값
create table product_options (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label      text not null,
  sort_order int  not null default 0
);
create index product_options_product_idx on product_options (product_id);

create table product_option_values (
  id         uuid primary key default gen_random_uuid(),
  option_id  uuid not null references product_options(id) on delete cascade,
  name       text not null,
  price      integer,          -- null → 기본가
  stock      integer,          -- null → 상품재고 사용
  sort_order int not null default 0
);
create index product_option_values_option_idx on product_option_values (option_id);

-- ── coupons ─────────────────────────────────────────────────
create table coupons (
  code           text primary key,
  label          text not null,
  discount_type  discount_type not null,
  discount_value integer not null check (discount_value >= 0),
  min_order      integer not null default 0,
  is_active      boolean not null default true,
  expires_at     timestamptz
);

create table user_coupons (
  user_id      uuid references profiles(id) on delete cascade,
  code         text references coupons(code) on delete cascade,
  used_at      timestamptz,
  collected_at timestamptz not null default now(),
  primary key (user_id, code)
);

-- ── orders / order_items ────────────────────────────────────
create table orders (
  id          uuid primary key default gen_random_uuid(),
  order_no    text unique not null
              default ('CM-' || to_char(now(),'YYYYMMDD') || '-'
                       || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
  user_id     uuid not null references profiles(id),
  status      order_status not null default 'pending',
  subtotal    integer not null,
  discount    integer not null default 0,
  total       integer not null,
  coupon_code text references coupons(code),
  pay_method  text not null,
  recipient   text not null,
  phone       text not null,
  address     text not null,
  memo        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index orders_user_idx on orders (user_id, created_at desc);
create trigger t_orders_touch before update on orders
  for each row execute function touch_updated_at();

create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  product_id    uuid not null references products(id),
  product_name  text not null,            -- 주문 시점 스냅샷
  option_label  text,
  unit_price    integer not null,          -- 서버 확정가
  qty           integer not null check (qty >= 1),
  customization jsonb                       -- { engraving, ring_size, gift_wrap }
);
create index order_items_order_idx on order_items (order_id);

-- ── reviews ─────────────────────────────────────────────────
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  rating      int  not null check (rating between 1 and 5),
  content     text,
  images      text[] not null default '{}',
  is_verified boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (product_id, user_id)
);
create index reviews_product_idx on reviews (product_id, created_at desc);

create table review_votes (
  review_id  uuid references reviews(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

-- ── faqs / restock / notifications ──────────────────────────
create table faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  sort_order int not null default 0
);

create table restock_alerts (
  product_id uuid references products(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, user_id)
);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       notif_type not null,
  title      text not null,
  body       text,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, is_read, created_at desc);

-- ── addresses / wishlists ───────────────────────────────────
create table addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  label      text,
  recipient  text not null,
  phone      text not null,
  zipcode    text not null,
  address1   text not null,
  address2   text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on addresses (user_id);

create table wishlists (
  user_id    uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ── point_ledger ────────────────────────────────────────────
create table point_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  delta      integer not null,
  reason     point_reason not null,
  order_id   uuid references orders(id) on delete set null,
  memo       text,
  created_at timestamptz not null default now()
);
create index point_ledger_user_idx on point_ledger (user_id, created_at desc);

-- ── product_questions ───────────────────────────────────────
create table product_questions (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  content     text not null,
  is_secret   boolean not null default false,
  answer      text,
  answered_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index product_questions_product_idx on product_questions (product_id, created_at desc);
create trigger t_pq_touch before update on product_questions
  for each row execute function touch_updated_at();

-- ── inquiries (1:1) ─────────────────────────────────────────
create table inquiries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  category   text not null,
  subject    text not null,
  body       text not null,
  status     inquiry_status not null default 'open',
  order_id   uuid references orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_user_idx on inquiries (user_id, created_at desc);
create trigger t_inquiries_touch before update on inquiries
  for each row execute function touch_updated_at();

create table inquiry_messages (
  id          uuid primary key default gen_random_uuid(),
  inquiry_id  uuid not null references inquiries(id) on delete cascade,
  sender_role user_role not null,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index inquiry_messages_inquiry_idx on inquiry_messages (inquiry_id, created_at);

-- ── shipments / returns ─────────────────────────────────────
create table shipments (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  carrier      text,
  tracking_no  text,
  shipped_at   timestamptz,
  delivered_at timestamptz,
  created_at   timestamptz not null default now()
);
create index shipments_order_idx on shipments (order_id);

create table order_returns (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  user_id    uuid not null references profiles(id),
  type       return_type not null,
  reason     text not null,
  status     return_status not null default 'requested',
  created_at timestamptz not null default now()
);
create index order_returns_order_idx on order_returns (order_id);

-- ── promotions / site_settings ──────────────────────────────
create table promotions (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  image_url  text,
  link       text,
  starts_at  timestamptz,
  ends_at    timestamptz,
  is_active  boolean not null default true,
  sort_order int not null default 0
);

create table site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
create trigger t_site_settings_touch before update on site_settings
  for each row execute function touch_updated_at();

-- ▼▼▼ migrations/20260611120002_policies.sql ▼▼▼
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

-- ▼▼▼ migrations/20260611120003_functions.sql ▼▼▼
-- ╔══════════════════════════════════════════════════════════╗
-- ║ 함수 / 트리거                                              ║
-- ╚══════════════════════════════════════════════════════════╝

-- ── 가입 시 profiles 자동 생성 ──────────────────────────────
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',
                           new.raw_user_meta_data->>'full_name'));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── 일반 유저의 민감 필드 변경 차단 ─────────────────────────
create or replace function protect_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    if new.role          is distinct from old.role
    or new.grade         is distinct from old.grade
    or new.points_balance is distinct from old.points_balance
    or new.is_banned     is distinct from old.is_banned
    or new.created_at    is distinct from old.created_at then
      raise exception 'FORBIDDEN_PROFILE_FIELD';
    end if;
  end if;
  return new;
end; $$;

create trigger t_profiles_protect before update on profiles
  for each row execute function protect_profile_fields();

-- ── 리뷰: 구매 이력 기반 is_verified 자동 설정 ──────────────
create or replace function set_review_verified() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.is_verified := exists (
    select 1
      from order_items oi
      join orders o on o.id = oi.order_id
     where o.user_id = new.user_id
       and oi.product_id = new.product_id
       and o.status in ('paid','preparing','shipped','delivered')
  );
  return new;
end; $$;

create trigger t_reviews_verify before insert on reviews
  for each row execute function set_review_verified();

-- ── 주문 생성 (재고차감 + 가격확정 + 쿠폰검증, 원자적) ──────
create or replace function place_order(
  p_items      jsonb,                       -- [{product_id, option_value_id?, qty, customization?}]
  p_coupon_code text default null,
  p_recipient  text default '',
  p_phone      text default '',
  p_address    text default '',
  p_memo       text default null,
  p_pay_method text default 'bank'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user_id  uuid := auth.uid();
  v_order_id uuid;
  v_subtotal int := 0;
  v_discount int := 0;
  v_item   jsonb;
  v_pid    uuid;
  v_ovid   uuid;
  v_qty    int;
  v_price  int;
  v_stock  int;
  v_pname  text;
  v_olabel text;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'EMPTY_CART'; end if;

  insert into orders (user_id, subtotal, discount, total, coupon_code,
                      pay_method, recipient, phone, address, memo, status)
  values (v_user_id, 0, 0, 0, p_coupon_code,
          p_pay_method, p_recipient, p_phone, p_address, p_memo, 'pending')
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid  := (v_item->>'product_id')::uuid;
    v_ovid := nullif(v_item->>'option_value_id','')::uuid;
    v_qty  := coalesce((v_item->>'qty')::int, 1);
    if v_qty < 1 then raise exception 'BAD_QTY'; end if;

    -- 가격/재고를 DB에서 확정 + 상품행 잠금(동시성)
    select p.name,
           coalesce(ov.price, p.sale_price, p.price),
           coalesce(ov.stock, p.stock),
           case when ov.id is not null then opt.label || ' / ' || ov.name end
      into v_pname, v_price, v_stock, v_olabel
      from products p
      left join product_option_values ov on ov.id = v_ovid
      left join product_options opt       on opt.id = ov.option_id
     where p.id = v_pid and p.is_active
     for update of p;

    if v_pname is null then raise exception 'PRODUCT_NOT_FOUND: %', v_pid; end if;
    if v_stock < v_qty then raise exception 'OUT_OF_STOCK: %', v_pid; end if;

    if v_ovid is not null then
      update product_option_values set stock = stock - v_qty where id = v_ovid;
    else
      update products set stock = stock - v_qty where id = v_pid;
    end if;

    insert into order_items (order_id, product_id, product_name, option_label,
                             unit_price, qty, customization)
    values (v_order_id, v_pid, v_pname, v_olabel, v_price, v_qty, v_item->'customization');

    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  -- 쿠폰: 보유/유효/최소금액 서버 검증
  if p_coupon_code is not null then
    select case c.discount_type
             when 'amount'  then c.discount_value
             when 'percent' then v_subtotal * c.discount_value / 100
           end
      into v_discount
      from coupons c
      join user_coupons uc on uc.code = c.code and uc.user_id = v_user_id
     where c.code = p_coupon_code
       and c.is_active
       and uc.used_at is null
       and (c.expires_at is null or c.expires_at > now())
       and v_subtotal >= c.min_order;

    if v_discount is null then raise exception 'INVALID_COUPON'; end if;
    if v_discount > v_subtotal then v_discount := v_subtotal; end if;

    update user_coupons set used_at = now()
     where user_id = v_user_id and code = p_coupon_code;
  end if;

  update orders
     set subtotal = v_subtotal,
         discount = coalesce(v_discount, 0),
         total    = v_subtotal - coalesce(v_discount, 0)
   where id = v_order_id;

  return v_order_id;
end; $$;

-- ── 권한(execute) ───────────────────────────────────────────
grant execute on function is_admin()                                   to anon, authenticated;
grant execute on function place_order(jsonb, text, text, text, text, text, text) to authenticated;

-- ▼▼▼ migrations/20260611120004_seed.sql ▼▼▼
-- ╔══════════════════════════════════════════════════════════╗
-- ║ 시드: 카테고리 + 사이트 기본 설정                          ║
-- ╚══════════════════════════════════════════════════════════╝

insert into categories (slug, name, description, sort_order) values
  ('pendant',  'Pendant',  '펜던트 · 목걸이 컬렉션', 1),
  ('ring',     'Ring',     '반지 컬렉션',            2),
  ('earring',  'Earring',  '이어링 · 귀걸이 컬렉션', 3),
  ('bracelet', 'Bracelet', '브레이슬렛 · 팔찌 컬렉션', 4)
on conflict (slug) do nothing;

insert into site_settings (key, value) values
  ('free_ship_threshold', '50000'::jsonb),   -- 5만원 이상 무료배송
  ('ship_fee',            '3000'::jsonb),     -- 기본 배송비
  ('point_earn_rate',     '0.01'::jsonb)      -- 구매액 1% 적립
on conflict (key) do nothing;

