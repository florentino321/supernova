import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { obtenerSesion } from "@/lib/sesion";
import { EMPRESA } from "@/lib/empresa";
import { enSoles, enPorcentaje, etiquetaCanal, etiquetaPago, fecha, fechaHora } from "@/lib/formato";
import type { Venta } from "@/lib/tipos";
import { BotonesVenta } from "./botones-venta";

export default async function DetalleVenta({ params, searchParams }: PageProps<"/admin/ventas/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, esAdmin } = await obtenerSesion();
  const { data } = await supabase
    .from("ventas")
    .select("*, unidades(*, modelos(nombre, marcas(nombre))), clientes(*), perfiles(nombre)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const v = data as unknown as Venta;
  const u = v.unidades!;
  const util = Number(v.total_pen) - Number(v.costo_total_pen);

  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-3xl print:max-w-none">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href="/admin/ventas" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> Ventas
          </Link>
          <BotonesVenta id={v.id} anulable={esAdmin && v.estado === "completada"} />
        </div>
        {sp.nueva && (
          <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 print:hidden">
            Venta registrada. El equipo {u.sku} ya figura como vendido.
          </p>
        )}

        <article className="card relative overflow-hidden p-8 print:border-0">
          {v.estado === "anulada" && (
            <span className="absolute right-6 top-6 rotate-6 rounded-lg border-4 border-red-500 px-4 py-1 font-display text-2xl font-extrabold text-red-500">
              ANULADA
            </span>
          )}
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
            <div>
              <Logo />
              <p className="mt-3 text-sm text-muted">{EMPRESA.direccion}<br />{EMPRESA.ciudad} · {EMPRESA.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">Nota de venta</p>
              <p className="font-mono text-2xl font-bold">{v.codigo}</p>
              <p className="text-sm text-muted">{fechaHora(v.fecha)}</p>
            </div>
          </div>

          <div className="grid gap-6 border-b border-line py-6 sm:grid-cols-2">
            <div>
              <p className="label">Cliente</p>
              <p className="font-semibold">{v.clientes?.nombre ?? "Cliente varios"}</p>
              {v.clientes && (
                <p className="text-sm text-muted">
                  {v.clientes.tipo_doc} {v.clientes.num_doc ?? "—"}
                  {v.clientes.telefono && <> · {v.clientes.telefono}</>}
                  <br />{v.clientes.ciudad}
                </p>
              )}
            </div>
            <div>
              <p className="label">Pago</p>
              <p className="font-semibold">{etiquetaPago[v.metodo_pago]}</p>
              <p className="text-sm text-muted">Canal: {etiquetaCanal[v.canal]}<br />Atendió: {v.perfiles?.nombre ?? "—"}</p>
            </div>
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2">Descripción</th>
                <th className="pb-2 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-line align-top">
                <td className="py-3">
                  <p className="font-semibold">{u.modelos?.nombre}</p>
                  <p className="text-muted">
                    {u.procesador} · {u.ram_gb} GB {u.ram_tipo ?? ""} · {u.almacenamiento}
                    {u.gpu && <> · {u.gpu}</>}
                  </p>
                  <p className="text-muted">
                    Código <span className="font-mono">{u.sku}</span> · N.º de serie <span className="font-mono">{u.serie ?? "—"}</span>
                  </p>
                </td>
                <td className="num py-3 text-right">{enSoles(v.precio_lista_pen)}</td>
              </tr>
              {Number(v.descuento_pen) > 0 && (
                <tr className="border-t border-line">
                  <td className="py-2 text-muted">Descuento</td>
                  <td className="num py-2 text-right">−{enSoles(v.descuento_pen)}</td>
                </tr>
              )}
              <tr className="border-t-2 border-ink">
                <td className="py-3 font-semibold">Total</td>
                <td className="num py-3 text-right font-display text-2xl font-extrabold">{enSoles(v.total_pen)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 rounded-xl bg-surface-2 p-4 text-sm">
            <p className="font-semibold">Garantía de {u.garantia_meses} meses · válida hasta el {fecha(v.garantia_hasta)}</p>
            <p className="mt-1 text-muted">
              Cubre fallas de hardware no ocasionadas por golpes, líquidos o manipulación de terceros. Presentar esta nota de venta.
            </p>
          </div>
          {v.notas && <p className="mt-4 text-sm text-muted">Notas: {v.notas}</p>}
        </article>

        {esAdmin && (
          <div className="card mt-4 grid grid-cols-3 gap-4 p-5 text-sm print:hidden">
            <div><p className="label">Costo del equipo</p><p className="num font-semibold">{enSoles(v.costo_total_pen)}</p></div>
            <div><p className="label">Utilidad</p><p className={`num font-semibold ${util < 0 ? "text-red-600" : "text-green"}`}>{enSoles(util)}</p></div>
            <div><p className="label">Margen</p><p className="num font-semibold">{Number(v.total_pen) ? enPorcentaje(util / Number(v.total_pen)) : "—"}</p></div>
          </div>
        )}
        {esAdmin && (
          <p className="mt-3 text-center text-xs text-muted print:hidden">
            <Link href={`/admin/inventario/${u.id}`} className="hover:text-ink">Ver ficha del equipo →</Link>
          </p>
        )}
      </div>
    </div>
  );
}
