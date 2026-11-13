"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { crearCotizacion, type Resultado } from "../../comercial";
import { SelectorCliente } from "../../selector-cliente";
import { enSoles } from "@/lib/formato";
import type { Cliente, Unidad } from "@/lib/tipos";

const enDias = (n: number) => new Date(Date.now() - 5 * 3600_000 + n * 86_400_000).toISOString().slice(0, 10);
const precioDe = (x?: Unidad) => (x ? Number(x.precio_oferta_pen ?? x.precio_pen) : 0);

type Fila = { clave: number; unidadId: string; precio: number; descuento: number };

export function FormCotizacion({ unidades, clientes, unidadInicial }: { unidades: Unidad[]; clientes: Cliente[]; unidadInicial: string }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(crearCotizacion, {});
  const inicial = unidades.find((u) => String(u.id) === unidadInicial);
  const [filas, setFilas] = useState<Fila[]>([{ clave: 1, unidadId: unidadInicial, precio: precioDe(inicial), descuento: 0 }]);

  const cambiar = (clave: number, cambios: Partial<Fila>) => setFilas((fs) => fs.map((f) => (f.clave === clave ? { ...f, ...cambios } : f)));
  const elegidas = new Set(filas.map((f) => f.unidadId));
  const subtotal = filas.reduce((a, f) => a + (f.unidadId ? f.precio : 0), 0);
  const descuentos = filas.reduce((a, f) => a + (f.unidadId ? f.descuento : 0), 0);

  return (
    <form action={accion} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="card p-5">
          <p className="font-display text-lg font-bold">1. Cliente</p>
          <div className="mt-4">
            <SelectorCliente clientes={clientes} />
          </div>
          <p className="mt-2 text-xs text-muted">Opcional: sin cliente, la proforma sale a nombre de &quot;Cliente varios&quot;.</p>
        </section>

        <section className="card p-5">
          <p className="font-display text-lg font-bold">2. Equipos</p>
          <ul className="mt-4 space-y-3">
            {filas.map((f, i) => (
              <li key={f.clave} className="rounded-xl border border-line p-3">
                <div className="flex gap-2">
                  <select
                    name="item_unidad"
                    required
                    className="input"
                    value={f.unidadId}
                    onChange={(e) => {
                      const u = unidades.find((x) => String(x.id) === e.target.value);
                      cambiar(f.clave, { unidadId: e.target.value, precio: precioDe(u), descuento: 0 });
                    }}
                  >
                    <option value="">Elige un equipo…</option>
                    {unidades.map((x) => (
                      <option key={x.id} value={x.id} disabled={elegidas.has(String(x.id)) && String(x.id) !== f.unidadId}>
                        {x.sku} · {x.modelos?.nombre} · {x.ram_gb} GB / {x.almacenamiento} · {enSoles(precioDe(x))}
                        {x.estado === "en_transito" ? " (en camino)" : ""}
                      </option>
                    ))}
                  </select>
                  {filas.length > 1 && (
                    <button type="button" className="btn-ghost px-3 text-red-600" onClick={() => setFilas((fs) => fs.filter((x) => x.clave !== f.clave))} aria-label={`Quitar equipo ${i + 1}`}>
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label>
                    <span className="label">Precio (S/)</span>
                    <input name="item_precio" type="number" step="0.01" inputMode="decimal" required className="input" value={f.precio || ""} onChange={(e) => cambiar(f.clave, { precio: Number(e.target.value) })} />
                  </label>
                  <label>
                    <span className="label">Descuento (S/)</span>
                    <input name="item_descuento" type="number" step="0.01" inputMode="decimal" min={0} className="input" value={f.descuento || ""} onChange={(e) => cambiar(f.clave, { descuento: Number(e.target.value) })} />
                  </label>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-ghost mt-3"
            onClick={() => setFilas((fs) => [...fs, { clave: Math.max(...fs.map((x) => x.clave)) + 1, unidadId: "", precio: 0, descuento: 0 }])}
          >
            <Plus className="size-4" /> Agregar otro equipo
          </button>
        </section>

        <section className="card p-5">
          <p className="font-display text-lg font-bold">3. Condiciones</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="label">Válida hasta</span>
              <input type="date" name="valida_hasta" required defaultValue={enDias(3)} min={enDias(0)} className="input" />
              <p className="mt-1 text-xs text-muted">Como cada equipo es único, conviene una vigencia corta.</p>
            </div>
            <div className="sm:col-span-2">
              <span className="label">Notas para el cliente</span>
              <textarea name="notas" rows={2} className="input" placeholder="Ej.: incluye mochila de regalo; envío a Lima por cuenta del cliente…" />
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="card space-y-3 p-5">
          <p className="font-display text-lg font-bold">Resumen</p>
          <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span className="num">{enSoles(subtotal)}</span></div>
          {descuentos > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Descuentos</span><span className="num">−{enSoles(descuentos)}</span></div>}
          <div className="flex items-end justify-between border-t border-line pt-3">
            <span className="text-muted">Total</span>
            <span className="num font-display text-3xl font-extrabold">{enSoles(subtotal - descuentos)}</span>
          </div>
        </div>
        {estado.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{estado.error}</p>}
        <button className="btn-accent w-full py-3 text-base" disabled={pendiente || !filas.some((f) => f.unidadId)}>
          {pendiente ? "Guardando…" : "Crear cotización"}
        </button>
      </div>
    </form>
  );
}
