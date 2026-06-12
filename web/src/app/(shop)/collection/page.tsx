import type { Metadata } from "next";
import { getAllProducts } from "@/lib/queries/catalog";
import { ProductCard } from "@/components/shop/product-card";
import { Reveal } from "@/components/ui/reveal";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Collection",
  description: "체크메이트 전체 주얼리 컬렉션",
};

export default async function CollectionPage() {
  const products = await getAllProducts();

  return (
    <div className="px-5 py-12 md:px-[60px] md:py-20">
      <Reveal>
        <header className="mb-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-antique-gold">
            All pieces
          </p>
          <h1 className="mt-3 font-display text-4xl font-light italic text-dark md:text-5xl">
            Collection
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            전체 {products.length}개의 주얼리
          </p>
        </header>
      </Reveal>

      {products.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          등록된 상품이 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 90}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
