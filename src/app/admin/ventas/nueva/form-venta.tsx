"use client";

import { useActionState, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { registrarVenta, type Resultado } from "../../acciones";
import { enSoles, etiquetaCanal, etiquetaPago } from "@/lib/formato";
import type { Canal, Cliente, MetodoPago, Unidad } from "@/lib/tipos";

export function FormVenta({ unidades, clientes, unidadInicial }: { unidades: Unidad[]; clientes: Cliente[]; unidadInicial: string }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(registrarVenta, {});
  const [unidadId, setUnidadId] = useState(unidadInicial);
  const u = unidades.find((x) => String(x.id) === unidadId);
  const [precio, setPrecio] = useState(() => (u ? Number(u.precio_oferta_pen ?? u.precio_pen) : 0));
  const [descuento, setDescuento] = useState(0);
  const [modoCliente, setModoCliente] = useState<"existente" | "nuevo">("existente");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteId, setClienteId] = useState("");

  const sugeridos = useMemo(() => {
    const t = buscaCliente.toLowerCase();
    if (!t) return [];
    return clientes.filter((c) => `${c.nombre} ${c.num_doc ?? ""}`.toLowerCase().includes(t)).slice(0, 6);
  }, [buscaCliente, clientes]);
  const cliente = clientes.find((c) => String(c.id) === clienteId);

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
              if (n) setPrecio(Number(n.precio_oferta_pen ?? n.precio_pen));
            }}
          >
            <option value="">Elige el equipo vendido…</option>
            {unidades.map((x) => (
              <option key={x.id} value={x.id}>
                {x.sku} · {x.modelos?.nombre} · {x.ram_gb} GB / {x.almacenamiento} · {enSoles(x.precio_oferta_pen ?? x.precio_pen)}
                {x.estado === "reservado" ? " (reservado)" : ""}
              </option>
            ))}
          </select>
          {u && (
            <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-ink-2">
              {u.modelos?.nombre} · {u.procesador} · Serie <span className="font-mono">{u.serie ?? "—"}</span> · Garantía {u.garantia_meses} meses
            </p>
          )}
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-bold">2. Cliente</p>
            <div className="flex rounded-xl bg-surface-2 p-1 text-sm">
              {(["existente", "nuevo"] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setModoCliente(m)}
                  className={`rounded-lg px-3 py-1 font-medium ${modoCliente === m ? "bg-surface shadow-sm" : "text-muted"}`}
                >
                  {m === "existente" ? "Registrado" : "Nuevo cliente"}
                </button>
              ))}
            </div>
          </div>
          {modoCliente === "existente" ? (
            <div className="mt-4">
              <input type="hidden" name="cliente_id" value={clienteId} />
              {cliente ? (
                <div className="flex items-center justify-between rounded-xl border border-line p-3">
                  <span>
                    <CheckCircle2 className="mr-2 inline size-4 text-green" />
                    <strong>{cliente.nombre}</strong> <span className="text-sm text-muted">· {cliente.tipo_doc} {cliente.num_doc} · {cliente.ciudad}</span>
                  </span>
                  <button type="button" className="text-sm text-blue" onClick={() => setClienteId("")}>Cambiar</button>
                </div>
              ) : (
                <>
                  <input className="input" placeholder="Busca por nombre o DNI/RUC (opcional)" value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} />
                  {sugeridos.length > 0 && (
                    <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                      {sugeridos.map((c) => (
                        <li key={c.id}>
                          <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-surface-2" onClick={() => { setClienteId(String(c.id)); setBuscaCliente(""); }}>
                            {c.nombre} <span className="text-muted">· {c.num_doc} · {c.ciudad}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-xs text-muted">Puedes dejarlo vacío para una venta rápida sin datos del cliente.</p>
                </>
              )}
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><span className="label">Nombre o razón social *</span><input name="cliente_nombre" required className="input" /></div>
              <div>
                <span className="label">Documento</span>
                <div className="flex gap-2">
                  <select name="cliente_tipo_doc" className="input w-24"><option>DNI</option><option>RUC</option><option>CE</option></select>
                  <input name="cliente_num_doc" className="input" />
                </div>
              </div>
              <div><span className="label">Teléfono</span><input name="cliente_telefono" className="input" /></div>
              <div><span className="label">Ciudad</span><input name="cliente_ciudad" defaultValue="Huánuco" className="input" /></div>
            </div>
          )}
        </section>

        <section className="card p-5">
          <p className="font-display text-lg font-bold">3. Pago</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="label">Método de pago</span>
              <select name="metodo_pago" className="input" defaultValue="yape">
                {(Object.keys(etiquetaPago) as MetodoPago[]).map((m) => <option key={m} value={m}>{etiquetaPago[m]}</option>)}
              </select>
            </div>
            <div>
              <span className="label">Canal de venta</span>
              <select name="canal" className="input" defaultValue="tienda">
                {(Object.keys(etiquetaCanal) as Canal[]).map((m) => <option key={m} value={m}>{etiquetaCanal[m]}</option>)}
              </select>
            </div>
            <div>
              <span className="label">Fecha y hora</span>
              <input type="datetime-local" name="fecha" className="input" />
              <p className="mt-1 text-xs text-muted">Vacío = ahora</p>
            </div>
            <div className="sm:col-span-2"><span className="label">Notas</span><textarea name="notas" rows={2} className="input" /></div>
          </div>
        </section>
      </div>

      <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="card p-5">
          <p className="font-display text-lg font-bold">Resumen</p>
          <div className="mt-4 space-y-4">
            <div><span className="label">Precio (S/)</span><input name="precio_lista_pen" type="number" step="0.01" required value={precio || ""} onChange={(e) => setPrecio(Number(e.target.value))} className="input text-lg font-semibold" /></div>
            <div><span className="label">Descuento (S/)</span><input name="descuento_pen" type="number" step="0.01" min={0} value={descuento || ""} onChange={(e) => setDescuento(Number(e.target.value))} className="input" /></div>
            <div className="flex items-end justify-between border-t border-line pt-4">
              <span className="text-muted">Total a cobrar</span>
              <span className="num font-display text-3xl font-extrabold">{enSoles(Math.max(0, precio - descuento))}</span>
            </div>
          </div>
        </div>
        {estado.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{estado.error}</p>}
        <button className="btn-accent w-full py-3 text-base" disabled={pendiente || !unidadId}>
          {pendiente ? "Registrando…" : "Registrar venta"}
        </button>
      </div>
    </form>
  );
}
