"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Calculator, Trash2 } from "lucide-react";
import { eliminarLote, prorratearLote } from "../../acciones";

export function BotonesLote({ id, esAdmin, vacio }: { id: number; esAdmin: boolean; vacio: boolean }) {
  const router = useRouter();
  const [pendiente, start] = useTransition();
  const [msg, setMsg] = useState<{ t: string; error?: boolean } | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {esAdmin && !vacio && (
        <button
          className="btn-ghost"
          disabled={pendiente}
          title="Reparte flete y aduana entre los equipos según su costo de compra"
          onClick={() =>
            start(async () => {
              const r = await prorratearLote(id);
              setMsg(r.error ? { t: r.error, error: true } : { t: r.ok ?? "" });
              router.refresh();
            })
          }
        >
          <Calculator className="size-4" /> Prorratear gastos
        </button>
      )}
      {esAdmin && vacio && (
        <button
          className="btn-danger"
          disabled={pendiente}
          onClick={() => {
            if (confirm("¿Eliminar esta importación?")) start(async () => { await eliminarLote(id); });
          }}
        >
          <Trash2 className="size-4" /> Eliminar
        </button>
      )}
      {msg && <p className={`w-full text-sm ${msg.error ? "text-red-600" : "text-green"}`}>{msg.t}</p>}
    </div>
  );
}
