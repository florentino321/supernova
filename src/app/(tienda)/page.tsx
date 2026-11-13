import Link from "next/link";
import { ArrowRight, BadgeCheck, PackageCheck, Plane, ShieldCheck, Truck, Wrench } from "lucide-react";
import { TarjetaEquipo } from "@/components/tarjeta-equipo";
import { obtenerCatalogo } from "@/lib/catalogo";
import { enSolesCorto } from "@/lib/formato";
import { enlaceWhatsApp } from "@/lib/empresa";

export default async function Inicio() {
  const { unidades, categorias } = await obtenerCatalogo();
  const enVenta = unidades.filter((u) => u.estado === "disponible" || u.estado === "reservado");
  const destacados = enVenta.filter((u) => u.destacado).slice(0, 8);
  const llegando = unidades.filter((u) => u.estado === "en_transito");
  const remates = enVenta.filter((u) => u.condicion === "remate" || u.precio_oferta_pen != null);
  const desde = enVenta.length ? Math.min(...enVenta.map((u) => Number(u.precio_oferta_pen ?? u.precio_pen))) : 0;
  const vendidos = unidades.filter((u) => u.estado === "vendido").length;

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-52 left-1/3 size-[420px] rounded-full bg-blue/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:py-28">
          <div>
            <p className="chip bg-white/10 text-white/80 ring-1 ring-white/15">
              <Plane className="size-3.5" /> Importación directa Miami → Huánuco
            </p>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Laptops de Estados Unidos,
              <span className="block text-white/55">revisadas una por una.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Cada equipo es una pieza única: lo compramos en EE.UU., lo traemos, lo revisamos en nuestro taller y te
              lo entregamos con garantía real. Lo que ves aquí está físicamente en tienda.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/catalogo" className="btn-accent px-6 py-3 text-base">
                {enVenta.length ? `Ver ${enVenta.length} equipos disponibles` : "Ver el catálogo"} <ArrowRight className="size-4" />
              </Link>
              <a
                href={enlaceWhatsApp("Hola, necesito ayuda para elegir una laptop.")}
                target="_blank"
                rel="noreferrer"
                className="btn border border-white/20 px-6 py-3 text-base text-white hover:bg-white/10"
              >
                Te ayudo a elegir
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-end">
            {[
              { n: enVenta.length, t: "equipos en tienda hoy" },
              // con el inventario vacío no se muestran cifras en cero
              enVenta.length ? { n: enSolesCorto(desde), t: "precio desde" } : { n: "Cada semana", t: "llegan equipos nuevos" },
              { n: "12 meses", t: "de garantía (6 en remates)" },
              vendidos >= 10 ? { n: `${vendidos}+`, t: "equipos entregados" } : { n: "100 %", t: "revisadas en taller" },
            ].map((s) => (
              <div key={s.t} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                <p className="num font-display text-3xl font-extrabold">{s.n}</p>
                <p className="mt-1 text-sm text-white/60">{s.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CATEGORÍAS ---------- */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-extrabold">¿Para qué la necesitas?</h2>
            <p className="mt-2 text-muted">Elige por tipo de uso.</p>
          </div>
          <Link href="/catalogo" className="hidden text-sm font-semibold text-blue hover:underline sm:block">
            Ver todo el catálogo →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {categorias.map((c) => {
            const n = enVenta.filter((u) => u.modelos?.categorias?.slug === c.slug).length;
            return (
              <Link
                key={c.id}
                href={`/catalogo?categoria=${c.slug}`}
                className="card group p-4 transition hover:border-navy"
              >
                <p className="font-display font-bold leading-tight">{c.nombre}</p>
                <p className="mt-6 text-sm text-muted">
                  <span className="num font-semibold text-ink">{n}</span> disponibles
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- DESTACADOS ---------- */}
      {destacados.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
          <h2 className="font-display text-3xl font-extrabold">Equipos destacados</h2>
          <p className="mt-2 text-muted">Los que más recomendamos para trabajo, estudio y gaming.</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {destacados.map((u) => (
              <TarjetaEquipo key={u.id} u={u} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- CÓMO FUNCIONA ---------- */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <div className="card overflow-hidden">
          <div className="grid lg:grid-cols-[1fr_2fr]">
            <div className="bg-surface-2 p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">Nuestro proceso</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold">Del outlet americano a tus manos</h2>
              <p className="mt-3 text-muted">
                Por eso no tenemos 10 unidades del mismo modelo: cada laptop se elige y se revisa de forma individual.
              </p>
            </div>
            <ol className="grid gap-px bg-line sm:grid-cols-2">
              {[
                { i: PackageCheck, t: "Selección en EE.UU.", d: "Compramos en outlets, subastas corporativas y vendedores certificados." },
                { i: Plane, t: "Importación", d: "Llega por courier desde Miami con seguro y trazabilidad del lote." },
                { i: Wrench, t: "Revisión técnica", d: "Batería, pantalla, teclado, temperatura y limpieza interna con pasta térmica nueva." },
                { i: ShieldCheck, t: "Entrega con garantía", d: "12 meses de garantía (6 en remates) y envío a todo el Perú." },
              ].map((p, idx) => (
                <li key={p.t} className="bg-surface p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-navy text-white">
                      <p.i className="size-5" />
                    </span>
                    <span className="num text-sm font-semibold text-muted">0{idx + 1}</span>
                  </div>
                  <p className="mt-4 font-display text-lg font-bold">{p.t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{p.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- REMATES / OFERTAS ---------- */}
      {remates.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-extrabold">Ofertas y remates</h2>
              <p className="mt-2 text-muted">Unidades con precio rebajado o pequeños detalles estéticos.</p>
            </div>
            <Link href="/catalogo?oferta=1" className="hidden text-sm font-semibold text-blue hover:underline sm:block">
              Ver todas →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {remates.slice(0, 4).map((u) => (
              <TarjetaEquipo key={u.id} u={u} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- LLEGANDO ---------- */}
      {llegando.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-violet-50 to-blue-50 p-6 ring-1 ring-violet-100 sm:p-10">
            <p className="chip bg-violet-600 text-white">
              <Plane className="size-3.5" /> En camino desde Miami
            </p>
            <h2 className="mt-4 font-display text-3xl font-extrabold">Llegando pronto</h2>
            <p className="mt-2 max-w-xl text-muted">Sepáralos antes de que lleguen a tienda escribiéndonos por WhatsApp.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {llegando.slice(0, 4).map((u) => (
                <TarjetaEquipo key={u.id} u={u} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- CONFIANZA ---------- */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { i: BadgeCheck, t: "Garantía que responde", d: "12 meses en equipos certificados, 6 meses en remates. Cubre fallas de hardware." },
            { i: Truck, t: "Envíos a todo el Perú", d: "Shalom, Olva y agencias. Empaque reforzado y número de seguimiento." },
            { i: ShieldCheck, t: "Número de serie verificable", d: "Cada equipo tiene su serie registrada; la ves en tu comprobante de venta." },
          ].map((b) => (
            <div key={b.t} className="card flex gap-4 p-6">
              <b.i className="size-6 shrink-0 text-accent" />
              <div>
                <p className="font-display font-bold">{b.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{b.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
