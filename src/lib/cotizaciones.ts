import type { Cotizacion } from "./tipos";

/** Fecha de hoy en Perú (UTC−5), AAAA-MM-DD. */
export const hoyLima = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10);

/** Estado visible: una cotización pendiente cuya fecha pasó se muestra como "Vencida". */
export function estadoCotizacion(c: Pick<Cotizacion, "estado" | "valida_hasta">, hoy = hoyLima()): [string, string] {
  if (c.estado === "aceptada") return ["Vendida", "bg-emerald-50 text-emerald-700"];
  if (c.estado === "anulada") return ["Anulada", "bg-slate-100 text-slate-600"];
  if (c.valida_hasta < hoy) return ["Vencida", "bg-red-50 text-red-700"];
  return ["Pendiente", "bg-amber-100 text-amber-800"];
}

export const totalCotizacion = (c: Pick<Cotizacion, "cotizacion_items">) =>
  (c.cotizacion_items ?? []).reduce((a, i) => a + Number(i.precio_pen) - Number(i.descuento_pen), 0);
