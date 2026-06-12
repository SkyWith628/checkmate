"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: React.ReactNode;
  className?: string;
  /** 최대 기울기 각도(deg) */
  max?: number;
  /** 마우스를 따라 움직이는 광택 표시 */
  glare?: boolean;
};

/**
 * 포인터 위치에 따라 3D 로 기울어지는 카드.
 * 모든 변형은 직접 DOM style 조작(ref) → effect 동기 setState 규칙과 무관.
 */
export function TiltCard({
  children,
  className,
  max = 10,
  glare = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotX = (0.5 - py) * max * 2;
    const rotY = (px - 0.5) * max * 2;

    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
      if (glareRef.current) {
        glareRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.45), transparent 55%)`;
        glareRef.current.style.opacity = "1";
      }
    });
  }

  function reset() {
    const el = ref.current;
    if (!el) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    el.style.transform =
      "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)";
    if (glareRef.current) glareRef.current.style.opacity = "0";
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={cn(
        "relative transition-transform duration-300 [transition-timing-function:var(--ease-luxe)] will-change-transform",
        className,
      )}
    >
      {children}
      {glare && (
        <div
          ref={glareRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300"
        />
      )}
    </div>
  );
}
