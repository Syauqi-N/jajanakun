import { prisma } from "@/lib/prisma";
import { saveCategory, deleteCategory } from "../../actions/data";

export const dynamic = "force-dynamic";

export default async function AdminKategoriPage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="slab mb-6 text-[26px]">Kategori</h1>

      <form action={saveCategory} className="card mb-6 flex flex-wrap items-end gap-4">
        <label className="field" style={{ marginBottom: 0, flex: "1 1 200px" }}>
          <span>Nama Kategori Baru</span>
          <input className="input" name="name" placeholder="mis. Streaming" required />
        </label>
        <label className="field" style={{ marginBottom: 0, width: 100 }}>
          <span>Urutan</span>
          <input className="input" name="order" type="number" defaultValue={0} />
        </label>
        <button className="btn btn-green" type="submit">
          + Tambah
        </button>
      </form>

      <div className="table-wrap">
        <table className="gk">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Slug</th>
              <th>Jumlah Produk</th>
              <th>Urutan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>
                  <b>{c.name}</b>
                </td>
                <td className="mono">{c.slug}</td>
                <td>{c._count.products}</td>
                <td>
                  <form action={saveCategory} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="name" value={c.name} />
                    <input className="input" name="order" type="number" defaultValue={c.order} style={{ width: 72, padding: "6px 9px" }} />
                    <button className="btn btn-sm" type="submit">
                      Simpan
                    </button>
                  </form>
                </td>
                <td>
                  {c._count.products === 0 ? (
                    <form action={deleteCategory}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="btn btn-sm btn-red" type="submit">
                        Hapus
                      </button>
                    </form>
                  ) : (
                    <span className="badge">Dipakai</span>
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
