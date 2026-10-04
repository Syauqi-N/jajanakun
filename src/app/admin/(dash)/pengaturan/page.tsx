import { getSettings, SETTING_KEYS } from "@/lib/settings";
import { saveSettings } from "../../actions/settings";

export const dynamic = "force-dynamic";

export default async function AdminPengaturanPage() {
  const s = await getSettings([
    SETTING_KEYS.adminWa,
    SETTING_KEYS.storeName,
    SETTING_KEYS.storeTagline,
    SETTING_KEYS.storeAddress,
  ]);

  return (
    <div>
      <h1 className="slab mb-2 text-[26px]">Pengaturan Toko</h1>
      <p className="mb-6" style={{ color: "var(--ink-soft)" }}>
        Perubahan langsung berlaku di seluruh halaman toko — tanpa perlu build ulang.
      </p>

      <form action={saveSettings} className="card" style={{ maxWidth: 620 }}>
        <label className="field">
          <span>Nomor WhatsApp Admin (wajib)</span>
          <input
            className="input mono"
            name="admin_wa"
            defaultValue={s[SETTING_KEYS.adminWa]}
            placeholder="6281234567890"
            required
          />
          <small style={{ color: "var(--ink-soft)" }}>
            Format internasional tanpa tanda +, mis. <b>6281234567890</b>. Boleh diawali 0 — otomatis dinormalkan.
          </small>
        </label>

        <label className="field">
          <span>Nama Toko</span>
          <input className="input" name="store_name" defaultValue={s[SETTING_KEYS.storeName]} placeholder="jajanakun.store" />
        </label>

        <label className="field">
          <span>Tagline</span>
          <input
            className="input"
            name="store_tagline"
            defaultValue={s[SETTING_KEYS.storeTagline]}
            placeholder="Warung Akun Premium"
          />
        </label>

        <label className="field">
          <span>Alamat / Keterangan (opsional)</span>
          <input
            className="input"
            name="store_address"
            defaultValue={s[SETTING_KEYS.storeAddress]}
            placeholder="mis. Surabaya, Indonesia"
          />
        </label>

        <label className="field flex items-center gap-3" style={{ flexDirection: "row", alignItems: "center" }}>
          <input
            type="checkbox"
            name="google_enabled"
            value="1"
            defaultChecked={s[SETTING_KEYS.googleEnabled] === "1"}
            style={{ width: 20, height: 20 }}
          />
          <span style={{ margin: 0 }}>Aktifkan tombol “Masuk dengan Google”</span>
        </label>

        <button className="btn btn-green mt-2" type="submit">
          Simpan Pengaturan
        </button>
      </form>
    </div>
  );
}
