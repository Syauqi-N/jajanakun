import { redirect } from "next/navigation";
import { currentAdmin, ensureSuperAdmin, isAdmin, isSuperAdmin } from "@/lib/auth";
import { AdminNav } from "./admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminDashLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");

  // Pastikan super admin (dari env) terdaftar di tabel `admins`.
  await ensureSuperAdmin();
  const [superAdmin, me] = await Promise.all([isSuperAdmin(), currentAdmin()]);

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg)" }}>
      <AdminNav isSuper={superAdmin} adminEmail={me?.email} />
      <main className="mx-auto max-w-[1200px] px-6 py-8">{children}</main>
    </div>
  );
}
