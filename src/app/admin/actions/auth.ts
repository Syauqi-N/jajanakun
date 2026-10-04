"use server";

import { redirect } from "next/navigation";
import { checkCredentials, createSession, destroySession } from "@/lib/auth";

export async function loginAction(_prev: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") || "");
  const pass = String(formData.get("pass") || "");
  if (!checkCredentials(email, pass)) {
    return { error: "Email atau password admin salah." };
  }
  await createSession();
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
