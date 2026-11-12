"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { enSoles, enPorcentaje, etiquetaCanal, etiquetaPago, fecha } from "@/lib/formato";
import type { Canal, MetodoPago, Venta } from "@/lib/tipos";

export function TablaVentas({ ventas, esAdmin }: { ventas: Venta[]; esAdmin: boolean }) {
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [canal, setCanal] = useState("");
  const [pago, setPago] = useState("");
  const [verAnuladas, setVerAnuladas] = useState(false);
  const [vendedor, setVendedor] = useState("");
  const vendedores = [...new Set(ventas.map((v) => v.perfiles?.nombre).filter(Boolean))] as string[];

  const filas = useMemo(() => {
    const t = q.toLowerCase();
    return ventas.filter((v) => {
      if (!verAnuladas && v.estado === "anulada") return false;
      const d = v.fecha.slice(0, 10);
      if (desde && d < desde) return false;
      if (hasta && d > hasta) return false;
      if (canal && v.canal !== canal) return false;
      if (pago && v.metodo_pago !== pago) return false;
      if (vendedor && v.perfiles?.nombre !== vendedor) return false;
      if (t) {
        const s = [v.codigo, v.unidades?.sku, v.unidades?.modelos?.nombre, v.clientes?.nombre, v.clientes?.num_doc].join(" ").toLowerCase();
        if (!s.includes(t)) return false;
      }
      return true;
    });
  }, [ventas, q, desde, hasta, canal, pago, verAnuladas, vendedor]);

  const validas = filas.filter((v) => v.estado === "completada");
  const ingresos = validas.reduce((a, v) => a + Number(v.total_pen), 0);
  const costo = validas.reduce((a, v) => a + Number(v.costo_total_pen), 0);
  const ticket = validas.length ? ingresos / validas.length : 0;

  const exportar = () => {
    const cab = ["Código", "Fecha", "Equipo", "SKU", "Cliente", "Documento", "Vendedor", "Canal", "Pago", "Precio lista", "Descuento", "Total", ...(esAdmin ? ["Costo", "Utilidad"] : []), "Estado"];
    const rows = filas.map((v) => [
      v.codigo, v.fecha.slice(0, 10), v.unidades?.modelos?.nombre, v.unidades?.sku, v.clientes?.nombre, v.clientes?.num_doc, v.perfiles?.nombre,
      etiquetaCanal[v.canal], etiquetaPago[v.metodo_pago], v.precio_lista_pen, v.descuento_pen, v.total_pen,
      ...(esAdmin ? [v.costo_total_pen, (Number(v.total_pen) - Number(v.costo_total_pen)).toFixed(2)] : []), v.estado,
    ]);
    const csv = [cab, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `ventas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5 p-4 sm:p-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi t="Ventas" v={String(validas.length)} />
        <Kpi t="Ingresos" v={enSoles(ingresos)} />
        {esAdmin ? <Kpi t="Utilidad bruta" v={enSoles(ingresos - costo)} n={ingresos ? `Margen ${enPorcentaje((ingresos - costo) / ingresos)}` : ""} /> : <Kpi t="Descuentos" v={enSoles(validas.reduce((a, v) => a + Number(v.descuento_pen), 0))} />}
        <Kpi t="Ticket promedio" v={enSoles(ticket)} />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-end gap-2 border-b border-line p-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Buscar por código, equipo, cliente, DNI…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <label className="text-xs text-muted">Desde<input type="date" className="input mt-1 w-auto" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
          <label className="text-xs text-muted">Hasta<input type="date" className="input mt-1 w-auto" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
          <select className="input w-auto" value={canal} onChange={(e) => setCanal(e.target.value)}>
            <option value="">Todos los canales</option>
            {(Object.keys(etiquetaCanal) as Canal[]).map((c) => <option key={c} value={c}>{etiquetaCanal[c]}</option>)}
          </select>
          <select className="input w-auto" value={pago} onChange={(e) => setPago(e.target.value)}>
            <option value="">Todos los pagos</option>
            {(Object.keys(etiquetaPago) as MetodoPago[]).map((c) => <option key={c} value={c}>{etiquetaPago[c]}</option>)}
          </select>
          {esAdmin && vendedores.length > 1 && (
            <select className="input w-auto" value={vendedor} onChange={(e) => setVendedor(e.target.value)}>
              <option value="">Todos los vendedores</option>
              {vendedores.map((n) => <option key={n}>{n}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 px-2 py-2.5 text-sm">
            <input type="checkbox" checked={verAnuladas} onChange={(e) => setVerAnuladas(e.target.checked)} /> Ver anuladas
          </label>
          <button className="btn-ghost" onClick={exportar}><Download className="size-4" /> CSV</button>
        </div>
        <div className="scroll-fino overflow-x-auto">
          <table className="tabla min-w-[900px]">
            <thead>
              <tr>
                <th>Venta</th>
                <th>Equipo</th>
                <th>Cliente</th>
                <th>Canal / pago</th>
                {esAdmin && <th>Vendedor</th>}
                <th className="text-right">Total</th>
                {esAdmin && <th className="text-right">Utilidad</th>}
              </tr>
            </thead>
            <tbody>
              {filas.map((v) => {
                const util = Number(v.total_pen) - Number(v.costo_total_pen);
                return (
                  <tr key={v.id} className={v.estado === "anulada" ? "opacity-50" : ""}>
                    <td>
                      <Link href={`/admin/ventas/${v.id}`} className="font-mono font-semibold text-blue hover:underline">{v.codigo}</Link>
                      <span className="block text-xs text-muted">{fecha(v.fecha)}</span>
                    </td>
                    <td>
                      <span className="font-semibold">{v.unidades?.modelos?.nombre}</span>
                      <span className="block text-xs text-muted"><span className="font-mono">{v.unidades?.sku}</span> · {v.unidades?.ram_gb} GB · {v.unidades?.almacenamiento}</span>
                    </td>
                    <td>
                      {v.clientes?.nombre ?? <span className="text-muted">—</span>}
                      <span className="block text-xs text-muted">{v.clientes?.ciudad}</span>
                    </td>
                    <td>
                      {etiquetaCanal[v.canal]}
                      <span className="block text-xs text-muted">{etiquetaPago[v.metodo_pago]}</span>
                    </td>
                    {esAdmin && <td className="text-sm">{v.perfiles?.nombre ?? "—"}</td>}
                    <td className="num text-right font-semibold">
                      {enSoles(v.total_pen)}
                      {Number(v.descuento_pen) > 0 && <span className="block text-xs font-normal text-muted">−{enSoles(v.descuento_pen)} dscto.</span>}
                      {v.estado === "anulada" && <span className="block text-xs font-normal text-red-600">Anulada</span>}
                    </td>
                    {esAdmin && (
                      <td className="num text-right">
                        <span className={`font-semibold ${util < 0 ? "text-red-600" : "text-green"}`}>{enSoles(util)}</span>
                        <span className="block text-xs text-muted">{Number(v.total_pen) ? enPorcentaje(util / Number(v.total_pen)) : ""}</span>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filas.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-muted">No hay ventas con esos filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ t, v, n }: { t: string; v: string; n?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t}</p>
      <p className="num mt-1 font-display text-2xl font-extrabold">{v}</p>
      {n && <p className="text-xs text-muted">{n}</p>}
    </div>
  );
}
