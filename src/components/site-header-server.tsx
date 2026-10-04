import { getCurrentUser } from "@/lib/user-auth";
import { SiteHeader as SiteHeaderClient, type HeaderUser } from "./site-header";

/** Server wrapper: ambil user aktif lalu render header client dengan props. */
export async function SiteHeaderServer() {
  const user = await getCurrentUser();
  const headerUser: HeaderUser = user ? { name: user.name, email: user.email } : null;
  return <SiteHeaderClient user={headerUser} />;
}
