import type { Metadata } from "next";
import { Alfa_Slab_One, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/store-provider";

const alfa = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alfa",
  display: "swap",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});
const mono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-spacemono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "jajanakun.store — Warung Akun Premium",
  description:
    "Cari akun premium? Di sini tempatnya. Netflix, Spotify, Canva, ChatGPT — harga kaki lima, kualitas bintang lima. Bayar QRIS, verifikasi otomatis.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${alfa.variable} ${jakarta.variable} ${mono.variable}`}>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
