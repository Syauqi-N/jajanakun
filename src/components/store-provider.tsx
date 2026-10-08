"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type CartProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  tileBg: string;
  tileFg: string;
  letter: string;
  imageUrl?: string | null;
  isPreOrder?: boolean;
};

export type CartState = Record<string, number>; // productId -> qty

type StoreCtx = {
  cart: CartState;
  products: Record<string, CartProduct>;
  ready: boolean;
  count: number;
  total: number;
  // drawer
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  // toast
  toast: (msg: string) => void;
  toastMsg: string;
  // actions
  add: (p: CartProduct, qty?: number) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  setProductCache: (list: CartProduct[]) => void;
};

const Ctx = createContext<StoreCtx | null>(null);
const LS_KEY = "jajanakun.cart.v1";

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore harus dipakai di dalam StoreProvider");
  return ctx;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>({});
  const [cache, setCache] = useState<Record<string, CartProduct>>({});
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // load cart
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  // persist cart
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart, ready]);

  const setProductCache = useCallback((list: CartProduct[]) => {
    setCache((prev) => {
      const next = { ...prev };
      for (const p of list) next[p.id] = p;
      return next;
    });
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2600);
  }, []);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    document.body.style.overflow = "hidden";
  }, []);
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    document.body.style.overflow = "";
  }, []);

  const add = useCallback(
    (p: CartProduct, qty = 1) => {
      setCache((prev) => ({ ...prev, [p.id]: p }));
      setCart((prev) => {
        const cur = prev[p.id] || 0;
        const max = 99;
        const next = Math.min(cur + qty, max);
        return { ...prev, [p.id]: next };
      });
      toast(`${p.name} sudah masuk keranjang ✓`);
    },
    [toast]
  );

  const inc = useCallback((id: string) => {
    setCart((prev) => {
      const p = cache[id];
      const cur = prev[id] || 0;
      const max = p && 99;
      return { ...prev, [id]: Math.min(cur + 1, max) };
    });
  }, [cache]);

  const dec = useCallback((id: string) => {
    setCart((prev) => {
      const cur = (prev[id] || 0) - 1;
      const next = { ...prev };
      if (cur <= 0) delete next[id];
      else next[id] = cur;
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clear = useCallback(() => setCart({}), []);

  const count = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  const total = useMemo(
    () => Object.entries(cart).reduce((sum, [id, q]) => sum + (cache[id]?.price || 0) * q, 0),
    [cart, cache]
  );

  const value: StoreCtx = {
    cart,
    products: cache,
    ready,
    count,
    total,
    drawerOpen,
    openDrawer,
    closeDrawer,
    toast,
    toastMsg,
    add,
    inc,
    dec,
    remove,
    clear,
    setProductCache,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
