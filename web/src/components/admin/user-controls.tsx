"use client";

import { useTransition } from "react";
import {
  updateUserRoleAction,
  updateUserGradeAction,
  toggleBanAction,
} from "@/lib/actions/admin";
import type { UserRole, UserGrade } from "@/lib/types/database";
import { adminInputSm } from "@/components/admin/ui";

const selectCls = adminInputSm;

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
          "rounded-full px-3 py-1 text-xs transition-colors disabled:opacity-50 " +
          (banned
            ? "bg-cherry/20 text-cherry-light ring-1 ring-cherry/40 hover:bg-cherry/30"
            : "bg-white/5 text-muted-foreground ring-1 ring-white/10 hover:text-foreground")
        }
      >
        {banned ? "차단 해제" : "차단"}
      </button>
    </div>
  );
}
