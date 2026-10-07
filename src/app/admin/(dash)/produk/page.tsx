import { prisma } from "@/lib/prisma";
import { rp } from "@/lib/utils";
import { ProductForm } from "./product-form";
import { AdminForm } from "@/components/admin-form";

export const dynamic = "force-dynamic";

export default async function AdminProdukPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="slab text-[26px]">Produk</h1>
        <span className="mono text-xs" style={{ color: "var(--ink-soft)" }}>
          {products.length} produk
        </span>
      </div>

      <ProductForm categories={categories} />

      <div className="table-wrap">
        <table className="gk">
          <thead>
            <tr>
              <th></th>
              <th>Nama</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Jenis</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="table-thumb" />
                  ) : (
                    <div className="tile" style={{ width: 36, height: 36, fontSize: 14, background: p.tileBg, color: p.tileFg }}>
                      {p.letter}
                    </div>
                  )}
                </td>
                <td>
                  <b>{p.name}</b>
                  <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                    {p.duration}
                  </div>
                  {p.adminWa && (
                    <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                      Admin WA: +{p.adminWa}
                    </div>
                  )}
                </td>
                <td>{p.category.name}</td>
                <td className="mono" style={{ whiteSpace: "nowrap" }}>
                  {rp(p.price)}
                </td>
                <td>
                  {p.isPreOrder ? (
                    <span className="po-badge">PO • {p.poEta || "1-3 hari"}</span>
                  ) : (
                    <span className="badge badge-green" style={{ fontSize: 10 }}>Ready</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${p.active ? "badge-green" : "badge-red"}`}>{p.active ? "Aktif" : "Nonaktif"}</span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    <AdminForm action="toggleProductActive">
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn btn-sm" type="submit">
                        {p.active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </AdminForm>
                    <details>
                      <summary className="btn btn-sm btn-mustard" style={{ listStyle: "none", display: "inline-flex" }}>
                        Edit
                      </summary>
                      <div style={{ marginTop: 10, minWidth: 340 }}>
                        <ProductForm
                          categories={categories}
                          initial={{
                            id: p.id,
                            name: p.name,
                            description: p.description,
                            categoryId: p.categoryId,
                            duration: p.duration,
                            warranty: p.warranty,
                            price: p.price,
                            priceWas: p.priceWas,
                            tileBg: p.tileBg,
                            tileFg: p.tileFg,
                            letter: p.letter,
                            featured: p.featured,
                            badge: p.badge,
                            active: p.active,
                            imageUrl: p.imageUrl,
                            isPreOrder: p.isPreOrder,
                            poEta: p.poEta,
                            poMinQty: p.poMinQty,
                            poEndsAt: p.poEndsAt?.toISOString() ?? null,
                            adminWa: p.adminWa,
                          }}
                        />
                      </div>
                    </details>
                    <AdminForm action="deleteProduct" confirmText="Hapus produk ini?">
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn btn-sm btn-red" type="submit">
                        Hapus
                      </button>
                    </AdminForm>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="kirim-note" style={{ textAlign: "left", marginTop: 12 }}>
        Catatan: akun dikirim manual oleh admin lewat WhatsApp. Untuk menyembunyikan produk sementara, pakai
        Nonaktifkan.
      </p>
    </div>
  );
}
