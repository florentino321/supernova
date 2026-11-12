import Link from "next/link";
import { Cpu, HardDrive, MemoryStick, Monitor } from "lucide-react";
import { portada } from "@/lib/catalogo";
import { enSoles } from "@/lib/formato";
import type { UnidadPublica } from "@/lib/tipos";
import { ChipCondicion } from "./chips";
import { PlaceholderLaptop } from "./placeholder-laptop";

export function TarjetaEquipo({ u }: { u: UnidadPublica }) {
  const img = portada(u);
  const marca = u.modelos?.marcas?.nombre ?? "";
  const vendido = u.estado === "vendido";
  const oferta = u.precio_oferta_pen != null;
  return (
    <Link
      href={`/equipo/${u.slug}`}
      className={`group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(11,22,38,0.25)] ${
        vendido ? "opacity-70" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img.url}
            alt={u.modelos?.nombre ?? "Laptop"}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <PlaceholderLaptop marca={marca} categoria={u.modelos?.categorias?.slug} className="size-full" />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {oferta && !vendido && <span className="chip bg-accent text-white">Oferta</span>}
          {u.estado === "en_transito" && <span className="chip bg-violet-600 text-white">Llega pronto</span>}
          {u.estado === "reservado" && <span className="chip bg-amber-500 text-white">Reservado</span>}
          {vendido && <span className="chip bg-slate-800 text-white">Vendido</span>}
        </div>
        <span className="absolute bottom-3 right-3 chip bg-white/90 text-ink backdrop-blur">Pieza única</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {marca} · {u.modelos?.categorias?.nombre}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold leading-snug text-ink">{u.modelos?.nombre}</h3>
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px] text-ink-2">
          <li className="flex min-w-0 items-center gap-1.5" title={u.procesador}>
            <Cpu className="size-3.5 shrink-0 text-muted" />
            <span className="truncate">{u.procesador.replace(/^(Intel |AMD |Apple )/, "")}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <MemoryStick className="size-3.5 shrink-0 text-muted" />
            {u.ram_gb} GB RAM
          </li>
          <li className="flex min-w-0 items-center gap-1.5" title={u.almacenamiento}>
            <HardDrive className="size-3.5 shrink-0 text-muted" />
            <span className="truncate">{u.almacenamiento}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Monitor className="size-3.5 shrink-0 text-muted" />
            {u.pantalla_pulg}″
          </li>
        </ul>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-3">
          <div>
            {oferta && <p className="num text-xs text-muted line-through">{enSoles(u.precio_pen)}</p>}
            <p className={`num font-display text-xl font-extrabold ${oferta ? "text-accent" : "text-ink"}`}>
              {enSoles(u.precio_oferta_pen ?? u.precio_pen)}
            </p>
          </div>
          <ChipCondicion condicion={u.condicion} grado={u.grado} />
        </div>
      </div>
    </Link>
  );
}
