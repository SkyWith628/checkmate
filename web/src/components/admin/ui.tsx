import * as React from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────
   CHECKMATE 관리자 — 럭셔리 다크 표면 프리미티브
   고객 면과 같은 디자인 언어(gold hairline · shadow-luxe ·
   eyebrow 라벨 · 라운드 풀 CTA)를 내부 도구 밀도에 맞춰 적용.
   순수 프레젠테이션 → 서버 컴포넌트로 사용 가능.
─────────────────────────────────────────────── */

/** 폼 입력 공통 클래스 (gold 포커스 링) */
export const adminInput =
  "rounded-lg border border-[rgba(201,169,110,0.22)] bg-[#1a1512] px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-antique-gold focus:ring-2 focus:ring-antique-gold/20";

/** 라벨+입력 세로 묶음 */
export const adminLabel = "flex flex-col gap-1.5 text-sm text-muted-foreground";

/** 컴팩트 입력/셀렉트 (테이블 인라인 컨트롤용) */
export const adminInputSm =
  "rounded-lg border border-[rgba(201,169,110,0.22)] bg-[#1a1512] px-2.5 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-antique-gold focus:ring-2 focus:ring-antique-gold/20 disabled:opacity-50";

/** 주 CTA — 골드 라운드 풀 버튼 */
export const adminBtnPrimary =
  "inline-flex items-center justify-center rounded-full bg-antique-gold px-5 py-2 text-sm font-medium text-dark shadow-gold-glow transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0";

/** 테이블 헤더 행 */
export const tableHead =
  "border-b border-[rgba(201,169,110,0.18)] bg-[rgba(201,169,110,0.05)] text-left text-[11px] uppercase tracking-[0.18em] text-antique-gold/70";

/** 테이블 데이터 행 */
export const tableRow =
  "border-b border-[rgba(201,169,110,0.08)] align-top transition-colors last:border-0 hover:bg-[rgba(201,169,110,0.04)]";

/** 럭셔리 패널 표면 클래스 — div 외 요소(form 등)에도 직접 적용 */
export const panelClass =
  "rounded-2xl border border-[rgba(201,169,110,0.16)] bg-[#211a16] shadow-luxe";

/** 럭셔리 패널 — gold 헤어라인 + 입체 그림자 표면 */
export function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(panelClass, className)} {...props} />;
}

/** 페이지 헤더 — eyebrow + font-display 제목 + 카운트 + 액션 슬롯 */
export function PageHeader({
  eyebrow,
  title,
  count,
  action,
}: {
  eyebrow?: string;
  title: string;
  count?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(201,169,110,0.15)] pb-5">
      <div className="flex flex-col gap-1.5">
        {eyebrow && (
          <span className="text-[11px] uppercase tracking-[0.3em] text-antique-gold/70">
            {eyebrow}
          </span>
        )}
        <h1 className="flex items-baseline gap-2.5 font-display text-3xl leading-none text-foreground">
          {title}
          {count != null && (
            <span className="font-sans text-sm font-light text-muted-foreground">
              {count}
            </span>
          )}
        </h1>
      </div>
      {action}
    </div>
  );
}

/** 활성/비활성 상태 알약 */
export function StatusPill({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs",
        active
          ? "bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-500/25"
          : "bg-white/5 text-muted-foreground ring-1 ring-white/10",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-emerald-400" : "bg-muted-foreground/50",
        )}
      />
      {children}
    </span>
  );
}
