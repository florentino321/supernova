"use server";

import { crearClientePublico } from "@/lib/supabase/publico";

export type EstadoAviso = { ok?: string; error?: string };

/** "Avísame cuando llegue": el visitante deja su nombre y WhatsApp. Solo puede insertar, no leer. */
export async function registrarAviso(_: EstadoAviso, f: FormData): Promise<EstadoAviso> {
  // campo trampa: los bots lo llenan, las personas no lo ven
  if (String(f.get("sitio_web") ?? "")) return { ok: "¡Listo! Te escribiremos por WhatsApp." };

  const nombre = String(f.get("nombre") ?? "").trim().slice(0, 80);
  let telefono = String(f.get("telefono") ?? "").replace(/[^\d+]/g, "");
  const unidadId = Number(f.get("unidad_id")) || null;
  const mensaje = String(f.get("mensaje") ?? "").trim().slice(0, 300) || null;

  if (nombre.length < 2) return { error: "Escribe tu nombre." };
  if (/^9\d{8}$/.test(telefono)) telefono = `51${telefono}`; // celular peruano sin código de país
  telefono = telefono.replace(/^\+/, "");
  if (!/^\d{9,15}$/.test(telefono)) return { error: "Escribe un número de WhatsApp válido (9 dígitos)." };

  const { error } = await crearClientePublico().from("avisos").insert({ unidad_id: unidadId, nombre, telefono, mensaje });
  if (error && !error.message.includes("duplicate")) {
    console.error("Aviso:", error.message);
    return { error: "No pudimos registrar tu pedido. Escríbenos por WhatsApp." };
  }
  return { ok: "¡Listo! Te escribiremos por WhatsApp apenas tengamos novedades." };
}
