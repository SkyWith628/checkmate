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
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 목록
        </Link>
        <h1 className="font-display text-2xl">{product.name}</h1>
      </div>

      <ProductForm product={product} categories={categories} />

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="font-display text-xl">옵션</h2>
        <OptionsManager product={product} />
      </section>
    </div>
  );
}
