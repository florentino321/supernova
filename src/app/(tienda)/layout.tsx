import Link from "next/link";
import { Mail, MapPin, Menu, MessageCircle, Clock } from "lucide-react";
import { Logo } from "@/components/logo";
import { EMPRESA, enlaceWhatsApp } from "@/lib/empresa";

const nav = [
  { href: "/catalogo", texto: "Catálogo" },
  { href: "/catalogo?condicion=remate", texto: "Remates" },
  { href: "/catalogo?oferta=1", texto: "Ofertas" },
  { href: "/catalogo?estado=en_transito", texto: "Llegando pronto" },
  { href: "/#contacto", texto: "Contacto" },
];

export default function LayoutTienda({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="bg-navy text-[13px] text-white/75">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <p className="truncate">Importamos de Estados Unidos · Garantía de 12 meses · Envíos a todo el Perú</p>
          <Link href="/login" className="hidden shrink-0 hover:text-white sm:block">
            Acceso del personal
          </Link>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-2 transition hover:bg-surface-2 hover:text-ink"
              >
                {n.texto}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a
              href={enlaceWhatsApp("Hola, quiero información sobre sus laptops.")}
              target="_blank"
              rel="noreferrer"
              className="btn-accent hidden sm:inline-flex"
            >
              <MessageCircle className="size-4" /> Escríbenos
            </a>
            <details className="relative lg:hidden">
              <summary className="btn-ghost list-none px-3 [&::-webkit-details-marker]:hidden" aria-label="Menú">
                <Menu className="size-5" />
              </summary>
              <div className="card absolute right-0 mt-2 w-56 p-2 shadow-xl">
                {nav.map((n) => (
                  <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
                    {n.texto}
                  </Link>
                ))}
                <Link href="/login" className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2">
                  Acceso del personal
                </Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer id="contacto" className="mt-24 bg-navy text-white/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo claro />
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              {EMPRESA.lema}. Cada equipo que ves en la web existe físicamente y tiene su propio número de serie.
            </p>
          </div>
          <div className="min-w-0 space-y-3 text-sm">
            <p className="font-semibold text-white">Visítanos</p>
            <p className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" /> {EMPRESA.direccion}, {EMPRESA.ciudad}
            </p>
            <p className="flex gap-2">
              <Clock className="mt-0.5 size-4 shrink-0" /> {EMPRESA.horario}
            </p>
          </div>
          <div className="min-w-0 space-y-3 text-sm">
            <p className="font-semibold text-white">Contacto</p>
            <a className="flex gap-2 hover:text-white" href={enlaceWhatsApp("Hola")} target="_blank" rel="noreferrer">
              <MessageCircle className="mt-0.5 size-4 shrink-0" /> WhatsApp
            </a>
            <a className="flex min-w-0 gap-2 break-all hover:text-white" href={`mailto:${EMPRESA.email}`}>
              <Mail className="mt-0.5 size-4 shrink-0" /> {EMPRESA.email}
            </a>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-white/50 sm:px-6">
            © {new Date().getFullYear()} {EMPRESA.nombre}. Precios en soles, sujetos a disponibilidad de la unidad.
          </p>
        </div>
      </footer>
    </>
  );
}
