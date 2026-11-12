"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { GripVertical, ImagePlus, Link2, Loader2, Play, Star, Trash2 } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { urlEmbebida } from "@/lib/video";
import type { Medio } from "@/lib/tipos";
import { agregarMedio, eliminarMedio, marcarPortada, ordenarMedios } from "../../acciones";

/** Reduce fotos muy grandes antes de subirlas (máx. 1800 px, WebP). */
async function comprimir(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.size < 900_000) return file;
  const bmp = await createImageBitmap(file);
  const escala = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * escala);
  canvas.height = Math.round(bmp.height * escala);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b ?? file), "image/webp", 0.85));
}

export function GestorMedios({ unidadId, medios }: { unidadId: number; medios: Medio[] }) {
  const router = useRouter();
  const [lista, setLista] = useState(() => [...medios].sort((a, b) => a.posicion - b.posicion));
  const [subiendo, setSubiendo] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [enlace, setEnlace] = useState("");
  const [sobre, setSobre] = useState(false);
  const [, startTransition] = useTransition();
  const arrastrado = useRef<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // sincronizar cuando el servidor devuelve datos nuevos
  const firma = medios.map((m) => `${m.id}:${m.posicion}:${m.es_portada}`).join("|");
  const [firmaPrev, setFirmaPrev] = useState(firma);
  if (firma !== firmaPrev) {
    setFirmaPrev(firma);
    setLista([...medios].sort((a, b) => a.posicion - b.posicion));
  }

  const subir = async (files: FileList | File[]) => {
    setError("");
    const supabase = crearClienteNavegador();
    for (const file of Array.from(files)) {
      const esVideo = file.type.startsWith("video/");
      if (!esVideo && !file.type.startsWith("image/")) {
        setError(`${file.name}: solo se aceptan fotos o videos.`);
        continue;
      }
      if (esVideo && file.size > 100 * 1024 * 1024) {
        setError(`${file.name}: el video supera los 100 MB. Súbelo a YouTube/TikTok y pega el enlace.`);
        continue;
      }
      setSubiendo((s) => [...s, file.name]);
      try {
        const cuerpo = esVideo ? file : await comprimir(file);
        const ext = esVideo ? file.name.split(".").pop() : cuerpo.type === "image/webp" ? "webp" : file.name.split(".").pop();
        const ruta = `unidades/${unidadId}/${crypto.randomUUID()}.${ext}`;
        const { error: e } = await supabase.storage.from("medios").upload(ruta, cuerpo, {
          contentType: cuerpo.type || file.type,
          cacheControl: "31536000",
        });
        if (e) throw e;
        const { data } = supabase.storage.from("medios").getPublicUrl(ruta);
        const r = await agregarMedio(unidadId, esVideo ? "video" : "imagen", data.publicUrl, ruta);
        if (r.error) throw new Error(r.error);
      } catch (e) {
        setError(`${file.name}: ${(e as Error).message}`);
      } finally {
        setSubiendo((s) => s.filter((n) => n !== file.name));
      }
    }
    router.refresh();
  };

  const agregarEnlace = async () => {
    if (!urlEmbebida(enlace)) {
      setError("Pega un enlace válido de YouTube o TikTok.");
      return;
    }
    const r = await agregarMedio(unidadId, "video_url", enlace, null);
    if (r.error) setError(r.error);
    else setEnlace("");
    router.refresh();
  };

  const soltarEn = (destino: number) => {
    const origen = arrastrado.current;
    arrastrado.current = null;
    if (origen === null || origen === destino) return;
    const nueva = [...lista];
    const [m] = nueva.splice(origen, 1);
    nueva.splice(destino, 0, m);
    setLista(nueva);
    startTransition(() => ordenarMedios(unidadId, nueva.map((x) => x.id)));
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setSobre(true);
          }
        }}
        onDragLeave={() => setSobre(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setSobre(false);
          subir(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        className={`grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
          sobre ? "border-blue bg-blue-50" : "border-line hover:border-ink-2 hover:bg-surface-2"
        }`}
      >
        <ImagePlus className="size-8 text-muted" />
        <p className="mt-2 font-semibold">Arrastra fotos o videos aquí, o haz clic para elegir</p>
        <p className="text-sm text-muted">JPG, PNG, WebP · MP4, MOV (máx. 100 MB). Las fotos grandes se optimizan solas.</p>
        <input
          ref={input}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => e.target.files && subir(e.target.files)}
        />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="O pega un enlace de YouTube / TikTok" value={enlace} onChange={(e) => setEnlace(e.target.value)} />
        </div>
        <button type="button" className="btn-ghost" onClick={agregarEnlace} disabled={!enlace}>Agregar video</button>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {lista.map((m, i) => (
          <li
            key={m.id}
            draggable
            onDragStart={() => (arrastrado.current = i)}
            onDragOver={(e) => arrastrado.current !== null && e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              soltarEn(i);
            }}
            className={`group relative aspect-square overflow-hidden rounded-xl border-2 bg-surface-2 ${m.es_portada ? "border-accent" : "border-line"}`}
          >
            {m.tipo === "imagen" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt="" className="size-full object-cover" />
            ) : m.tipo === "video" ? (
              <video src={m.url} className="size-full object-cover" muted />
            ) : (
              <div className="grid size-full place-items-center bg-navy p-3 text-center text-xs text-white/80">
                <Play className="mb-1 size-7 text-white" />
                <span className="line-clamp-2 break-all">{m.url}</span>
              </div>
            )}
            {m.tipo !== "imagen" && <span className="chip absolute left-2 top-2 bg-black/60 text-white"><Play className="size-3" /> Video</span>}
            {m.es_portada && <span className="chip absolute left-2 top-2 bg-accent text-white">Portada</span>}
            <span className="absolute right-2 top-2 grid size-7 cursor-grab place-items-center rounded-lg bg-white/90 text-muted opacity-0 transition group-hover:opacity-100" title="Arrastra para ordenar">
              <GripVertical className="size-4" />
            </span>
            <div className="absolute inset-x-2 bottom-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
              {m.tipo === "imagen" && !m.es_portada && (
                <button
                  type="button"
                  className="btn flex-1 bg-white/95 px-2 py-1.5 text-xs text-ink"
                  onClick={() => startTransition(async () => { await marcarPortada(unidadId, m.id); router.refresh(); })}
                >
                  <Star className="size-3.5" /> Portada
                </button>
              )}
              <button
                type="button"
                className="btn ml-auto bg-white/95 px-2 py-1.5 text-xs text-red-600"
                onClick={() => {
                  if (!confirm("¿Eliminar este archivo?")) return;
                  setLista((l) => l.filter((x) => x.id !== m.id));
                  startTransition(async () => { await eliminarMedio(m.id); router.refresh(); });
                }}
                aria-label="Eliminar"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
        {subiendo.map((n) => (
          <li key={n} className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-line p-3 text-center text-xs text-muted">
            <Loader2 className="size-6 animate-spin" />
            <span className="line-clamp-2 break-all">{n}</span>
          </li>
        ))}
      </ul>
      {lista.length === 0 && subiendo.length === 0 && (
        <p className="text-sm text-muted">Este equipo aún no tiene fotos. En la web se mostrará una imagen referencial.</p>
      )}
    </div>
  );
}
