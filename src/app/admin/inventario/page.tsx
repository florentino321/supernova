import Link from "next/link";
import { Plus } from "lucide-react";
import { Encabezado } from "@/components/encabezado";
import { requerirAdmin } from "@/lib/sesion";
import type { Categoria, Marca, Unidad } from "@/lib/tipos";
import { TablaInventario } from "./tabla-inventario";

export const metadata = { title: "Inventario" };

export default async function Inventario({ searchParams }: PageProps<"/admin/inventario">) {
  const { supabase, esAdmin } = await requerirAdmin();
  const sp = await searchParams;
  const [{ data: unidades }, { data: marcas }, { data: categorias }] = await Promise.all([
    supabase
      .from("unidades")
      .select(
        "*, modelos(id, nombre, slug, marcas(id, nombre, slug), categorias(id, nombre, slug)), lotes(id, codigo, tipo_cambio), medios(id, url, tipo, es_portada, posicion)",
      )
      .order("creado_en", { ascending: false }),
    supabase.from("marcas").select("*").order("nombre"),
    supabase.from("categorias").select("*").order("id"),
  ]);

  return (
    <>
      <Encabezado
        titulo="Inventario"
        descripcion="Cada fila es un equipo físico único con su propio número de serie."
      >
        <Link href="/admin/inventario/nuevo" className="btn-primary">
          <Plus className="size-4" /> Registrar equipo
        </Link>
      </Encabezado>
      {sp.eliminado && (
        <p className="mx-4 mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:mx-8">Equipo eliminado.</p>
      )}
      <TablaInventario
        unidades={(unidades ?? []) as unknown as Unidad[]}
        marcas={(marcas ?? []) as Marca[]}
        categorias={(categorias ?? []) as Categoria[]}
        esAdmin={esAdmin}
        estadoInicial={typeof sp.estado === "string" ? sp.estado : ""}
      />
    </>
  );
}
