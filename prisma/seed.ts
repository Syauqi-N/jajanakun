import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = ["Streaming", "Musik", "Desain", "Produktivitas"];

type SeedProduct = {
  slug: string;
  name: string;
  cat: string;
  dur: string;
  price: number;
  was: number;
  garansi: string;
  desc: string;
  tileBg: string;
  tileFg: string;
  letter: string;
  featured?: boolean;
  badge?: string;
  po?: boolean;
  poEta?: string;
  poMinQty?: number;
};

const PRODUCTS: SeedProduct[] = [
  { slug: "netflix-premium-4k", name: "Netflix Premium 4K UHD", cat: "Streaming", dur: "1 bulan (30 hari)", price: 48000, was: 152000, garansi: "Garansi 30 Hari", desc: "Profil private, kualitas 4K UHD + HDR, bisa di HP/TV/laptop. Anti on-hold, full garansi.", tileBg: "#221f1f", tileFg: "#e50914", letter: "N", featured: true, badge: "Paling Laris" },
  { slug: "spotify-premium-individual", name: "Spotify Premium Individual", cat: "Musik", dur: "3 bulan", price: 62000, was: 195000, garansi: "Garansi Full", desc: "Tanpa iklan, bisa download, kualitas audio paling tinggi. Aktivasi di akunmu sendiri.", tileBg: "#123524", tileFg: "#1ed760", letter: "S", featured: true },
  { slug: "youtube-premium", name: "YouTube Premium", cat: "Streaming", dur: "1 bulan", price: 18000, was: 59000, garansi: "Garansi 30 Hari", desc: "Tanpa iklan, bisa diputar di background, termasuk YouTube Music Premium.", tileBg: "#2a0f0f", tileFg: "#ff4e45", letter: "Y" },
  { slug: "disney-hotstar-premium", name: "Disney+ Hotstar Premium", cat: "Streaming", dur: "1 bulan", price: 20000, was: 65000, garansi: "Garansi 30 Hari", desc: "Semua konten Disney, Marvel, Star Wars, sampai liga Inggris. Kualitas 4K.", tileBg: "#0d2242", tileFg: "#7cc4ff", letter: "D" },
  { slug: "vidio-platinum", name: "Vidio Platinum", cat: "Streaming", dur: "1 tahun", price: 49000, was: 429000, garansi: "Garansi Full", desc: "Bola lokal & Eropa, sinetron, film Indonesia. Bisa 2 perangkat sekaligus.", tileBg: "#2b1052", tileFg: "#c9a7ff", letter: "V" },
  { slug: "apple-music", name: "Apple Music", cat: "Musik", dur: "3 bulan", price: 39000, was: 165000, garansi: "Garansi Full", desc: "Audio lossless + spatial audio, bisa di Android maupun iPhone.", tileBg: "#331118", tileFg: "#fa5c7c", letter: "A" },
  { slug: "canva-pro", name: "Canva Pro", cat: "Desain", dur: "1 tahun", price: 35000, was: 769000, garansi: "Garansi Full", desc: "Semua template premium, background remover, brand kit. Undangan via email kamu.", tileBg: "#0d2b33", tileFg: "#2fd4e8", letter: "C", featured: true },
  { slug: "capcut-pro", name: "CapCut Pro", cat: "Desain", dur: "1 bulan", price: 15000, was: 89000, garansi: "Garansi 30 Hari", desc: "Efek & transisi premium, auto caption pro, cloud storage. Bikin konten cepat.", tileBg: "#1c1c1e", tileFg: "#f2f2f2", letter: "Cc" },
  { slug: "adobe-lightroom-premium", name: "Adobe Lightroom Premium", cat: "Desain", dur: "1 bulan", price: 22000, was: 129000, garansi: "Garansi 30 Hari", desc: "Preset premium, edit RAW, sync semua perangkat. Untuk fotografer & kreator.", tileBg: "#0a2436", tileFg: "#31a8ff", letter: "Lr" },
  { slug: "chatgpt-plus", name: "ChatGPT Plus", cat: "Produktivitas", dur: "1 bulan", price: 85000, was: 349000, garansi: "Garansi 30 Hari", desc: "Akses model terbaru, respon lebih cepat, bisa membuat gambar & analisis file.", tileBg: "#0c2b26", tileFg: "#4fe3c1", letter: "G", featured: true, badge: "Paling Laris" },
  { slug: "microsoft-365-personal", name: "Microsoft 365 Personal", cat: "Produktivitas", dur: "1 tahun", price: 95000, was: 959000, garansi: "Garansi Full", desc: "Word, Excel, PowerPoint + OneDrive 1TB. Aktivasi resmi di akun Microsoft kamu.", tileBg: "#2b1a10", tileFg: "#ff8c42", letter: "M" },
  { slug: "notion-plus", name: "Notion Plus", cat: "Produktivitas", dur: "1 tahun", price: 55000, was: 1590000, garansi: "Garansi Full", desc: "Upload tanpa batas, riwayat versi 90 hari, Notion AI add-on tersedia.", tileBg: "#1e1e1e", tileFg: "#f5f5f5", letter: "N" },

  // ---- Produk PRE-ORDER (harga lebih murah) ----
  { slug: "netflix-premium-4k-po", name: "Netflix Premium 4K (Pre-Order)", cat: "Streaming", dur: "1 bulan (30 hari)", price: 39000, was: 48000, garansi: "Garansi 30 Hari", desc: "Harga PO lebih murah! Akun dikirim setelah masa PO selesai atau kuota terkumpul. Estimasi 1-3 hari kerja.", tileBg: "#221f1f", tileFg: "#e50914", letter: "N", po: true, poEta: "1-3 hari kerja", poMinQty: 5 },
  { slug: "spotify-premium-po", name: "Spotify Premium (Pre-Order)", cat: "Musik", dur: "3 bulan", price: 49000, was: 62000, garansi: "Garansi Full", desc: "Harga PO lebih murah! Cocok buat kamu yang tidak buru-buru. Dikirim setelah kuota PO terpenuhi.", tileBg: "#123524", tileFg: "#1ed760", letter: "S", po: true, poEta: "2-3 hari kerja", poMinQty: 5 },
  { slug: "canva-pro-po", name: "Canva Pro (Pre-Order)", cat: "Desain", dur: "1 tahun", price: 25000, was: 35000, garansi: "Garansi Full", desc: "Harga PO lebih murah! Undangan via email kamu setelah masa PO selesai.", tileBg: "#0d2b33", tileFg: "#2fd4e8", letter: "C", po: true, poEta: "1-3 hari kerja", poMinQty: 8 },
];

async function main() {
  console.log("Seeding…");

  const catMap = new Map<string, string>();
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    const slug = c.toLowerCase();
    const row = await prisma.category.upsert({
      where: { name: c },
      update: {},
      create: { name: c, slug, order: i },
    });
    catMap.set(c, row.id);
  }

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.desc,
        categoryId: catMap.get(p.cat)!,
        duration: p.dur,
        warranty: p.garansi,
        price: p.price,
        priceWas: p.was,
        tileBg: p.tileBg,
        tileFg: p.tileFg,
        letter: p.letter,
        featured: p.featured ?? false,
        badge: p.badge ?? null,
        order: i,
        isPreOrder: p.po ?? false,
        poEta: p.poEta ?? "",
        poMinQty: p.poMinQty ?? 0,
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.desc,
        categoryId: catMap.get(p.cat)!,
        duration: p.dur,
        warranty: p.garansi,
        price: p.price,
        priceWas: p.was,
        tileBg: p.tileBg,
        tileFg: p.tileFg,
        letter: p.letter,
        featured: p.featured ?? false,
        badge: p.badge ?? null,
        order: i,
        isPreOrder: p.po ?? false,
        poEta: p.poEta ?? "",
        poMinQty: p.poMinQty ?? 0,
      },
    });
  }

  console.log(`Selesai. ${CATEGORIES.length} kategori, ${PRODUCTS.length} produk.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
