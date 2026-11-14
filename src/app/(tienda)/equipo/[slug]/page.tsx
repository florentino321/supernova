import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronRight, HandCoins, ShieldCheck, Store, Truck } from "lucide-react";
import { ChipCondicion } from "@/components/chips";
import { IconoWhatsApp } from "@/components/iconos";
import { TarjetaEquipo } from "@/components/tarjeta-equipo";
import { TransicionPagina } from "@/components/transicion-pagina";
import { obtenerCatalogo, obtenerEquipo } from "@/lib/catalogo";
import { enSoles, enSolesCorto, etiquetaCondicion } from "@/lib/formato";
import { RESERVA, adelantoSugerido, enlaceWhatsApp } from "@/lib/empresa";
import { obtenerEmpresa } from "@/lib/empresa-datos";
import { URL_SITIO } from "@/lib/sitio";
import { FormAviso } from "./form-aviso";
import { Galeria } from "./galeria";
import { Revelar } from "@/components/revelar";

const explicacionGrado = {
  A: "Estado estético excelente: sin marcas visibles o mínimas, parece nuevo.",
  B: "Detalles estéticos leves (rayones finos o marcas de uso) que no afectan el funcionamiento.",
  C: "Detalles estéticos notorios (golpes o desgaste). Funciona al 100% y por eso tiene mejor precio.",
};

export async function generateMetadata({ params }: PageProps<"/equipo/[slug]">) {
  const { slug } = await params;
  const u = await obtenerEquipo(slug);
  if (!u) return { title: "Equipo no encontrado" };
  const nombre = u.modelos?.nombre ?? "Laptop";
  const precio = Number(u.precio_oferta_pen ?? u.precio_pen);
  const titulo = `${nombre} · ${u.ram_gb} GB / ${u.almacenamiento}`;
  const descripcion = `${nombre} con ${u.procesador}, ${u.ram_gb} GB de RAM y ${u.almacenamiento}. ${enSoles(precio)} · ${etiquetaCondicion[u.condicion]} · ${u.garantia_meses} meses de garantía. Importada de EE.UU.`;
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `/equipo/${u.slug}` },
    openGraph: { title: `${titulo} · ${enSoles(precio)}`, description: descripcion, url: `/equipo/${u.slug}` },
  };
}

export default async function Equipo({ params }: PageProps<"/equipo/[slug]">) {
  const { slug } = await params;
  const u = await obtenerEquipo(slug);
  if (!u) notFound();

  const [{ unidades }, { whatsapp }] = await Promise.all([obtenerCatalogo(), obtenerEmpresa()]);
  const enVenta = unidades.filter((x) => x.id !== u.id && x.estado !== "vendido");
  const otrasConfig = enVenta.filter((x) => x.modelo_id === u.modelo_id);
  const relacionados = enVenta
    .filter((x) => x.modelo_id !== u.modelo_id && x.modelos?.categorias?.slug === u.modelos?.categorias?.slug)
    .slice(0, 4);

  const nombre = u.modelos?.nombre ?? "";
  const marca = u.modelos?.marcas?.nombre ?? "";
  const precio = Number(u.precio_oferta_pen ?? u.precio_pen);
  const vendible = u.estado === "disponible" || u.estado === "en_transito";
  const adelanto = adelantoSugerido(precio);
  // si no hay descripción escrita, se arma una a partir de la ficha técnica
  const textoDescripcion =
    u.descripcion ??
    u.modelos?.descripcion ??
    `${nombre} ${etiquetaCondicion[u.condicion].toLowerCase()}, importada de Estados Unidos y revisada en nuestro taller. ` +
      `Cuenta con procesador ${u.procesador}, ${u.ram_gb} GB de RAM, ${u.almacenamiento}` +
      `${u.gpu ? (/^gráficos integrados/i.test(u.gpu) ? ` y ${u.gpu.toLowerCase()}` : ` y tarjeta de video ${u.gpu}`) : ""}, con pantalla de ${u.pantalla_pulg}″. ` +
      `Se entrega con ${u.garantia_meses} meses de garantía.`;
  const mensajeReserva = `Hola, quiero separar la ${nombre} (${u.sku})${u.estado === "en_transito" ? " que está en camino" : ""} con un adelanto de ${enSolesCorto(adelanto)}. ¿Cómo hago el pago?`;

  // Datos estructurados para Google (precio, disponibilidad y condición en los resultados de búsqueda)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: nombre,
    sku: u.sku,
    brand: { "@type": "Brand", name: marca },
    description: textoDescripcion,
    image: (u.medios ?? []).filter((m) => m.tipo === "imagen").map((m) => m.url),
    offers: {
      "@type": "Offer",
      url: `${URL_SITIO}/equipo/${u.slug}`,
      priceCurrency: "PEN",
      price: precio.toFixed(2),
      itemCondition: u.condicion === "nuevo" ? "https://schema.org/NewCondition" : "https://schema.org/RefurbishedCondition",
      availability: {
        disponible: "https://schema.org/InStock",
        reservado: "https://schema.org/LimitedAvailability",
        en_transito: "https://schema.org/PreOrder",
      }[u.estado as string] ?? "https://schema.org/SoldOut",
    },
  };
  const mensaje = `Hola, me interesa la ${nombre} (${u.sku}) a ${enSoles(precio)}. ¿Sigue disponible?`;

  const specs: [string, string | null | undefined][] = [
    ["Marca", marca],
    ["Procesador", u.procesador],
    ["Memoria RAM", `${u.ram_gb} GB ${u.ram_tipo ?? ""}`],
    ["Almacenamiento", u.almacenamiento],
    ["Tarjeta de video", u.gpu],
    ["Pantalla", `${u.pantalla_pulg}″ ${u.pantalla_detalle ?? ""}`],
    ["Color", u.color],
    ["Sistema operativo", u.sistema],
    ["Año del modelo", u.modelos?.anio ? String(u.modelos.anio) : null],
    ["Condición", `${etiquetaCondicion[u.condicion]}${u.condicion === "seminuevo" || u.condicion === "remate" ? ` · Grado ${u.grado}` : ""}`],
    ["Garantía", `${u.garantia_meses} meses`],
    ["Código", u.sku],
  ];

  return (
    <TransicionPagina key={slug}>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
      />
      <nav className="flex items-center gap-1 text-sm text-muted">
        <Link href="/catalogo" className="hover:text-ink">Catálogo</Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/catalogo?categoria=${u.modelos?.categorias?.slug}`} className="hover:text-ink">
          {u.modelos?.categorias?.nombre}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-ink">{nombre}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr]">
        <Revelar>
          <Galeria medios={u.medios ?? []} marca={marca} categoria={u.modelos?.categorias?.slug} nombre={nombre} />
        </Revelar>

        <Revelar>
          <div className="flex flex-wrap items-center gap-2">
            <ChipCondicion condicion={u.condicion} grado={u.grado} />
            {u.estado === "disponible" && (
              <span className="chip bg-emerald-50 text-emerald-700">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                En tienda
              </span>
            )}
            {u.estado === "reservado" && <span className="chip bg-amber-100 text-amber-800">Reservado</span>}
            {u.estado === "en_transito" && <span className="chip bg-violet-100 text-violet-700">En camino desde EE.UU.</span>}
            {u.estado === "vendido" && <span className="chip bg-slate-800 text-white">Vendido</span>}
          </div>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted">{marca}</p>
          <h1 className="font-display text-4xl font-extrabold leading-tight">{nombre}</h1>
          <p className="mt-2 text-ink-2">
            {u.procesador} · {u.ram_gb} GB RAM · {u.almacenamiento}
            {u.gpu ? ` · ${u.gpu}` : ""}
          </p>

          <div className="card mt-6 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                {u.precio_oferta_pen != null && (
                  <p className="num text-sm text-muted line-through">{enSoles(u.precio_pen)}</p>
                )}
                <p className="num font-display text-4xl font-extrabold">{enSoles(precio)}</p>
                <p className="mt-1 text-xs text-muted">Precio en soles. Pago con Yape, Plin, transferencia o efectivo.</p>
              </div>
              {u.precio_oferta_pen != null && (
                <span className="chip bg-accent text-white">
                  −{Math.round((1 - Number(u.precio_oferta_pen) / Number(u.precio_pen)) * 100)}%
                </span>
              )}
            </div>
            {vendible ? (
              <>
                {u.estado === "disponible" && (
                  <a
                    href={enlaceWhatsApp(whatsapp, mensaje)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-whatsapp latido mt-5 w-full py-3 text-base font-bold"
                  >
                    <IconoWhatsApp className="size-5" /> Comprar por WhatsApp
                  </a>
                )}
                <a
                  href={enlaceWhatsApp(whatsapp, mensajeReserva)}
                  target="_blank"
                  rel="noreferrer"
                  className={u.estado === "en_transito" ? "btn-accent mt-5 w-full py-3 text-base" : "btn-ghost mt-2 w-full py-3"}
                >
                  <HandCoins className="size-5" /> Sepárala con {enSolesCorto(adelanto)} de adelanto
                </a>
                <p className="mt-2 text-center text-xs text-muted">
                  {u.estado === "en_transito"
                    ? "Con el adelanto te la guardamos y es tuya apenas llegue."
                    : `Te la guardamos ${RESERVA.dias} días. El adelanto se descuenta del precio.`}
                </p>
              </>
            ) : (
              <a
                href={enlaceWhatsApp(whatsapp, `Hola, vi la ${nombre} pero ya no está disponible. ¿Tienen algo similar?`)}
                target="_blank"
                rel="noreferrer"
                className="btn-primary mt-5 w-full py-3 text-base"
              >
                Pedir un equipo similar
              </a>
            )}
          </div>

          {u.estado === "en_transito" && (
            <FormAviso unidadId={u.id} titulo="Avísame cuando llegue" detalle="Te escribimos por WhatsApp apenas esté en tienda, con fotos reales." />
          )}
          {u.estado === "reservado" && (
            <FormAviso unidadId={u.id} titulo="Avísame si se libera" detalle="Otro cliente la separó. Si no la recoge, eres el primero en saberlo." />
          )}
          {u.estado === "vendido" && (
            <FormAviso unidadId={u.id} titulo="Avísame si llega una similar" detalle="Traemos equipos nuevos cada semana desde EE.UU." />
          )}

          <ul className="mt-5 grid gap-2 text-sm text-ink-2 sm:grid-cols-3">
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-green" /> {u.garantia_meses} meses de garantía</li>
            <li className="flex items-center gap-2"><Truck className="size-4 text-green" /> Envío a todo el Perú</li>
            <li className="flex items-center gap-2"><Store className="size-4 text-green" /> Pruébala en tienda</li>
          </ul>

          {(u.condicion === "seminuevo" || u.condicion === "remate") && (
            <div className="mt-5 rounded-xl border border-line p-4 text-sm">
              <p className="font-semibold">¿Qué significa Grado {u.grado}?</p>
              <p className="mt-1 text-muted">{explicacionGrado[u.grado]}</p>
            </div>
          )}
        </Revelar>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <Revelar como="section">
          <h2 className="font-display text-2xl font-extrabold">Ficha técnica</h2>
          <dl className="card mt-4 divide-y divide-line">
            {specs
              .filter(([, v]) => v && v.trim())
              .map(([k, v]) => (
                <div key={k} className="grid grid-cols-[160px_1fr] gap-4 px-5 py-3 text-sm">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
          </dl>
        </Revelar>
        <Revelar como="section">
          <h2 className="font-display text-2xl font-extrabold">Descripción</h2>
          <p className="mt-4 leading-relaxed text-ink-2">{textoDescripcion}</p>
          <h3 className="mt-6 font-semibold">Incluye</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
            {["Cargador original", "Limpieza interna y pasta térmica nueva", "Windows activado y programas básicos", "Comprobante con número de serie"].map((t) => (
              <li key={t} className="flex gap-2"><CheckCircle2 className="size-4 text-green" /> {t}</li>
            ))}
          </ul>
        </Revelar>
      </div>

      {otrasConfig.length > 0 && (
        <section className="mt-16">
          <Revelar como="h2" className="font-display text-2xl font-extrabold">Otras configuraciones de este modelo</Revelar>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {otrasConfig.map((x) => <TarjetaEquipo key={x.id} u={x} />)}
          </div>
        </section>
      )}

      {relacionados.length > 0 && (
        <section className="mt-16">
          <Revelar como="h2" className="font-display text-2xl font-extrabold">También te puede interesar</Revelar>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relacionados.map((x) => <TarjetaEquipo key={x.id} u={x} />)}
          </div>
        </section>
      )}
    </div>
    </TransicionPagina>
  );
}
