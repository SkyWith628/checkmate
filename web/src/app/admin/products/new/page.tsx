import Link from "next/link";
import { getCategories } from "@/lib/queries/catalog";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 목록
        </Link>
        <h1 className="font-display text-2xl">새 상품</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        먼저 상품을 저장하면 옵션(컬러/사이즈 등)을 추가할 수 있습니다.
      </p>

      <ProductForm product={null} categories={categories} />
    </div>
  );
}
