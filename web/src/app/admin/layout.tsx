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
    <div className="dark min-h-screen bg-background text-foreground">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
