"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, MessageCircle, X } from "lucide-react";
import { marcarAviso } from "../comercial";
import { enSoles, fechaHora } from "@/lib/formato";
import type { Aviso, EstadoAviso } from "@/lib/tipos";

const etiqueta: Record<string, [string, string]> = {
  disponible: ["Ya llegó: en tienda", "bg-emerald-50 text-emerald-700"],
  en_transito: ["Aún en camino", "bg-violet-100 text-violet-700"],
  reservado: ["Sigue reservado", "bg-amber-100 text-amber-800"],
  vendido: ["Vendido: ofrecer similar", "bg-slate-100 text-slate-600"],
};

export function ListaAvisos({ avisos }: { avisos: Aviso[] }) {
  const router = useRouter();
  const [pendiente, start] = useTransition();
  const marcar = (id: number, estado: EstadoAviso) =>
    start(async () => {
      const r = await marcarAviso(id, estado);
      if (r.error) alert(r.error);
      router.refresh();
    });

  if (avisos.length === 0) {
    return (
      <p className="card p-10 text-center text-sm text-muted">
        No hay interesados pendientes. Cuando alguien toque &quot;Avísame&quot; en un equipo de la web, aparecerá aquí.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {avisos.map((a) => {
        const u = a.unidades;
        const nombre = u?.modelos?.nombre ?? "un equipo";
        const [txtEstado, color] = etiqueta[u?.estado ?? ""] ?? ["", ""];
        const mensaje =
          u?.estado === "disponible"
            ? `Hola ${a.nombre.split(" ")[0]}, te escribimos de Laptops Americanas: la ${nombre} que esperabas ya está en tienda a ${enSoles(u.precio_oferta_pen ?? u.precio_pen)}. ¿Quieres verla o separarla?`
            : u?.estado === "vendido"
              ? `Hola ${a.nombre.split(" ")[0]}, te escribimos de Laptops Americanas: la ${nombre} ya se vendió, pero tenemos equipos similares. ¿Te paso opciones?`
              : `Hola ${a.nombre.split(" ")[0]}, te escribimos de Laptops Americanas sobre la ${nombre}.`;
        return (
          <li key={a.id} className={`card flex flex-col p-5 ${a.estado !== "pendiente" ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{a.nombre}</p>
                <p className="font-mono text-sm text-muted">+{a.telefono}</p>
              </div>
              {a.estado !== "pendiente" ? (
                <span className="chip bg-slate-100 text-slate-600">{a.estado === "contactado" ? "Contactado" : "Descartado"}</span>
              ) : (
                txtEstado && <span className={`chip shrink-0 ${color}`}>{txtEstado}</span>
              )}
            </div>
            {u ? (
              <Link href={`/equipo/${u.slug}`} target="_blank" className="mt-3 block truncate text-sm text-blue hover:underline">
                {nombre} <span className="font-mono text-xs text-muted">{u.sku}</span>
              </Link>
            ) : (
              <p className="mt-3 text-sm text-muted">Equipo eliminado del inventario</p>
            )}
            {a.mensaje && <p className="mt-2 text-sm text-ink-2">“{a.mensaje}”</p>}
            <p className="mt-2 text-xs text-muted">{fechaHora(a.creado_en)}</p>
            {a.estado === "pendiente" && (
              <div className="mt-auto flex gap-2 pt-4">
                <a
                  href={`https://wa.me/${a.telefono}?text=${encodeURIComponent(mensaje)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-accent flex-1 py-2 text-sm"
                  onClick={() => marcar(a.id, "contactado")}
                >
                  <MessageCircle className="size-4" /> Escribir
                </a>
                <button className="btn-ghost py-2 text-sm" disabled={pendiente} onClick={() => marcar(a.id, "contactado")} title="Marcar como contactado" aria-label="Marcar como contactado">
                  <Check className="size-4" />
                </button>
                <button className="btn-ghost py-2 text-sm text-red-600" disabled={pendiente} onClick={() => marcar(a.id, "descartado")} title="Descartar" aria-label="Descartar">
                  <X className="size-4" />
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
