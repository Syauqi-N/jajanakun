import { getCatalogProducts } from "@/lib/products";
import { getCurrentUser } from "@/lib/user-auth";
import { CartDrawer as CartDrawerClient } from "./cart-drawer";

export async function CartDrawerServer() {
  const user = await getCurrentUser();
  const products = await getCatalogProducts();
  return <CartDrawerClient loggedIn={Boolean(user)} initialProducts={products} initialWa={user?.wa || ""} />;
}
