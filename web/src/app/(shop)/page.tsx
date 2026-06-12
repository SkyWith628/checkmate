import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { getAllProducts } from "@/lib/queries/catalog";
import { HomeHero } from "@/components/shop/home-hero";
import { ProductCard } from "@/components/shop/product-card";
import { Reveal } from "@/components/ui/reveal";
import { TiltCard } from "@/components/ui/tilt-card";

// 카탈로그는 공개 클라이언트로 읽어 정적/ISR 유지
export const revalidate = 300;

const MARQUEE = [
  "FINE JEWELRY",
  "PERSONAL CURATION",
  "GOLD & CHERRY",
  "CHECK ⬦ MATE",
  "TIMELESS PIECES",
];

export default async function HomePage() {
  const products = await getAllProducts();
  const featured = products.slice(0, 8);

  return (
    <>
      <HomeHero />

      {/* 흐르는 텍스트 마퀴 */}
      <div className="bg-cherry-deep relative overflow-hidden py-5">
        <div className="animate-marquee flex w-max gap-12 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <span
              key={i}
              className="font-display text-xl italic tracking-[0.2em] text-gold/70"
            >
              {t}
              <span className="ml-12 text-antique-gold">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* 카테고리 — 3D 틸트 타일 */}
      <section className="mx-auto max-w-7xl px-6 py-24 md:px-[60px]">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.3em] text-antique-gold">
            Collections
          </p>
          <h2 className="mt-3 font-display text-4xl font-light italic text-dark md:text-5xl">
            카테고리로 둘러보기
          </h2>
        </Reveal>

        <div className="scene-3d mt-12 grid grid-cols-2 gap-5 md:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.slug} delay={i * 100} direction="zoom">
              <TiltCard className="h-full">
                <Link
                  href={`/category/${c.slug}`}
                  className="group glass shadow-luxe relative flex aspect-[3/4] flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl"
                >
                  <div className="shine absolute inset-0" />
                  <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-antique-gold/20 blur-2xl transition-all duration-500 group-hover:bg-antique-gold/40" />
                  <span className="font-display text-3xl font-light italic text-dark transition-transform duration-500 [transition-timing-function:var(--ease-spring)] group-hover:-translate-y-1">
                    {c.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    Shop now →
                  </span>
                </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 추천 상품 */}
      {featured.length > 0 && (
        <section className="relative overflow-hidden bg-sand py-24">
          <div
            aria-hidden
            className="animate-glow pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-antique-gold/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-7xl px-6 md:px-[60px]">
            <Reveal>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-antique-gold">
                    Featured
                  </p>
                  <h2 className="mt-3 font-display text-4xl font-light italic text-dark md:text-5xl">
                    이번 시즌 셀렉션
                  </h2>
                </div>
                <Link
                  href="/collection"
                  className="hidden text-[11px] uppercase tracking-[0.2em] text-cherry transition-colors hover:text-antique-gold md:inline"
                >
                  전체 보기 →
                </Link>
              </div>
            </Reveal>

            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
              {featured.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 90}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA 밴드 */}
      <section className="bg-cherry-deep relative isolate overflow-hidden py-28">
        <div
          aria-hidden
          className="animate-glow pointer-events-none absolute left-1/4 top-0 h-80 w-80 rounded-full bg-antique-gold/20 blur-3xl"
        />
        <Reveal direction="zoom">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-antique-gold">
              Start now
            </p>
            <h2 className="mt-4 font-display text-4xl font-light italic leading-tight text-cream md:text-6xl">
              당신의 무드를
              <br />
              <span className="text-gold-gradient animate-gradient bg-[length:200%_auto]">
                완성하는 한 점
              </span>
            </h2>
            <Link
              href="/collection"
              className="group mt-10 inline-flex items-center gap-3 rounded-full bg-gold-sheen px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-cherry-esp shadow-gold-glow transition-transform duration-300 [transition-timing-function:var(--ease-spring)] hover:-translate-y-0.5"
            >
              지금 둘러보기
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
