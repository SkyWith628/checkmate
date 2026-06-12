import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProducts, getProductById } from "@/lib/queries/catalog";
import { CATEGORIES } from "@/lib/constants";
import { formatKRW, effectivePrice } from "@/lib/format";
import { AddToCart } from "@/components/shop/add-to-cart";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { Reveal } from "@/components/ui/reveal";
import { TiltCard } from "@/components/ui/tilt-card";
import { env } from "@/lib/env";

export const revalidate = 60; // ISR

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "상품" };
  const price = effectivePrice(product);
  return {
    title: product.name,
    description: product.description ?? `${product.name} — ${formatKRW(price)}`,
    openGraph: {
      title: product.name,
      images: product.images?.length ? [product.images[0]] : ["/og-image.png"],
    },
  };
}

const CAT_NAME = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const price = effectivePrice(product);
  const onSale = product.sale_price != null && product.sale_price < product.price;
  const img = product.images?.[0];

  // SEO: JSON-LD Product
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images?.length
      ? product.images
      : [`${env.siteUrl}/og-image.png`],
    material: product.material ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "KRW",
      price: price,
      availability:
        product.is_sold_out || product.stock <= 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
  };

  return (
    <div className="px-5 py-10 md:px-[60px] md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* breadcrumb */}
      <nav className="mb-8 text-xs tracking-[0.1em] text-muted-foreground">
        <Link href="/" className="hover:text-dark">
          HOME
        </Link>
        {product.category_slug && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/category/${product.category_slug}`}
              className="hover:text-dark"
            >
              {CAT_NAME[product.category_slug] ?? product.category_slug}
            </Link>
          </>
        )}
      </nav>

      <div className="scene-3d grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* 이미지 */}
        <Reveal direction="left">
          <TiltCard max={6} className="rounded-2xl">
            <div className="shadow-luxe relative aspect-square overflow-hidden rounded-2xl bg-sand">
              {img ? (
                <Image
                  src={img}
                  alt={product.name}
                  fill
                  sizes="(max-width:768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-2xl italic text-muted-foreground">
                  {product.name}
                </div>
              )}
              <div className="shine absolute inset-0 z-10 rounded-2xl" />
            </div>
          </TiltCard>
        </Reveal>

        {/* 정보 */}
        <Reveal direction="right" className="flex flex-col">
          {product.material && (
            <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-antique-gold">
              {product.material}
            </p>
          )}
          <h1 className="font-display text-3xl font-light italic text-dark md:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            {onSale ? (
              <>
                <span className="font-display text-2xl text-cherry">
                  {formatKRW(product.sale_price)}
                </span>
                <span className="text-base text-muted-foreground line-through">
                  {formatKRW(product.price)}
                </span>
              </>
            ) : (
              <span className="font-display text-2xl text-dark">
                {formatKRW(price)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 text-sm leading-loose text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="my-8 h-px bg-sand" />

          <AddToCart product={product} />

          <div className="mt-3">
            <WishlistButton productId={product.id} />
          </div>

          {product.care_guide && (
            <div className="mt-8 border-t border-sand pt-6">
              <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Care Guide
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {product.care_guide}
              </p>
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}
