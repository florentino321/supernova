"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requerirAdmin } from "@/lib/sesion";
import { TAG_EMPRESA } from "@/lib/empresa-datos";

export type Resultado = { error?: string; ok?: string };

const txt = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
};
const enlace = (v: string | null) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v);

/** Guarda los datos de la empresa (solo administrador). La web los muestra al instante. */
export async function guardarEmpresa(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase } = await requerirAdmin();
  const nombre = txt(f, "nombre");
  if (!nombre) return { error: "Escribe el nombre comercial." };

  let whatsapp = (txt(f, "whatsapp") ?? "").replace(/\D/g, "");
  if (/^9\d{8}$/.test(whatsapp)) whatsapp = `51${whatsapp}`; // celular peruano sin código de país
  if (!/^\d{9,15}$/.test(whatsapp)) return { error: "Escribe un número de WhatsApp válido (9 dígitos, o con código de país)." };

  const ruc = (txt(f, "ruc") ?? "").replace(/\D/g, "") || null;
  if (ruc && !/^(10|15|17|20)\d{9}$/.test(ruc)) return { error: "El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20." };

  const email = txt(f, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "El correo no es válido." };

  const { error } = await supabase
    .from("empresa")
    .update({
      nombre,
      razon_social: txt(f, "razon_social"),
      ruc,
      whatsapp,
      telefono: txt(f, "telefono"),
      email,
      direccion: txt(f, "direccion"),
      ciudad: txt(f, "ciudad"),
      horario: txt(f, "horario"),
      facebook: enlace(txt(f, "facebook")),
      instagram: enlace(txt(f, "instagram")),
      tiktok: enlace(txt(f, "tiktok")),
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { error: error.message.includes("row-level security") ? "Solo el administrador puede cambiar estos datos." : error.message };
  updateTag(TAG_EMPRESA);
  revalidatePath("/", "layout");
  return { ok: "Datos guardados. La web ya muestra la información nueva." };
}
