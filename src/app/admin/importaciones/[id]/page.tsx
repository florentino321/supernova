import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { ChipEstado } from "@/components/chips";
import { requerirAdmin } from "@/lib/sesion";
import { costoUnidad } from "@/lib/calculos";
import { enDolares, enSoles } from "@/lib/formato";
import type { Lote, Unidad } from "@/lib/tipos";
import { FormLote } from "../form-lote";
import { BotonesLote } from "./botones-lote";

export default async function DetalleLote({ params }: PageProps<"/admin/importaciones/[id]">) {
  const { id } = await params;
  const { supabase, esAdmin } = await requerirAdmin();
  const [{ data: lote }, { data: unidades }] = await Promise.all([
    supabase.from("lotes").select("*").eq("id", id).maybeSingle(),
    supabase.from("unidades").select("*, modelos(nombre)").eq("lote_id", id).order("sku"),
  ]);
  if (!lote) notFound();
  const l = lote as Lote;
  const us = (unidades ?? []) as unknown as Unidad[];
  const compraUsd = us.reduce((a, u) => a + Number(u.costo_usd), 0);
  const gastos = Number(l.flete_usd) * Number(l.tipo_cambio) + Number(l.aduana_pen);
  const total = compraUsd * Number(l.tipo_cambio) + gastos;

  return (
    <>
      <header className="border-b border-line bg-surface px-4 py-6 sm:px-8">
        <Link href="/admin/importaciones" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> Importaciones</Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-mono text-3xl font-bold">{l.codigo}</h1>
            <p className="text-sm text-muted">{l.proveedor} · {l.origen}</p>
          </div>
          <BotonesLote id={l.id} esAdmin={esAdmin} vacio={us.length === 0} />
        </div>
      </header>
      <div className="space-y-6 p-4 sm:p-8">
        {esAdmin && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Compras", `${enDolares(compraUsd)}`, `${enSoles(compraUsd * Number(l.tipo_cambio))} al TC ${Number(l.tipo_cambio).toFixed(3)}`],
              ["Flete", enDolares(l.flete_usd), enSoles(Number(l.flete_usd) * Number(l.tipo_cambio))],
              ["Aduana e impuestos", enSoles(l.aduana_pen), ""],
              ["Costo total del lote", enSoles(total), us.length ? `${enSoles(total / us.length)} por equipo` : ""],
            ].map(([t, v, n]) => (
              <div key={t} className="card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t}</p>
                <p className="num mt-1 font-display text-2xl font-extrabold">{v}</p>
                <p className="text-xs text-muted">{n}</p>
              </div>
            ))}
          </div>
        )}

        <FormLote lote={l} />

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line p-4">
            <p className="font-display text-lg font-bold">Equipos de este lote ({us.length})</p>
            <Link href="/admin/inventario/nuevo" className="btn-ghost"><Plus className="size-4" /> Agregar equipo</Link>
          </div>
          <div className="scroll-fino overflow-x-auto">
            <table className="tabla min-w-[720px]">
              <thead><tr><th>Equipo</th><th>Estado</th>{esAdmin && <th className="text-right">Compra</th>}{esAdmin && <th className="text-right">Gastos asignados</th>}{esAdmin && <th className="text-right">Costo total</th>}<th className="text-right">Precio</th></tr></thead>
              <tbody>
                {us.map((u) => (
                  <tr key={u.id}>
                    <td><Link href={`/admin/inventario/${u.id}`} className="font-semibold hover:underline">{u.modelos?.nombre}</Link><span className="block font-mono text-xs text-muted">{u.sku}</span></td>
                    <td><ChipEstado estado={u.estado} /></td>
                    {esAdmin && <td className="num text-right">{enDolares(u.costo_usd)}</td>}
                    {esAdmin && <td className="num text-right text-muted">{enSoles(u.costo_extra_pen)}</td>}
                    {esAdmin && <td className="num text-right font-semibold">{enSoles(costoUnidad({ ...u, lotes: l }))}</td>}
                    <td className="num text-right">{enSoles(u.precio_oferta_pen ?? u.precio_pen)}</td>
                  </tr>
                ))}
                {us.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted">Aún no hay equipos asignados. Al registrar un equipo, elige este lote.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
