"use client";

import { useTransition } from "react";
import { toggleProductActiveAction } from "@/lib/actions/admin";

export function ProductActiveToggle({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => toggleProductActiveAction(id, !active))}
      className={
        "rounded-full px-2.5 py-0.5 text-xs transition-colors disabled:opacity-50 " +
        (active
          ? "bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-500/25 hover:bg-emerald-500/20"
          : "bg-white/5 text-muted-foreground ring-1 ring-white/10 hover:text-foreground")
      }
    >
      {active ? "판매중" : "숨김"}
    </button>
  );
}
