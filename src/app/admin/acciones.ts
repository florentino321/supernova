"use server";

import { revalidatePath, updateTag } from "next/cache";
import { TAG_CATALOGO } from "@/lib/catalogo";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { obtenerSesion, requerirAdmin } from "@/lib/sesion";
import { slugificar } from "@/lib/formato";
import type { EstadoUnidad, TipoMedia } from "@/lib/tipos";

export type Resultado = { error?: string; ok?: string; id?: number };

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
  updateTag(TAG_CATALOGO); // la tienda (en caché) muestra el cambio en la siguiente visita
  revalidatePath("/", "layout");
};

// =====================================================================
// UNIDADES (equipos del inventario)
// =====================================================================
/** "512 GB SSD + 1 TB HDD" → 1536 (GB totales, para ordenar y filtrar). */
function gbDe(texto: string) {
  let total = 0;
  for (const m of texto.matchAll(/(\d+(?:[.,]\d+)?)\s*(TB|GB)/gi)) total += Number(m[1].replace(",", ".")) * (m[2].toUpperCase() === "TB" ? 1024 : 1);
  return Math.round(total) || 256;
}
/** Escapa los comodines de LIKE (% y _) para buscar el texto exacto. */
const sinComodines = (t: string) => t.replace(/[\\%_]/g, (c) => `\\${c}`);
const tituloDe = (t: string) => t.trim().replace(/\s+/g, " ");

/** Busca la marca por nombre (sin importar mayúsculas) o la crea. */
async function marcaPorNombre(supabase: SupabaseClient, nombre: string) {
  const limpio = tituloDe(nombre);
  // "huawei" → "Huawei"; si ya trae mayúsculas (HP, MSI, ASUS) se respeta
  const n = /\p{Lu}/u.test(limpio) ? limpio : limpio.replace(/(^|\s)(\p{L})/gu, (_, e, c: string) => e + c.toUpperCase());
  const { data } = await supabase.from("marcas").select("id").ilike("nombre", sinComodines(n)).limit(1).maybeSingle();
  if (data) return data.id as number;
  const slug = slugificar(n);
  const { data: nueva, error } = await supabase.from("marcas").insert({ nombre: n, slug }).select("id").single();
  if (!error) return nueva.id as number;
  const { data: porSlug } = await supabase.from("marcas").select("id").eq("slug", slug).maybeSingle();
  if (porSlug) return porSlug.id as number;
  throw new Error(error.message);
}

/** Busca el modelo por nombre dentro de la marca o lo crea (ya no hay que registrarlo aparte). */
async function modeloPorNombre(supabase: SupabaseClient, nombre: string, marcaId: number, categoriaId: number) {
  const n = tituloDe(nombre);
  const { data } = await supabase
    .from("modelos")
    .select("id, categoria_id")
    .eq("marca_id", marcaId)
    .ilike("nombre", sinComodines(n))
    .limit(1)
    .maybeSingle();
  if (data) {
    if (data.categoria_id !== categoriaId) await supabase.from("modelos").update({ categoria_id: categoriaId }).eq("id", data.id);
    return data.id as number;
  }
  const base = slugificar(n) || "laptop";
  for (let i = 0; i < 20; i++) {
    const slug = i ? `${base}-${i + 1}` : base;
    const { data: nuevo, error } = await supabase
      .from("modelos")
      .insert({ nombre: n, slug, marca_id: marcaId, categoria_id: categoriaId })
      .select("id")
      .single();
    if (!error) return nuevo.id as number;
    if (!error.message.includes("duplicate")) throw new Error(error.message);
  }
  throw new Error("No se pudo registrar el modelo.");
}

export async function guardarUnidad(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase } = await requerirAdmin(); // solo administrador
  const id = num(f, "id");
  const nombreModelo = txt(f, "modelo");
  const nombreMarca = txt(f, "marca");
  const categoriaId = num(f, "categoria_id");
  if (!nombreModelo) return { error: "Escribe el modelo del equipo (por ejemplo, Dell Latitude 5420)." };
  if (!nombreMarca) return { error: "Escribe o elige la marca." };
  if (!categoriaId) return { error: "Elige la categoría." };
  const procesador = txt(f, "procesador");
  if (!procesador) return { error: "Elige el procesador." };
  const almacenamiento = txt(f, "almacenamiento");
  if (!almacenamiento) return { error: "Elige el almacenamiento." };
  const precio = num(f, "precio_pen");
  if (!precio || precio <= 0) return { error: "Ingresa un precio de venta válido." };
  const oferta = num(f, "precio_oferta_pen");
  if (oferta !== null && oferta >= precio) return { error: "El precio de oferta debe ser menor al precio normal." };
  const adquisicion = num(f, "costo_adquisicion_pen");
  if (adquisicion !== null && adquisicion < 0) return { error: "El precio de adquisición no puede ser negativo." };

  let modeloId: number;
  try {
    const marcaId = await marcaPorNombre(supabase, nombreMarca);
    modeloId = await modeloPorNombre(supabase, nombreModelo, marcaId, categoriaId);
  } catch (e) {
    return { error: traducirError((e as Error).message) };
  }

  const datos = {
    modelo_id: modeloId,
    procesador,
    ram_gb: num(f, "ram_gb") ?? 8,
    almacenamiento,
    almacenamiento_gb: gbDe(almacenamiento),
    gpu: txt(f, "gpu"),
    pantalla_pulg: num(f, "pantalla_pulg") ?? 15.6,
    condicion: txt(f, "condicion") ?? "seminuevo",
    grado: txt(f, "grado") ?? "A",
    garantia_meses: num(f, "garantia_meses") ?? 12,
    costo_adquisicion_pen: adquisicion,
    precio_pen: precio,
    precio_oferta_pen: oferta,
    estado: (txt(f, "estado") ?? "disponible") as EstadoUnidad,
    publicado: f.get("publicado") === "on",
    ingresado_en: txt(f, "ingresado_en") ?? new Date().toISOString().slice(0, 10),
  };

  if (id) {
    const { error } = await supabase.from("unidades").update(datos).eq("id", id);
    if (error) return { error: traducirError(error.message) };
    refrescar();
    return { ok: "Cambios guardados." };
  }

  // código correlativo LA-1001, LA-1002…
  const { data: ult } = await supabase.from("unidades").select("sku").like("sku", "LA-%").order("sku", { ascending: false }).limit(1);
  const sku = `LA-${Number(ult?.[0]?.sku?.slice(3) ?? 1000) + 1}`;
  const slug = `${slugificar(nombreModelo)}-${slugificar(sku)}`;
  const { data, error } = await supabase.from("unidades").insert({ ...datos, sku, slug }).select("id").single();
  if (error) return { error: traducirError(error.message) };
  refrescar();
  // el formulario sube las fotos elegidas y luego abre la ficha del equipo
  return { ok: `Equipo ${sku} registrado.`, id: data.id };
}

export async function cambiarEstadoUnidad(id: number, estado: EstadoUnidad) {
  const { supabase } = await requerirAdmin(); // solo administrador
  const { error } = await supabase.from("unidades").update({ estado }).eq("id", id);
  if (error) return { error: traducirError(error.message) };
  refrescar();
  return { ok: "Estado actualizado." };
}

export async function eliminarUnidad(id: number): Promise<Resultado> {
  const { supabase, esAdmin } = await obtenerSesion();
  if (!esAdmin) return { error: "Solo un administrador puede eliminar equipos." };
  const { count } = await supabase.from("ventas").select("id", { count: "exact", head: true }).eq("unidad_id", id);
  if (count) return { error: "Este equipo tiene ventas registradas. Márcalo como 'De baja' en lugar de eliminarlo." };
  const { data: medios } = await supabase.from("medios").select("ruta").eq("unidad_id", id);
  const rutas = (medios ?? []).map((m) => m.ruta).filter(Boolean) as string[];
  if (rutas.length) await supabase.storage.from("medios").remove(rutas);
  const { error } = await supabase.from("unidades").delete().eq("id", id);
  if (error) return { error: traducirError(error.message) };
  refrescar();
  redirect("/admin/inventario?eliminado=1");
}

// =====================================================================
// FOTOS Y VIDEOS
// =====================================================================
export async function agregarMedio(unidadId: number, tipo: TipoMedia, url: string, ruta: string | null): Promise<Resultado> {
  const { supabase } = await requerirAdmin(); // solo administrador
  const { data: existentes } = await supabase.from("medios").select("id, es_portada").eq("unidad_id", unidadId);
  const sinPortada = tipo === "imagen" && !(existentes ?? []).some((m) => m.es_portada);
  const { error } = await supabase.from("medios").insert({
    unidad_id: unidadId,
    tipo,
    url,
    ruta,
    posicion: existentes?.length ?? 0,
    es_portada: sinPortada,
  });
  if (error) return { error: traducirError(error.message) };
  refrescar();
  return { ok: "Archivo agregado." };
}

export async function ordenarMedios(unidadId: number, ids: number[]) {
  const { supabase } = await requerirAdmin(); // solo administrador
  await Promise.all(ids.map((id, i) => supabase.from("medios").update({ posicion: i }).eq("id", id).eq("unidad_id", unidadId)));
  refrescar();
}

export async function marcarPortada(unidadId: number, medioId: number) {
  const { supabase } = await requerirAdmin(); // solo administrador
  await supabase.from("medios").update({ es_portada: false }).eq("unidad_id", unidadId);
  await supabase.from("medios").update({ es_portada: true }).eq("id", medioId);
  refrescar();
}

export async function eliminarMedio(medioId: number): Promise<Resultado> {
  const { supabase } = await requerirAdmin(); // solo administrador
  const { data: m } = await supabase.from("medios").select("*").eq("id", medioId).single();
  if (!m) return { error: "No encontrado." };
  if (m.ruta) await supabase.storage.from("medios").remove([m.ruta]);
  await supabase.from("medios").delete().eq("id", medioId);
  if (m.es_portada) {
    const { data: sig } = await supabase
      .from("medios")
      .select("id")
      .eq("unidad_id", m.unidad_id)
      .eq("tipo", "imagen")
      .order("posicion")
      .limit(1);
    if (sig?.[0]) await supabase.from("medios").update({ es_portada: true }).eq("id", sig[0].id);
  }
  refrescar();
  return { ok: "Eliminado." };
}

// =====================================================================
// CLIENTES
// =====================================================================
export async function guardarCliente(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase } = await requerirAdmin(); // solo administrador
  const id = num(f, "id");
  const nombre = txt(f, "nombre");
  if (!nombre) return { error: "Escribe el nombre del cliente." };
  const datos = {
    nombre,
    tipo_doc: txt(f, "tipo_doc") ?? "DNI",
    num_doc: txt(f, "num_doc"),
    telefono: txt(f, "telefono"),
    email: txt(f, "email"),
    ciudad: txt(f, "ciudad"),
  };
  const { error } = id
    ? await supabase.from("clientes").update(datos).eq("id", id)
    : await supabase.from("clientes").insert(datos);
  if (error) return { error: traducirError(error.message) };
  refrescar();
  return { ok: id ? "Cliente actualizado." : "Cliente registrado." };
}

// =====================================================================
// VENTAS
// =====================================================================
export async function registrarVenta(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, user } = await obtenerSesion();
  const unidadId = num(f, "unidad_id");
  if (!unidadId) return { error: "Elige el equipo que se vende." };
  const precio = num(f, "precio_lista_pen");
  if (!precio || precio <= 0) return { error: "Ingresa el precio." };
  const descuento = num(f, "descuento_pen") ?? 0;
  if (descuento < 0 || descuento >= precio) return { error: "El descuento no es válido." };

  let clienteId = num(f, "cliente_id");
  const nombreNuevo = txt(f, "cliente_nombre");
  const docNuevo = txt(f, "cliente_num_doc");
  // si ya existe un cliente con ese DNI/RUC se reutiliza (evita duplicados al reintentar)
  if (!clienteId && nombreNuevo && docNuevo) {
    const { data: existente } = await supabase.from("clientes").select("id").eq("num_doc", docNuevo).limit(1).maybeSingle();
    if (existente) clienteId = existente.id;
  }
  if (!clienteId && nombreNuevo) {
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nombre: nombreNuevo,
        tipo_doc: txt(f, "cliente_tipo_doc") ?? "DNI",
        num_doc: docNuevo,
        telefono: txt(f, "cliente_telefono"),
        ciudad: txt(f, "cliente_ciudad"),
      })
      .select("id")
      .single();
    if (error) return { error: traducirError(error.message) };
    clienteId = data.id;
  }

  const fechaTxt = txt(f, "fecha");

  // el código V-00001… lo asigna la base de datos (secuencia ventas_codigo_seq)
  const { data, error } = await supabase
    .from("ventas")
    .insert({
      unidad_id: unidadId,
      cliente_id: clienteId,
      vendedor_id: user.id,
      // el formulario envía hora local de Perú (UTC−5) sin zona horaria
      fecha: fechaTxt ? new Date(fechaTxt.length === 16 ? `${fechaTxt}:00-05:00` : fechaTxt).toISOString() : new Date().toISOString(),
      precio_lista_pen: precio,
      descuento_pen: descuento,
      metodo_pago: txt(f, "metodo_pago") ?? "efectivo",
      canal: txt(f, "canal") ?? "tienda",
      notas: txt(f, "notas"),
    })
    .select("id")
    .single();
  if (error) return { error: traducirError(error.message) };
  refrescar();
  redirect(`/admin/ventas/${data.id}?nueva=1`);
}

export async function anularVenta(id: number, motivo: string): Promise<Resultado> {
  const { supabase, esAdmin } = await obtenerSesion();
  if (!esAdmin) return { error: "Solo un administrador puede anular ventas." };
  const { error } = await supabase
    .from("ventas")
    .update({ estado: "anulada", notas: motivo ? `Anulada: ${motivo}` : "Anulada" })
    .eq("id", id)
    .eq("estado", "completada");
  if (error) return { error: traducirError(error.message) };
  refrescar();
  return { ok: "Venta anulada. El equipo volvió a estar disponible." };
}

// =====================================================================
function traducirError(msg: string) {
  if (msg.includes("duplicate key") && msg.includes("sku")) return "Ya existe un equipo con ese código (SKU).";
  if (msg.includes("duplicate key") && msg.includes("serie")) return "Ya existe un equipo con ese número de serie.";
  if (msg.includes("duplicate key") && msg.includes("codigo")) return "Ese código ya está en uso.";
  if (msg.includes("duplicate key")) return "Ya existe un registro con esos datos.";
  if (msg.includes("ventas_unidad_completada")) return "Ese equipo ya fue vendido.";
  if (msg.includes("no está disponible")) return msg.replace(/^.*?El equipo/, "El equipo");
  if (msg.includes("row-level security")) return "No tienes permisos para esta acción.";
  return msg;
}
