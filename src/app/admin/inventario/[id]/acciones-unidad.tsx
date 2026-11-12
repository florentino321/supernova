"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Receipt, Trash2 } from "lucide-react";
import { eliminarUnidad } from "../../acciones";
import type { Unidad } from "@/lib/tipos";

export function AccionesUnidad({ unidad, esAdmin }: { unidad: Unidad; esAdmin: boolean }) {
  const router = useRouter();
  const [pendiente, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <>
      <Link href={`/equipo/${unidad.slug}`} target="_blank" className="btn-ghost">
        <ExternalLink className="size-4" /> Ver en la web
      </Link>
      {(unidad.estado === "disponible" || unidad.estado === "reservado") && (
        <Link href={`/admin/ventas/nueva?unidad=${unidad.id}`} className="btn-accent">
          <Receipt className="size-4" /> Registrar venta
        </Link>
      )}
      {esAdmin && unidad.estado !== "vendido" && (
        <button
          className="btn-danger"
          disabled={pendiente}
          onClick={() => {
            if (!confirm(`¿Eliminar definitivamente ${unidad.sku}? Se borrarán también sus fotos y videos.`)) return;
            start(async () => {
              const r = await eliminarUnidad(unidad.id);
              if (r?.error) setError(r.error);
              else router.push("/admin/inventario");
            });
          }}
        >
          <Trash2 className="size-4" /> Eliminar
        </button>
      )}
      {error && <p className="w-full rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </>
  );
}
