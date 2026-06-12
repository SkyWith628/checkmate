import Link from "next/link";
import Image from "next/image";
import { formatKRW } from "@/lib/format";
import type { Product } from "@/lib/queries/catalog";

export function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0];
  const onSale = product.sale_price != null && product.sale_price < product.price;
  const soldOut = product.is_sold_out || product.stock <= 0;

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="shadow-luxe relative mb-4 aspect-square overflow-hidden rounded-2xl bg-sand transition-all duration-500 [transition-timing-function:var(--ease-luxe)] group-hover:-translate-y-1.5 group-hover:shadow-gold-glow">
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 [transition-timing-function:var(--ease-luxe)] group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-lg italic text-muted-foreground">
            {product.name}
          </div>
        )}
        {/* hover 광택 스윕 */}
        <div className="shine absolute inset-0 z-10 rounded-2xl" />
        {soldOut && (
          <span className="glass-dark absolute left-3 top-3 z-20 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-cream">
            Sold Out
          </span>
        )}
        {!soldOut && onSale && (
          <span className="absolute left-3 top-3 z-20 rounded-full bg-cherry px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-cream shadow-luxe">
            Sale
          </span>
        )}
      </div>
      <h3 className="font-display text-lg font-light text-dark transition-colors group-hover:text-cherry">
        {product.name}
      </h3>
      {product.material && (
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {product.material}
        </p>
      )}
      <div className="mt-1 flex items-baseline gap-2">
        {onSale ? (
          <>
            <span className="text-sm text-cherry">
              {formatKRW(product.sale_price)}
            </span>
            <span className="text-xs text-muted-foreground line-through">
              {formatKRW(product.price)}
            </span>
          </>
        ) : (
          <span className="text-sm text-gold">{formatKRW(product.price)}</span>
        )}
      </div>
    </Link>
  );
}
