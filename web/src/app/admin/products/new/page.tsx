import Link from "next/link";
import { getCategories } from "@/lib/queries/catalog";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1.5 border-b border-[rgba(201,169,110,0.15)] pb-5">
        <Link
          href="/admin/products"
          className="text-xs text-muted-foreground transition-colors hover:text-antique-gold"
        >
          ← 상품 목록
        </Link>
        <h1 className="font-display text-3xl leading-none text-foreground">
          새 상품
        </h1>
      </div>

      <p className="text-sm text-muted-foreground">
        먼저 상품을 저장하면 옵션(컬러/사이즈 등)을 추가할 수 있습니다.
      </p>

      <ProductForm product={null} categories={categories} />
    </div>
  );
}
