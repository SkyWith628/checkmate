"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleWishlistAction } from "@/lib/actions/wishlist";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [wished, setWished] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setLoggedIn(false);
        return;
      }
      setLoggedIn(true);
      const { data } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      if (active) setWished(!!data);
    }
    load();
    return () => {
      active = false;
    };
  }, [productId]);

  function toggle() {
    if (!loggedIn) {
      toast.error("로그인 후 이용할 수 있습니다.", {
        action: { label: "로그인", onClick: () => router.push("/login") },
      });
      return;
    }
    start(async () => {
      const res = await toggleWishlistAction(productId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setWished(!!res.added);
      toast.success(res.added ? "찜 목록에 추가했습니다." : "찜을 해제했습니다.");
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={wished}
      className={cn(
        "flex w-full items-center justify-center gap-2 border py-3 text-sm transition-colors",
        wished
          ? "border-cherry text-cherry"
          : "border-sand text-muted-foreground hover:border-cherry hover:text-cherry",
      )}
    >
      <Heart className="h-4 w-4" fill={wished ? "currentColor" : "none"} />
      {wished ? "찜 완료" : "찜하기"}
    </button>
  );
}
