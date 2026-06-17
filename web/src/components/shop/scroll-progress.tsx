"use client";

import { useEffect, useRef } from "react";

/**
 * 상단 골드 스크롤 진행률 바 (codeit 스프린트류 디테일).
 *
 * [What] 페이지 스크롤 비율을 0→1 로 환산해 바의 가로 스케일로 표현.
 * [Why]  setState 대신 ref 로 transform 을 직접 갱신 → 리렌더 없이 부드럽고,
 *        rAF 스로틀 + passive 리스너로 스크롤 성능 부담 최소화
 *        (react-hooks/set-state-in-effect 규칙도 자연스럽게 회피).
 * [How]  프리미엄 사이트가 흔히 쓰는 독서 진행 인디케이터 패턴.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      raf.current = null;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const ratio = max > 0 ? Math.min(doc.scrollTop / max, 1) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => {
      if (raf.current == null) raf.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
    >
      <div
        ref={barRef}
        className="h-full origin-left scale-x-0 bg-linear-to-r from-antique-gold via-gold to-antique-gold shadow-[0_0_12px_rgba(201,169,110,0.7)] [transition:transform_120ms_var(--ease-luxe)] will-change-transform"
      />
    </div>
  );
}
