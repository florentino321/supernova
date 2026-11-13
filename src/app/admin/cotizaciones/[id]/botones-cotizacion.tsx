"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, CheckCircle2, MessageCircle, Printer } from "lucide-react";
import { anularCotizacion, convertirCotizacion } from "../../comercial";
import { etiquetaCanal, etiquetaPago } from "@/lib/formato";
import type { Canal, MetodoPago } from "@/lib/tipos";

export function BotonesCotizacion({ id, pendiente, whatsapp }: { id: number; pendiente: boolean; whatsapp: string | null }) {
  const router = useRouter();
  const [ocupado, start] = useTransition();
  const [abrir, setAbrir] = useState(false);
  const [metodo, setMetodo] = useState<MetodoPago>("yape");
  const [canal, setCanal] = useState<Canal>("whatsapp");
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button className="btn-ghost" onClick={() => window.print()}>
          <Printer className="size-4" /> Imprimir / PDF
        </button>
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-ghost">
            <MessageCircle className="size-4" /> WhatsApp
          </a>
        )}
        {pendiente && (
          <>
            <button className="btn-accent" onClick={() => setAbrir((v) => !v)}>
              <CheckCircle2 className="size-4" /> Convertir en venta
            </button>
            <button
              className="btn-ghost text-red-600"
              disabled={ocupado}
              onClick={() => {
                if (!confirm("¿Anular esta cotización?")) return;
                start(async () => {
                  const r = await anularCotizacion(id);
                  if (r.error) setError(r.error);
                  router.refresh();
                });
              }}
            >
              <Ban className="size-4" /> Anular
            </button>
          </>
        )}
      </div>
      {abrir && (
        <div className="card w-full max-w-md p-4">
          <p className="font-semibold">¿Cómo pagó el cliente?</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <select className="input" value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)} aria-label="Método de pago">
              {(Object.keys(etiquetaPago) as MetodoPago[]).map((m) => <option key={m} value={m}>{etiquetaPago[m]}</option>)}
            </select>
            <select className="input" value={canal} onChange={(e) => setCanal(e.target.value as Canal)} aria-label="Canal de venta">
              {(Object.keys(etiquetaCanal) as Canal[]).map((m) => <option key={m} value={m}>{etiquetaCanal[m]}</option>)}
            </select>
          </div>
          <button
            className="btn-accent mt-3 w-full"
            disabled={ocupado}
            onClick={() =>
              start(async () => {
                setError("");
                const r = await convertirCotizacion(id, metodo, canal);
                if (r?.error) setError(r.error);
              })
            }
          >
            {ocupado ? "Registrando…" : "Registrar la venta"}
          </button>
          <p className="mt-2 text-xs text-muted">Se registra una venta por cada equipo y pasan a &quot;Vendido&quot;.</p>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
