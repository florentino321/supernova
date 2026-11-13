import { Loader2 } from "lucide-react";

// Indicador mientras carga una sección del panel.
export default function CargandoPanel() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-muted" aria-busy="true">
      <p className="flex items-center gap-2 text-sm"><Loader2 className="size-5 animate-spin" /> Cargando…</p>
    </div>
  );
}
