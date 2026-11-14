import Link from "next/link";
import { Clock, Mail, MapPin, Menu, Phone } from "lucide-react";
import { AnimacionesTienda } from "@/components/animaciones";
import { IconoWhatsApp } from "@/components/iconos";
import { Logo } from "@/components/logo";
import { LEMA, enlaceWhatsApp } from "@/lib/empresa";
import { obtenerEmpresa } from "@/lib/empresa-datos";

const nav = [
  { href: "/catalogo", texto: "Catálogo" },
  { href: "/catalogo?oferta=1", texto: "Ofertas" },
  { href: "/catalogo?estado=en_transito", texto: "Llegando pronto" },
  { href: "/#contacto", texto: "Contacto" },
];

export default async function LayoutTienda({ children }: LayoutProps<"/">) {
  const e = await obtenerEmpresa();
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
      <AnimacionesTienda />
      <header id="cabecera" className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="relative rounded-lg px-3 py-2 text-sm font-medium text-ink-2 transition after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-accent after:transition-transform after:duration-300 hover:bg-surface-2 hover:text-ink hover:after:scale-x-100"
              >
                {n.texto}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a
              href={enlaceWhatsApp(e.whatsapp, "Hola, quiero información sobre sus laptops.")}
              target="_blank"
              rel="noreferrer"
              className="btn-accent hidden sm:inline-flex"
            >
              <IconoWhatsApp className="size-4" /> Escríbenos
            </a>
            <details className="relative lg:hidden">
              <summary className="btn-ghost list-none px-3 [&::-webkit-details-marker]:hidden" aria-label="Menú">
                <Menu className="size-5" />
              </summary>
              <div className="menu-movil card absolute right-0 mt-2 w-56 p-2 shadow-xl">
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
        {/* progreso de lectura al deslizar */}
        <div id="progreso-lectura" className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-accent via-[#ff6b7d] to-blue" />
      </header>

      <main className="flex-1">{children}</main>

      <footer id="contacto" className="mt-24 bg-navy text-white/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo claro />
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              {LEMA}. Cada equipo que ves en la web existe físicamente y tiene su propio número de serie.
            </p>
          </div>
          <div className="min-w-0 space-y-3 text-sm">
            <p className="font-semibold text-white">Visítanos</p>
            {(e.direccion || e.ciudad) && (
              <p className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" /> {[e.direccion, e.ciudad].filter(Boolean).join(", ")}
              </p>
            )}
            {e.horario && (
              <p className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0" /> {e.horario}
              </p>
            )}
          </div>
          <div className="min-w-0 space-y-3 text-sm">
            <p className="font-semibold text-white">Contacto</p>
            <a className="flex gap-2 hover:text-white" href={enlaceWhatsApp(e.whatsapp, "Hola")} target="_blank" rel="noreferrer">
              <IconoWhatsApp className="mt-0.5 size-4 shrink-0" /> WhatsApp
            </a>
            {e.telefono && (
              <a className="flex gap-2 hover:text-white" href={`tel:${e.telefono.replace(/\s/g, "")}`}>
                <Phone className="mt-0.5 size-4 shrink-0" /> {e.telefono}
              </a>
            )}
            {e.email && (
              <a className="flex min-w-0 gap-2 break-all hover:text-white" href={`mailto:${e.email}`}>
                <Mail className="mt-0.5 size-4 shrink-0" /> {e.email}
              </a>
            )}
            {(e.facebook || e.instagram || e.tiktok) && (
              <div className="flex gap-3 pt-1">
                {e.facebook && <a href={e.facebook} target="_blank" rel="noreferrer" className="text-sm font-semibold hover:text-white">Facebook</a>}
                {e.instagram && <a href={e.instagram} target="_blank" rel="noreferrer" className="text-sm font-semibold hover:text-white">Instagram</a>}
                {e.tiktok && <a href={e.tiktok} target="_blank" rel="noreferrer" className="text-sm font-semibold hover:text-white">TikTok</a>}
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-white/50 sm:px-6">
            © {new Date().getFullYear()} {e.razon_social ?? e.nombre}
            {e.ruc ? ` · RUC ${e.ruc}` : ""}. Precios en soles, sujetos a disponibilidad de la unidad.
          </p>
        </div>
      </footer>
    </>
  );
}
