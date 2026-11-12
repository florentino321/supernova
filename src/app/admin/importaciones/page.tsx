import Link from "next/link";
import { Encabezado } from "@/components/encabezado";
import { requerirAdmin } from "@/lib/sesion";
import { costoUnidad } from "@/lib/calculos";
import { enDolares, enSoles, etiquetaLote, fecha } from "@/lib/formato";
import type { Lote, Unidad } from "@/lib/tipos";
import { FormLote } from "./form-lote";

export const metadata = { title: "Importaciones" };

const colorLote = {
  comprado: "bg-slate-100 text-slate-700",
  en_transito: "bg-violet-50 text-violet-700",
  en_aduana: "bg-amber-50 text-amber-800",
  recibido: "bg-emerald-50 text-emerald-700",
};

export default async function Importaciones() {
  const { supabase, esAdmin } = await requerirAdmin();
  const [{ data: lotes }, { data: unidades }, { data: ventas }] = await Promise.all([
    supabase.from("lotes").select("*").order("fecha_compra", { ascending: false }),
    supabase.from("unidades").select("id, lote_id, estado, costo_usd, costo_extra_pen, precio_pen, precio_oferta_pen"),
    supabase.from("ventas").select("unidad_id, total_pen, costo_total_pen").eq("estado", "completada"),
  ]);
  const ls = (lotes ?? []) as Lote[];
  const us = (unidades ?? []) as Unidad[];
  const ventaPorUnidad = new Map((ventas ?? []).map((v) => [v.unidad_id, v]));
  const hoy = new Date();
  const codigoSugerido = `IMP-${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}${ls.some((l) => l.codigo === `IMP-${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`) ? "-B" : ""}`;

  return (
    <>
      <Encabezado titulo="Importaciones" descripcion="Cada lote comprado en EE.UU. con sus costos de flete, aduana y tipo de cambio." />
      <div className="space-y-6 p-4 sm:p-8">
        <details className="group">
          <summary className="btn-primary w-fit cursor-pointer list-none">+ Nueva importación</summary>
          <div className="mt-4"><FormLote codigoSugerido={codigoSugerido} /></div>
        </details>

        <div className="card scroll-fino overflow-x-auto">
          <table className="tabla min-w-[900px]">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Proveedor</th>
                <th>Fechas</th>
                <th>Estado</th>
                <th className="text-right">Equipos</th>
                {esAdmin && <th className="text-right">Inversión</th>}
                {esAdmin && <th className="text-right">Recuperado</th>}
              </tr>
            </thead>
            <tbody>
              {ls.map((l) => {
                const delLote = us.filter((u) => u.lote_id === l.id);
                const vendidos = delLote.filter((u) => u.estado === "vendido");
                const inversion = delLote.reduce((a, u) => a + costoUnidad({ ...u, lotes: l }), 0);
                const compraUsd = delLote.reduce((a, u) => a + Number(u.costo_usd), 0);
                const recuperado = vendidos.reduce((a, u) => a + Number(ventaPorUnidad.get(u.id)?.total_pen ?? 0), 0);
                const pct = inversion ? Math.min(1, recuperado / inversion) : 0;
                return (
                  <tr key={l.id}>
                    <td><Link href={`/admin/importaciones/${l.id}`} className="font-mono font-semibold text-blue hover:underline">{l.codigo}</Link></td>
                    <td>{l.proveedor}<span className="block text-xs text-muted">{l.courier ?? "—"} · TC {Number(l.tipo_cambio).toFixed(3)}</span></td>
                    <td className="text-sm">{fecha(l.fecha_compra)}<span className="block text-xs text-muted">Llegó: {fecha(l.fecha_llegada)}</span></td>
                    <td><span className={`chip ${colorLote[l.estado]}`}>{etiquetaLote[l.estado]}</span></td>
                    <td className="num text-right">{delLote.length}<span className="block text-xs text-muted">{vendidos.length} vendidos</span></td>
                    {esAdmin && <td className="num text-right font-semibold">{enSoles(inversion)}<span className="block text-xs font-normal text-muted">{enDolares(compraUsd)} en compras</span></td>}
                    {esAdmin && (
                      <td className="w-48 text-right">
                        <span className="num text-sm font-semibold">{enSoles(recuperado)}</span>
                        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <span className={`block h-full rounded-full ${recuperado >= inversion && inversion > 0 ? "bg-green" : "bg-blue"}`} style={{ width: `${pct * 100}%` }} />
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
