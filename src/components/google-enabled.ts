// Nilai NEXT_PUBLIC_* di-inline saat build, jadi aman dibaca di client.
export function googleAvailable(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "1";
}
