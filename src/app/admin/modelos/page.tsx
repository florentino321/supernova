import { Encabezado } from "@/components/encabezado";
import { requerirAdmin } from "@/lib/sesion";
import type { Categoria, Marca, Modelo } from "@/lib/tipos";
import { FilaModelo, FormModelo, FormSimple } from "./formularios";

export const metadata = { title: "Modelos y marcas" };

export default async function Modelos() {
  const { supabase, esAdmin } = await requerirAdmin();
  const [{ data: modelos }, { data: marcas }, { data: categorias }, { data: unidades }] = await Promise.all([
    supabase.from("modelos").select("*, marcas(id, nombre), categorias(id, nombre)").order("nombre"),
    supabase.from("marcas").select("*").order("nombre"),
    supabase.from("categorias").select("*").order("id"),
    supabase.from("unidades").select("modelo_id, estado"),
  ]);
  const ms = (modelos ?? []) as Modelo[];
  const mar = (marcas ?? []) as Marca[];
  const cat = (categorias ?? []) as Categoria[];
  const us = unidades ?? [];

  return (
    <>
      <Encabezado titulo="Modelos y marcas" descripcion="El modelo es la ficha general; cada equipo físico se registra en Inventario." />
      <div className="grid gap-6 p-4 sm:p-8 xl:grid-cols-[1fr_340px]">
        <div className="card scroll-fino overflow-x-auto">
          <table className="tabla min-w-[640px]">
            <thead><tr><th>Modelo</th><th>Marca</th><th>Categoría</th><th className="text-right">Equipos</th><th /></tr></thead>
            <tbody>
              {ms.map((m) => (
                <FilaModelo
                  key={m.id}
                  modelo={m}
                  marcas={mar}
                  categorias={cat}
                  esAdmin={esAdmin}
                  unidades={us.filter((u) => u.modelo_id === m.id).length}
                  disponibles={us.filter((u) => u.modelo_id === m.id && u.estado === "disponible").length}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-6">
          <section className="card p-5">
            <p className="mb-4 font-display text-lg font-bold">Nuevo modelo</p>
            <FormModelo marcas={mar} categorias={cat} />
          </section>
          <section className="card p-5">
            <p className="font-display text-lg font-bold">Marcas ({mar.length})</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {mar.map((m) => <span key={m.id} className="chip bg-surface-2 text-ink-2">{m.nombre}</span>)}
            </div>
            <FormSimple tipo="marca" />
          </section>
          <section className="card p-5">
            <p className="font-display text-lg font-bold">Categorías ({cat.length})</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {cat.map((c) => <span key={c.id} className="chip bg-surface-2 text-ink-2">{c.nombre}</span>)}
            </div>
            <FormSimple tipo="categoria" />
          </section>
        </div>
      </div>
    </>
  );
}
