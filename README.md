<div align="center">

# CHECK ⬦ MATE

**개인 큐레이션 주얼리 이커머스** — Firebase 정적 사이트를 **Next.js + Supabase**로 전면 재설계

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres·Auth·RLS-3FCF8E?logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)

</div>

---

## 개요

주얼리(펜던트·반지·이어링·브레이슬렛)를 판매하는 풀스택 이커머스입니다. 카탈로그 열람부터 장바구니·주문·결제, 마이페이지(주문/리뷰/쿠폰/찜), 그리고 관리자 백오피스까지 운영에 필요한 흐름을 갖췄습니다.

핵심은 **신뢰 경계를 서버에 둔 설계**입니다 — 가격·재고·쿠폰은 클라이언트 값을 신뢰하지 않고 **DB에서 확정**하며, 접근 제어는 **Postgres RLS + 트리거**로 강제합니다.

## 주요 기능

| 영역 | 내용 |
|---|---|
| 🛍️ 카탈로그 | 카테고리/상품상세/컬렉션, **SSG·ISR** 정적 렌더, SEO(JSON-LD·sitemap·robots) |
| 🔐 인증 | 이메일+비밀번호 / Google OAuth, 세션 기반 보호 라우트 |
| 🛒 주문 | 장바구니(localStorage) → 주문서 → **원자적 `place_order` RPC**(가격확정·재고차감·쿠폰검증) |
| 👤 마이페이지 | 대시보드·주문내역·**구매인증 리뷰**·쿠폰·찜 |
| 🧑‍💼 관리자 | 상품/옵션/주문/회원/쿠폰/FAQ 관리, 역할 기반 접근 제어 |
| 🎨 디자인 | 3D 럭셔리 UI — 스크롤 reveal·포인터 틸트·glass·gold 그라데이션 (순수 CSS + IntersectionObserver) |

## 기술 스택

- **프레임워크**: Next.js 16 (App Router) · React 19 · TypeScript(strict)
- **스타일**: Tailwind CSS v4 · shadcn/ui · Pretendard(본문) / Cormorant Garamond(디스플레이)
- **백엔드**: Supabase — Postgres · Auth · Storage · **RLS** · **RPC(security definer)** · 트리거
- **폼/검증**: Server Actions + Zod (`useActionState` / `useTransition`)
- **테스트/CI**: Playwright E2E · GitHub Actions(typecheck + lint) · Vercel 자동 배포

## 보안 설계 하이라이트

- **`place_order` RPC** (security definer): 주문은 이 RPC로만 생성. 가격을 DB에서 확정하고, `for update` 행잠금으로 재고를 차감하며, 쿠폰의 보유·유효·최소금액을 서버 검증한 뒤 단일 사용 처리 — 전 과정이 **하나의 트랜잭션**(실패 시 롤백).
- **RLS 53개 정책 / 24개 테이블**: 주문은 본인만 조회·RPC로만 생성, 관리자 분기는 `is_admin()`으로 처리.
- **트리거 방어**: `protect_profile_fields`(일반 유저의 role/등급/포인트/밴 변경 차단), `set_review_verified`(구매 이력 기반 리뷰 인증 위조 불가), `handle_new_user`(가입 시 프로필 자동 생성).

## 프로젝트 구조

```
checkmate/
├─ web/                  # 앱 (Next.js 16 + Supabase)
│  ├─ src/
│  │  ├─ app/            # App Router (shop / auth / admin)
│  │  ├─ components/     # shop · admin · auth · ui
│  │  ├─ lib/            # actions · queries · supabase 클라 4종 · types · validations
│  │  └─ proxy.ts        # Next 16 미들웨어(인증 라우트 가드)
│  ├─ supabase/migrations/   # 스키마 · RLS · RPC · 트리거 SQL
│  ├─ scripts/           # seed-products.mjs · create-admin.mjs
│  └─ e2e/               # Playwright 테스트
├─ docs/ARCHITECTURE.md  # 설계 단일 소스(스키마·RLS·RPC·로드맵)
└─ CLAUDE.md             # 개발 작업 가이드
```

## 로컬 실행

> 모든 개발은 `web/` 에서 진행합니다.

```bash
cd web
npm install

# 환경변수 설정 (.env.local.example 참고)
cp .env.local.example .env.local
#   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#   SUPABASE_SERVICE_ROLE_KEY=...        (서버 전용)
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000

npm run dev          # 개발 서버 (localhost:3000)
```

DB 스키마는 `web/supabase/migrations/*.sql` 을 Supabase 대시보드 SQL Editor에 붙여 실행합니다.

### 명령어

```bash
npm run dev          # 개발
npm run build        # 프로덕션 빌드
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test:e2e     # Playwright E2E (dev 서버 자동 기동)
node --env-file=.env.local scripts/seed-products.mjs   # 테스트 상품 시드
```

### 관리자 계정 생성

```bash
node --env-file=.env.local scripts/create-admin.mjs <email> <password> [name]
```

승격된 계정으로 로그인하면 우상단 사용자 메뉴에 **관리자 페이지(`/admin`)** 항목이 나타납니다.

## 배포

- **호스팅**: Vercel (Root Directory `web/`, `master` push 시 자동 배포)
- **CI**: GitHub Actions — `master` push 시 typecheck + lint
- 환경변수는 Vercel 대시보드에서 관리

---

<div align="center">
<sub>개인 학습/포트폴리오 프로젝트 · Next.js 16 + Supabase 풀스택</sub>
</div>
