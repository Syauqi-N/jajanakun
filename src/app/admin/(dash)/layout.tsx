import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { AdminNav } from "./admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminDashLayout({ children }: { children: React.ReactNode }) {
  // Super admin dari env disinkronkan ke tabel `admins` saat login (ensureSuperAdmin).
  const me = await currentAdmin();
  if (!me) redirect("/admin/login");

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg)" }}>
      <AdminNav isSuper={me.role === "super"} adminEmail={me.email} />
      <main className="mx-auto max-w-[1200px] px-6 py-8">{children}</main>
    </div>
  );
}
