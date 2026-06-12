import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export default function HomePage() {
  return (
    <section className="grid min-h-[85vh] grid-cols-1 md:grid-cols-2">
      {/* hero text */}
      <div className="flex flex-col items-start justify-center gap-8 px-6 py-12 md:px-[60px] md:py-20">
        <p className="text-[11px] uppercase tracking-[0.3em] text-antique-gold">
          Check your style
        </p>
        <h1 className="font-display text-5xl font-light italic leading-tight md:text-7xl">
          나만의 주얼리
          <br />
          <span className="not-italic tracking-[0.15em]">체크메이트가</span>
          <br />
          찾아드립니다
        </h1>
        <p className="max-w-sm text-sm leading-loose text-muted-foreground">
          스타일 진단으로 당신에게 어울리는 주얼리를 추천해 드립니다.
          (스타일 퀴즈는 단계 3에서 연결됩니다.)
        </p>
        <Link
          href="/collection"
          className="w-fit bg-dark px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-cream transition-colors hover:bg-gold hover:text-dark"
        >
          컬렉션 보기
        </Link>
      </div>

      {/* hero side: category quick links (퀴즈 자리 placeholder) */}
      <div className="flex items-center justify-center bg-sand px-8 py-16">
        <div className="grid w-full max-w-sm grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="flex aspect-square flex-col items-center justify-center border border-gold bg-cream transition-colors hover:bg-gold/30"
            >
              <span className="font-display text-2xl font-light italic text-dark">
                {c.name}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Collection
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
