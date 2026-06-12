"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/mypage", label: "내 정보" },
  { href: "/mypage/orders", label: "주문 내역" },
  { href: "/mypage/reviews", label: "리뷰" },
  { href: "/mypage/coupons", label: "쿠폰" },
  { href: "/mypage/wishlist", label: "찜한 상품" },
];

export function MypageNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-sand md:flex-col md:gap-0 md:border-b-0 md:border-r md:pr-6">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "whitespace-nowrap px-4 py-3 text-sm tracking-[0.05em] transition-colors md:px-2",
              active
                ? "text-dark md:border-r-2 md:border-cherry md:-mr-[1px]"
                : "text-muted-foreground hover:text-dark",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
