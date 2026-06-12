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
      <div className="relative mb-4 aspect-square overflow-hidden bg-sand">
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[0.97]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-lg italic text-muted-foreground">
            {product.name}
          </div>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 bg-dark/80 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-cream">
            Sold Out
          </span>
        )}
        {!soldOut && onSale && (
          <span className="absolute left-3 top-3 bg-cherry px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-cream">
            Sale
          </span>
        )}
      </div>
      <h3 className="font-display text-lg font-light text-dark">{product.name}</h3>
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
