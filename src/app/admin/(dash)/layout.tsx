import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { AdminNav } from "./admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminDashLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg)" }}>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-6 py-8">{children}</main>
    </div>
  );
}
