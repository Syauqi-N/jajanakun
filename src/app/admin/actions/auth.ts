"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentialsAsync, createSession, destroySession } from "@/lib/auth";
import { rateLimit, resetRateLimit, TOO_MANY } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

export async function loginAction(_prev: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const pass = String(formData.get("pass") || "");
  const ip = clientIp(await headers());
  // Maks 5 percobaan / 15 menit per email+IP, dan 20 / 15 menit per IP.
  const keyEmail = `admin-login:${ip}:${email}`;
  if (!rateLimit(keyEmail, 5, 15 * 60_000) || !rateLimit(`admin-login:${ip}`, 20, 15 * 60_000)) {
    return { error: TOO_MANY };
  }
  const admin = await checkCredentialsAsync(email, pass);
  if (!admin) {
    return { error: "Email atau password admin salah." };
  }
  resetRateLimit(keyEmail);
  await createSession(admin);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
