"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function useUserLabel(): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load(userId: string, email: string | undefined) {
      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", userId)
        .single();
      if (active) setLabel(data?.name || email || "회원");
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) load(user.id, user.email);
      else if (active) setLabel(null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) load(session.user.id, session.user.email);
      else setLabel(null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return label;
}

function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const read = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cm_cart") || "[]");
        setCount(
          cart.reduce(
            (s: number, i: { qty?: number }) => s + (i.qty || 1),
            0,
          ),
        );
      } catch {
        setCount(0);
      }
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-cherry px-1 text-[9px] text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function UserArea({ userLabel }: { userLabel: string | null }) {
  if (!userLabel) {
    return (
      <Link href="/login" aria-label="로그인" className="text-dark">
        <User className="h-[22px] w-[22px]" strokeWidth={1} />
      </Link>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 text-xs tracking-[0.1em] text-cherry outline-none">
        <User className="h-[18px] w-[18px]" strokeWidth={1} />
        <span className="hidden sm:inline">{userLabel}&thinsp;님</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem className="p-0">
          <Link href="/mypage" className="w-full px-2 py-1.5">
            마이페이지
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-0">
          <Link href="/mypage/orders" className="w-full px-2 py-1.5">
            주문 내역
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-0">
          <form action={signOutAction} className="w-full">
            <button type="submit" className="w-full px-2 py-1.5 text-left">
              로그아웃
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function useScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

export function SiteNav() {
  const userLabel = useUserLabel();
  const scrolled = useScrolled();
  return (
    <nav
      className={cn(
        "sticky top-0 z-50 flex items-center justify-between px-5 transition-all duration-500 [transition-timing-function:var(--ease-luxe)] md:px-[60px]",
        scrolled
          ? "glass border-b border-gold/40 py-3 shadow-luxe md:py-4"
          : "border-b border-transparent bg-cream py-4 md:py-7",
      )}
    >
      {/* left: mobile menu + logo */}
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger
            aria-label="메뉴 열기"
            className="flex md:hidden text-dark"
          >
            <Menu className="h-5 w-5" strokeWidth={1} />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="bg-cherry-esp text-sand border-none"
          >
            <SheetTitle className="sr-only">메뉴</SheetTitle>
            <ul className="mt-16 flex flex-col gap-2 px-8">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="block py-3 font-display text-2xl italic tracking-[0.2em] text-sand transition-colors hover:text-antique-gold"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/collection"
                  className="block py-3 font-display text-2xl italic tracking-[0.2em] text-sand transition-colors hover:text-antique-gold"
                >
                  Collection
                </Link>
              </li>
            </ul>
          </SheetContent>
        </Sheet>

        <Link
          href="/"
          className="font-display text-2xl font-light tracking-[0.4em] text-dark md:text-3xl"
        >
          CHECK<span className="mx-[-4px] text-cherry">⬦</span>MATE
        </Link>
      </div>

      {/* center: category links (desktop) */}
      <ul className="absolute left-1/2 hidden -translate-x-1/2 gap-9 md:flex">
        {CATEGORIES.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/category/${c.slug}`}
              className={cn(
                "text-[15px] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-dark",
              )}
            >
              {c.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* right: icons */}
      <div className="flex items-center gap-4">
        <Link href="/collection" aria-label="검색" className="text-dark">
          <Search className="h-[22px] w-[22px]" strokeWidth={1} />
        </Link>
        <UserArea userLabel={userLabel} />
        <Link
          href="/cart"
          aria-label="장바구니"
          className="relative flex items-center text-dark"
        >
          <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1} />
          <CartBadge />
        </Link>
      </div>
    </nav>
  );
}
