"use client";

import { useState } from "react";
import { useStore } from "@/components/store-provider";

type ProductLite = {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  tileBg: string;
  tileFg: string;
  letter: string;
  isPreOrder: boolean;
  poClosed: boolean;
};

export function BuyBox({ product }: { product: ProductLite }) {
  const { add, openDrawer } = useStore();
  const [qty, setQty] = useState(1);
  const soldOut = product.poClosed;
  const max = product.isPreOrder ? 99 : product.stock > 0 ? product.stock : 99;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <div className="qty" style={{ marginLeft: 0, border: "2.5px solid var(--line)", borderRadius: 9, padding: "5px 9px", background: "var(--paper-2)", boxShadow: "2.5px 2.5px 0 rgba(51,36,26,.8)" }}>
        <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kurangi">
          −
        </button>
        <b>{qty}</b>
        <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="Tambah">
          +
        </button>
      </div>
      <button
        className="btn btn-mustard"
        type="button"
        disabled={soldOut}
        onClick={() => {
          add({ ...product, stock: max }, qty);
          openDrawer();
        }}
      >
        {soldOut ? "Batch PO Ditutup" : product.isPreOrder ? "+ Keranjang (Pre-Order)" : "+ Masukkan Keranjang"}
      </button>
    </div>
  );
}
