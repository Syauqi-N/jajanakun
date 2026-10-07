-- Nomor WhatsApp admin per produk (kosong = pakai nomor toko).
ALTER TABLE "products" ADD COLUMN "adminWa" TEXT NOT NULL DEFAULT '';
