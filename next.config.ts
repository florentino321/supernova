import type { NextConfig } from "next";

// Las fotos viven en Supabase Storage: next/image las optimiza (WebP/AVIF y tamaño según la pantalla).
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400, // 31 días: cada foto tiene un nombre único, nunca cambia
    remotePatterns: supabase
      ? [{ protocol: "https", hostname: supabase.hostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  // Modelo clásico de caché: el catálogo público se guarda con unstable_cache (etiqueta "catalogo")
  // y el panel lo invalida al guardar; las páginas del panel leen la sesión en cada petición.
  cacheComponents: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
