import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SiteHeaderServer } from "@/components/site-header-server";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawerServer } from "@/components/cart-drawer-server";
import { Toast } from "@/components/toast";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/user-auth";
import { googleEnabled } from "@/lib/google-enabled";

export const dynamic = "force-dynamic";

export default async function DaftarPage() {
  const user = await getCurrentUser();
  if (user) redirect("/akun");
  const googleOk = await googleEnabled();

  return (
    <>
      <SiteHeaderServer />
      <CartDrawerServer />
      <Toast />
      <main>
        <Suspense fallback={<div className="wrap py-16 text-center mono">Memuat…</div>}>
          <AuthForm mode="register" googleEnabled={googleOk} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
