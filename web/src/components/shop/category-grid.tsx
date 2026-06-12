"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/shop/product-card";
import { effectivePrice } from "@/lib/format";
import type { Product } from "@/lib/queries/catalog";

type Sort = "newest" | "price_asc" | "price_desc";

const SORTS: { key: Sort; label: string }[] = [
  { key: "newest", label: "신상품" },
  { key: "price_asc", label: "낮은 가격" },
  { key: "price_desc", label: "높은 가격" },
];

export function CategoryGrid({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<Sort>("newest");

  const sorted = useMemo(() => {
    const arr = [...products];
    if (sort === "price_asc")
      arr.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    else if (sort === "price_desc")
      arr.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    // newest: 서버가 이미 created_at desc로 정렬
    return arr;
  }, [products, sort]);

  return (
    <>
      <div className="mb-8 flex items-center justify-between border-b border-sand pb-4">
        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
          {products.length} items
        </span>
        <div className="flex gap-4">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              className={
                "text-xs tracking-[0.1em] transition-colors " +
                (sort === s.key
                  ? "text-dark"
                  : "text-muted-foreground hover:text-dark")
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          등록된 상품이 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
          {sorted.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}
