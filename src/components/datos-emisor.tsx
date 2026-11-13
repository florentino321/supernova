import type { Empresa } from "@/lib/empresa-datos";

/** Datos de la empresa en la nota de venta y la cotización (se editan en Configuración). */
export function DatosEmisor({ e }: { e: Empresa }) {
  const contacto = [e.telefono, e.email].filter(Boolean).join(" · ");
  return (
    <div className="mt-3 text-sm text-muted">
      {e.razon_social && <p className="font-semibold text-ink-2">{e.razon_social}</p>}
      {e.ruc && <p>RUC {e.ruc}</p>}
      {(e.direccion || e.ciudad) && <p>{[e.direccion, e.ciudad].filter(Boolean).join(", ")}</p>}
      {contacto && <p>{contacto}</p>}
    </div>
  );
}
