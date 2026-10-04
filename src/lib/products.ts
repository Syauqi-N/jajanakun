import { prisma } from "./prisma";
import { preOrderQuota } from "./preorder";
import type { ProductDTO } from "@/components/catalog";

export async function getCatalogProducts(): Promise<ProductDTO[]> {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const quota = await preOrderQuota(products);

  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    category: p.category.name,
    duration: p.duration,
    warranty: p.warranty,
    price: p.price,
    priceWas: p.priceWas,
    tileBg: p.tileBg,
    tileFg: p.tileFg,
    letter: p.letter,
    featured: p.featured,
    badge: p.badge,
    stock: 99, // batas jumlah per pesanan, bukan stok kredensial
    imageUrl: p.imageUrl,
    isPreOrder: p.isPreOrder,
    poEta: p.poEta,
    poMinQty: p.poMinQty,
    poEndsAt: p.poEndsAt?.toISOString() ?? null,
    poClosed: Boolean(p.isPreOrder && p.poEndsAt && p.poEndsAt <= new Date()),
    poClaimed: quota.get(p.id)?.claimed ?? 0,
  }));
}

export async function getProductBySlug(slug: string) {
  const p = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!p || !p.active) return null;
  const stock = 99;
  const dto: ProductDTO = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    category: p.category.name,
    duration: p.duration,
    warranty: p.warranty,
    price: p.price,
    priceWas: p.priceWas,
    tileBg: p.tileBg,
    tileFg: p.tileFg,
    letter: p.letter,
    featured: p.featured,
    badge: p.badge,
    stock,
    imageUrl: p.imageUrl,
    isPreOrder: p.isPreOrder,
    poEta: p.poEta,
    poMinQty: p.poMinQty,
    poEndsAt: p.poEndsAt?.toISOString() ?? null,
    poClosed: Boolean(p.isPreOrder && p.poEndsAt && p.poEndsAt <= new Date()),
    poClaimed: (await preOrderQuota([p])).get(p.id)?.claimed ?? 0,
  };
  return { product: p, dto, stock };
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
}
