"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import { cancelarReserva } from "../comercial";

export function BotonCancelarReserva({ id }: { id: number }) {
  const router = useRouter();
  const [pendiente, start] = useTransition();
  return (
    <button
      className="btn-ghost py-2 text-sm text-red-600"
      disabled={pendiente}
      aria-label="Cancelar reserva"
      title="Cancelar reserva"
      onClick={() => {
        const motivo = prompt("¿Por qué se cancela? (el cliente desistió, se devolvió el adelanto…)");
        if (motivo === null) return;
        start(async () => {
          const r = await cancelarReserva(id, motivo);
          if (r.error) alert(r.error);
          router.refresh();
        });
      }}
    >
      <X className="size-4" />
    </button>
  );
}
