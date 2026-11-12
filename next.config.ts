import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las páginas leen la sesión y el inventario en cada petición (datos siempre al día),
  // por eso usamos el modelo de renderizado dinámico clásico.
  cacheComponents: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
