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
