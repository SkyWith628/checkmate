import Link from "next/link";
import { getDashboardStats } from "@/lib/queries/admin";
import { formatKRW } from "@/lib/format";
import { PageHeader, Panel } from "@/components/admin/ui";

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Panel className="group relative overflow-hidden p-5">
      {/* 좌측 골드 악센트 라인 */}
      <span className="absolute inset-y-0 left-0 w-px bg-linear-to-b from-transparent via-antique-gold/60 to-transparent" />
      <p className="text-[11px] uppercase tracking-[0.22em] text-antique-gold/70">
        {label}
      </p>
      <p
        className={
          "mt-2.5 font-display text-3xl leading-none " +
          (accent ? "text-gold-gradient" : "text-foreground")
        }
      >
        {value}
      </p>
    </Panel>
  );
}

export default async function AdminDashboard() {
  const s = await getDashboardStats();

  return (
    <div className="flex flex-col gap-9">
      <PageHeader eyebrow="Overview" title="대시보드" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="누적 매출" value={formatKRW(s.revenue)} accent />
        <StatCard label="총 주문" value={`${s.orderCount}건`} />
        <StatCard label="입금 대기" value={`${s.pendingCount}건`} />
        <StatCard label="회원" value={`${s.userCount}명`} />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-antique-gold/70">
            재고 부족 (≤5)
          </h2>
          <Link
            href="/admin/products"
            className="text-xs text-muted-foreground transition-colors hover:text-antique-gold"
          >
            상품 관리 →
          </Link>
        </div>
        {s.lowStock.length === 0 ? (
          <Panel className="px-5 py-8 text-center text-sm text-muted-foreground">
            재고 부족 상품이 없습니다.
          </Panel>
        ) : (
          <Panel className="overflow-hidden">
            <ul className="divide-y divide-[rgba(201,169,110,0.1)]">
              {s.lowStock.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-5 py-3.5 text-sm transition-colors hover:bg-[rgba(201,169,110,0.04)]"
                >
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="hover:text-antique-gold"
                  >
                    {p.name}
                  </Link>
                  <span
                    className={
                      p.stock === 0
                        ? "font-medium text-destructive"
                        : "text-foreground"
                    }
                  >
                    재고 {p.stock}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </section>
    </div>
  );
}
