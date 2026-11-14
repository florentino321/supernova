import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { enlaceWhatsApp } from "@/lib/empresa";
import { obtenerEmpresa } from "@/lib/empresa-datos";

/** También se usa dentro de la tienda (que ya muestra el logo en su encabezado). */
export async function ContenidoNoEncontrado({ conLogo = false }: { conLogo?: boolean }) {
  const { whatsapp } = await obtenerEmpresa();
  return (
    <div className="grid flex-1 place-items-center bg-bg px-4 py-16">
      <div className="max-w-md text-center">
        {conLogo && <div className="mb-10 flex justify-center"><Logo /></div>}
        <p className="font-display text-7xl font-extrabold text-navy">404</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold">Esta página no existe</h1>
        <p className="mt-3 text-ink-2">
          Puede que el equipo ya se haya vendido o que el enlace esté mal escrito. Los equipos rotan rápido, pero
          llegan nuevos cada semana.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/catalogo" className="btn-accent"><Search className="size-4" /> Ver equipos disponibles</Link>
          <a href={enlaceWhatsApp(whatsapp, "Hola, buscaba un equipo en su web y no lo encontré.")} target="_blank" rel="noreferrer" className="btn-ghost">
            Pregúntanos por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
