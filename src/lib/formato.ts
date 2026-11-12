import type { Canal, Condicion, EstadoLote, EstadoUnidad, EstadoVenta, MetodoPago } from "./tipos";

const soles = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 });
const solesCorto = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 });
const dolares = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const enSoles = (n: number | null | undefined) => soles.format(Number(n ?? 0));
export const enSolesCorto = (n: number | null | undefined) => solesCorto.format(Number(n ?? 0));
export const enDolares = (n: number | null | undefined) => dolares.format(Number(n ?? 0));
export const enPorcentaje = (n: number) => `${(n * 100).toFixed(1)}%`;
export const compacto = (n: number) =>
  n >= 1000 ? `S/ ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `S/ ${Math.round(n)}`;

export function fecha(d: string | Date | null | undefined, opciones?: Intl.DateTimeFormatOptions) {
  if (!d) return "—";
  const f = typeof d === "string" && d.length === 10 ? new Date(`${d}T12:00:00`) : new Date(d);
  return f.toLocaleDateString("es-PE", opciones ?? { day: "2-digit", month: "short", year: "numeric" });
}

export function fechaHora(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function diasEntre(desde: string | Date, hasta: string | Date = new Date()) {
  return Math.max(0, Math.round((new Date(hasta).getTime() - new Date(desde).getTime()) / 86_400_000));
}

export const etiquetaCondicion: Record<Condicion, string> = {
  nuevo: "Nuevo",
  open_box: "Open box",
  seminuevo: "Seminuevo certificado",
  remate: "Remate",
};

export const etiquetaEstado: Record<EstadoUnidad, string> = {
  en_transito: "En tránsito",
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
  garantia: "En garantía",
  baja: "De baja",
};

export const colorEstado: Record<EstadoUnidad, string> = {
  en_transito: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  disponible: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  reservado: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  vendido: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  garantia: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  baja: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

export const etiquetaLote: Record<EstadoLote, string> = {
  comprado: "Comprado",
  en_transito: "En tránsito",
  en_aduana: "En aduana",
  recibido: "Recibido",
};

export const etiquetaPago: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

export const etiquetaCanal: Record<Canal, string> = {
  tienda: "Tienda física",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  facebook: "Facebook",
  instagram: "Instagram",
  web: "Página web",
};

export const etiquetaVenta: Record<EstadoVenta, string> = {
  completada: "Completada",
  anulada: "Anulada",
};

export function slugificar(t: string) {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const precioFinal = (u: { precio_pen: number; precio_oferta_pen: number | null }) =>
  Number(u.precio_oferta_pen ?? u.precio_pen);
