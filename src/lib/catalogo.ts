import { unstable_cache } from "next/cache";
import { crearClientePublico } from "./supabase/publico";
import type { Categoria, Marca, UnidadPublica } from "./tipos";

// Columnas sin costos: el público nunca recibe precios de compra.
export const COLUMNAS_PUBLICAS = `id, modelo_id, sku, slug, procesador, ram_gb, ram_tipo, almacenamiento_gb, almacenamiento,
  gpu, pantalla_pulg, pantalla_detalle, color, sistema, condicion, grado, garantia_meses, precio_pen,
  precio_oferta_pen, estado, publicado, destacado, descripcion, ingresado_en,
  modelos(id, nombre, slug, anio, descripcion, marca_id, categoria_id, marcas(id, nombre, slug), categorias(id, nombre, slug, descripcion)),
  medios(id, unidad_id, tipo, url, ruta, posicion, es_portada)`;

/** Etiqueta de caché: el panel la invalida al guardar cambios, así la tienda se actualiza al instante. */
export const TAG_CATALOGO = "catalogo";
const CACHE = { tags: [TAG_CATALOGO], revalidate: 600 };

export const obtenerCatalogo = unstable_cache(async () => {
  const supabase = crearClientePublico();
  const [{ data: unidades, error }, { data: marcas }, { data: categorias }] = await Promise.all([
    supabase
      .from("unidades")
      .select(COLUMNAS_PUBLICAS)
      .eq("publicado", true)
      .in("estado", ["disponible", "reservado", "en_transito", "vendido"])
      .order("destacado", { ascending: false })
      .order("ingresado_en", { ascending: false }),
    supabase.from("marcas").select("*").order("nombre"),
    supabase.from("categorias").select("*").order("id"),
  ]);
  if (error) console.error("Error al leer el catálogo:", error.message);
  return {
    unidades: (unidades ?? []) as unknown as UnidadPublica[],
    marcas: (marcas ?? []) as Marca[],
    categorias: (categorias ?? []) as Categoria[],
  };
}, ["catalogo"], CACHE);

export const obtenerEquipo = unstable_cache(async (slug: string) => {
  const supabase = crearClientePublico();
  const { data } = await supabase
    .from("unidades")
    .select(COLUMNAS_PUBLICAS)
    .eq("slug", slug)
    .eq("publicado", true)
    .maybeSingle();
  return data as unknown as UnidadPublica | null;
}, ["equipo"], CACHE);

export function portada(u: UnidadPublica) {
  const imgs = (u.medios ?? []).filter((m) => m.tipo === "imagen").sort((a, b) => a.posicion - b.posicion);
  return imgs.find((m) => m.es_portada) ?? imgs[0] ?? null;
}
