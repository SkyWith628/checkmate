import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProduct } from "@/lib/queries/admin";
import { getCategories } from "@/lib/queries/catalog";
import { ProductForm } from "@/components/admin/product-form";
import { OptionsManager } from "@/components/admin/options-manager";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    getCategories(),
  ]);
  if (!product) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-1.5 border-b border-[rgba(201,169,110,0.15)] pb-5">
        <Link
          href="/admin/products"
          className="text-xs text-muted-foreground transition-colors hover:text-antique-gold"
        >
          ← 상품 목록
        </Link>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.3em] text-antique-gold/70">
            Edit
          </span>
          <h1 className="font-display text-3xl leading-none text-foreground">
            {product.name}
          </h1>
        </div>
      </div>

      <ProductForm product={product} categories={categories} />

      <section className="flex flex-col gap-3 border-t border-[rgba(201,169,110,0.15)] pt-7">
        <h2 className="font-display text-xl">옵션</h2>
        <OptionsManager product={product} />
      </section>
    </div>
  );
}
