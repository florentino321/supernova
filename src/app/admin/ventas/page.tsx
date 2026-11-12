import Link from "next/link";
import { Plus } from "lucide-react";
import { Encabezado } from "@/components/encabezado";
import { obtenerSesion } from "@/lib/sesion";
import type { Venta } from "@/lib/tipos";
import { TablaVentas } from "./tabla-ventas";

export const metadata = { title: "Ventas" };

export default async function Ventas({ searchParams }: PageProps<"/admin/ventas">) {
  const sp = await searchParams;
  const { supabase, esAdmin, perfil } = await obtenerSesion();
  // RLS: el vendedor solo recibe sus propias ventas
  const { data } = await supabase
    .from("ventas")
    .select("*, unidades(id, sku, procesador, ram_gb, almacenamiento, modelos(nombre, marcas(nombre))), clientes(id, nombre, num_doc, ciudad), perfiles(nombre, usuario)")
    .order("fecha", { ascending: false });
  return (
    <>
      <Encabezado
        titulo={esAdmin ? "Ventas" : "Mis ventas"}
        descripcion={
          esAdmin
            ? "Historial completo de ventas con su utilidad real por equipo."
            : `Ventas registradas por ${perfil.nombre}.`
        }
      >
        <Link href="/admin/ventas/nueva" className="btn-accent">
          <Plus className="size-4" /> Nueva venta
        </Link>
      </Encabezado>
      {sp["sin-permiso"] && (
        <p className="mx-4 mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:mx-8">
          Esa sección es solo para el administrador. Como vendedor puedes registrar ventas y consultar las tuyas.
        </p>
      )}
      <TablaVentas ventas={(data ?? []) as unknown as Venta[]} esAdmin={esAdmin} />
    </>
  );
}
