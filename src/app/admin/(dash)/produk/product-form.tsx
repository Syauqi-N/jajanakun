"use client";

import { useRef, useState } from "react";
import { saveProduct } from "../../actions/data";

type Category = { id: string; name: string };
export type ProductFormValues = {
  id?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  duration?: string;
  warranty?: string;
  price?: number;
  priceWas?: number | null;
  tileBg?: string;
  tileFg?: string;
  letter?: string;
  featured?: boolean;
  badge?: string | null;
  active?: boolean;
  imageUrl?: string | null;
  isPreOrder?: boolean;
  poEta?: string;
  poMinQty?: number;
  poEndsAt?: string | null;
};

export function ProductForm({ categories, initial }: { categories: Category[]; initial?: ProductFormValues }) {
  const [open, setOpen] = useState(Boolean(initial?.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [isPo, setIsPo] = useState(Boolean(initial?.isPreOrder));
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initial?.id);

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setUploadErr("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal upload.");
      setImageUrl(data.url);
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : "Gagal upload gambar.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (!open) {
    return (
      <button className="btn btn-red mb-5" type="button" onClick={() => setOpen(true)}>
        {isEdit ? "Edit Produk" : "+ Tambah Produk"}
      </button>
    );
  }

  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      if (uploading || saving) return;
      setSaving(true); setError("");
      const fd = new FormData(e.currentTarget);
      try { await saveProduct(fd); window.location.assign("/admin/produk"); }
      catch { setError("Gagal menyimpan. Periksa harga, kategori, dan batas waktu PO."); setSaving(false); }
    }} className="card mb-6" style={{ display: "grid", gap: 4 }}>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <div className="mb-4 flex items-center justify-between">
        <h3 className="slab text-[19px]">{isEdit ? "Edit Produk" : "Tambah Produk"}</h3>
        <button className="x-btn" type="button" onClick={() => setOpen(false)} aria-label="Tutup">
          ✕
        </button>
      </div>

      <label className="field">
        <span>Nama Produk</span>
        <input className="input" name="name" defaultValue={initial?.name} required />
      </label>
      <label className="field">
        <span>Deskripsi</span>
        <textarea className="textarea" name="description" defaultValue={initial?.description} />
      </label>

      {/* Gambar produk (1:1) */}
      <div className="field">
        <span>Gambar Produk (kotak 1:1)</span>
        <div className="upload-row">
          <div className="upload-preview">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Pratinjau" />
            ) : (
              <span className="mono">1:1</span>
            )}
          </div>
          <div style={{ display: "grid", gap: 6, flex: 1 }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              className="input"
              style={{ padding: 8 }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                PNG/JPG/WEBP • maks 3MB • akan dipotong otomatis jadi kotak
              </span>
              {imageUrl && (
                <button type="button" className="btn btn-sm" onClick={() => setImageUrl("")}>
                  Hapus gambar
                </button>
              )}
            </div>
            {uploading && <span className="mono" style={{ fontSize: 12, color: "var(--mustard-700, #8a6400)" }}>Mengunggah…</span>}
            {uploadErr && (
              <span className="mono" style={{ fontSize: 12, color: "var(--red)" }}>
                {uploadErr}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span>Kategori</span>
          <select className="select" name="categoryId" defaultValue={initial?.categoryId} required>
            <option value="">— pilih —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Durasi</span>
          <input className="input" name="duration" defaultValue={initial?.duration} placeholder="1 bulan (30 hari)" />
        </label>
        <label className="field">
          <span>Garansi</span>
          <input className="input" name="warranty" defaultValue={initial?.warranty} placeholder="Garansi 30 Hari" />
        </label>
        <label className="field">
          <span>Badge (opsional)</span>
          <input className="input" name="badge" defaultValue={initial?.badge ?? ""} placeholder="Paling Laris" />
        </label>
        <label className="field">
          <span>Harga (Rp)</span>
          <input className="input" name="price" type="number" min={1} step={1} defaultValue={initial?.price} required />
        </label>
        <label className="field">
          <span>Harga Coret (Rp, opsional)</span>
          <input className="input" name="priceWas" type="number" min={0} defaultValue={initial?.priceWas ?? undefined} />
        </label>
        <label className="field">
          <span>Huruf Tile</span>
          <input className="input" name="letter" defaultValue={initial?.letter ?? "A"} maxLength={3} />
        </label>
        <label className="field">
          <span>Warna Tile (background)</span>
          <input className="input" name="tileBg" type="color" defaultValue={initial?.tileBg ?? "#221f1f"} style={{ height: 46, padding: 6 }} />
        </label>
        <label className="field">
          <span>Warna Teks Tile</span>
          <input className="input" name="tileFg" type="color" defaultValue={initial?.tileFg ?? "#e50914"} style={{ height: 46, padding: 6 }} />
        </label>
      </div>

      {/* Pre-Order */}
      <div className="po-box">
        <label className="flex items-center gap-2 font-bold">
          <input type="checkbox" name="isPreOrder" checked={isPo} onChange={(e) => setIsPo(e.target.checked)} /> Produk
          ini Pre-Order (harga lebih murah)
        </label>
        {isPo && (
          <div className="grid gap-4 sm:grid-cols-2" style={{ marginTop: 10 }}>
            <label className="field">
              <span>Batas Waktu Batch PO (WIB)</span>
              <input className="input" name="poEndsAt" type="datetime-local" required defaultValue={
                new Date((initial?.poEndsAt ? new Date(initial.poEndsAt).getTime() : Date.now() + 3 * 86400000) + 7 * 3600000).toISOString().slice(0, 16)
              } />
            </label>
            <label className="field">
              <span>Estimasi Pengiriman</span>
              <input className="input" name="poEta" defaultValue={initial?.poEta} placeholder="1-3 hari kerja" />
            </label>
            <label className="field">
              <span>Min. Pembelian untuk Batch PO (opsional)</span>
              <input className="input" name="poMinQty" type="number" min={0} defaultValue={initial?.poMinQty ?? 0} />
            </label>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-5">
        <label className="flex items-center gap-2 font-bold">
          <input type="checkbox" name="featured" defaultChecked={initial?.featured} /> Tampilkan di &ldquo;Terlaris&rdquo;
        </label>
        <label className="flex items-center gap-2 font-bold">
          <input type="checkbox" name="active" value="on" defaultChecked={initial?.active ?? true} /> Aktif
        </label>
      </div>

      <button className="btn btn-green justify-center" type="submit" disabled={uploading || saving}>
        {uploading ? "Tunggu unggahan…" : saving ? "Menyimpan…" : "Simpan"}
      </button>
    </form>
  );
}
