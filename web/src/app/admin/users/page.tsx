import { getAdminUsers } from "@/lib/queries/admin";
import { UserControls } from "@/components/admin/user-controls";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl">회원 ({users.length})</h1>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">이메일</th>
              <th className="px-4 py-3">연락처</th>
              <th className="px-4 py-3 text-right">포인트</th>
              <th className="px-4 py-3">가입일</th>
              <th className="px-4 py-3">권한 / 등급 / 차단</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-card/50">
                <td className="px-4 py-3 text-foreground">{u.name ?? "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.email ?? "-"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.phone ?? "-"}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {u.points_balance.toLocaleString("ko-KR")}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3">
                  <UserControls
                    userId={u.id}
                    role={u.role}
                    grade={u.grade}
                    banned={u.is_banned}
                  />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  회원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
