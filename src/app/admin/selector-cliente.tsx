"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Cliente } from "@/lib/tipos";

/**
 * Elegir un cliente registrado o escribir uno nuevo. Envía en el formulario:
 * cliente_id, o bien cliente_nombre / cliente_tipo_doc / cliente_num_doc / cliente_telefono / cliente_ciudad.
 */
export function SelectorCliente({
  clientes,
  inicial = "",
  obligatorio = false,
}: {
  clientes: Pick<Cliente, "id" | "nombre" | "num_doc" | "tipo_doc" | "telefono" | "ciudad">[];
  inicial?: string;
  obligatorio?: boolean;
}) {
  const [modo, setModo] = useState<"existente" | "nuevo">("existente");
  const [busca, setBusca] = useState("");
  const [clienteId, setClienteId] = useState(inicial);
  const sugeridos = useMemo(() => {
    const t = busca.toLowerCase();
    if (!t) return [];
    return clientes.filter((c) => `${c.nombre} ${c.num_doc ?? ""} ${c.telefono ?? ""}`.toLowerCase().includes(t)).slice(0, 6);
  }, [busca, clientes]);
  const cliente = clientes.find((c) => String(c.id) === clienteId);

  return (
    <div>
      <div className="flex w-fit rounded-xl bg-surface-2 p-1 text-sm">
        {(["existente", "nuevo"] as const).map((m) => (
          <button
            type="button"
            key={m}
            onClick={() => setModo(m)}
            className={`rounded-lg px-3 py-1 font-medium ${modo === m ? "bg-surface shadow-sm" : "text-muted"}`}
          >
            {m === "existente" ? "Registrado" : "Nuevo cliente"}
          </button>
        ))}
      </div>
      {modo === "existente" ? (
        <div className="mt-3">
          <input type="hidden" name="cliente_id" value={clienteId} />
          {cliente ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
              <span className="min-w-0">
                <CheckCircle2 className="mr-2 inline size-4 text-green" />
                <strong>{cliente.nombre}</strong>{" "}
                <span className="text-sm text-muted">· {cliente.tipo_doc} {cliente.num_doc ?? "—"}{cliente.telefono ? ` · ${cliente.telefono}` : ""}</span>
              </span>
              <button type="button" className="shrink-0 text-sm text-blue" onClick={() => setClienteId("")}>Cambiar</button>
            </div>
          ) : (
            <>
              <input
                className="input"
                placeholder="Busca por nombre, DNI/RUC o teléfono"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                required={obligatorio && !clienteId}
              />
              {sugeridos.length > 0 && (
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                  {sugeridos.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-surface-2"
                        onClick={() => { setClienteId(String(c.id)); setBusca(""); }}
                      >
                        {c.nombre} <span className="text-muted">· {c.num_doc ?? "s/d"} · {c.telefono ?? c.ciudad ?? ""}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {busca && sugeridos.length === 0 && (
                <p className="mt-2 text-xs text-muted">
                  No hay coincidencias.{" "}
                  <button type="button" className="text-blue" onClick={() => setModo("nuevo")}>Registrar como nuevo</button>
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><span className="label">Nombre o razón social *</span><input name="cliente_nombre" required className="input" /></div>
          <div>
            <span className="label">Documento</span>
            <div className="flex gap-2">
              <select name="cliente_tipo_doc" className="input w-24"><option>DNI</option><option>RUC</option><option>CE</option></select>
              <input name="cliente_num_doc" inputMode="numeric" className="input" />
            </div>
          </div>
          <div><span className="label">Teléfono / WhatsApp</span><input name="cliente_telefono" inputMode="tel" className="input" /></div>
          <div><span className="label">Ciudad</span><input name="cliente_ciudad" defaultValue="Huánuco" className="input" /></div>
        </div>
      )}
    </div>
  );
}
