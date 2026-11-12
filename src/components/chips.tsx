import { colorEstado, etiquetaCondicion, etiquetaEstado } from "@/lib/formato";
import type { Condicion, EstadoUnidad, Grado } from "@/lib/tipos";

export function ChipEstado({ estado }: { estado: EstadoUnidad }) {
  return <span className={`chip ${colorEstado[estado]}`}>{etiquetaEstado[estado]}</span>;
}

const colorCondicion: Record<Condicion, string> = {
  nuevo: "bg-blue-50 text-blue-700",
  open_box: "bg-sky-50 text-sky-700",
  seminuevo: "bg-slate-100 text-slate-700",
  remate: "bg-red-50 text-red-700",
};

export function ChipCondicion({ condicion, grado }: { condicion: Condicion; grado?: Grado }) {
  return (
    <span className={`chip ${colorCondicion[condicion]}`}>
      {etiquetaCondicion[condicion]}
      {grado && condicion !== "nuevo" && condicion !== "open_box" ? ` · Grado ${grado}` : ""}
    </span>
  );
}
