import { Suspense } from "react";
import { TarjetaEquipo } from "@/components/tarjeta-equipo";
import { obtenerCatalogo } from "@/lib/catalogo";
import { precioFinal } from "@/lib/formato";
import { Filtros } from "./filtros";
import { Orden } from "./orden";

export const metadata = { title: "Catálogo" };

export default async function Catalogo({ searchParams }: PageProps<"/catalogo">) {
  const sp = await searchParams;
  const p = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const { unidades, marcas, categorias } = await obtenerCatalogo();

  const q = p("q").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const estado = p("estado");
  let lista = unidades.filter((u) => {
    if (estado) {
      if (u.estado !== estado) return false;
    } else if (u.estado === "vendido" && !p("vendidos")) return false;
    if (p("categoria") && u.modelos?.categorias?.slug !== p("categoria")) return false;
    if (p("marca") && u.modelos?.marcas?.slug !== p("marca")) return false;
    if (p("condicion") && u.condicion !== p("condicion")) return false;
    if (p("ram") && u.ram_gb < Number(p("ram"))) return false;
    if (p("max") && precioFinal(u) > Number(p("max"))) return false;
    if (p("oferta") && u.precio_oferta_pen == null && u.condicion !== "remate") return false;
    if (q) {
      const texto = [u.modelos?.nombre, u.procesador, u.gpu, u.almacenamiento, u.color, u.modelos?.categorias?.nombre]
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
      if (!q.split(/\s+/).every((t) => texto.includes(t))) return false;
    }
    return true;
  });

  const orden = p("orden");
  if (orden === "precio_asc") lista = [...lista].sort((a, b) => precioFinal(a) - precioFinal(b));
  if (orden === "precio_desc") lista = [...lista].sort((a, b) => precioFinal(b) - precioFinal(a));
  if (orden === "recientes") lista = [...lista].sort((a, b) => b.ingresado_en.localeCompare(a.ingresado_en));
  if (orden === "ram") lista = [...lista].sort((a, b) => b.ram_gb - a.ram_gb);
  // los equipos en tránsito van al final salvo que se filtren
  if (!estado) lista = [...lista].sort((a, b) => Number(a.estado === "en_transito") - Number(b.estado === "en_transito"));

  const categoriaActual = categorias.find((c) => c.slug === p("categoria"));
  const titulo = estado === "en_transito" ? "Llegando pronto" : categoriaActual?.nombre ?? "Todo el catálogo";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="text-sm text-muted">Catálogo</p>
          <h1 className="font-display text-4xl font-extrabold">{titulo}</h1>
          <p className="mt-2 text-muted">
            {categoriaActual?.descripcion ?? "Cada tarjeta es un equipo físico único, con su propia serie."}{" "}
            <span className="num font-semibold text-ink">{lista.length}</span> resultados.
          </p>
        </div>
        <Suspense>
          <Orden />
        </Suspense>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <Suspense>
          <Filtros marcas={marcas} categorias={categorias} />
        </Suspense>
        <div>
          {lista.length === 0 ? (
            <div className="card grid place-items-center p-16 text-center">
              <p className="font-display text-xl font-bold">No encontramos equipos con esos filtros</p>
              <p className="mt-2 max-w-sm text-muted">
                Escríbenos por WhatsApp: podemos traer el modelo que buscas en el próximo lote desde EE.UU.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {lista.map((u) => (
                <TarjetaEquipo key={u.id} u={u} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
