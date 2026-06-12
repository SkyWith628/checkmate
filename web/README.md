# CHECKMATE — web

CHECKMATE 이커머스 앱 (Next.js 16 + Supabase). 프로젝트 전체 소개는 레포 루트의 [README](../README.md)를 참고하세요.

## 빠른 시작

```bash
npm install
cp .env.local.example .env.local   # 값 채우기
npm run dev                        # http://localhost:3000
```

## 명령어

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | eslint |
| `npm run test:e2e` | Playwright E2E |
| `node --env-file=.env.local scripts/create-admin.mjs <email> <password> [name]` | 관리자 계정 생성 |

설계 단일 소스: [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) · 작업 가이드: [`../CLAUDE.md`](../CLAUDE.md)
