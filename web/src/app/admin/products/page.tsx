import Link from "next/link";
import { getAdminProducts } from "@/lib/queries/admin";
import { formatKRW } from "@/lib/format";
import { ProductActiveToggle } from "@/components/admin/product-active-toggle";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">상품 ({products.length})</h1>
        <Link
          href="/admin/products/new"
          className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          + 새 상품
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">상품명</th>
              <th className="px-4 py-3">카테고리</th>
              <th className="px-4 py-3 text-right">가격</th>
              <th className="px-4 py-3 text-right">재고</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-card/50">
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.category_slug ?? "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  {p.sale_price ? (
                    <span>
                      <span className="text-cherry">{formatKRW(p.sale_price)}</span>{" "}
                      <span className="text-xs text-muted-foreground line-through">
                        {formatKRW(p.price)}
                      </span>
                    </span>
                  ) : (
                    formatKRW(p.price)
                  )}
                </td>
                <td
                  className={
                    "px-4 py-3 text-right " +
                    (p.stock === 0 ? "text-destructive" : "")
                  }
                >
                  {p.stock}
                </td>
                <td className="px-4 py-3">
                  <ProductActiveToggle id={p.id} active={p.is_active} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    편집
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
