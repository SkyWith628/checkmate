import { getAdminUsers } from "@/lib/queries/admin";
import { UserControls } from "@/components/admin/user-controls";
import { PageHeader, Panel, tableHead, tableRow } from "@/components/admin/ui";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Members" title="회원" count={`${users.length}명`} />

      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={tableHead}>
            <tr>
              <th className="px-5 py-3.5">이름</th>
              <th className="px-5 py-3.5">이메일</th>
              <th className="px-5 py-3.5">연락처</th>
              <th className="px-5 py-3.5 text-right">포인트</th>
              <th className="px-5 py-3.5">가입일</th>
              <th className="px-5 py-3.5">권한 / 등급 / 차단</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={tableRow}>
                <td className="px-5 py-3.5 text-foreground">{u.name ?? "-"}</td>
                <td className="px-5 py-3.5 text-muted-foreground">
                  {u.email ?? "-"}
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">
                  {u.phone ?? "-"}
                </td>
                <td className="px-5 py-3.5 text-right text-muted-foreground">
                  {u.points_balance.toLocaleString("ko-KR")}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-5 py-3.5">
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
                  className="px-5 py-12 text-center text-muted-foreground"
                >
                  회원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
