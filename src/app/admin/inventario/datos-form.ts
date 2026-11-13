import type { SupabaseClient } from "@supabase/supabase-js";
import type { Categoria, Marca } from "@/lib/tipos";

export type ModeloSugerido = { id: number; nombre: string; marca: string; categoria_id: number };

/** Datos para el formulario de equipos: modelos ya registrados, marcas, categorías y valores usados antes. */
export async function datosFormulario(supabase: SupabaseClient) {
  const [{ data: modelos }, { data: marcas }, { data: categorias }, { data: usados }] = await Promise.all([
    supabase.from("modelos").select("id, nombre, categoria_id, marcas(nombre)").order("nombre"),
    supabase.from("marcas").select("*").order("nombre"),
    supabase.from("categorias").select("*").order("id"),
    supabase.from("unidades").select("procesador, gpu").limit(1000),
  ]);
  return {
    modelos: ((modelos ?? []) as unknown as { id: number; nombre: string; categoria_id: number; marcas: { nombre: string } | null }[]).map(
      (m): ModeloSugerido => ({ id: m.id, nombre: m.nombre, marca: m.marcas?.nombre ?? "", categoria_id: m.categoria_id }),
    ),
    marcas: (marcas ?? []) as Marca[],
    categorias: (categorias ?? []) as Categoria[],
    procesadoresUsados: [...new Set((usados ?? []).map((u) => u.procesador).filter(Boolean))] as string[],
    gpusUsadas: [...new Set((usados ?? []).map((u) => u.gpu).filter(Boolean))] as string[],
  };
}

export type DatosFormulario = Awaited<ReturnType<typeof datosFormulario>>;
