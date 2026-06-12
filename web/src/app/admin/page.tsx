import Link from "next/link";
import { getDashboardStats } from "@/lib/queries/admin";
import { formatKRW } from "@/lib/format";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const s = await getDashboardStats();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl">대시보드</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="누적 매출" value={formatKRW(s.revenue)} />
        <StatCard label="총 주문" value={`${s.orderCount}건`} />
        <StatCard label="입금 대기" value={`${s.pendingCount}건`} />
        <StatCard label="회원" value={`${s.userCount}명`} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-[0.15em] text-muted-foreground">
            재고 부족 (≤5)
          </h2>
          <Link
            href="/admin/products"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            상품 관리 →
          </Link>
        </div>
        {s.lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground">재고 부족 상품이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {s.lowStock.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <Link href={`/admin/products/${p.id}`} className="hover:underline">
                  {p.name}
                </Link>
                <span
                  className={p.stock === 0 ? "text-destructive" : "text-foreground"}
                >
                  재고 {p.stock}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
