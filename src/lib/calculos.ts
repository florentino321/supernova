import type { Unidad } from "./tipos";

/**
 * Costo total en soles de un equipo: el precio de adquisición registrado.
 * Para equipos antiguos sin ese dato: compra en USD × tipo de cambio + gastos extra.
 */
export function costoUnidad(
  u: Pick<Unidad, "costo_usd" | "costo_extra_pen"> & { costo_adquisicion_pen?: number | null; lotes?: { tipo_cambio: number } | null },
) {
  if (u.costo_adquisicion_pen != null) return Number(u.costo_adquisicion_pen);
  const tc = Number(u.lotes?.tipo_cambio ?? 3.75);
  return Math.round((Number(u.costo_usd) * tc + Number(u.costo_extra_pen)) * 100) / 100;
}

export function margen(precio: number, costo: number) {
  return precio > 0 ? (precio - costo) / precio : 0;
}
