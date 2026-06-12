"use client";

import { useTransition } from "react";
import {
  updateUserRoleAction,
  updateUserGradeAction,
  toggleBanAction,
} from "@/lib/actions/admin";
import type { UserRole, UserGrade } from "@/lib/types/database";

const selectCls =
  "rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-foreground disabled:opacity-50";

const ROLES: UserRole[] = ["user", "admin"];
const GRADES: UserGrade[] = ["bronze", "silver", "gold", "vip"];

export function UserControls({
  userId,
  role,
  grade,
  banned,
}: {
  userId: string;
  role: UserRole;
  grade: UserGrade;
  banned: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={role}
        disabled={pending}
        onChange={(e) =>
          start(() => updateUserRoleAction(userId, e.target.value as UserRole))
        }
        className={selectCls}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r === "admin" ? "관리자" : "일반"}
          </option>
        ))}
      </select>

      <select
        value={grade}
        disabled={pending}
        onChange={(e) =>
          start(() =>
            updateUserGradeAction(userId, e.target.value as UserGrade),
          )
        }
        className={selectCls}
      >
        {GRADES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => toggleBanAction(userId, !banned))}
        className={
          "rounded px-2 py-1 text-xs disabled:opacity-50 " +
          (banned
            ? "bg-destructive/20 text-destructive"
            : "bg-muted text-muted-foreground hover:text-foreground")
        }
      >
        {banned ? "차단 해제" : "차단"}
      </button>
    </div>
  );
}
