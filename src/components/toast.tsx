"use client";

import { useStore } from "./store-provider";

export function Toast() {
  const { toastMsg } = useStore();
  return (
    <div className={`toast ${toastMsg ? "show" : ""}`} role="status">
      {toastMsg}
    </div>
  );
}
