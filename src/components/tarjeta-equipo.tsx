import Image from "next/image";
import Link from "next/link";
import { Cpu, Gpu, HardDrive, MemoryStick } from "lucide-react";
import { portada } from "@/lib/catalogo";
import { enSoles } from "@/lib/formato";
import type { UnidadPublica } from "@/lib/tipos";
import { ChipCondicion } from "./chips";
import { PlaceholderLaptop } from "./placeholder-laptop";
import { Revelar } from "@/components/revelar";

const insignia =
  "num w-fit rounded-md px-2 py-1 text-xs font-extrabold leading-none shadow-[0_4px_10px_-4px_rgba(0,0,0,0.45)]";

/** "Intel Core i5-12500H" → { marca: "intel", linea: "CORE I5" } para la insignia del procesador. */
function procesadorCorto(procesador: string) {
  const m = procesador.trim().match(/^(Intel|AMD|Apple|Qualcomm|MediaTek)\s+(.+)$/i);
  const resto = m?.[2] ?? procesador.trim();
  const familia =
    resto.match(
      /^(Core\s+Ultra\s+\d|Core\s+i\d|Core\s+m\d|Ryzen\s+(?:AI\s+)?\d|Ryzen|Athlon|Celeron|Pentium(?:\s+(?:Silver|Gold))?|Xeon|M\d(?:\s+(?:Pro|Max|Ultra))?|Snapdragon\s+X\w*)/i,
    )?.[0] ?? resto.split(/[\s-]/)[0];
  return { marca: (m?.[1] ?? "").toLowerCase(), linea: familia.toUpperCase() };
}

const colorMarcaCpu: Record<string, string> = {
  intel: "text-[#0068b5] lowercase",
  amd: "text-[#e1251b] uppercase",
  apple: "text-ink",
  qualcomm: "text-[#3253dc]",
  mediatek: "text-[#ec9430]",
};

/** Solo las tarjetas de video dedicadas llevan insignia (sin la VRAM, para que entre). */
function gpuDedicada(gpu: string | null | undefined) {
  if (!gpu || !/nvidia|geforce|rtx|gtx|quadro|radeon\s+(rx|pro)|arc\s+a\d/i.test(gpu)) return null;
  const nombre = gpu.replace(/\s*\d+\s*GB$/i, "").toUpperCase();
  const nvidia = /nvidia|geforce|rtx|gtx|quadro/i.test(gpu);
  return {
    nombre,
    color: nvidia ? "from-[#1f4d06] to-[#76b900]" : /radeon/i.test(gpu) ? "from-[#7a0d12] to-[#e1251b]" : "from-[#1b2f6b] to-[#0068b5]",
  };
}

export function TarjetaEquipo({ u }: { u: UnidadPublica }) {
  const img = portada(u);
  const marca = u.modelos?.marcas?.nombre ?? "";
  const vendido = u.estado === "vendido";
  const oferta = u.precio_oferta_pen != null;
  const cpu = procesadorCorto(u.procesador);
  const gpu = gpuDedicada(u.gpu);
  return (
    <Revelar className="h-full">
      <Link
        href={`/equipo/${u.slug}`}
        data-pulso
        className={`group card relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(11,22,38,0.4)] active:scale-[0.98] ${
          vendido ? "opacity-70" : ""
        }`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
          {img ? (
            <Image
              src={img.url}
              alt={u.modelos?.nombre ?? "Laptop"}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <PlaceholderLaptop
              marca={marca}
              categoria={u.modelos?.categorias?.slug}
              className="size-full transition duration-700 group-hover:scale-105"
            />
          )}

          {/* pantalla · RAM · almacenamiento */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5 transition duration-300 group-hover:translate-x-0.5">
            <span className={`${insignia} bg-[#ffd21f] text-ink`} title="Tamaño de pantalla">
              {Number(u.pantalla_pulg)} pulg
            </span>
            <span className={`${insignia} bg-[#6d28d9] text-white`} title="Memoria RAM">
              {u.ram_gb} GB RAM
            </span>
            <span className={`${insignia} max-w-36 truncate bg-[#2563eb] text-white`} title={`Almacenamiento: ${u.almacenamiento}`}>
              {u.almacenamiento}
            </span>
          </div>

          {/* estado */}
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            {oferta && !vendido && <span className="chip bg-accent text-white">Oferta</span>}
            {u.estado === "en_transito" && <span className="chip bg-violet-600 text-white">Llega pronto</span>}
            {u.estado === "reservado" && <span className="chip bg-amber-500 text-white">Reservado</span>}
            {vendido && <span className="chip bg-slate-800 text-white">Vendido</span>}
          </div>

          {/* procesador y tarjeta de video */}
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
            <span
              className="shrink-0 rounded-lg bg-white px-2 py-1 text-center leading-none shadow-[0_4px_12px_-4px_rgba(0,0,0,0.35)]"
              title={u.procesador}
            >
              {cpu.marca && (
                <span className={`block font-display text-[13px] font-extrabold ${colorMarcaCpu[cpu.marca] ?? "text-ink"}`}>
                  {cpu.marca}
                </span>
              )}
              <span className="mt-0.5 block text-[10px] font-bold tracking-wide text-ink-2">{cpu.linea}</span>
            </span>
            {gpu && (
              <span
                className={`min-w-0 truncate rounded-lg bg-gradient-to-r ${gpu.color} px-2 py-1.5 text-[10px] font-extrabold tracking-wide text-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.45)]`}
                title={u.gpu ?? ""}
              >
                {gpu.nombre}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="font-display text-lg font-bold leading-snug text-ink">{u.modelos?.nombre}</h3>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
              {marca} · {u.modelos?.categorias?.nombre}
            </p>
          </div>
          <ul className="space-y-1.5 text-[13px] text-ink-2">
            <li className="flex min-w-0 items-center gap-2" title={u.procesador}>
              <Cpu className="size-3.5 shrink-0 text-muted" />
              <span className="truncate">{u.procesador}</span>
            </li>
            {u.gpu && (
              <li className="flex min-w-0 items-center gap-2" title={u.gpu}>
                <Gpu className="size-3.5 shrink-0 text-muted" />
                <span className="truncate">{u.gpu}</span>
              </li>
            )}
            <li className="flex items-center gap-2">
              <MemoryStick className="size-3.5 shrink-0 text-muted" />
              {u.ram_gb} GB RAM{u.ram_tipo ? ` ${u.ram_tipo}` : ""}
            </li>
            <li className="flex min-w-0 items-center gap-2" title={u.almacenamiento}>
              <HardDrive className="size-3.5 shrink-0 text-muted" />
              <span className="truncate">{u.almacenamiento}</span>
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
    </Revelar>
  );
}
