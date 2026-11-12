"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { PlaceholderLaptop } from "@/components/placeholder-laptop";
import { esVertical, urlEmbebida } from "@/lib/video";
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.url} alt={nombre} className="size-full object-contain" />
        ) : m.tipo === "video" ? (
          <video src={m.url} controls playsInline className="size-full bg-black object-contain" />
        ) : urlEmbebida(m.url) ? (
          <div className="grid size-full place-items-center bg-black">
            <iframe
              src={urlEmbebida(m.url)!}
              className={esVertical(m.url) ? "h-full aspect-[9/16]" : "size-full"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`Video de ${nombre}`}
            />
          </div>
        ) : (
          <a href={m.url} target="_blank" rel="noreferrer" className="grid size-full place-items-center text-blue underline">
            Ver video
          </a>
        )}
        <p className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-0.5 text-[11px] text-white">
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
                // eslint-disable-next-line @next/next/no-img-element
                <img src={x.url} alt="" className="size-full object-cover" />
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
