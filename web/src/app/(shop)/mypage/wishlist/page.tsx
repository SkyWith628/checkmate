import type { Metadata } from "next";
import Link from "next/link";
import { getMyWishlist } from "@/lib/queries/account";
import { ProductCard } from "@/components/shop/product-card";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = { title: "찜한 상품" };

export default async function WishlistPage() {
  const products = await getMyWishlist();

  if (products.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">찜한 상품이 없습니다.</p>
        <Link
          href="/collection"
          className="mt-4 inline-block text-sm text-cherry underline"
        >
          컬렉션 둘러보기
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3">
      {products.map((p, i) => (
        <Reveal key={p.id} delay={(i % 3) * 90}>
          <ProductCard product={p} />
        </Reveal>
      ))}
    </div>
  );
}
