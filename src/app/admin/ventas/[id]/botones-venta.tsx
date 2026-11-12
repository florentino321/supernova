"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, Printer } from "lucide-react";
import { anularVenta } from "../../acciones";

export function BotonesVenta({ id, anulable }: { id: number; anulable: boolean }) {
  const router = useRouter();
  const [pendiente, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className="btn-ghost" onClick={() => window.print()}>
        <Printer className="size-4" /> Imprimir / PDF
      </button>
      {anulable && (
        <button
          className="btn-danger"
          disabled={pendiente}
          onClick={() => {
            const motivo = prompt("Motivo de la anulación (devolución, error de registro…):");
            if (motivo === null) return;
            start(async () => {
              const r = await anularVenta(id, motivo);
              if (r.error) setError(r.error);
              router.refresh();
            });
          }}
        >
          <Ban className="size-4" /> Anular venta
        </button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
