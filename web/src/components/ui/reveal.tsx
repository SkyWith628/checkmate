"use client";

import { useEffect, useRef, useState, type ElementType } from "react";
import { cn } from "@/lib/utils";

type RevealDirection = "up" | "left" | "right" | "zoom";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** 등장 방향 (기본 up) */
  direction?: RevealDirection;
  /** 지연(ms) — 스태거용 */
  delay?: number;
  /** 한 번만 보여줄지 (기본 true) */
  once?: boolean;
  as?: ElementType;
};

/**
 * 스크롤 진입 시 부드럽게 등장(fade + slide/zoom).
 * 실제 트랜지션 스타일은 globals.css 의 [data-reveal] 가 담당.
 * setState 는 IntersectionObserver 콜백에서만 호출 → effect 동기 setState 규칙 회피.
 */
export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  once = true,
  as,
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) io.disconnect();
          } else if (!once) {
            setShown(false);
          }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      data-reveal={direction}
      data-show={shown ? "true" : "false"}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className={className}
    >
      {children}
    </Tag>
  );
}

/** 자식들을 순서대로 스태거 등장시키는 래퍼 */
export function RevealStagger({
  children,
  className,
  step = 90,
  direction = "up",
}: {
  children: React.ReactNode[];
  className?: string;
  step?: number;
  direction?: RevealDirection;
}) {
  return (
    <div className={cn(className)}>
      {children.map((child, i) => (
        <Reveal key={i} direction={direction} delay={i * step}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
