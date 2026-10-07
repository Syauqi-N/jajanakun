"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_HOURS, formatHours, isStoreOpen, type StoreHours } from "@/lib/store-hours";

/**
 * `open` null = belum dihitung (render server / sebelum hydrate) — dianggap
 * buka agar tidak ada kedipan modal. Server tetap menolak checkout saat tutup.
 */
type Ctx = { hours: StoreHours; open: boolean | null };

const StoreHoursCtx = createContext<Ctx>({ hours: DEFAULT_HOURS, open: null });

export function useStoreHours() {
  return useContext(StoreHoursCtx);
}

export function StoreHoursProvider({ hours, children }: { hours: StoreHours; children: React.ReactNode }) {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const tick = () => setOpen(isStoreOpen(hours));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [hours]);
  return (
    <StoreHoursCtx.Provider value={{ hours, open }}>
      {children}
      <StoreClosedModal />
    </StoreHoursCtx.Provider>
  );
}

const ACK_KEY = "gk_closed_ack";

/** Modal "Toko Tutup" — sekali per sesi browser, tidak di panel admin. */
function StoreClosedModal() {
  const { hours, open } = useStoreHours();
  const pathname = usePathname();
  const [acked, setAcked] = useState(true);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(ACK_KEY) === "1";
    } catch {
      // storage diblokir — tampilkan saja
    }
    setAcked(seen);
  }, []);

  const show = open === false && !acked && !pathname.startsWith("/admin");

  useEffect(() => {
    if (!show) return;
    btnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  function dismiss() {
    setAcked(true);
    try {
      sessionStorage.setItem(ACK_KEY, "1");
    } catch {
      // abaikan
    }
  }

  if (!show) return null;
  return (
    <>
      <div className="overlay show" />
      <div
        className="modal show"
        role="dialog"
        aria-modal="true"
        aria-labelledby="closed-title"
        aria-describedby="closed-desc"
        onClick={(e) => e.target === e.currentTarget && dismiss()}
      >
        <div className="modal-card closed-card">
          <div className="closed-sign" aria-hidden="true">TUTUP</div>
          <h3 id="closed-title">Toko Tutup</h3>
          <p id="closed-desc" className="modal-sub">
            Jelajahi produk dan kembali lagi besok.
          </p>
          <p className="closed-hours mono">Jam buka: {formatHours(hours)}</p>
          <div className="modal-actions">
            <button ref={btnRef} type="button" className="btn btn-mustard" onClick={dismiss}>
              Okey Paham
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
