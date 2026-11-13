import type { MetadataRoute } from "next";
import { obtenerCatalogo } from "@/lib/catalogo";
import { URL_SITIO } from "@/lib/sitio";

// Mapa del sitio para Google: portada, catálogo, categorías y cada equipo publicado.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { unidades, categorias } = await obtenerCatalogo();
  const hoy = new Date();
  return [
    { url: URL_SITIO, lastModified: hoy, changeFrequency: "daily", priority: 1 },
    { url: `${URL_SITIO}/catalogo`, lastModified: hoy, changeFrequency: "daily", priority: 0.9 },
    ...categorias.map((c) => ({ url: `${URL_SITIO}/catalogo?categoria=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...unidades
      .filter((u) => u.estado !== "vendido")
      .map((u) => ({
        url: `${URL_SITIO}/equipo/${u.slug}`,
        lastModified: new Date(u.ingresado_en),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        images: (u.medios ?? []).filter((m) => m.tipo === "imagen").slice(0, 3).map((m) => m.url),
      })),
  ];
}
