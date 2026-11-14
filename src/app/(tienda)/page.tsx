import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, BadgeCheck, PackageCheck, Plane, ShieldCheck, Truck, Wrench } from "lucide-react";
import { iconoCategoria } from "@/components/iconos";
import { paletas } from "@/components/placeholder-laptop";
import { TarjetaEquipo } from "@/components/tarjeta-equipo";
import { TransicionPagina } from "@/components/transicion-pagina";
import { obtenerCatalogo } from "@/lib/catalogo";
import { enSolesCorto } from "@/lib/formato";
import { enlaceWhatsApp } from "@/lib/empresa";
import { obtenerEmpresa } from "@/lib/empresa-datos";
import { Contador, Revelar } from "@/components/revelar";

/** Retraso de la animación de entrada de la portada. */
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

type Cifra = { n: string; t: string; contar?: number; prefijo?: string; sufijo?: string };

export default async function Inicio() {
  const [{ unidades, categorias }, empresa] = await Promise.all([obtenerCatalogo(), obtenerEmpresa()]);
  const enVenta = unidades.filter((u) => u.estado === "disponible" || u.estado === "reservado");
  // destacados: los marcados y, si faltan, los ingresos más recientes
  const destacados = [...enVenta.filter((u) => u.destacado), ...enVenta.filter((u) => !u.destacado)].slice(0, 8);
  const llegando = unidades.filter((u) => u.estado === "en_transito");
  const ofertas = enVenta.filter((u) => u.precio_oferta_pen != null);
  const desde = enVenta.length ? Math.min(...enVenta.map((u) => Number(u.precio_oferta_pen ?? u.precio_pen))) : 0;
  const vendidos = unidades.filter((u) => u.estado === "vendido").length;

  const cifras: Cifra[] = [
    { n: String(enVenta.length), contar: enVenta.length, t: "equipos en tienda hoy" },
    // con el inventario vacío no se muestran cifras en cero
    enVenta.length
      ? { n: enSolesCorto(desde), contar: Math.round(desde), prefijo: "S/ ", t: "precio desde" }
      : { n: "Cada semana", t: "llegan equipos nuevos" },
    { n: "12 meses", contar: 12, sufijo: " meses", t: "de garantía" },
    vendidos >= 10
      ? { n: `${vendidos}+`, contar: vendidos, sufijo: "+", t: "equipos entregados" }
      : { n: "100 %", contar: 100, sufijo: " %", t: "revisadas en taller" },
  ];

  return (
    <TransicionPagina>
      {/* ---------- PORTADA ---------- */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="flotar pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-accent/25 blur-3xl" />
        <div className="flotar-lento pointer-events-none absolute -bottom-52 left-1/3 size-[420px] rounded-full bg-blue/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:py-28">
          <div>
            <p className="entrada chip bg-white/10 text-white/80 ring-1 ring-white/15">
              <Plane className="size-3.5" /> Importación directa Miami → Huánuco
            </p>
            <h1 className="entrada mt-6 font-display text-5xl font-extrabold leading-[0.95] sm:text-7xl" style={d(90)}>
              Laptops
              <span className="texto-brillo block pb-1">americanas</span>
            </h1>
            <div className="entrada mt-9 flex flex-wrap gap-3" style={d(200)}>
              <Link href="/catalogo" className="btn-accent group px-6 py-3 text-base">
                {enVenta.length ? `Ver ${enVenta.length} equipos disponibles` : "Ver el catálogo"}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href={enlaceWhatsApp(empresa.whatsapp, "Hola, necesito ayuda para elegir una laptop.")}
                target="_blank"
                rel="noreferrer"
                className="btn border border-white/20 px-6 py-3 text-base text-white hover:bg-white/10"
              >
                Te ayudo a elegir
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {cifras.map((s, i) => (
              <div
                key={s.t}
                className="entrada rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition hover:border-white/25 hover:bg-white/[0.07]"
                style={d(260 + i * 90)}
              >
                <Contador
                  className="num font-display text-3xl font-extrabold"
                  valor={s.contar}
                  texto={s.n}
                  prefijo={s.prefijo}
                  sufijo={s.sufijo}
                />
                <p className="mt-1 text-sm text-white/60">{s.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- TIPOS DE USO ---------- */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <Revelar className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-extrabold">¿Para qué la necesitas?</h2>
            <p className="mt-2 text-muted">Elige por tipo de uso.</p>
          </div>
          <Link href="/catalogo" className="hidden text-sm font-semibold text-blue hover:underline sm:block">
            Ver todo el catálogo →
          </Link>
        </Revelar>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {categorias.map((c) => {
            const n = enVenta.filter((u) => u.modelos?.categorias?.slug === c.slug).length;
            const Icono = iconoCategoria(c.slug);
            const [fondo, acento] = paletas[c.slug] ?? ["#0d1b2e", "#d7263d"];
            return (
              <Revelar key={c.id} className="h-full">
                <Link
                  href={`/catalogo?categoria=${c.slug}`}
                  data-pulso
                  className="card group relative flex h-full flex-col overflow-hidden p-4 transition duration-300 hover:-translate-y-1 hover:border-navy hover:shadow-[0_16px_36px_-18px_rgba(11,22,38,0.4)] active:scale-[0.97]"
                >
                  <span
                    className="grid size-12 place-items-center rounded-xl text-white shadow-sm transition duration-300 group-hover:-rotate-6 group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${fondo}, ${acento})` }}
                  >
                    <Icono className="size-6" />
                  </span>
                  <p className="mt-4 font-display font-bold leading-tight">{c.nombre}</p>
                  <p className="mt-auto pt-2 text-sm text-muted">
                    <span className="num font-semibold text-ink">{n}</span> disponibles
                  </p>
                  <ArrowRight className="absolute right-4 top-4 size-4 -translate-x-1 text-muted opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </Revelar>
            );
          })}
        </div>
      </section>

      {/* ---------- DESTACADOS ---------- */}
      {destacados.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
          <Revelar>
            <h2 className="font-display text-3xl font-extrabold">Equipos destacados</h2>
            <p className="mt-2 text-muted">Los que más recomendamos para trabajo, estudio y gaming.</p>
          </Revelar>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {destacados.map((u) => (
              <TarjetaEquipo key={u.id} u={u} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- CÓMO TRABAJAMOS ---------- */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: PackageCheck, t: "Selección en EE.UU.", d: "Compramos en outlets, subastas corporativas y vendedores certificados." },
            { i: Plane, t: "Importación", d: "Llega por courier desde Miami con seguro y trazabilidad del lote." },
            { i: Wrench, t: "Revisión técnica", d: "Batería, pantalla, teclado, temperatura y limpieza interna con pasta térmica nueva." },
            { i: ShieldCheck, t: "Entrega con garantía", d: "12 meses de garantía y envío a todo el Perú." },
          ].map((p, idx) => (
            <Revelar como="li" key={p.t} className="h-full">
              <div className="card group relative h-full overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:border-navy">
                <span className="num pointer-events-none absolute -right-2 -top-4 font-display text-7xl font-extrabold text-surface-2 transition duration-300 group-hover:text-accent/10">
                  0{idx + 1}
                </span>
                <span className="relative grid size-11 place-items-center rounded-xl bg-navy text-white transition duration-300 group-hover:bg-accent">
                  <p.i className="size-5" />
                </span>
                <p className="relative mt-4 font-display text-lg font-bold">{p.t}</p>
                <p className="relative mt-1 text-sm leading-relaxed text-muted">{p.d}</p>
              </div>
            </Revelar>
          ))}
        </ol>
      </section>

      {/* ---------- OFERTAS ---------- */}
      {ofertas.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
          <Revelar className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-extrabold">Ofertas</h2>
              <p className="mt-2 text-muted">Unidades con precio rebajado por tiempo limitado.</p>
            </div>
            <Link href="/catalogo?oferta=1" className="hidden text-sm font-semibold text-blue hover:underline sm:block">
              Ver todas →
            </Link>
          </Revelar>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ofertas.slice(0, 4).map((u) => (
              <TarjetaEquipo key={u.id} u={u} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- LLEGANDO ---------- */}
      {llegando.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-violet-50 to-blue-50 p-6 ring-1 ring-violet-100 sm:p-10">
            <Revelar>
              <p className="chip bg-violet-600 text-white">
                <Plane className="size-3.5" /> En camino desde Miami
              </p>
              <h2 className="mt-4 font-display text-3xl font-extrabold">Llegando pronto</h2>
              <p className="mt-2 max-w-xl text-muted">Sepáralos antes de que lleguen a tienda escribiéndonos por WhatsApp.</p>
            </Revelar>
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
            { i: BadgeCheck, t: "Garantía que responde", d: "Hasta 12 meses según el equipo. Cubre fallas de hardware." },
            { i: Truck, t: "Envíos a todo el Perú", d: "Shalom, Olva y agencias. Empaque reforzado y número de seguimiento." },
            { i: ShieldCheck, t: "Número de serie verificable", d: "Cada equipo tiene su serie registrada; la ves en tu comprobante de venta." },
          ].map((b) => (
            <Revelar key={b.t} className="card flex gap-4 p-6">
              <b.i className="size-6 shrink-0 text-accent" />
              <div>
                <p className="font-display font-bold">{b.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{b.d}</p>
              </div>
            </Revelar>
          ))}
        </div>
      </section>
    </TransicionPagina>
  );
}
