import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import { URL_SITIO } from "@/lib/sitio";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], weight: ["600", "700", "800"] });

const descripcion =
  "Laptops importadas directamente de Estados Unidos, revisadas una por una y con garantía. Gaming, ultrabooks, ejecutivas y workstations en Huánuco con envíos a todo el Perú.";

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITIO),
  applicationName: "Laptops Americanas",
  openGraph: { type: "website", locale: "es_PE", siteName: "Laptops Americanas", description: descripcion },
  twitter: { card: "summary_large_image" },
  title: {
    default: "Laptops Americanas · Laptops importadas de EE.UU.",
    template: "%s · Laptops Americanas",
  },
  description: descripcion,
};

export const viewport: Viewport = { themeColor: "#0d1b2e" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
