import { preOrderReadiness } from "../src/lib/preorder";
import { prisma } from "../src/lib/prisma";
const order = await prisma.order.findUnique({ where: { code: "GK-GHNVNU" }, include: { items: true } });
if (!order) throw new Error("no order");
console.log("po readiness ->", await preOrderReadiness(order.items));
await prisma.$disconnect();
