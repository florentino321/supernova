import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lote, Modelo, Unidad } from "@/lib/tipos";

/** Datos que necesita el formulario de equipos (modelos, lotes y plantillas por modelo). */
export async function datosFormulario(supabase: SupabaseClient) {
  const [{ data: modelos }, { data: lotes }, { data: ultimas }] = await Promise.all([
    supabase.from("modelos").select("*, marcas(id, nombre, slug)").order("nombre"),
    supabase.from("lotes").select("*").order("fecha_compra", { ascending: false }),
    supabase
      .from("unidades")
      .select("modelo_id, procesador, ram_gb, ram_tipo, almacenamiento_gb, almacenamiento, gpu, pantalla_pulg, pantalla_detalle, color, sistema")
      .order("creado_en", { ascending: false }),
  ]);
  const vistos = new Set<number>();
  const plantillas = (ultimas ?? []).filter((u) => (vistos.has(u.modelo_id) ? false : (vistos.add(u.modelo_id), true)));
  const ordenados = ((modelos ?? []) as Modelo[]).sort(
    (a, b) => (a.marcas?.nombre ?? "").localeCompare(b.marcas?.nombre ?? "") || a.nombre.localeCompare(b.nombre),
  );
  return {
    modelos: ordenados,
    lotes: (lotes ?? []) as Lote[],
    plantillas: plantillas as (Partial<Unidad> & { modelo_id: number })[],
  };
}
