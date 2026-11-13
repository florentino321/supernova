"use client";

import { crearClienteNavegador } from "./supabase/client";
import { agregarMedio } from "@/app/admin/acciones";

/**
 * Comprime cada foto en el navegador antes de subirla: máx. 1600 px y JPEG al 82 %.
 * Una foto de celular de 4–8 MB queda en ~200–400 KB. Se usa JPEG (no WebP) porque
 * WhatsApp y Facebook lo leen siempre en la vista previa; la web igual la sirve en WebP/AVIF.
 */
const LADO_MAX = 1600;
export async function comprimir(file: File): Promise<Blob> {
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

/** Revisa que el archivo sea una foto o un video aceptado. Devuelve el motivo si no lo es. */
export function validarArchivo(file: File): string | null {
  const esVideo = file.type.startsWith("video/");
  if (!esVideo && !file.type.startsWith("image/")) return `${file.name}: solo se aceptan fotos o videos.`;
  if (esVideo && file.size > 100 * 1024 * 1024) return `${file.name}: el video supera los 100 MB. Súbelo a YouTube o TikTok y pega el enlace.`;
  return null;
}

/** Comprime (si es foto), sube a Storage y registra el archivo en la ficha del equipo. */
export async function subirArchivo(unidadId: number, file: File) {
  const supabase = crearClienteNavegador();
  const esVideo = file.type.startsWith("video/");
  const cuerpo = esVideo ? file : await comprimir(file);
  const ext = cuerpo.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() ?? "bin").toLowerCase();
  const ruta = `unidades/${unidadId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("medios").upload(ruta, cuerpo, {
    contentType: cuerpo.type || file.type,
    cacheControl: "31536000",
  });
  if (error) throw error;
  const { data } = supabase.storage.from("medios").getPublicUrl(ruta);
  const r = await agregarMedio(unidadId, esVideo ? "video" : "imagen", data.publicUrl, ruta);
  if (r.error) throw new Error(r.error);
}
