"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { guardarLote, type Resultado } from "../acciones";
import type { Lote } from "@/lib/tipos";

export function FormLote({ lote, codigoSugerido }: { lote?: Lote; codigoSugerido?: string }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(guardarLote, {});
  return (
    <form action={accion} className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
      {lote && <input type="hidden" name="id" value={lote.id} />}
      <C l="Código *"><input name="codigo" required defaultValue={lote?.codigo ?? codigoSugerido} className="input font-mono" /></C>
      <C l="Proveedor *" className="lg:col-span-2"><input name="proveedor" required defaultValue={lote?.proveedor} placeholder="eBay, Amazon Renewed, subasta…" className="input" /></C>
      <C l="Estado">
        <select name="estado" defaultValue={lote?.estado ?? "comprado"} className="input">
          <option value="comprado">Comprado</option>
          <option value="en_transito">En tránsito</option>
          <option value="en_aduana">En aduana</option>
          <option value="recibido">Recibido</option>
        </select>
      </C>
      <C l="Origen"><input name="origen" defaultValue={lote?.origen ?? "Miami, FL"} className="input" /></C>
      <C l="Courier"><input name="courier" defaultValue={lote?.courier ?? ""} className="input" /></C>
      <C l="Fecha de compra *"><input type="date" name="fecha_compra" required defaultValue={lote?.fecha_compra ?? new Date().toISOString().slice(0, 10)} className="input" /></C>
      <C l="Fecha de llegada"><input type="date" name="fecha_llegada" defaultValue={lote?.fecha_llegada ?? ""} className="input" /></C>
      <C l="Flete (USD)"><input type="number" step="0.01" name="flete_usd" defaultValue={lote?.flete_usd ?? 0} className="input" /></C>
      <C l="Aduana / impuestos (S/)"><input type="number" step="0.01" name="aduana_pen" defaultValue={lote?.aduana_pen ?? 0} className="input" /></C>
      <C l="Tipo de cambio"><input type="number" step="0.001" name="tipo_cambio" defaultValue={lote?.tipo_cambio ?? 3.75} className="input" /></C>
      <C l="Notas" className="sm:col-span-2 lg:col-span-1"><input name="notas" defaultValue={lote?.notas ?? ""} className="input" /></C>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
        <button className="btn-primary" disabled={pendiente}><Save className="size-4" /> {pendiente ? "Guardando…" : lote ? "Guardar cambios" : "Crear importación"}</button>
        {estado.error && <p className="text-sm text-red-600">{estado.error}</p>}
        {estado.ok && <p className="text-sm text-green">{estado.ok}</p>}
        {lote && <p className="text-xs text-muted">Al marcarla como &quot;Recibido&quot;, los equipos en tránsito pasan a disponibles.</p>}
      </div>
    </form>
  );
}

function C({ l, className = "", children }: { l: string; className?: string; children: React.ReactNode }) {
  return <div className={className}><span className="label">{l}</span>{children}</div>;
}
