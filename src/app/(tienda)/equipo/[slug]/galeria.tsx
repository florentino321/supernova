"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { PlaceholderLaptop } from "@/components/placeholder-laptop";
import { idYoutube, urlEmbebida } from "@/lib/video";
import type { Medio } from "@/lib/tipos";

export function Galeria({ medios, marca, categoria, nombre }: { medios: Medio[]; marca: string; categoria?: string; nombre: string }) {
  const ordenados = [...medios].sort((a, b) => Number(b.es_portada) - Number(a.es_portada) || a.posicion - b.posicion);
  const [activo, setActivo] = useState(0);
  const m = ordenados[activo];

  return (
    <div>
      <div className="card relative aspect-[4/3] overflow-hidden bg-surface-2">
        {!m ? (
          <PlaceholderLaptop marca={marca} categoria={categoria} className="size-full" />
        ) : m.tipo === "imagen" ? (
          <Image
            src={m.url}
            alt={`${nombre}, foto ${activo + 1}`}
            fill
            priority={activo === 0}
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-contain"
          />
        ) : m.tipo === "video" ? (
          <video src={m.url} controls playsInline preload="metadata" className="size-full bg-black object-contain" />
        ) : (
          <VideoEnlace url={m.url} nombre={nombre} key={m.id} />
        )}
        <p className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-0.5 text-[11px] text-white">
          {m ? "Fotos reales del equipo" : "Imagen referencial"}
        </p>
      </div>
      {ordenados.length > 1 && (
        <div className="scroll-fino mt-3 flex gap-2 overflow-x-auto pb-1">
          {ordenados.map((x, i) => (
            <button
              key={x.id}
              onClick={() => setActivo(i)}
              className={`relative size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-surface-2 transition ${
                i === activo ? "border-navy" : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={`Ver ${x.tipo === "imagen" ? "foto" : "video"} ${i + 1}`}
            >
              {x.tipo === "imagen" ? (
                <Image src={x.url} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <span className="grid size-full place-items-center bg-navy text-white">
                  <Play className="size-6" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Videos externos sin cargar código de terceros al abrir la ficha:
 * - YouTube: miniatura liviana; el reproductor se carga solo al tocar "play".
 * - TikTok: botón que abre el video en TikTok (su reproductor incrustado es muy pesado).
 */
function VideoEnlace({ url, nombre }: { url: string; nombre: string }) {
  const [cargar, setCargar] = useState(false);
  const yt = idYoutube(url);

  if (yt) {
    if (cargar) {
      return (
        <iframe
          src={`${urlEmbebida(url)}?autoplay=1&rel=0`}
          className="size-full bg-black"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`Video de ${nombre}`}
        />
      );
    }
    return (
      <button onClick={() => setCargar(true)} className="group relative size-full bg-black" aria-label={`Reproducir video de ${nombre}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="" className="size-full object-cover opacity-80" loading="lazy" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid size-16 place-items-center rounded-full bg-accent text-white shadow-xl transition group-hover:scale-110">
            <Play className="ml-1 size-7" />
          </span>
        </span>
      </button>
    );
  }

  const tiktok = /tiktok\.com/.test(url);
  return (
    <div className="grid size-full place-items-center bg-navy p-6 text-center text-white">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-white/10">
          <Play className="ml-1 size-7" />
        </span>
        <p className="mt-4 font-display text-xl font-bold">Mira este equipo en video</p>
        <p className="mt-1 text-sm text-white/60">{tiktok ? "Se abre en TikTok" : "Se abre en otra pestaña"}</p>
        <a href={url} target="_blank" rel="noreferrer" className="btn-accent mt-5">
          <ExternalLink className="size-4" /> {tiktok ? "Ver en TikTok" : "Ver video"}
        </a>
      </div>
    </div>
  );
}
