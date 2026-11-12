"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, X } from "lucide-react";
import { guardarCliente, type Resultado } from "../acciones";
import { enSoles, fecha } from "@/lib/formato";
import type { Cliente } from "@/lib/tipos";

type Fila = Cliente & { compras: number; total: number; ultima: string };

export function TablaClientes({ filas }: { filas: Fila[] }) {
  const [q, setQ] = useState("");
  const [editando, setEditando] = useState<Fila | "nuevo" | null>(null);
  const lista = useMemo(() => {
    const t = q.toLowerCase();
    return filas
      .filter((c) => !t || [c.nombre, c.num_doc, c.telefono, c.ciudad, c.email].join(" ").toLowerCase().includes(t))
      .sort((a, b) => b.total - a.total);
  }, [filas, q]);

  return (
    <div className="space-y-5 p-4 sm:p-8">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Buscar por nombre, DNI/RUC, teléfono o ciudad" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={() => setEditando("nuevo")}><Plus className="size-4" /> Nuevo cliente</button>
      </div>

      {editando && (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-lg font-bold">{editando === "nuevo" ? "Nuevo cliente" : `Editar: ${editando.nombre}`}</p>
            <button onClick={() => setEditando(null)} aria-label="Cerrar"><X className="size-5 text-muted" /></button>
          </div>
          <FormCliente key={editando === "nuevo" ? "nuevo" : editando.id} cliente={editando === "nuevo" ? undefined : editando} onListo={() => setEditando(null)} />
        </div>
      )}

      <div className="card scroll-fino overflow-x-auto">
        <table className="tabla min-w-[760px]">
          <thead><tr><th>Cliente</th><th>Contacto</th><th>Ciudad</th><th className="text-right">Compras</th><th className="text-right">Total comprado</th><th>Última compra</th><th /></tr></thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id}>
                <td className="font-semibold">{c.nombre}<span className="block text-xs font-normal text-muted">{c.tipo_doc} {c.num_doc ?? "—"}</span></td>
                <td className="text-sm">{c.telefono ?? "—"}<span className="block text-xs text-muted">{c.email}</span></td>
                <td>{c.ciudad}</td>
                <td className="num text-right">{c.compras}{c.compras > 1 && <span className="chip ml-2 bg-blue-50 text-blue-700">recurrente</span>}</td>
                <td className="num text-right font-semibold">{enSoles(c.total)}</td>
                <td className="text-sm text-muted">{c.ultima ? fecha(c.ultima) : "—"}</td>
                <td className="text-right"><button className="btn-ghost px-2.5 py-1.5" onClick={() => setEditando(c)} aria-label="Editar"><Pencil className="size-3.5" /></button></td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted">Sin resultados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormCliente({ cliente, onListo }: { cliente?: Cliente; onListo: () => void }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(guardarCliente, {});
  useEffect(() => { if (estado.ok) onListo(); }, [estado, onListo]);
  return (
    <form action={accion} className="grid gap-4 sm:grid-cols-3">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}
      <div className="sm:col-span-2"><span className="label">Nombre o razón social *</span><input name="nombre" required defaultValue={cliente?.nombre} className="input" /></div>
      <div>
        <span className="label">Documento</span>
        <div className="flex gap-2">
          <select name="tipo_doc" defaultValue={cliente?.tipo_doc ?? "DNI"} className="input w-24"><option>DNI</option><option>RUC</option><option>CE</option></select>
          <input name="num_doc" defaultValue={cliente?.num_doc ?? ""} className="input" />
        </div>
      </div>
      <div><span className="label">Teléfono</span><input name="telefono" defaultValue={cliente?.telefono ?? ""} className="input" /></div>
      <div><span className="label">Correo</span><input name="email" type="email" defaultValue={cliente?.email ?? ""} className="input" /></div>
      <div><span className="label">Ciudad</span><input name="ciudad" defaultValue={cliente?.ciudad ?? "Huánuco"} className="input" /></div>
      <div className="flex items-center gap-3 sm:col-span-3">
        <button className="btn-primary" disabled={pendiente}>{pendiente ? "Guardando…" : "Guardar"}</button>
        {estado.error && <span className="text-sm text-red-600">{estado.error}</span>}
      </div>
    </form>
  );
}
