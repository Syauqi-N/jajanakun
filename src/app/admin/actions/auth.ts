"use server";

import { redirect } from "next/navigation";
import { checkCredentialsAsync, createSession, destroySession } from "@/lib/auth";

export async function loginAction(_prev: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") || "");
  const pass = String(formData.get("pass") || "");
  const id = await checkCredentialsAsync(email, pass);
  if (!id) {
    return { error: "Email atau password admin salah." };
  }
  await createSession(id);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
