import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="bg-cherry-deep relative mt-auto overflow-hidden text-sand">
      <div
        aria-hidden
        className="animate-glow pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-antique-gold/15 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:px-[60px] md:py-20">
        <div>
          <Link
            href="/"
            className="font-display text-3xl font-light tracking-[0.3em] text-sand"
          >
            CHECK<span className="text-antique-gold">⬦</span>MATE
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-loose text-gold/60">
            취향 진단으로 시작하는 퍼스널 주얼리 메이트.
            <br />
            당신의 무드를 완성하는 한 점.
          </p>
        </div>

        <div>
          <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-antique-gold">
            Collections
          </p>
          <ul className="flex flex-col gap-2.5">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  className="text-sm text-gold/70 transition-colors hover:text-antique-gold"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-antique-gold">
            Account
          </p>
          <ul className="flex flex-col gap-2.5">
            <li>
              <Link href="/collection" className="text-sm text-gold/70 transition-colors hover:text-antique-gold">
                전체 컬렉션
              </Link>
            </li>
            <li>
              <Link href="/mypage" className="text-sm text-gold/70 transition-colors hover:text-antique-gold">
                마이페이지
              </Link>
            </li>
            <li>
              <Link href="/cart" className="text-sm text-gold/70 transition-colors hover:text-antique-gold">
                장바구니
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-gold/15 px-6 py-6 text-center md:px-[60px]">
        <p className="text-[11px] tracking-[0.2em] text-gold/40">
          © {new Date().getFullYear()} CHECKMATE — All rights reserved.
        </p>
      </div>
    </footer>
  );
}
