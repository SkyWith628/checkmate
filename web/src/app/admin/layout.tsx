import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-guard";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "관리자" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAdmin();
  if (!ctx) redirect("/");

  return (
    <div className="dark min-h-screen bg-[#15110e] text-foreground">
      {/* 상단 골드 광원 — 내부 도구에도 은은한 럭셔리 깊이감 */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-80 opacity-60"
        style={{
          background:
            "radial-gradient(70% 100% at 50% 0%, rgba(201,169,110,0.10) 0%, transparent 70%)",
        }}
      />
      <AdminNav />
      <main className="relative mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
