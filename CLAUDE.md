# CHECKMATE — 프로젝트 작업 가이드 (CLAUDE.md)

주얼리 이커머스 **CHECKMATE**. Firebase 정적 사이트를 **Next.js + Supabase**로 전면 재설계 완료.
작업/구현은 모두 레포 루트의 **`web/`** 에서 진행한다.

---

## 1. 레포 구조

```
checkmate/
├─ web/          ← 신규 앱 (Next.js 16 + Supabase) — 여기서 개발
├─ legacy/       ← 구 Firebase 정적 사이트 (디자인 참고용 보관, 개발/배포 대상 아님)
├─ docs/
│  ├─ ARCHITECTURE.md      ← 전체 설계(목표). 스키마·RLS·RPC·로드맵·배포·추가기능
│  └─ CURRENT-STRUCTURE.md ← 구 사이트(As-Is) 기록
└─ CLAUDE.md     ← (이 파일)
```

설계의 단일 소스는 **`docs/ARCHITECTURE.md`**. 큰 결정/스키마 변경 시 같이 갱신할 것.

---

## 2. 기술 스택

- **Next.js 16.2** (App Router) / **React 19** / **TypeScript(strict)** / **Tailwind v4** / **shadcn/ui**
- **Supabase**: Postgres + Auth(이메일+Google) + Storage + RLS + RPC
- 폼/검증: React Hook Form 없이 **Server Actions + Zod**, 클라 상호작용은 `useActionState`/`useTransition`
- 장바구니: `localStorage('cm_cart')` + `useSyncExternalStore`(`src/lib/cart.ts`)

### ⚠️ Next 16 주의 (학습데이터와 다름)
- `middleware.ts` → **`proxy.ts`** (함수명 `proxy`). 코드 작성 전 `web/node_modules/next/dist/docs/` 참고.
- `params`/`searchParams` 는 **Promise** (await 필요).
- ESLint 규칙 `react-hooks/set-state-in-effect`: effect 내 동기 setState 금지 → `useSyncExternalStore` 또는 async 콜백 사용.

---

## 3. 명령어 (web/ 에서)

```bash
npm run dev          # 개발 (localhost:3000)
npm run build        # 프로덕션 빌드
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test:e2e     # Playwright E2E 테스트 (dev 서버 자동 실행)
npm run test:e2e:ui  # Playwright UI 모드
node --env-file=.env.local scripts/seed-products.mjs   # 테스트 상품 시드
```

각 단계 완료 시 **typecheck + lint + build** 통과를 기준으로 삼는다.

---

## 4. 배포

- **GitHub**: `SkyWith628/checkmate` (private)
- **CI**: `.github/workflows/deploy.yml` — `master` push 시 typecheck + lint 자동 실행
- **호스팅**: Vercel (GitHub 연동, `master` push 시 자동 배포)
  - Root Directory: `web/`
  - 환경변수: Vercel 대시보드에서 관리 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)

---

## 5. Supabase 연결

- 프로젝트 ref: **`xokjeowkibmksxgebdoh`**
- 키: `web/.env.local` (신형 `sb_publishable_` / `sb_secret_`). gitignore됨.
  - `NEXT_PUBLIC_SUPABASE_URL` 은 **베이스 URL만** (`https://xxx.supabase.co`, `/rest/v1/` 붙이지 말 것)
- SQL 변경: `web/supabase/migrations/*.sql` 에 파일 추가 후 **대시보드 SQL Editor에 붙여넣어 Run**.
  - SQL Editor: `https://supabase.com/dashboard/project/xokjeowkibmksxgebdoh/sql/new`

### 클라이언트 (`src/lib/supabase/`)
- `server.ts` — 쿠키 세션(Server Component/Action). **쿠키를 읽으면 라우트가 동적이 됨.**
- `client.ts` — 브라우저(Client Component).
- `public.ts` — 쿠키 없는 공개 읽기용 → **카탈로그 SSG/ISR 유지에 사용**.
- `admin.ts` — service_role(서버 전용). RLS 우회. **getAdmin() 검증 후에만** 사용.

---

## 6. DB / 보안 핵심 (절대 깨지 않게)

- **신뢰 경계는 서버.** 주문/재고/가격/쿠폰은 클라가 보낸 값을 신뢰하지 않는다.
- **`place_order(p_items, p_coupon_code, ...)` RPC** (security definer): 가격을 DB에서 확정,
  `for update` 행잠금으로 재고 차감, 쿠폰 보유/유효/최소금액 검증·단일사용. 주문은 이 RPC로만 생성.
  - 쿠폰은 검증 통과 후 **마지막 UPDATE에서 `coupon_code` 설정**(초기 INSERT에 넣으면 FK 위반 — 수정 완료).
- **RLS**: 테이블 24개 정책 53개. `is_admin()`(security definer)로 관리자 분기.
  - 주문: 본인 읽기, INSERT 정책 없음(RPC만), 수정 admin.
  - profiles: 본인/admin 읽기, `protect_profile_fields` 트리거가 일반유저의 role/grade/points/ban 변경 차단.
    (admin은 **쿠키 세션 클라이언트**로 변경해야 함. service_role은 `auth.uid()=null`이라 트리거가 막음.)
  - reviews: `set_review_verified` 트리거가 구매이력 기준 `is_verified` 강제(위조 불가).
  - user_coupons: 본인만 INSERT(RLS) → **관리자 쿠폰 지급은 service_role 사용**(getAdmin 검증 후).
- 가입 시 `handle_new_user` 트리거가 `profiles` 자동 생성(role=user).

### TS 타입 (`src/lib/types/database.ts`)
- 수기 작성. postgrest가 요구하는 `Relationships`를 매핑 타입(`AddRelationships`)으로 자동 부착.
- **중첩 select**(`*, order_items(*)` 등)는 `Relationships`가 비어 추론 불가 → `as unknown as <Type>` 캐스팅.
- 헬퍼: `Tables<"x">`, `TablesInsert<"x">`, `TablesUpdate<"x">`.

### 첫 관리자 지정 (가입 후 SQL Editor에서 실행)
```sql
update profiles set role='admin'
where id=(select id from auth.users where email='본인이메일');
```

---

## 7. 진행 현황 (로드맵) — 전체 완료

| 단계 | 상태 | 내용 |
|---|---|---|
| 0 스캐폴드 | ✅ | Next/TS/Tailwind/shadcn, supabase 클라 3종, `proxy.ts`, 디자인토큰, nav/footer |
| 1 DB | ✅ | 24테이블·9enum·53 RLS·RPC·트리거·시드. 원격 적용·검증·TS타입 |
| 2 인증 | ✅ | 이메일+비번 + Google OAuth, `/login` `/signup` `/auth/callback`, nav 로그인상태 |
| 3 카탈로그 | ✅ | `/category/[slug]`·`/product/[id]`(SSG)·`/collection`, 장바구니담기, SEO(JSON-LD/sitemap/robots) |
| 4 주문 | ✅ | `/cart`·`/checkout`·`place_order` 연동·`/order/[id]`. E2E 검증(가격/재고/쿠폰) |
| 5 마이페이지 | ✅ | 대시보드·주문내역·리뷰(구매인증)·쿠폰·찜. E2E 검증 |
| 6 관리자 | ✅ | 상품/옵션/주문/회원/쿠폰/FAQ 전체 완성. 코드 리뷰 이슈 5건 수정 |
| 7 SEO/테스트/배포 | ✅ | GitHub Actions CI, Vercel 자동배포, Playwright E2E 13개 통과 |
| 8 데이터 이전 | ➖ | 레거시 데이터 없이 신규 운영으로 결정 |

---

## 8. 컨벤션 / 패턴

- **데이터 읽기**: 공개=`public.ts`(SSG), 인증필요=`server.ts`. 쿼리는 `src/lib/queries/*`.
- **변경**: `src/lib/actions/*` Server Action + Zod + `revalidatePath`.
  관리자 액션은 첫 줄에 `getAdmin()` 재검증 필수.
- **클라 상호작용**: `useActionState`(폼) / `useTransition`(버튼) / `sonner` 토스트.
- **`useEffect` toast deps**: `[state.error]`/`[state.ok]` 대신 `[state]` 객체 전체로 — 같은 에러 연속 발생 시 재발동 보장.
- **카탈로그는 정적 유지**: 페이지/레이아웃에서 쿠키(인증) 읽지 말 것. 인증상태는 클라(`SiteNav`)에서.
- **디자인 토큰**: `bg-sand`/`text-cherry`/`text-gold`/`text-dark`/`font-display` 등 (`globals.css @theme`).
  디자인은 추후 재작업 예정 — 현재는 기능 위주.
- 금액=정수(원), `formatKRW()`. 날짜=`timestamptz`.

---

## 9. 검증 습관

- SQL/RPC/RLS 변경 후 **service_role 스크립트로 E2E**(임시 유저 생성→동작→정리)로 확인.
  (예: 가격확정·재고차감·쿠폰·구매인증 트리거·RLS 차단)
- 페이지는 `npm run build` 라우트표로 정적/동적(○/●/ƒ) 확인.
- 코드 변경 후 `npm run typecheck && npm run lint` 통과 필수.
