/** Dijalankan sekali saat server start: gagal cepat bila env produksi belum benar. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertProductionEnv } = await import("./lib/env");
  assertProductionEnv();
}
