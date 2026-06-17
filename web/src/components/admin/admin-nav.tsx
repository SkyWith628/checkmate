"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "대시보드", exact: true },
  { href: "/admin/products", label: "상품" },
  { href: "/admin/orders", label: "주문" },
  { href: "/admin/users", label: "회원" },
  { href: "/admin/coupons", label: "쿠폰" },
  { href: "/admin/faqs", label: "FAQ" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <header className="glass-dark sticky top-0 z-20 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[rgba(201,169,110,0.18)] px-6 py-4">
      <Link href="/admin" className="font-display text-xl tracking-[0.22em]">
        CHECKMATE{" "}
        <span className="text-[10px] uppercase tracking-[0.35em] text-antique-gold/80">
          Admin
        </span>
      </Link>
      <nav className="flex flex-1 flex-wrap gap-1">
        {TABS.map((t) => {
          const active = t.exact
            ? pathname === t.href
            : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "relative px-3 py-1.5 text-sm transition-colors",
                active
                  ? "text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-px after:bg-antique-gold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-antique-gold">
          쇼핑몰로
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="transition-colors hover:text-antique-gold"
          >
            로그아웃
          </button>
        </form>
      </div>
    </header>
  );
}
