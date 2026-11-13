"use client";

import { useActionState } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";
import { registrarAviso, type EstadoAviso } from "../../acciones";

export function FormAviso({ unidadId, titulo, detalle }: { unidadId: number; titulo: string; detalle: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoAviso, FormData>(registrarAviso, {});
  if (estado.ok) {
    return (
      <p className="mt-5 flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {estado.ok}
      </p>
    );
  }
  return (
    <form action={accion} className="mt-5 rounded-xl border border-line p-4">
      <p className="flex items-center gap-2 font-semibold">
        <BellRing className="size-4 text-violet" /> {titulo}
      </p>
      <p className="mt-1 text-sm text-muted">{detalle}</p>
      <input type="hidden" name="unidad_id" value={unidadId} />
      <input name="sitio_web" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input name="nombre" required minLength={2} maxLength={80} placeholder="Tu nombre" className="input" autoComplete="given-name" />
        <input name="telefono" required inputMode="tel" placeholder="WhatsApp (9 dígitos)" className="input" autoComplete="tel" />
        <button className="btn-primary" disabled={pendiente}>{pendiente ? "Enviando…" : "Avísame"}</button>
      </div>
      {estado.error && <p className="mt-2 text-sm text-red-600">{estado.error}</p>}
      <p className="mt-2 text-xs text-muted">Solo usaremos tu número para avisarte sobre este equipo.</p>
    </form>
  );
}
