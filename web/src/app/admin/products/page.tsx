import Link from "next/link";
import { getAdminProducts } from "@/lib/queries/admin";
import { formatKRW } from "@/lib/format";
import { ProductActiveToggle } from "@/components/admin/product-active-toggle";
import {
  PageHeader,
  Panel,
  adminBtnPrimary,
  tableHead,
  tableRow,
} from "@/components/admin/ui";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Catalog"
        title="상품"
        count={`${products.length}개`}
        action={
          <Link href="/admin/products/new" className={adminBtnPrimary}>
            + 새 상품
          </Link>
        }
      />

      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={tableHead}>
            <tr>
              <th className="px-5 py-3.5">상품명</th>
              <th className="px-5 py-3.5">카테고리</th>
              <th className="px-5 py-3.5 text-right">가격</th>
              <th className="px-5 py-3.5 text-right">재고</th>
              <th className="px-5 py-3.5">상태</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={tableRow}>
                <td className="px-5 py-3.5 text-foreground">{p.name}</td>
                <td className="px-5 py-3.5 text-muted-foreground">
                  {p.category_slug ?? "-"}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {p.sale_price ? (
                    <span>
                      <span className="text-cherry-light">
                        {formatKRW(p.sale_price)}
                      </span>{" "}
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
                    "px-5 py-3.5 text-right " +
                    (p.stock === 0 ? "font-medium text-destructive" : "")
                  }
                >
                  {p.stock}
                </td>
                <td className="px-5 py-3.5">
                  <ProductActiveToggle id={p.id} active={p.is_active} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-muted-foreground transition-colors hover:text-antique-gold"
                  >
                    편집
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
