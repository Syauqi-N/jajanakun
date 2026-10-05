import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth";
import { AdminForm } from "@/components/admin-form";
import { AdminCreateForm } from "./admin-create-form";

export const dynamic = "force-dynamic";

export default async function AdminListPage() {
  if (!(await isSuperAdmin())) redirect("/admin");

  const admins = await prisma.admin.findMany({ orderBy: [{ isSuper: "desc" }, { createdAt: "asc" }] });

  return (
    <div>
      <h1 className="slab mb-2 text-[26px]">Kelola Admin</h1>
      <p className="mb-6" style={{ color: "var(--ink-soft)" }}>
        Admin utama (dari env) dapat membuat akun admin lain. Kredensial diberikan manual ke pemilik akun.
      </p>

      <AdminCreateForm />

      <div className="table-wrap">
        <table className="gk">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nama</th>
              <th>Peran</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td className="mono">{a.email}</td>
                <td>{a.name || "—"}</td>
                <td>
                  {a.isSuper ? <span className="badge badge-red">Admin Utama</span> : <span className="badge">Admin</span>}
                </td>
                <td>{a.active ? "Aktif" : "Nonaktif"}</td>
                <td>
                  {a.isSuper ? (
                    <span style={{ color: "var(--ink-soft)" }}>—</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AdminForm action="toggleAdmin">
                        <input type="hidden" name="id" value={a.id} />
                        <button className="btn btn-sm" type="submit">
                          {a.active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </AdminForm>
                      <AdminForm action="deleteAdmin" confirmText="Hapus admin ini?">
                        <input type="hidden" name="id" value={a.id} />
                        <button className="btn btn-sm btn-red" type="submit">
                          Hapus
                        </button>
                      </AdminForm>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
