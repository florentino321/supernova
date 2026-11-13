"use client";

import { useActionState, useState } from "react";
import { crearReserva, type Resultado } from "../../comercial";
import { SelectorCliente } from "../../selector-cliente";
import { RESERVA, adelantoSugerido } from "@/lib/empresa";
import { enSoles, etiquetaPago } from "@/lib/formato";
import type { Cliente, MetodoPago, Unidad } from "@/lib/tipos";

/** Fecha de Perú dentro de n días (AAAA-MM-DD). */
const enDias = (n: number) => new Date(Date.now() - 5 * 3600_000 + n * 86_400_000).toISOString().slice(0, 10);
const precioDe = (x?: Unidad) => (x ? Number(x.precio_oferta_pen ?? x.precio_pen) : 0);

export function FormReserva({ unidades, clientes, unidadInicial }: { unidades: Unidad[]; clientes: Cliente[]; unidadInicial: string }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(crearReserva, {});
  const [unidadId, setUnidadId] = useState(unidadInicial);
  const u = unidades.find((x) => String(x.id) === unidadId);
  const [precio, setPrecio] = useState(() => precioDe(u));
  const [adelanto, setAdelanto] = useState(() => (u ? adelantoSugerido(precioDe(u)) : 0));

  return (
    <form action={accion} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="card p-5">
          <p className="font-display text-lg font-bold">1. Equipo</p>
          <select
            name="unidad_id"
            required
            className="input mt-4"
            value={unidadId}
            onChange={(e) => {
              setUnidadId(e.target.value);
              const n = unidades.find((x) => String(x.id) === e.target.value);
              setPrecio(precioDe(n));
              setAdelanto(n ? adelantoSugerido(precioDe(n)) : 0);
            }}
          >
            <option value="">Elige el equipo que se separa…</option>
            {unidades.map((x) => (
              <option key={x.id} value={x.id}>
                {x.sku} · {x.modelos?.nombre} · {x.ram_gb} GB / {x.almacenamiento} · {enSoles(precioDe(x))}
                {x.estado === "en_transito" ? " (en camino)" : ""}
              </option>
            ))}
          </select>
          {unidades.length === 0 && <p className="mt-2 text-sm text-muted">No hay equipos disponibles o en camino para reservar.</p>}
        </section>

        <section className="card p-5">
          <p className="font-display text-lg font-bold">2. Cliente</p>
          <div className="mt-4">
            <SelectorCliente clientes={clientes} obligatorio />
          </div>
        </section>

        <section className="card p-5">
          <p className="font-display text-lg font-bold">3. Adelanto</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="label">Método de pago del adelanto</span>
              <select name="metodo_pago" className="input" defaultValue="yape">
                {(Object.keys(etiquetaPago) as MetodoPago[]).map((m) => <option key={m} value={m}>{etiquetaPago[m]}</option>)}
              </select>
            </div>
            <div>
              <span className="label">Se guarda hasta</span>
              <input type="date" name="vence_en" required defaultValue={enDias(RESERVA.dias)} min={enDias(0)} className="input" />
              <p className="mt-1 text-xs text-muted">Por defecto {RESERVA.dias} días. Si vence, el equipo se libera solo.</p>
            </div>
            <div className="sm:col-span-2">
              <span className="label">Notas</span>
              <textarea name="notas" rows={2} className="input" placeholder="Ej.: recoge el sábado, N.º de operación Yape…" />
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="card p-5">
          <p className="font-display text-lg font-bold">Resumen</p>
          <div className="mt-4 space-y-4">
            <div>
              <span className="label">Precio acordado (S/)</span>
              <input name="precio_acordado_pen" type="number" step="0.01" inputMode="decimal" required value={precio || ""} onChange={(e) => setPrecio(Number(e.target.value))} className="input text-lg font-semibold" />
            </div>
            <div>
              <span className="label">Adelanto (S/)</span>
              <input name="adelanto_pen" type="number" step="0.01" inputMode="decimal" min={1} required value={adelanto || ""} onChange={(e) => setAdelanto(Number(e.target.value))} className="input" />
              {precio > 0 && <p className="mt-1 text-xs text-muted">Sugerido: {enSoles(adelantoSugerido(precio))}</p>}
            </div>
            <div className="flex items-end justify-between border-t border-line pt-4">
              <span className="text-muted">Saldo al recoger</span>
              <span className="num font-display text-3xl font-extrabold">{enSoles(Math.max(0, precio - adelanto))}</span>
            </div>
          </div>
        </div>
        {estado.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{estado.error}</p>}
        <button className="btn-accent w-full py-3 text-base" disabled={pendiente || !unidadId}>
          {pendiente ? "Guardando…" : "Registrar reserva"}
        </button>
      </div>
    </form>
  );
}
