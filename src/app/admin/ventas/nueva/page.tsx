import Link from "next/link";
import { Encabezado } from "@/components/encabezado";
import { obtenerSesion } from "@/lib/sesion";
import type { Cliente, Unidad } from "@/lib/tipos";
import { FormVenta } from "./form-venta";

export const metadata = { title: "Nueva venta" };

export default async function NuevaVenta({ searchParams }: PageProps<"/admin/ventas/nueva">) {
  const sp = await searchParams;
  const { supabase } = await obtenerSesion();
  const [{ data: unidades }, { data: clientes }] = await Promise.all([
    supabase
      .from("unidades")
      .select("id, sku, serie, procesador, ram_gb, almacenamiento, precio_pen, precio_oferta_pen, estado, garantia_meses, modelos(nombre, marcas(nombre))")
      .in("estado", ["disponible", "reservado"])
      .order("sku"),
    supabase.from("clientes").select("id, nombre, num_doc, tipo_doc, telefono, ciudad").order("nombre"),
  ]);
  return (
    <>
      <Encabezado titulo="Nueva venta" descripcion="Al registrarla, el equipo pasa a 'Vendido' y se calcula la garantía automáticamente.">
        <Link href="/admin/ventas" className="btn-ghost">Cancelar</Link>
      </Encabezado>
      <div className="p-4 sm:p-8">
        <FormVenta
          unidades={(unidades ?? []) as unknown as Unidad[]}
          clientes={(clientes ?? []) as Cliente[]}
          unidadInicial={typeof sp.unidad === "string" ? sp.unidad : ""}
        />
      </div>
    </>
  );
}
