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
        "rounded px-2 py-0.5 text-xs " +
        (active
          ? "bg-emerald-900/40 text-emerald-400"
          : "bg-muted text-muted-foreground")
      }
    >
      {active ? "판매중" : "숨김"}
    </button>
  );
}
