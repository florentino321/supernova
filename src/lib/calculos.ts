import type { Unidad } from "./tipos";

/** Costo total en soles de un equipo: compra en USD × tipo de cambio + gastos prorrateados. */
export function costoUnidad(u: Pick<Unidad, "costo_usd" | "costo_extra_pen"> & { lotes?: { tipo_cambio: number } | null }) {
  const tc = Number(u.lotes?.tipo_cambio ?? 3.75);
  return Math.round((Number(u.costo_usd) * tc + Number(u.costo_extra_pen)) * 100) / 100;
}

export function margen(precio: number, costo: number) {
  return precio > 0 ? (precio - costo) / precio : 0;
}
