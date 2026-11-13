"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { obtenerSesion } from "@/lib/sesion";
import { TAG_CATALOGO } from "@/lib/catalogo";
import type { Canal, EstadoAviso, MetodoPago } from "@/lib/tipos";

// Reservas, interesados ("Avísame") y cotizaciones. Los usa el administrador y el vendedor;
// la base de datos (RLS) asegura que cada vendedor solo vea y modifique lo suyo.

export type Resultado = { error?: string; ok?: string };

const txt = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
};
const num = (f: FormData, k: string) => {
  const v = txt(f, k);
  if (v === null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const refrescar = () => {
  updateTag(TAG_CATALOGO); // cambia el estado visible en la tienda (Reservado / Vendido)
  revalidatePath("/", "layout");
};

function traducir(msg: string) {
  if (msg.includes("reservas_unidad_activa")) return "Ese equipo ya tiene una reserva activa.";
  if (msg.includes("adelanto_menor_precio")) return "El adelanto debe ser menor que el precio acordado.";
  if (msg.includes("no se puede reservar")) return msg.replace(/^.*?El equipo/, "El equipo");
  if (msg.includes("no está disponible")) return msg.replace(/^.*?El equipo/, "El equipo");
  if (msg.includes("descuento_valido")) return "Algún descuento no es válido (debe ser menor que el precio).";
  if (msg.includes("row-level security")) return "No tienes permisos para esta acción.";
  return msg;
}

/** Usa el cliente elegido o registra uno nuevo (reutiliza si ya existe ese DNI/RUC). */
async function resolverCliente(supabase: SupabaseClient, f: FormData): Promise<{ id: number | null; error?: string }> {
  const id = num(f, "cliente_id");
  if (id) return { id };
  const nombre = txt(f, "cliente_nombre");
  if (!nombre) return { id: null };
  const doc = txt(f, "cliente_num_doc");
  if (doc) {
    const { data } = await supabase.from("clientes").select("id").eq("num_doc", doc).limit(1).maybeSingle();
    if (data) return { id: data.id };
  }
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nombre,
      tipo_doc: txt(f, "cliente_tipo_doc") ?? "DNI",
      num_doc: doc,
      telefono: txt(f, "cliente_telefono"),
      ciudad: txt(f, "cliente_ciudad"),
    })
    .select("id")
    .single();
  if (error) return { id: null, error: traducir(error.message) };
  return { id: data.id };
}

// =====================================================================
// RESERVAS
// =====================================================================
export async function crearReserva(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, user } = await obtenerSesion();
  const unidadId = num(f, "unidad_id");
  if (!unidadId) return { error: "Elige el equipo que se separa." };
  const precio = num(f, "precio_acordado_pen");
  const adelanto = num(f, "adelanto_pen");
  if (!precio || precio <= 0) return { error: "Indica el precio acordado." };
  if (!adelanto || adelanto <= 0) return { error: "Indica el monto del adelanto." };
  if (adelanto >= precio) return { error: "El adelanto debe ser menor que el precio acordado." };
  const vence = txt(f, "vence_en");
  if (!vence) return { error: "Indica hasta qué fecha se guarda el equipo." };

  const cliente = await resolverCliente(supabase, f);
  if (cliente.error) return { error: cliente.error };
  if (!cliente.id) return { error: "Indica el cliente que separa el equipo." };

  const { error } = await supabase.from("reservas").insert({
    unidad_id: unidadId,
    cliente_id: cliente.id,
    vendedor_id: user.id,
    precio_acordado_pen: precio,
    adelanto_pen: adelanto,
    metodo_pago: (txt(f, "metodo_pago") ?? "yape") as MetodoPago,
    vence_en: vence,
    notas: txt(f, "notas"),
  });
  if (error) return { error: traducir(error.message) };
  refrescar();
  redirect("/admin/reservas?creada=1");
}

export async function cancelarReserva(id: number, motivo: string): Promise<Resultado> {
  const { supabase } = await obtenerSesion();
  const { error, count } = await supabase
    .from("reservas")
    .update({ estado: "cancelada", notas: motivo ? `Cancelada: ${motivo}` : "Cancelada" }, { count: "exact" })
    .eq("id", id)
    .eq("estado", "activa");
  if (error) return { error: traducir(error.message) };
  if (!count) return { error: "La reserva ya no está activa." };
  refrescar();
  return { ok: "Reserva cancelada. El equipo volvió a estar disponible." };
}

// =====================================================================
// INTERESADOS ("Avísame cuando llegue")
// =====================================================================
export async function marcarAviso(id: number, estado: EstadoAviso): Promise<Resultado> {
  const { supabase } = await obtenerSesion();
  const { error } = await supabase.from("avisos").update({ estado }).eq("id", id);
  if (error) return { error: traducir(error.message) };
  revalidatePath("/admin", "layout");
  return { ok: "Actualizado." };
}

// =====================================================================
// COTIZACIONES
// =====================================================================
export async function crearCotizacion(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, user } = await obtenerSesion();
  const unidades = f.getAll("item_unidad").map(Number).filter(Boolean);
  const precios = f.getAll("item_precio").map((v) => Number(String(v).replace(",", ".")));
  const descuentos = f.getAll("item_descuento").map((v) => Number(String(v || 0).replace(",", ".")));
  if (!unidades.length) return { error: "Agrega al menos un equipo a la cotización." };
  for (let i = 0; i < unidades.length; i++) {
    if (!(precios[i] > 0)) return { error: "Revisa los precios: todos deben ser mayores que cero." };
    if (!(descuentos[i] >= 0) || descuentos[i] >= precios[i]) return { error: "Algún descuento no es válido." };
  }
  const valida = txt(f, "valida_hasta");
  if (!valida) return { error: "Indica hasta cuándo es válida la cotización." };

  const cliente = await resolverCliente(supabase, f);
  if (cliente.error) return { error: cliente.error };

  const { data: c, error } = await supabase
    .from("cotizaciones")
    .insert({ cliente_id: cliente.id, vendedor_id: user.id, valida_hasta: valida, notas: txt(f, "notas") })
    .select("id")
    .single();
  if (error) return { error: traducir(error.message) };

  const { error: eItems } = await supabase.from("cotizacion_items").insert(
    unidades.map((u, i) => ({ cotizacion_id: c.id, unidad_id: u, precio_pen: precios[i], descuento_pen: descuentos[i] || 0 })),
  );
  if (eItems) {
    await supabase.from("cotizaciones").update({ estado: "anulada" }).eq("id", c.id);
    return { error: traducir(eItems.message) };
  }
  revalidatePath("/admin/cotizaciones");
  redirect(`/admin/cotizaciones/${c.id}?nueva=1`);
}

export async function anularCotizacion(id: number): Promise<Resultado> {
  const { supabase } = await obtenerSesion();
  const { error } = await supabase.from("cotizaciones").update({ estado: "anulada" }).eq("id", id).eq("estado", "pendiente");
  if (error) return { error: traducir(error.message) };
  revalidatePath("/admin/cotizaciones");
  return { ok: "Cotización anulada." };
}

/** Convierte la cotización en ventas (una por equipo) en una sola transacción de la base de datos. */
export async function convertirCotizacion(id: number, metodo: MetodoPago, canal: Canal): Promise<Resultado> {
  const { supabase } = await obtenerSesion();
  const { data, error } = await supabase.rpc("convertir_cotizacion", { p_id: id, p_metodo: metodo, p_canal: canal });
  if (error) return { error: traducir(error.message) };
  refrescar();
  redirect(`/admin/ventas/${data}?nueva=1`);
}
