# CHECKMATE — 재설계 아키텍처 문서

> Firebase 정적 사이트 → **Next.js (App Router) + Supabase** 전면 재설계
> Stack: Next.js 15 / React 19 / TypeScript / Tailwind CSS / shadcn/ui / Supabase (Postgres + Auth + Storage + Edge Functions)
> 상태: **설계 (구현 전, 합의용)**

---

## 1. 목표와 설계 원칙

### 현재 문제(기존 사이트 리뷰에서 도출)
- 홈페이지 중복(`index.html` / `checkmate.html`), 카테고리 4페이지 복붙 → 유지보수 불가
- 프로덕션에 디버그 플레이스홀더 노출
- **재고 차감이 클라이언트에서 실행 → RLS에 막혀 일반 고객은 항상 실패**
- **주문 금액/쿠폰 검증이 클라이언트에만 존재 → 위변조 가능**
- 빌드/컴포넌트화 부재, SEO 취약

### 재설계 원칙
1. **신뢰 경계를 서버로 이동** — 주문 생성·재고 차감·쿠폰 적용·가격 계산은 전부 서버(Server Action / Edge Function + Postgres 트랜잭션)에서. 클라이언트는 절대 가격을 신뢰하지 않는다.
2. **단일 소스(Single source of truth)** — 카테고리/상품/메뉴를 데이터로 관리, 페이지는 템플릿 1개.
3. **SEO 우선** — 상품/카테고리는 SSG/ISR로 정적 생성 + 동적 메타데이터.
4. **타입 안전성** — Supabase 스키마에서 TS 타입 생성, DB→UI까지 타입 일관.
5. **디자인 시스템 보존** — 기존 럭셔리 팔레트/타이포를 Tailwind theme + shadcn 토큰으로 이식.

---

## 2. 기술 스택

| 레이어 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 15 App Router | RSC, Server Actions, ISR |
| 언어 | TypeScript (strict) | |
| 스타일 | Tailwind CSS v4 + CSS 변수 토큰 | 기존 디자인 토큰 이식 |
| 컴포넌트 | shadcn/ui (Radix 기반) | 접근성 내장, 코드 소유 |
| DB | Supabase Postgres | 관계형 + RLS |
| 인증 | Supabase Auth | 이메일/비번 + Google OAuth |
| 파일 | Supabase Storage | 리뷰 사진, 상품 이미지 |
| 서버로직 | Server Actions + Postgres 함수(RPC) | 주문/재고/쿠폰 원자성 |
| 폼/검증 | React Hook Form + Zod | 클라이언트+서버 공용 스키마 |
| 서버상태 | TanStack Query (클라 영역) | 장바구니, 실시간 부분 |
| 배포 | **GitHub Actions** CI/CD → 호스팅, Supabase(백엔드) | 14장 참고 |
| 도메인 | 초기 호스팅 기본 도메인 → **추후 Google 도메인** 연결 | 14.3 참고 |
| 테스트 | Vitest + Playwright | 결제/주문 플로우 E2E |

---

## 3. 폴더 구조

> **구현 위치**: 마이그레이션 기간 동안 신규 앱은 레포 루트의 **`web/`** 하위에 둔다(레거시 HTML 사이트와 공존). 컷오버 시 `web/` 내용을 루트로 승격한다. 아래 트리는 `web/` 기준.
> **Next 16 주의**: `middleware.ts`는 deprecated → **`proxy.ts`**(함수명 `proxy`)로 작성한다.

```
web/
├─ src/
│  ├─ app/
│  │  ├─ (shop)/                      # 고객용 레이아웃 그룹
│  │  │  ├─ layout.tsx                # 공통 nav + footer (단 1곳)
│  │  │  ├─ page.tsx                  # 홈 (히어로 + 스타일 퀴즈)
│  │  │  ├─ category/[slug]/page.tsx  # 카테고리 1 템플릿 (pendant/ring/...)
│  │  │  ├─ product/[id]/page.tsx     # 상품 상세 (SSG + ISR)
│  │  │  ├─ cart/page.tsx
│  │  │  ├─ checkout/page.tsx
│  │  │  ├─ collection/page.tsx
│  │  │  ├─ grade/page.tsx
│  │  │  └─ mypage/
│  │  │     ├─ page.tsx               # 프로필/등급/쿠폰
│  │  │     ├─ orders/page.tsx
│  │  │     └─ reviews/page.tsx
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx
│  │  │  └─ signup/page.tsx
│  │  ├─ admin/                       # 관리자 (미들웨어로 role 가드)
│  │  │  ├─ layout.tsx
│  │  │  ├─ page.tsx                  # 대시보드
│  │  │  ├─ products/...
│  │  │  ├─ orders/...
│  │  │  ├─ users/...
│  │  │  ├─ coupons/...
│  │  │  └─ faqs/...
│  │  ├─ api/                         # 필요 시 Route Handler (웹훅 등)
│  │  ├─ sitemap.ts                   # 동적 사이트맵
│  │  ├─ robots.ts
│  │  └─ layout.tsx                   # 폰트/전역 providers
│  ├─ components/
│  │  ├─ ui/                          # shadcn 컴포넌트
│  │  ├─ shop/                        # ProductCard, QuizWizard, CartBadge ...
│  │  └─ admin/
│  ├─ lib/
│  │  ├─ supabase/
│  │  │  ├─ server.ts                 # 서버 클라이언트(쿠키 기반)
│  │  │  ├─ client.ts                 # 브라우저 클라이언트
│  │  │  └─ admin.ts                  # service_role (서버 전용)
│  │  ├─ actions/                     # Server Actions (placeOrder, applyCoupon...)
│  │  ├─ queries/                     # 데이터 조회 함수
│  │  ├─ validations/                 # Zod 스키마 (공용)
│  │  └─ types/database.ts            # supabase gen types
│  ├─ proxy.ts                        # (구 middleware) 세션 갱신 + admin 라우트 가드
│  └─ styles/globals.css              # Tailwind + 디자인 토큰
├─ supabase/
│  ├─ migrations/                     # SQL 마이그레이션 (스키마+RLS)
│  ├─ functions/                      # Edge Functions (선택)
│  └─ seed.sql
├─ public/
├─ .env.local
└─ package.json
```

---

## 4. 데이터베이스 스키마 (Postgres)

Firestore 컬렉션 → 정규화된 관계형 테이블로 전환. 핵심 변경:
- 서브컬렉션 `products/{id}/reviews` → `reviews` 테이블 (FK)
- `products/_coupons` 단일 문서의 배열 → `coupons` 테이블
- 옵션(중첩 객체) → `product_options` + `product_option_values` 테이블 (재고를 옵션 단위로 정확히 관리)
- 주문은 `orders` + `order_items` 로 분리 (단일/장바구니 주문 통합)

```sql
-- ─────────────────────────────────────────────
-- profiles : auth.users 1:1 확장 (role/grade 등)
-- ─────────────────────────────────────────────
create type user_role  as enum ('user', 'admin');
create type user_grade as enum ('bronze', 'silver', 'gold', 'vip');

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  phone       text,
  role        user_role  not null default 'user',
  grade       user_grade not null default 'bronze',
  is_banned   boolean    not null default false,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- categories : 카테고리를 데이터로 (페이지 템플릿 1개)
-- ─────────────────────────────────────────────
create table categories (
  slug        text primary key,        -- 'pendant', 'ring', ...
  name        text not null,           -- 'Pendant'
  description text,
  sort_order  int  not null default 0
);

-- ─────────────────────────────────────────────
-- products
-- ─────────────────────────────────────────────
create table products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category_slug text references categories(slug),
  material      text,
  description   text,
  price         integer not null check (price >= 0),     -- 원, 정수
  sale_price    integer check (sale_price >= 0),
  stock         integer not null default 0,              -- 옵션 없는 상품용
  images        text[]  not null default '{}',
  is_sold_out   boolean not null default false,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index on products (category_slug);

-- 옵션 그룹 (예: '컬러', '사이즈')
create table product_options (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label      text not null,
  sort_order int  not null default 0
);

-- 옵션 값 (값별 가격/재고)
create table product_option_values (
  id         uuid primary key default gen_random_uuid(),
  option_id  uuid not null references product_options(id) on delete cascade,
  name       text not null,
  price      integer,        -- null이면 기본가 사용
  stock      integer,        -- null이면 재고 무제한/상품재고 사용
  sort_order int not null default 0
);

-- ─────────────────────────────────────────────
-- coupons
-- ─────────────────────────────────────────────
create type discount_type as enum ('amount', 'percent');

create table coupons (
  code          text primary key,
  label         text not null,
  discount_type discount_type not null,
  discount_value integer not null,        -- amount(원) 또는 percent(%)
  min_order     integer not null default 0,
  is_active     boolean not null default true,
  expires_at    timestamptz
);

-- 유저가 보유한 쿠폰
create table user_coupons (
  user_id   uuid references profiles(id) on delete cascade,
  code      text references coupons(code) on delete cascade,
  used_at   timestamptz,
  collected_at timestamptz not null default now(),
  primary key (user_id, code)
);

-- ─────────────────────────────────────────────
-- orders / order_items
-- ─────────────────────────────────────────────
create type order_status as enum
  ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled');

create table orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id),
  status      order_status not null default 'pending',
  subtotal    integer not null,        -- 서버 계산값
  discount    integer not null default 0,
  total       integer not null,        -- 서버 계산값 (= subtotal - discount)
  coupon_code text references coupons(code),
  pay_method  text not null,
  recipient   text not null,
  phone       text not null,
  address     text not null,
  memo        text,
  created_at  timestamptz not null default now()
);
create index on orders (user_id, created_at desc);

create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  product_id    uuid not null references products(id),
  product_name  text not null,         -- 주문 시점 스냅샷
  option_label  text,
  unit_price    integer not null,      -- 서버가 DB에서 확정한 가격
  qty           integer not null check (qty >= 1)
);

-- ─────────────────────────────────────────────
-- reviews
-- ─────────────────────────────────────────────
create table reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  rating     int  not null check (rating between 1 and 5),
  content    text,
  images     text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (product_id, user_id)         -- 1인 1상품 1리뷰 (선택)
);

-- ─────────────────────────────────────────────
-- restock_alerts / faqs / admin_notifications
-- ─────────────────────────────────────────────
create table restock_alerts (
  product_id uuid references products(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, user_id)
);

create table faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  sort_order int not null default 0
);

create table admin_notifications (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,           -- 'order', 'inquiry', 'restock'
  payload    jsonb,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
```

### 4.9 공통 규약 (모든 테이블)

- **금액**: 원화 정수(`integer`)로 통일 — 부동소수 오차 차단.
- **시간**: `timestamptz` + `created_at`/`updated_at`. `updated_at`은 트리거로 자동 갱신.
- **PK**: `uuid` 기본(외부 노출 안전). 단, 주문은 사람이 읽는 `order_no`(예: `CM-20260611-0001`) 별도 보유.
- **삭제**: 거래/이력성 데이터는 물리삭제 대신 상태값/`deleted_at` 소프트삭제.

```sql
-- updated_at 자동 갱신 트리거 (모든 변경 테이블에 부착)
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
-- 예: create trigger t_products_touch before update on products
--       for each row execute function touch_updated_at();
```

### 4.10 확장 테이블 (추가 기능용)

```sql
-- ── 배송지 주소록 (다중 주소 저장) ───────────────
create table addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  label       text,                       -- '집', '회사'
  recipient   text not null,
  phone       text not null,
  zipcode     text not null,
  address1    text not null,              -- 기본 주소
  address2    text,                       -- 상세 주소
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on addresses (user_id);

-- ── 찜 / 위시리스트 ──────────────────────────────
create table wishlists (
  user_id    uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ── 적립금(포인트) 원장 + 잔액 ───────────────────
-- profiles에 points_balance integer not null default 0 컬럼 추가
create type point_reason as enum
  ('earn_order', 'use_order', 'review_bonus', 'signup_bonus', 'admin_adjust', 'refund');
create table point_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  delta      integer not null,            -- +적립 / -사용
  reason     point_reason not null,
  order_id   uuid references orders(id),
  memo       text,
  created_at timestamptz not null default now()
);
create index on point_ledger (user_id, created_at desc);

-- ── 상품 Q&A (리뷰와 별개의 질의응답) ────────────
create table product_questions (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  content    text not null,
  is_secret  boolean not null default false,
  answer     text,                        -- 관리자 답변
  answered_at timestamptz,
  created_at timestamptz not null default now()
);
create index on product_questions (product_id, created_at desc);

-- ── 1:1 문의 / 고객지원 ──────────────────────────
create type inquiry_status as enum ('open', 'answered', 'closed');
create table inquiries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  category   text not null,               -- '주문/결제','배송','반품','기타'
  subject    text not null,
  body       text not null,
  status     inquiry_status not null default 'open',
  order_id   uuid references orders(id),
  created_at timestamptz not null default now()
);
create table inquiry_messages (              -- 스레드형 답변
  id          uuid primary key default gen_random_uuid(),
  inquiry_id  uuid not null references inquiries(id) on delete cascade,
  sender_role user_role not null,           -- 'user' | 'admin'
  body        text not null,
  created_at  timestamptz not null default now()
);

-- ── 인앱 알림 ───────────────────────────────────
create type notif_type as enum
  ('order_status', 'restock', 'coupon', 'answer', 'point', 'notice');
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
create index on notifications (user_id, is_read, created_at desc);

-- ── 배송 / 송장 추적 ─────────────────────────────
create table shipments (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  carrier      text,                       -- 'CJ대한통운' 등
  tracking_no  text,
  shipped_at   timestamptz,
  delivered_at timestamptz,
  created_at   timestamptz not null default now()
);

-- ── 반품 / 교환 ─────────────────────────────────
create type return_type   as enum ('return', 'exchange');
create type return_status as enum ('requested', 'approved', 'rejected', 'completed');
create table order_returns (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  user_id     uuid not null references profiles(id),
  type        return_type not null,
  reason      text not null,
  status      return_status not null default 'requested',
  created_at  timestamptz not null default now()
);

-- ── 기획전 / 배너 (프로모션) ─────────────────────
create table promotions (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  image_url   text,
  link        text,
  starts_at   timestamptz,
  ends_at     timestamptz,
  is_active   boolean not null default true,
  sort_order  int not null default 0
);

-- ── 리뷰 보강: 도움돼요 투표 + 구매인증 ──────────
-- reviews 에 is_verified boolean default false 컬럼 추가(주문 이력 기반)
create table review_votes (
  review_id  uuid references reviews(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

-- ── 사이트 설정 (배송비/무료배송 기준 등 key-value) ──
create table site_settings (
  key   text primary key,                  -- 'free_ship_threshold', 'ship_fee'
  value jsonb not null
);

-- ── 상품 검색 (한글 부분일치) ────────────────────
-- pg_trgm 확장으로 name/material 부분검색 인덱스
create extension if not exists pg_trgm;
create index products_name_trgm on products using gin (name gin_trgm_ops);
```

**상품 테이블 보강 컬럼** (주얼리 특화):
```sql
alter table products
  add column allow_engraving   boolean not null default false,  -- 각인 가능
  add column needs_ring_size   boolean not null default false,  -- 링 사이즈 필요
  add column gift_wrap         boolean not null default false,  -- 선물포장 가능
  add column care_guide        text,                            -- 관리 안내
  add column view_count        integer not null default 0;

-- 주문 품목에 커스터마이즈 정보(각인 문구/사이즈/포장)
alter table order_items
  add column customization jsonb;   -- { engraving: "...", ring_size: 13, gift_wrap: true }
```

---

## 5. 보안: RLS 정책 + 서버 무결성

### 5.1 핵심 결정 — 주문/재고는 **RPC(Postgres 함수)로만**
RLS로 `orders` INSERT를 직접 허용하지 않는다. 대신 `security definer` 함수를 통해서만 주문이 생성되고, 그 안에서 가격·재고·쿠폰을 서버가 확정한다. 이로써 기존의 두 치명 버그(클라 재고차감 실패 / 금액 위조)를 원천 차단.

```sql
-- 주문 생성 + 재고 차감 + 쿠폰 사용을 하나의 원자적 트랜잭션으로
create or replace function place_order(
  p_items jsonb,          -- [{product_id, option_value_id, qty}]
  p_coupon_code text,
  p_recipient text, p_phone text, p_address text, p_memo text, p_pay_method text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_subtotal int := 0;
  v_discount int := 0;
  v_item jsonb;
  v_price int;
  v_stock int;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  insert into orders(user_id, subtotal, discount, total, coupon_code,
                     pay_method, recipient, phone, address, memo, status)
  values (v_user_id, 0, 0, 0, p_coupon_code,
          p_pay_method, p_recipient, p_phone, p_address, p_memo, 'pending')
  returning id into v_order_id;

  -- 각 품목: 가격을 DB에서 확정, 재고를 원자적으로 차감
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    -- 옵션가 우선, 없으면 sale_price, 없으면 price (서버에서 결정)
    select coalesce(ov.price, p.sale_price, p.price),
           coalesce(ov.stock, p.stock)
      into v_price, v_stock
      from products p
      left join product_option_values ov
        on ov.id = (v_item->>'option_value_id')::uuid
     where p.id = (v_item->>'product_id')::uuid
       and p.is_active
     for update;                     -- 행 잠금 (동시성 안전)

    if v_price is null then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;
    if v_stock < (v_item->>'qty')::int then
      raise exception 'OUT_OF_STOCK';
    end if;

    -- 재고 차감 (옵션 또는 상품)
    if (v_item->>'option_value_id') is not null then
      update product_option_values
         set stock = stock - (v_item->>'qty')::int
       where id = (v_item->>'option_value_id')::uuid;
    else
      update products
         set stock = stock - (v_item->>'qty')::int
       where id = (v_item->>'product_id')::uuid;
    end if;

    insert into order_items(order_id, product_id, product_name, unit_price, qty)
    select v_order_id, p.id, p.name, v_price, (v_item->>'qty')::int
      from products p where p.id = (v_item->>'product_id')::uuid;

    v_subtotal := v_subtotal + v_price * (v_item->>'qty')::int;
  end loop;

  -- 쿠폰: 보유 여부/유효성/최소금액을 서버에서 검증
  if p_coupon_code is not null then
    select case
             when c.discount_type = 'amount'  then c.discount_value
             when c.discount_type = 'percent' then v_subtotal * c.discount_value / 100
           end
      into v_discount
      from coupons c
      join user_coupons uc on uc.code = c.code and uc.user_id = v_user_id
     where c.code = p_coupon_code
       and c.is_active
       and uc.used_at is null
       and (c.expires_at is null or c.expires_at > now())
       and v_subtotal >= c.min_order;

    if v_discount is null then
      raise exception 'INVALID_COUPON';
    end if;
    update user_coupons set used_at = now()
     where user_id = v_user_id and code = p_coupon_code;
  end if;

  update orders
     set subtotal = v_subtotal,
         discount = coalesce(v_discount, 0),
         total    = v_subtotal - coalesce(v_discount, 0)
   where id = v_order_id;

  return v_order_id;
end;
$$;
```

### 5.2 RLS 정책 요약

```sql
alter table profiles            enable row level security;
alter table products            enable row level security;
alter table product_options     enable row level security;
alter table product_option_values enable row level security;
alter table orders              enable row level security;
alter table order_items         enable row level security;
alter table reviews             enable row level security;
alter table coupons             enable row level security;
alter table user_coupons        enable row level security;
alter table faqs                enable row level security;
alter table restock_alerts      enable row level security;

-- helper: 현재 유저가 admin인가
create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- profiles: 본인/관리자만 읽기. role/grade는 본인이 못 바꿈(트리거로 강제)
create policy "profiles read"  on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles update" on profiles for update using (id = auth.uid())
  with check (id = auth.uid());     -- role/grade 변경은 BEFORE UPDATE 트리거로 차단

-- products: 누구나 읽기, 관리자만 쓰기 (재고 차감은 place_order RPC가 우회)
create policy "products read"  on products for select using (is_active or is_admin());
create policy "products write" on products for all using (is_admin()) with check (is_admin());
-- 옵션 테이블도 동일 패턴

-- orders: 본인만 읽기, 직접 INSERT 금지(RPC만), 수정은 관리자
create policy "orders read"   on orders for select using (user_id = auth.uid() or is_admin());
create policy "orders admin"  on orders for update using (is_admin());
-- INSERT 정책 없음 → place_order(security definer)로만 생성

-- reviews: 누구나 읽기, 본인 작성/삭제
create policy "reviews read"   on reviews for select using (true);
create policy "reviews insert" on reviews for insert with check (user_id = auth.uid());
create policy "reviews delete" on reviews for delete using (user_id = auth.uid() or is_admin());

-- coupons: 누구나 읽기(활성), 관리자 쓰기
create policy "coupons read"  on coupons for select using (is_active or is_admin());
create policy "coupons write" on coupons for all using (is_admin()) with check (is_admin());

-- faqs: 누구나 읽기, 관리자 쓰기
create policy "faqs read"  on faqs for select using (true);
create policy "faqs write" on faqs for all using (is_admin()) with check (is_admin());

-- restock_alerts / user_coupons: 본인 것만
create policy "restock own" on restock_alerts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

> **role 승격 방지**: `profiles`의 `role`/`grade`는 BEFORE UPDATE 트리거로 일반 유저가 변경 못 하게 막는다(기존 Firestore 규칙의 `affectedKeys` 검사를 트리거로 대체).

### 5.3 Storage 정책
- `review-images/{product_id}/...`: 인증 유저 업로드(5MB·image/* 제한), 누구나 읽기, 본인 삭제.
- `product-images/...`: 관리자만 쓰기, 누구나 읽기.

---

## 6. 인증 설계

| 항목 | 방식 |
|---|---|
| 가입/로그인 | Supabase Auth 이메일+비밀번호, Google OAuth |
| 아이디 로그인 | 기존 `id@checkmate.app` 스킴 폐기 → **이메일 기반 정식 가입**(이메일 인증/비번 재설정 정상화). 기존 유저는 마이그레이션 시 매핑. |
| 세션 | `@supabase/ssr` 쿠키 세션, `middleware.ts`에서 갱신 |
| 가입 후 처리 | `auth.users` INSERT 트리거로 `profiles` 자동 생성(role=user, grade=bronze) |
| 차단 유저 | `profiles.is_banned` 체크 → 미들웨어에서 강제 로그아웃 |
| admin 가드 | `middleware.ts`에서 `/admin/*` 접근 시 role 확인(클라 UI가 아닌 서버 가드) |

```sql
-- 가입 시 profiles 자동 생성
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, name) values (new.id, new.raw_user_meta_data->>'name');
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();
```

---

## 7. 라우팅 / 페이지 맵 (기존 → 신규)

| 기존 | 신규 | 렌더링 | 비고 |
|---|---|---|---|
| index.html + checkmate.html | `/` | SSG | **하나로 통합**, 히어로+퀴즈 |
| pendant/ring/earring/bracelet.html | `/category/[slug]` | SSG+ISR | **4개→템플릿 1개**, DB 기반 |
| product.html?id= | `/product/[id]` | SSG+ISR | 동적 메타데이터/OG |
| collection.html | `/collection` | SSG | |
| cart.html | `/cart` | CSR | localStorage→서버 동기화(로그인 시) |
| — (신규) | `/checkout` | 서버 액션 | `place_order` RPC 호출 |
| login.html | `/login`, `/signup` | CSR | |
| mypage.html | `/mypage/*` | SSR | 주문/리뷰/쿠폰 분리 |
| grade.html | `/grade` | SSG | |
| admin.html | `/admin/*` | SSR + 미들웨어 가드 | 기능별 라우트 분리 |
| 404.html | `app/not-found.tsx` | | |
| sitemap.xml | `app/sitemap.ts` | 동적 | 상품 포함 |

---

## 8. 디자인 시스템 이식

기존 CSS 변수를 `globals.css`의 `@theme`(Tailwind v4) 토큰으로 이전:

```css
@theme {
  --color-cream:        #ffffff;
  --color-sand:         #FEFAEF;
  --color-gold:         #E8D9B8;
  --color-dark:         #1C1A17;
  --color-muted:        #8A6A60;
  --color-cherry:       #5C3030;
  --color-cherry-esp:   #3A2420;
  --color-antique-gold: #C9A96E;
  --font-display: 'Cormorant Garamond', serif;
  --font-body:    'Noto Serif KR', serif;
}
```
- 폰트는 `next/font/google`로 로드(레이아웃 시프트 방지, self-host).
- shadcn/ui 테마 토큰(`--background`, `--primary` 등)을 위 팔레트에 매핑.
- 재사용 컴포넌트로 추출: `Nav`(적응형 로고색 유지), `FullscreenMenu`, `ProductCard`, `QuizWizard`, `CartBadge`, `OptionSelector`, `CouponSelect`.
- **퀴즈 개선**: 기존에 버려지던 `fingerType`/`faceShape`를 결과 로직에 실제 반영하거나 질문에서 제거(설계 합의 필요).

---

## 9. 데이터 흐름 패턴

- **읽기(상품/카테고리/리뷰)**: Server Component에서 직접 Supabase 조회 → SSG/ISR. `revalidate` 또는 admin 변경 시 `revalidatePath`.
- **장바구니**: 비로그인은 `localStorage`(`cm_cart`), 로그인 시 서버 동기화. TanStack Query로 관리.
- **주문/쿠폰/재입고**: **Server Action** → `place_order` 등 RPC 호출. Zod로 입력 검증, 가격은 서버가 확정.
- **관리자 변경**: Server Action + `revalidatePath`로 캐시 무효화.
- **실시간(선택)**: 재고/주문 알림은 Supabase Realtime 구독.

---

## 10. Firebase → Supabase 마이그레이션 계획

1. **데이터 추출**: Firestore export(GCS) → JSON. 컬렉션별 덤프(products, users, orders, reviews, faqs, coupons).
2. **변환 스크립트**(Node, 1회성):
   - `products`: 옵션 중첩 객체 → `product_options`/`product_option_values` 분해.
   - `products/_coupons.list[]` → `coupons` 행.
   - `users` → `profiles`(+ Auth 사용자 생성, role/grade 보존).
   - `orders`(단일+장바구니 혼재) → `orders` + `order_items` 정규화.
   - `reviews` 서브컬렉션 → `reviews` 테이블(product_id FK).
3. **이미지**: Firebase Storage → Supabase Storage 복사, URL 갱신.
4. **계정**: 이메일 기반 재가입 유도 or Auth admin API로 일괄 생성 + 비번 재설정 메일.
5. **검증**: 행 수/합계 대조, 샘플 주문 재현.
6. **컷오버**: DNS/호스팅 전환, 기존 Firebase는 읽기전용 보관.

---

## 11. 단계별 구현 로드맵

| 단계 | 내용 | 산출물 |
|---|---|---|
| **0 ✅** | **스캐폴드 완료**: Next 16 / React 19 / TS / Tailwind4 / shadcn, Supabase 클라이언트(server/client/admin), `proxy.ts`(세션+admin가드), 디자인 토큰 이식, 공통 nav/footer, 홈 placeholder. `build`·`typecheck`·`lint` 통과, 홈 200 OK | `web/` 프로젝트 |
| **1 ✅** | **DB 마이그레이션 완료**: 24테이블·9enum·53 RLS정책·`place_order`/`is_admin`/가입·권한보호·구매인증 트리거, 시드(카테고리4·설정3). 원격 적용·검증 완료, TS 타입(`database.ts`) 생성·클라이언트 연결 | `web/supabase/migrations/*` |
| **2 ✅** | **인증 완료**: 이메일+비번 + Google OAuth, Server Actions(`signIn/signUp/signOut`), `/auth/callback` 코드교환, `proxy.ts` admin가드, nav 로그인상태/로그아웃. build·typecheck·lint·런타임 통과 | `/login`, `/signup` |
| **3 ✅** | **카탈로그 완료**: 카테고리(`/category/[slug]` SSG)·상품상세(`/product/[id]` SSG, 옵션/세일/품절/각인)·전체컬렉션·장바구니담기(localStorage)·SEO(JSON-LD/sitemap/robots). 테스트상품 9개 시드. 전부 정적/ISR. (홈 스타일퀴즈는 디자인 재작업 시 연결) | 공개 쇼핑 가능 |
| **4 ✅** | **장바구니+체크아웃 완료**: `/cart`(useCart/localStorage)·`/checkout`(인증가드·주소·결제·쿠폰)·`place_order` RPC 연동·`/order/[id]` 완료페이지. E2E 검증(가격확정·재고차감·재고초과/무효쿠폰 차단·쿠폰할인/단일사용). `place_order` 쿠폰 FK 버그 수정 | 주문 가능(서버 검증) |
| **5 ✅** | **마이페이지 완료**: 대시보드(등급·적립금)·주문내역·리뷰(구매인증 작성/삭제)·쿠폰·찜(토글+목록). 구매인증 트리거·RLS E2E 검증 | `/mypage/*` |
| 6 | 관리자 콘솔(상품/주문/유저/쿠폰/FAQ) | |
| 7 | SEO(메타/사이트맵/OG), 성능, E2E 테스트 | 배포 |
| 8 | 데이터 마이그레이션 + 컷오버 | 운영 전환 |

---

## 12. 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # 서버 전용 (마이그레이션/관리 작업)
NEXT_PUBLIC_SITE_URL=
```
- `service_role` 키는 **절대 클라이언트 번들에 포함 금지**. 서버 액션/스크립트에서만.

---

## 13. 결정이 필요한 열린 질문

1. **결제(PG)**: 현재는 무통장/수기 상태. 토스페이먼츠/포트원(아임포트) 등 실연동 여부?
2. **퀴즈 로직**: `fingerType`/`faceShape`를 추천에 반영할지, 질문을 줄일지.
3. **장바구니 영속화**: 로그인 시 서버 저장 vs localStorage 유지.
4. **계정 마이그레이션**: 기존 `@checkmate.app` 유저를 어떻게 이관할지(일괄 생성 vs 재가입).
5. **다국어/통화**: 한국어/원화 고정 vs 확장 고려.

---

## 14. 배포 / CI·CD / 도메인

### 14.1 배포 전략 — GitHub Actions 기반 CI/CD
`main` 브랜치 push → GitHub Actions가 빌드·테스트·배포를 자동 수행한다.

> **호스팅 타깃 결정 필요**: Next.js는 SSR/Server Action을 쓰므로 정적 호스팅(기존 Firebase Hosting `public:.`)만으로는 부족하다. 아래 중 택1.

| 옵션 | 설명 | 추천 상황 |
|---|---|---|
| **Firebase App Hosting** | Next.js SSR 네이티브 지원, Google Cloud 기반. 기존 Firebase 프로젝트·**Google 도메인 연결이 매끄러움**. GitHub 연동 자동 배포 내장(+ Actions 보강 가능). | 기존 Firebase/Google 생태계 유지 시 **추천** |
| Vercel | Next.js 1급 지원, 미리보기 배포·ISR 최적. GitHub Actions에서 `vercel deploy`로 호출하거나 Vercel Git 연동. | Next 기능 최대 활용 |
| Cloud Run (컨테이너) | `next start`를 Docker로 패키징 → Actions가 빌드·푸시·배포. 가장 유연, 운영 부담 ↑. | 세밀한 인프라 제어 필요 시 |

→ 현재 Firebase + 향후 Google 도메인 맥락상 **Firebase App Hosting**을 기본 권장. (Supabase는 DB로 그대로 사용, Firebase는 호스팅만 담당.)

### 14.2 GitHub Actions 워크플로 (예시 골격)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
  pull_request:           # PR엔 빌드/테스트만 (배포 X)

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test            # Vitest
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  deploy:
    needs: ci
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # ── 택1 ───────────────────────────────
      # (A) Firebase App Hosting / Hosting
      #   - uses: FirebaseExtended/action-hosting-deploy@v0
      #     with:
      #       repoToken: ${{ secrets.GITHUB_TOKEN }}
      #       firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
      #       projectId: check-mate-14014
      #       channelId: live
      # (B) Vercel
      #   - run: npx vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**시크릿 관리**: `SUPABASE_SERVICE_ROLE_KEY`, `FIREBASE_SERVICE_ACCOUNT`(또는 `VERCEL_TOKEN`)는 GitHub repo **Secrets**에만 저장. 절대 코드/`NEXT_PUBLIC_*`에 넣지 않는다.

**DB 마이그레이션 자동화(선택)**: Supabase CLI(`supabase db push`)를 별도 Action 단계로 두어 `supabase/migrations/*`를 환경에 반영. 운영 DB 변경은 수동 승인(environment protection) 권장.

### 14.3 도메인 — 추후 Google 도메인 연결
- 초기에는 호스팅 제공 기본 도메인(예: `*.web.app` 또는 `*.vercel.app`)으로 운영.
- 추후 **Google에서 구매한 커스텀 도메인**(예: `checkmate.co.kr`)을 연결:
  - **Firebase App Hosting/Hosting**: 콘솔에서 도메인 추가 → 제공된 A/AAAA(또는 CNAME) 레코드를 Google Domains/Cloud DNS에 등록 → SSL 자동 발급.
  - **Vercel**: 프로젝트 도메인 추가 → Vercel이 안내하는 A/CNAME 레코드를 등록.
- 전환 시 체크: `NEXT_PUBLIC_SITE_URL` 갱신, `app/sitemap.ts`·`robots.ts`·OG `url`의 절대경로 갱신, 구 도메인 → 신 도메인 **301 리다이렉트**, Search Console 도메인 등록/소유 확인.
- DNS는 가능하면 **Cloud DNS**로 통합 관리(Google 생태계 일관성).

### 14.4 환경 분리
- `main` → production, `develop`(또는 PR 미리보기) → staging. Supabase는 프로젝트를 prod/staging 2개로 분리하거나 동일 프로젝트 내 스키마 분리.
- PR 미리보기 배포로 머지 전 실물 확인(App Hosting preview channel / Vercel preview).

---

## 15. 추가 기능 (확장 설계)

기존 사이트(카탈로그·옵션·장바구니·쿠폰·리뷰·등급·재입고·관리자·스타일퀴즈) **외에** 안정적 운영을 위해 추가하는 기능. 우선순위 표기(P1 = 1차 출시, P2 = 후속).

### A. 커머스 핵심
| 기능 | 설명 | 우선 | 관련 테이블 |
|---|---|---|---|
| 결제 PG 연동 | 토스페이먼츠/포트원 — 결제 승인 웹훅으로 주문 `paid` 확정 | P1 | orders, `api/webhooks` |
| 배송지 주소록 | 다중 주소 저장·기본배송지 | P1 | addresses |
| 배송 추적 | 택배사·송장번호, 배송상태 타임라인 | P1 | shipments |
| 반품/교환 | 신청→승인→완료 워크플로 | P2 | order_returns |
| 배송비 정책 | 무료배송 기준·기본 배송비(설정값) | P1 | site_settings |
| 찜/위시리스트 | 상품 찜, 마이페이지 모음 | P1 | wishlists |
| 적립금(포인트) | 구매·리뷰·가입 적립, 결제 시 사용. 등급별 적립률 | P2 | point_ledger |
| 최근 본 상품 | 클라이언트(localStorage) + 선택적 서버 동기화 | P2 | — |
| 연관/추천 상품 | 동일 카테고리·함께 구매, 퀴즈 결과 연동 | P2 | products |

### B. 상품 / 주얼리 특화
| 기능 | 설명 | 우선 |
|---|---|---|
| 각인(Engraving) | 이니셜/문구 커스터마이즈, 주문에 스냅샷 | P2 |
| 링 사이즈 가이드 | 사이즈 측정 안내 + 옵션 연동 | P1 |
| 선물포장 옵션 | 포장 추가/메시지카드 | P2 |
| 관리/보증 안내 | 상품별 care guide, 보증서 안내 | P2 |
| 상품 Q&A | 리뷰와 별개의 질의응답(비밀글 가능) | P1 |

### C. 신뢰 / 리뷰
| 기능 | 설명 | 우선 |
|---|---|---|
| 구매 인증 리뷰 | 주문 이력 있는 사용자 리뷰에 ‘구매확인’ 뱃지 | P1 |
| 리뷰 도움돼요 | 추천 투표·정렬 | P2 |
| 평점 집계 | 상품별 평균/분포 캐시 | P1 |

### D. 회원 / 마이페이지
| 기능 | 설명 | 우선 |
|---|---|---|
| 1:1 문의 | 스레드형 고객지원 | P1 |
| 인앱 알림센터 | 주문상태·재입고·쿠폰·답변 | P1 |
| 이메일 알림 | 주문확인·배송 — Resend/Supabase Edge Function | P1 |
| 소셜 로그인 확장 | 구글 + (카카오/네이버) | P2 |
| 회원 탈퇴 | 본인 요청 탈퇴(데이터 처리 정책 포함) | P1 |

### E. 운영 / 관리자
| 기능 | 설명 | 우선 |
|---|---|---|
| 매출 대시보드 | 기간별 매출·주문수·인기상품 | P1 |
| 재고/SKU 관리 | 옵션단위 재고, 임계치 알림 | P1 |
| 일괄 상품 등록 | CSV 업로드 | P2 |
| 기획전/배너 | 메인 프로모션 노출 관리 | P2 |
| 쿠폰 발급 | 코드/대상/기간 관리, 자동 지급 | P1 |
| 관리자 활동 로그 | 변경 이력 감사(audit) | P2 |

### F. 플랫폼 / 비기능
| 기능 | 설명 | 우선 |
|---|---|---|
| SEO 구조화 데이터 | JSON-LD(Product/Offer/AggregateRating), 동적 sitemap/OG | P1 |
| 분석 | GA4/Plausible + 동의 배너 | P1 |
| 접근성 | WCAG AA, 키보드/스크린리더 | P1 |
| 개인정보/약관 | 동의 수집·처리방침 페이지 | P1 |
| 에러 모니터링 | Sentry 등 | P2 |
| 어뷰즈 방지 | 쿠폰/리뷰 rate limit, 캡차(가입) | P2 |
| 테스트 | 주문·결제 핵심 플로우 E2E(Playwright) | P1 |
| 다국어/통화 | i18n 구조만 선반영(기본 ko/KRW) | P2 |

---

## 16. 구조 안정성 점검 (Fresh-design 확인)

> 요청: "기존 구조를 아예 배제하고 새롭게 안정적으로 짜였는지" 확인.

### 16.1 레거시를 끌고 오지 않았다는 점
| 레거시 패턴 | 신규 설계 | 결과 |
|---|---|---|
| 옵션이 상품 문서 안 **중첩 객체** | `product_options` / `product_option_values` 정규화 | 옵션단위 재고·가격 정확 |
| 쿠폰이 `_coupons` **단일 문서 배열** | `coupons` 테이블 + `user_coupons` | 동시성·조회·검증 안전 |
| 주문이 단일/장바구니 **혼재 1컬렉션** | `orders` + `order_items` 헤더-라인 분리 | 다품목 주문 정상 모델링 |
| 리뷰 **서브컬렉션** | `reviews` (FK) + 집계 | 조인/집계 가능 |
| **클라이언트** 재고차감·금액계산 | `place_order` **RPC(서버 트랜잭션)** | 위변조·재고오차 차단 |
| 페이지 **복붙**(홈2·카테고리4) | RSC + 단일 템플릿 + 컴포넌트 | 중복 0 |
| 클라이언트 **role 게이트만** | `proxy.ts` 서버 가드 + RLS | 권한 우회 불가 |
| `id@checkmate.app` **가짜 이메일** | 정식 이메일 + OAuth | 인증/복구 정상 |

→ 데이터 모델·신뢰경계·렌더링·인증 **4개 축 모두** 레거시 구조를 계승하지 않고 재설계함.

### 16.2 안정성 원칙 체크리스트
- ✅ **정규화 + 무결성**: 모든 관계 FK, `on delete` 정책 명시, 금액/수량 `check` 제약.
- ✅ **동시성**: 재고 차감은 `select … for update` 행잠금으로 경쟁조건 차단.
- ✅ **권한**: 테이블별 RLS + `security definer` RPC, service_role은 서버 전용.
- ✅ **불변 이력**: 주문 품목은 가격/상품명 **스냅샷** 저장(상품 변경에 영향 없음).
- ✅ **인덱스**: 조회 패턴별 인덱스(`user_id`, `category_slug`, trgm 검색).
- ✅ **확장성**: 기능 추가가 테이블 추가로 격리(코어 스키마 변경 최소).
- ✅ **타입 안전**: DB→TS 타입 생성으로 컴파일 타임 보장.
- ✅ **검증 일원화**: Zod 스키마를 클라이언트·서버 액션이 공유.
- ✅ **관측성/테스트**: 에러 모니터링 + 결제·주문 E2E(P1).

### 16.3 남은 리스크 / 결정 필요
- 결제 PG 선택(토스/포트원) — 웹훅 멱등성·환불 플로우 설계 동반.
- 적립금·등급 적립률 정책(비즈니스 룰) 확정 필요.
- 알림 채널(인앱/이메일/카카오 알림톡) 범위.
- 개인정보 보관·탈퇴 처리 정책(법적 요건).

---

*이 문서는 합의용 설계입니다. 승인되면 단계 1(DB 마이그레이션)부터 구현을 이어갑니다. (단계 0 스캐폴드는 완료)*
