"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Camera, ChevronLeft, ChevronRight, GripVertical, ImagePlus, Link2, Loader2, Play, Star, Trash2 } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { esEnlaceVideoValido } from "@/lib/video";
import type { Medio } from "@/lib/tipos";
import { agregarMedio, eliminarMedio, marcarPortada, ordenarMedios } from "../../acciones";

/**
 * Comprime cada foto en el navegador antes de subirla: máx. 1600 px y JPEG al 82 %.
 * Una foto de celular de 4–8 MB queda en ~200–400 KB. Se usa JPEG (no WebP) porque
 * WhatsApp y Facebook lo leen siempre en la vista previa; la web igual la sirve en WebP/AVIF.
 */
const LADO_MAX = 1600;
async function comprimir(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // formato que el navegador no puede leer (p. ej. HEIC en Android): se sube tal cual
  }
  const escala = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * escala);
  canvas.height = Math.round(bmp.height * escala);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; // fondo blanco para PNG con transparencia
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.82));
  return blob && blob.size < file.size ? blob : file;
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
  const camara = useRef<HTMLInputElement>(null);

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
        const ext = cuerpo.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() ?? "bin").toLowerCase();
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
    if (!esEnlaceVideoValido(enlace)) {
      setError("Pega un enlace válido de YouTube o TikTok.");
      return;
    }
    const r = await agregarMedio(unidadId, "video_url", enlace, null);
    if (r.error) setError(r.error);
    else setEnlace("");
    router.refresh();
  };

  const mover = (origen: number, destino: number) => {
    if (destino < 0 || destino >= lista.length || origen === destino) return;
    const nueva = [...lista];
    const [m] = nueva.splice(origen, 1);
    nueva.splice(destino, 0, m);
    setLista(nueva);
    startTransition(() => ordenarMedios(unidadId, nueva.map((x) => x.id)));
  };
  const soltarEn = (destino: number) => {
    const origen = arrastrado.current;
    arrastrado.current = null;
    if (origen !== null) mover(origen, destino);
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
        <p className="mt-2 font-semibold">
          <span className="hidden sm:inline">Arrastra fotos o videos aquí, o haz clic para elegir</span>
          <span className="sm:hidden">Toca para elegir fotos o videos de tu galería</span>
        </p>
        <p className="text-sm text-muted">JPG, PNG, HEIC · MP4, MOV (máx. 100 MB). Las fotos se comprimen solas antes de subir.</p>
        <input
          ref={input}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => e.target.files && subir(e.target.files)}
        />
      </div>

      <input
        ref={camara}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && subir(e.target.files)}
      />
      <button type="button" className="btn-primary w-full py-3 sm:hidden" onClick={() => camara.current?.click()}>
        <Camera className="size-5" /> Tomar foto con la cámara
      </button>

      <div className="flex flex-col gap-2 sm:flex-row">
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
            <span className="absolute right-2 top-2 hidden size-7 cursor-grab place-items-center rounded-lg bg-white/90 text-muted opacity-0 transition group-hover:opacity-100 lg:grid" title="Arrastra para ordenar">
              <GripVertical className="size-4" />
            </span>
            {/* en celular los botones se ven siempre (no hay "hover"); en PC aparecen al pasar el mouse */}
            <div className="absolute inset-x-2 bottom-2 flex gap-1.5 transition lg:opacity-0 lg:group-hover:opacity-100">
              <button type="button" className="btn bg-white/95 px-1.5 py-1.5 text-ink disabled:opacity-40" disabled={i === 0} onClick={() => mover(i, i - 1)} aria-label="Mover a la izquierda">
                <ChevronLeft className="size-3.5" />
              </button>
              <button type="button" className="btn bg-white/95 px-1.5 py-1.5 text-ink disabled:opacity-40" disabled={i === lista.length - 1} onClick={() => mover(i, i + 1)} aria-label="Mover a la derecha">
                <ChevronRight className="size-3.5" />
              </button>
              {m.tipo === "imagen" && !m.es_portada && (
                <button
                  type="button"
                  className="btn flex-1 bg-white/95 px-2 py-1.5 text-xs text-ink"
                  onClick={() => startTransition(async () => { await marcarPortada(unidadId, m.id); router.refresh(); })}
                >
                  <Star className="size-3.5" /><span className="hidden sm:inline">Portada</span>
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
