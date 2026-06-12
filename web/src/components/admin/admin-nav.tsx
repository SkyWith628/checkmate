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
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border bg-card px-6 py-4">
      <Link href="/admin" className="font-display text-xl tracking-[0.2em]">
        CHECKMATE <span className="text-xs text-muted-foreground">ADMIN</span>
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
                "px-3 py-1.5 text-sm transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          쇼핑몰로
        </Link>
        <form action={signOutAction}>
          <button type="submit" className="hover:text-foreground">
            로그아웃
          </button>
        </form>
      </div>
    </header>
  );
}
