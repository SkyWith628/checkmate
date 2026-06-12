"use client";

import Link from "next/link";
import { useRef } from "react";

/**
 * 히어로 — 마우스 패럴럭스로 떠다니는 3D 주얼리 무대.
 * 변형은 ref 로 직접 조작(스프링 느낌의 lerp)해 setState 없이 부드럽게.
 */
export function HomeHero() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  function tick() {
    current.current.x += (target.current.x - current.current.x) * 0.08;
    current.current.y += (target.current.y - current.current.y) * 0.08;
    const layers = sceneRef.current?.querySelectorAll<HTMLElement>("[data-depth]");
    layers?.forEach((el) => {
      const depth = Number(el.dataset.depth ?? "1");
      el.style.transform = `translate3d(${current.current.x * depth}px, ${current.current.y * depth}px, 0)`;
    });
    const dx = Math.abs(target.current.x - current.current.x);
    const dy = Math.abs(target.current.y - current.current.y);
    if (dx > 0.1 || dy > 0.1) raf.current = requestAnimationFrame(tick);
    else raf.current = null;
  }

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    target.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 40;
    target.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * 40;
    if (!raf.current) raf.current = requestAnimationFrame(tick);
  }

  function handleLeave() {
    target.current.x = 0;
    target.current.y = 0;
    if (!raf.current) raf.current = requestAnimationFrame(tick);
  }

  return (
    <section
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="bg-luxe-radial relative isolate flex min-h-[92vh] items-center overflow-hidden"
    >
      {/* 배경 글로우 */}
      <div
        aria-hidden
        className="animate-glow pointer-events-none absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-antique-gold/25 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-glow pointer-events-none absolute -bottom-32 right-0 h-[32rem] w-[32rem] rounded-full bg-cherry/15 blur-3xl [animation-delay:1.5s]"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-6 py-20 md:grid-cols-2 md:px-[60px]">
        {/* 카피 */}
        <div className="flex flex-col items-start gap-7">
          <span className="glass shadow-luxe inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-cherry">
            <span className="h-1.5 w-1.5 rounded-full bg-antique-gold" />
            Check your style
          </span>

          <h1 className="font-display text-5xl font-light leading-[1.05] text-dark md:text-7xl">
            <span className="italic">나만의 주얼리</span>
            <br />
            <span className="text-gold-gradient animate-gradient bg-[length:200%_auto] not-italic tracking-[0.04em]">
              체크메이트
            </span>
            <span className="not-italic">가</span>
            <br />
            <span className="italic">찾아드립니다</span>
          </h1>

          <p className="max-w-md text-sm leading-loose text-muted-foreground">
            스타일 진단으로 시작하는 퍼스널 주얼리 메이트.
            <br />
            당신의 취향에 꼭 맞는 한 점을 큐레이션합니다.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/collection"
              className="bg-cherry-deep group relative overflow-hidden rounded-full px-9 py-4 text-[11px] uppercase tracking-[0.25em] text-cream shadow-luxe transition-transform duration-300 [transition-timing-function:var(--ease-spring)] hover:-translate-y-0.5"
            >
              <span className="shine relative z-10">컬렉션 보기</span>
            </Link>
            <Link
              href="/collection"
              className="glass rounded-full px-9 py-4 text-[11px] uppercase tracking-[0.25em] text-dark transition-colors duration-300 hover:bg-gold/40"
            >
              더 알아보기
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-8 border-t border-gold/60 pt-6">
            {[
              { n: "1,200+", l: "큐레이션 아이템" },
              { n: "98%", l: "재구매 만족도" },
              { n: "24h", l: "빠른 배송" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-2xl text-cherry">{s.n}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3D 무대 */}
        <div ref={sceneRef} className="scene-3d relative hidden h-[34rem] md:block">
          {/* 중앙 카드 */}
          <div
            data-depth="1.2"
            className="absolute left-1/2 top-1/2 h-72 w-60 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="animate-float group glass shadow-luxe relative flex h-full w-full items-center justify-center overflow-hidden rounded-[2rem]">
              <div className="shine absolute inset-0" />
              <Gem className="h-28 w-28 drop-shadow-[0_10px_24px_rgba(58,36,32,0.4)]" />
              <span className="absolute bottom-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Signature
              </span>
            </div>
          </div>

          {/* 위성 카드 1 */}
          <div data-depth="2.2" className="absolute left-2 top-10 h-36 w-32">
            <div className="animate-float-slow bg-gold-sheen animate-gradient shadow-gold-glow flex h-full w-full items-center justify-center rounded-[1.5rem]">
              <Gem className="h-12 w-12 opacity-80" tone="cherry" />
            </div>
          </div>

          {/* 위성 카드 2 */}
          <div data-depth="3" className="absolute right-0 top-24 h-28 w-28">
            <div className="animate-float glass shadow-luxe flex h-full w-full items-center justify-center rounded-full [animation-delay:0.8s]">
              <Ring className="h-14 w-14" />
            </div>
          </div>

          {/* 위성 카드 3 */}
          <div data-depth="2.6" className="absolute bottom-6 right-10 h-32 w-36">
            <div className="animate-float-slow glass-dark shadow-luxe flex h-full w-full items-center justify-center rounded-[1.5rem] [animation-delay:1.2s]">
              <span className="text-gold-gradient font-display text-3xl italic">
                Luxe
              </span>
            </div>
          </div>

          {/* 회전 후광 */}
          <div
            aria-hidden
            data-depth="0.4"
            className="animate-spin-slow absolute left-1/2 top-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-antique-gold/40"
          />
        </div>
      </div>

      {/* 스크롤 힌트 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <span className="animate-float-slow inline-block">Scroll ↓</span>
      </div>
    </section>
  );
}

function Gem({
  className,
  tone = "gold",
}: {
  className?: string;
  tone?: "gold" | "cherry";
}) {
  const from = tone === "gold" ? "#e8d9b8" : "#8a4a48";
  const to = tone === "gold" ? "#c9a96e" : "#5c3030";
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={`g-${tone}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <path
        d="M16 8h32l12 16-28 32L4 24z"
        fill={`url(#g-${tone})`}
        stroke="#3a2420"
        strokeOpacity="0.25"
      />
      <path d="M16 8l16 16L48 8M4 24h56M32 24v32" stroke="#fff" strokeOpacity="0.5" fill="none" />
    </svg>
  );
}

function Ring({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e8d9b8" />
          <stop offset="1" stopColor="#c9a96e" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="38" r="18" fill="none" stroke="url(#ring-g)" strokeWidth="5" />
      <path d="M24 22l8-12 8 12z" fill="url(#ring-g)" stroke="#3a2420" strokeOpacity="0.2" />
    </svg>
  );
}
