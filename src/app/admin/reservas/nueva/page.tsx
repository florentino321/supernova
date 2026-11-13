import Link from "next/link";
import { Encabezado } from "@/components/encabezado";
import { obtenerSesion } from "@/lib/sesion";
import type { Cliente, Unidad } from "@/lib/tipos";
import { FormReserva } from "./form-reserva";

export const metadata = { title: "Nueva reserva" };

export default async function NuevaReserva({ searchParams }: PageProps<"/admin/reservas/nueva">) {
  const sp = await searchParams;
  const { supabase } = await obtenerSesion();
  const [{ data: unidades }, { data: clientes }] = await Promise.all([
    supabase
      .from("unidades")
      .select("id, sku, procesador, ram_gb, almacenamiento, precio_pen, precio_oferta_pen, estado, modelos(nombre)")
      .in("estado", ["disponible", "en_transito"])
      .order("sku"),
    supabase.from("clientes").select("id, nombre, num_doc, tipo_doc, telefono, ciudad").order("nombre"),
  ]);
  return (
    <>
      <Encabezado titulo="Nueva reserva" descripcion="Mientras esté vigente, el equipo figura como Reservado en la web.">
        <Link href="/admin/reservas" className="btn-ghost">Cancelar</Link>
      </Encabezado>
      <div className="p-4 sm:p-8">
        <FormReserva
          unidades={(unidades ?? []) as unknown as Unidad[]}
          clientes={(clientes ?? []) as Cliente[]}
          unidadInicial={typeof sp.unidad === "string" ? sp.unidad : ""}
        />
      </div>
    </>
  );
}
