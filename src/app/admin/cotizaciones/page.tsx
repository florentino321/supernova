import Link from "next/link";
import { Plus } from "lucide-react";
import { Encabezado } from "@/components/encabezado";
import { obtenerSesion } from "@/lib/sesion";
import { enSoles, fecha } from "@/lib/formato";
import { estadoCotizacion, hoyLima, totalCotizacion } from "@/lib/cotizaciones";
import type { Cotizacion } from "@/lib/tipos";

export const metadata = { title: "Cotizaciones" };

export default async function Cotizaciones() {
  const { supabase, esAdmin } = await obtenerSesion();
  const { data } = await supabase
    .from("cotizaciones")
    .select("*, clientes(nombre, num_doc), perfiles(nombre), cotizacion_items(id, precio_pen, descuento_pen, unidades(sku, modelos(nombre)))")
    .order("fecha", { ascending: false })
    .limit(300);
  const cotizaciones = (data ?? []) as unknown as Cotizacion[];
  const hoy = hoyLima();
  const pendientes = cotizaciones.filter((c) => estadoCotizacion(c, hoy)[0] === "Pendiente");
  const cerradas = cotizaciones.filter((c) => c.estado === "aceptada");
  const validas = cotizaciones.filter((c) => c.estado !== "anulada").length;
  const conversion = validas ? cerradas.length / validas : null;

  return (
    <>
      <Encabezado titulo="Cotizaciones" descripcion="Proformas para clientes. Cuando aceptan, se convierten en venta con un clic.">
        <Link href="/admin/cotizaciones/nueva" className="btn-accent"><Plus className="size-4" /> Nueva cotización</Link>
      </Encabezado>
      <div className="space-y-5 p-4 sm:p-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="card p-4"><p className="label">Pendientes</p><p className="num font-display text-2xl font-extrabold">{pendientes.length}</p></div>
          <div className="card p-4">
            <p className="label">Monto por cerrar</p>
            <p className="num font-display text-2xl font-extrabold">{enSoles(pendientes.reduce((a, c) => a + totalCotizacion(c), 0))}</p>
          </div>
          <div className="card col-span-2 p-4 lg:col-span-1">
            <p className="label">Cotizaciones que terminan en venta</p>
            <p className="num font-display text-2xl font-extrabold">{conversion === null ? "—" : `${Math.round(conversion * 100)} %`}</p>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Equipos</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Válida hasta</th>
                {esAdmin && <th className="px-4 py-3">Vendedor</th>}
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((c) => {
                const [txt, color] = estadoCotizacion(c, hoy);
                const items = c.cotizacion_items ?? [];
                return (
                  <tr key={c.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <Link href={`/admin/cotizaciones/${c.id}`} className="font-mono text-xs font-semibold text-blue hover:underline">{c.codigo}</Link>
                      <p className="text-xs text-muted">{fecha(c.fecha)}</p>
                    </td>
                    <td className="px-4 py-3">{c.clientes?.nombre ?? "Cliente varios"}</td>
                    <td className="px-4 py-3">
                      <span className="line-clamp-2">
                        {items.map((i) => i.unidades?.modelos?.nombre).join(", ")}
                      </span>
                      {items.length > 1 && <span className="text-xs text-muted">{items.length} equipos</span>}
                    </td>
                    <td className="num px-4 py-3 text-right font-semibold">{enSoles(totalCotizacion(c))}</td>
                    <td className="px-4 py-3 text-muted">{fecha(c.valida_hasta)}</td>
                    {esAdmin && <td className="px-4 py-3 text-muted">{c.perfiles?.nombre ?? "—"}</td>}
                    <td className="px-4 py-3"><span className={`chip ${color}`}>{txt}</span></td>
                  </tr>
                );
              })}
              {cotizaciones.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">Aún no hay cotizaciones.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
