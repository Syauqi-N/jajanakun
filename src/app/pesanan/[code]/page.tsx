import { getCurrentUser } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { SiteHeaderServer } from "@/components/site-header-server";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawerServer } from "@/components/cart-drawer-server";
import { Toast } from "@/components/toast";
import OrderPage from "./order-client";
import { getSetting, SETTING_KEYS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/masuk?next=${encodeURIComponent(`/pesanan/${code}`)}`);
  const owned = await prisma.order.findFirst({ where: { code: code.toUpperCase(), userId: user.id }, select: { id: true } });
  if (!owned) notFound();
  if (!/^GK-[A-Z0-9]{6}$/i.test(code)) notFound();
  const adminWa = await getSetting(SETTING_KEYS.adminWa);

  return (
    <>
      <SiteHeaderServer />
      <CartDrawerServer />
      <Toast />
      <main>
        <OrderPage code={code.toUpperCase()} adminWa={adminWa} />
      </main>
      <SiteFooter />
    </>
  );
}
