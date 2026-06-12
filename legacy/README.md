# legacy/ — 구 Firebase 정적 사이트 (보관용)

이 폴더는 **재설계 이전의 기존 CHECKMATE 사이트**(순수 HTML/CSS/JS + Firebase) 전체를
보관한 것입니다. 신규 앱은 레포 루트의 **`web/`** (Next.js + Supabase)로 개발됩니다.

## 보관 이유
- **디자인 참고**: 추후 디자인 재작업 시 기존 화면/스타일/인터랙션 참조용.
- **데이터 모델 참조**: `firestore.rules` 등 기존 규칙·구조 확인용.
- **롤백 안전망**: 마이그레이션 중 비교/복구용.

## 주의
- 여기 파일은 **더 이상 개발/배포 대상이 아닙니다.**
- 운영 데이터는 Firebase 클라우드에 있으며, Supabase로 마이그레이션 예정
  (계획: [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) 10장).
- 현행 구조 설명: [`../docs/CURRENT-STRUCTURE.md`](../docs/CURRENT-STRUCTURE.md).

컷오버(전환) 완료 후 이 폴더는 삭제해도 됩니다.
