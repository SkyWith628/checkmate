# CHECKMATE — 현재 프로젝트 구조 (As-Is)

> 재설계 전, **기존 Firebase 정적 사이트**의 현황 정리.
> 형태: 빌드 도구 없는 **순수 HTML/CSS/JS 멀티페이지** + Firebase BaaS.
> 신규 설계는 [ARCHITECTURE.md](./ARCHITECTURE.md) 참고.

> **📁 위치 변경(2026-06)**: 아래 기술된 파일들은 이제 레포 루트의 **`legacy/`** 폴더로 이동되어 보관됩니다.
> 신규 앱은 **`web/`**(Next.js + Supabase)에서 개발 중입니다. 현재 루트 구조:
> `web/` (신규 앱) · `legacy/` (구 사이트 보관) · `docs/` (설계 문서) · `.gitignore`

---

## 1. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 아키텍처 | 정적 호스팅(Firebase Hosting) + Firebase BaaS (서버리스) |
| 빌드 | **없음** — HTML 직접 작성, CDN ESM으로 Firebase SDK import |
| 페이지 | HTML 16개 (고객 + 관리자) |
| 백엔드 | Firestore(DB), Firebase Auth, Firebase Storage |
| 공유 코드 | `js/` 2개, `style/` 2개 (나머지는 페이지 인라인) |
| 총 규모 | HTML/CSS/JS 약 12,000줄 |

---

## 2. 파일 트리

```
checkmate/
├─ index.html          (869)  홈 — 히어로 + 스타일 진단 퀴즈
├─ checkmate.html      (846)  홈 거의 중복본 (로고가 전부 여기로 링크) ⚠️
├─ pendant.html        (329)  카테고리: 펜던트  ┐
├─ ring.html           (328)  카테고리: 반지    │ 4개가 CAT 상수·메타만
├─ earring.html        (328)  카테고리: 이어링  │ 다르고 사실상 복붙 ⚠️
├─ bracelet.html       (328)  카테고리: 브레이슬렛 ┘
├─ product.html       (1732)  상품 상세 (?id=) — 옵션/재고/쿠폰/주문/리뷰
├─ collection.html     (540)  전체 컬렉션
├─ cart.html           (663)  장바구니 + 주문
├─ mypage.html        (1522)  마이페이지 (주문/리뷰/쿠폰/등급)
├─ login.html          (568)  로그인 + 회원가입 (이메일/구글)
├─ grade.html          (261)  등급 안내
├─ admin-login.html    (346)  관리자 로그인
├─ admin.html         (2823)  관리자 콘솔 (상품/주문/유저/쿠폰/FAQ/알림)
├─ 404.html            (105)  Not Found
├─ test.html             (0)  빈 테스트 파일 ⚠️ (정리 대상)
│
├─ js/
│  ├─ firebase-config.js     Firebase 웹 설정 (공개 키)
│  └─ cart-badge.js          localStorage 'cm_cart' 기반 장바구니 뱃지
├─ style/
│  ├─ common.css             디자인 토큰(:root 변수) + nav/뱃지 공통
│  └─ collection.css         컬렉션 페이지 전용
├─ picture/
│  ├─ cm.png                 파비콘
│  ├─ main.png               메인 이미지
│  ├─ og-image.png           OG 공유 이미지
│  ├─ checkmate 로고.png     로고 (공백·한글 파일명) ⚠️
│  └─ KakaoTalk_*.png ×4     아이콘(검색/유저/장바구니) + 메뉴 이미지 ⚠️ 파일명
│
├─ firebase.json            Hosting/Firestore 설정 (cleanUrls, redirects, headers)
├─ firestore.rules          Firestore 보안 규칙
├─ storage.rules            Storage 보안 규칙 (리뷰 사진 5MB/image)
├─ .firebaserc             프로젝트 별칭 (check-mate-14014)
├─ sitemap.xml / robots.txt SEO
└─ .firebase/hosting..cache 배포 캐시 (추적됨 ⚠️ — .gitignore 부재)
```

---

## 3. 페이지 역할 / 라우팅

`firebase.json`은 `cleanUrls: true`(→ `.html` 생략 URL), `/checkmate → /` 301 리다이렉트.

| URL | 파일 | 역할 |
|---|---|---|
| `/` | index.html | 홈, 스타일 진단 퀴즈 |
| `/checkmate` | checkmate.html | **홈 중복** → `/`로 301 (로고 링크가 여기를 가리켜 이중 리다이렉트) |
| `/pendant` `/ring` `/earring` `/bracelet` | 각 html | 카테고리별 상품 목록 (Firestore where category==) |
| `/product?id=…` | product.html | 상품 상세 |
| `/collection` | collection.html | 전체 상품 |
| `/cart` | cart.html | 장바구니 → 주문 |
| `/login` | login.html | 로그인/가입 |
| `/mypage` | mypage.html | 내 정보/주문/리뷰/쿠폰 |
| `/grade` | grade.html | 등급 안내 |
| `/admin-login` `/admin` | admin*.html | 관리자 |

---

## 4. 데이터 모델 (Firestore, 현행)

| 컬렉션 | 주요 필드 | 비고 |
|---|---|---|
| `products/{id}` | name, category, price, salePrice, stock, image, images[], material, soldOut, **옵션(중첩 객체)** | 옵션 그룹/값이 문서 안에 nested |
| `products/_coupons` | list[] (쿠폰 배열) | **단일 문서에 쿠폰 전체** |
| `products/{id}/reviews/{id}` | userId, rating(1-5), content, images[] | 서브컬렉션 |
| `users/{uid}` | role(user/admin), grade, name/firstName, email, collectedCoupons[], createdAt | |
| `orders/{id}` | productId 또는 items[], price, total, subtotal, discount, couponCode, qty, option, payMethod, recipient, phone, address, status, userId | **단일/장바구니 주문이 한 컬렉션에 혼재** |
| `banned_users/{uid}` | — | 차단 목록 |
| `faqs/{id}` | question, answer | |
| `admin_notifications/{id}` | 주문/문의 알림 | |
| `restock_alerts/{productId}` | 재입고 알림 신청 | |

---

## 5. 인증

- **Firebase Auth**: 이메일+비밀번호, Google 팝업 로그인.
- **아이디 로그인 트릭**: 입력한 아이디에 `@`가 없으면 `id@checkmate.app`을 붙여 가짜 이메일로 변환([login.html](../login.html) `toEmail()`). → 이메일 인증/비번 재설정에 한계.
- **관리자 게이트**: `admin.html`에서 `onAuthStateChanged` → `users/{uid}.role === 'admin'` 확인(클라이언트 UI 차단). 실제 데이터 보호는 Firestore 규칙이 담당.
- **차단 처리**: 로그인 시 `banned_users` 존재하면 강제 `signOut`.

---

## 6. 보안 규칙 요약 (firestore.rules / storage.rules)

- 잘 되어 있는 부분: 가입 시 `role=='user'` 강제, 본인이 role/grade/email 수정 불가, 주문 생성 시 `price == 실제 상품가` 검증, Storage 5MB·image/* 제한.
- **약점(재설계에서 해결)**:
  - 상품 쓰기는 관리자만 → **클라이언트의 재고 차감(`updateDoc(products,…)`)이 일반 고객에게 항상 실패**(빈 catch로 무시됨).
  - 주문 `total`은 `>=1`만 검사 → **쿠폰 적용 후 금액 위조 가능**.
  - 옵션 절대가/`salePrice` 사용 시 규칙의 `price` 검증과 불일치 위험.
  - 쿠폰 유효성/할인 계산이 100% 클라이언트.

---

## 7. 프론트엔드 패턴

- **공유 코드 최소**: 디자인 토큰만 `style/common.css`(38줄), 나머지 스타일·nav·스크립트는 **각 페이지에 인라인 복붙**.
- **Firebase SDK**: 각 페이지가 `https://www.gstatic.com/firebasejs/10.12.0/…`를 ESM `import`(번들 없음).
- **장바구니**: `localStorage['cm_cart']` + `js/cart-badge.js`로 뱃지 동기화(`storage` 이벤트).
- **잘 만든 부분**: 적응형 로고 색상(WCAG 명도 계산), 햄버거 morph 애니메이션, 인라인 검색 확장, 스타일 진단 퀴즈.

---

## 8. 알려진 이슈 (재설계 동기)

1. **홈 중복** — `index.html` ↔ `checkmate.html` 거의 동일, 로고가 후자를 가리켜 이중 리다이렉트 + 중복 콘텐츠 SEO 페널티.
2. **카테고리 4페이지 복붙** — 한 곳 수정 시 4곳 수정 필요.
3. **프로덕션 플레이스홀더** — 풀스크린 메뉴에 `집갈래/배고파/ㅜㅜ/메뉴` 등 디버그 잔재 노출.
4. **재고 차감 미작동** — RLS에 막혀 고객 주문 시 재고 안 줄어듦.
5. **주문/쿠폰 금액 클라 검증** — 위변조 가능.
6. **퀴즈 미사용 데이터** — fingerType/faceShape 수집 후 버려짐.
7. **리포 위생** — `.gitignore` 없음, `.firebase/hosting..cache`·`test.html`·카톡 파일명 이미지 방치.
8. **SEO** — 카테고리 title 소문자·브랜드 없음, 상품/카테고리 OG 빈약.

→ 위 항목들의 해결책은 [ARCHITECTURE.md](./ARCHITECTURE.md)에 반영됨.

---

*이 문서는 현행(As-Is) 기록용입니다. 마이그레이션의 출발점 스냅샷으로 사용합니다.*
