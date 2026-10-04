"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Carousel horizontal yang bisa digeser dengan:
 *  - drag mouse (klik-tahan-geser)
 *  - roda mouse (wheel vertikal diubah ke horizontal)
 *  - tombol panah ‹ ›
 *  - swipe (touch) — sudah bawaan browser
 *
 * Scrollbar native disembunyikan agar tampilan bersih; tombol panah muncul
 * hanya bila masih ada ruang geser di sisi terkait.
 */
export function PoCarousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft < max - 2);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  // Roda mouse: React memasang onWheel sebagai listener PASSIVE, sehingga
  // preventDefault() di sana diabaikan. Kita pasang sendiri (non-passive) agar
  // roda vertikal bisa dipakai menggeser carousel saat masih ada ruang geser.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const atStart = el.scrollLeft <= 0 && delta < 0;
      const atEnd = el.scrollLeft >= max - 1 && delta > 0;
      if (atStart || atEnd) return; // biarkan halaman yang scroll
      e.preventDefault();
      el.scrollLeft += delta;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Tombol panah menggeser satu kartu.
  const scrollByAmount = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // Hanya untuk mouse (touch sudah native). Hindari menyeret saat klik tombol/link.
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a")) return;
    drag.current = { active: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    el.scrollLeft = drag.current.startLeft - dx;
  };

  const endDrag = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !drag.current.active) return;
    drag.current.active = false;
    el.style.cursor = "";
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      /* abaikan */
    }
  };

  return (
    <div className="po-carousel-wrap">
      <div
        ref={ref}
        className="po-carousel"
        role="region"
        aria-label="Produk pre-order"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {children}
      </div>

      {canLeft && (
        <button type="button" className="po-nav po-nav-left" aria-label="Geser ke kiri" onClick={() => scrollByAmount(-1)}>
          ‹
        </button>
      )}
      {canRight && (
        <button type="button" className="po-nav po-nav-right" aria-label="Geser ke kanan" onClick={() => scrollByAmount(1)}>
          ›
        </button>
      )}
    </div>
  );
}
