"use server";

import { revalidatePath, updateTag } from "next/cache";
import { TAG_CATALOGO } from "@/lib/catalogo";
import { redirect } from "next/navigation";
import { obtenerSesion, requerirAdmin } from "@/lib/sesion";
import { slugificar } from "@/lib/formato";
import type { EstadoUnidad, TipoMedia } from "@/lib/tipos";

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
  updateTag(TAG_CATALOGO); // la tienda (en caché) muestra el cambio en la siguiente visita
  revalidatePath("/", "layout");
};

// =====================================================================
// UNIDADES (equipos del inventario)
// =====================================================================
export async function guardarUnidad(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase } = await requerirAdmin(); // solo administrador
  const id = num(f, "id");
  const modeloId = num(f, "modelo_id");
  if (!modeloId) return { error: "Elige el modelo del equipo." };
  const precio = num(f, "precio_pen");
  if (!precio || precio <= 0) return { error: "Ingresa un precio de venta válido." };
  const oferta = num(f, "precio_oferta_pen");
  if (oferta !== null && oferta >= precio) return { error: "El precio de oferta debe ser menor al precio normal." };

  let sku = txt(f, "sku");
  if (!sku) {
    const { data } = await supabase.from("unidades").select("sku").like("sku", "LA-%").order("sku", { ascending: false }).limit(1);
    const ultimo = Number(data?.[0]?.sku?.slice(3) ?? 1000);
    sku = `LA-${ultimo + 1}`;
  }
  const { data: modelo } = await supabase.from("modelos").select("nombre").eq("id", modeloId).single();

  const datos = {
    modelo_id: modeloId,
    lote_id: num(f, "lote_id"),
    sku,
    serie: txt(f, "serie"),
    procesador: txt(f, "procesador") ?? "",
    ram_gb: num(f, "ram_gb") ?? 8,
    ram_tipo: txt(f, "ram_tipo"),
    almacenamiento_gb: num(f, "almacenamiento_gb") ?? 256,
    almacenamiento: txt(f, "almacenamiento") ?? `${num(f, "almacenamiento_gb") ?? 256} GB SSD`,
    gpu: txt(f, "gpu"),
    pantalla_pulg: num(f, "pantalla_pulg") ?? 15.6,
    pantalla_detalle: txt(f, "pantalla_detalle"),
    color: txt(f, "color"),
    sistema: txt(f, "sistema"),
    condicion: txt(f, "condicion") ?? "seminuevo",
    grado: txt(f, "grado") ?? "A",
    garantia_meses: num(f, "garantia_meses") ?? 12,
    costo_usd: num(f, "costo_usd") ?? 0,
    costo_extra_pen: num(f, "costo_extra_pen") ?? 0,
    precio_pen: precio,
    precio_oferta_pen: oferta,
    estado: (txt(f, "estado") ?? "disponible") as EstadoUnidad,
    publicado: f.get("publicado") === "on",
    destacado: f.get("destacado") === "on",
    descripcion: txt(f, "descripcion"),
    notas_internas: txt(f, "notas_internas"),
    ingresado_en: txt(f, "ingresado_en") ?? new Date().toISOString().slice(0, 10),
  };
  if (!datos.procesador) return { error: "Indica el procesador." };

  let nuevoId = id;
  if (id) {
    const { error } = await supabase.from("unidades").update(datos).eq("id", id);
    if (error) return { error: traducirError(error.message) };
  } else {
    const slug = `${slugificar(modelo?.nombre ?? "laptop")}-${slugificar(sku)}`;
    const { data, error } = await supabase.from("unidades").insert({ ...datos, slug }).select("id").single();
    if (error) return { error: traducirError(error.message) };
    nuevoId = data.id;
  }
  refrescar();
  if (!id) redirect(`/admin/inventario/${nuevoId}?creado=1`);
  return { ok: "Cambios guardados." };
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
// MODELOS, MARCAS Y CATEGORÍAS
// =====================================================================
export async function guardarModelo(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase } = await requerirAdmin(); // solo administrador
  const id = num(f, "id");
  const nombre = txt(f, "nombre");
  if (!nombre) return { error: "Escribe el nombre del modelo." };
  const datos = {
    nombre,
    marca_id: num(f, "marca_id"),
    categoria_id: num(f, "categoria_id"),
    anio: num(f, "anio"),
    descripcion: txt(f, "descripcion"),
  };
  if (!datos.marca_id || !datos.categoria_id) return { error: "Elige marca y categoría." };
  const { error } = id
    ? await supabase.from("modelos").update(datos).eq("id", id)
    : await supabase.from("modelos").insert({ ...datos, slug: slugificar(nombre) });
  if (error) return { error: traducirError(error.message) };
  refrescar();
  return { ok: id ? "Modelo actualizado." : "Modelo creado." };
}

export async function eliminarModelo(id: number): Promise<Resultado> {
  const { supabase, esAdmin } = await obtenerSesion();
  if (!esAdmin) return { error: "Solo un administrador puede eliminar modelos." };
  const { error } = await supabase.from("modelos").delete().eq("id", id);
  if (error) return { error: "No se puede eliminar: hay equipos registrados con este modelo." };
  refrescar();
  return { ok: "Modelo eliminado." };
}

export async function guardarMarca(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase } = await requerirAdmin(); // solo administrador
  const nombre = txt(f, "nombre");
  if (!nombre) return { error: "Escribe el nombre de la marca." };
  const { error } = await supabase.from("marcas").insert({ nombre, slug: slugificar(nombre) });
  if (error) return { error: traducirError(error.message) };
  refrescar();
  return { ok: `Marca ${nombre} agregada.` };
}

export async function guardarCategoria(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase } = await requerirAdmin(); // solo administrador
  const nombre = txt(f, "nombre");
  if (!nombre) return { error: "Escribe el nombre de la categoría." };
  const { error } = await supabase
    .from("categorias")
    .insert({ nombre, slug: slugificar(nombre), descripcion: txt(f, "descripcion") });
  if (error) return { error: traducirError(error.message) };
  refrescar();
  return { ok: `Categoría ${nombre} agregada.` };
}

// =====================================================================
// IMPORTACIONES (lotes)
// =====================================================================
export async function guardarLote(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase } = await requerirAdmin(); // solo administrador
  const id = num(f, "id");
  const codigo = txt(f, "codigo");
  const proveedor = txt(f, "proveedor");
  const fechaCompra = txt(f, "fecha_compra");
  if (!codigo || !proveedor || !fechaCompra) return { error: "Código, proveedor y fecha de compra son obligatorios." };
  const datos = {
    codigo,
    proveedor,
    origen: txt(f, "origen") ?? "Miami, FL",
    courier: txt(f, "courier"),
    fecha_compra: fechaCompra,
    fecha_llegada: txt(f, "fecha_llegada"),
    flete_usd: num(f, "flete_usd") ?? 0,
    aduana_pen: num(f, "aduana_pen") ?? 0,
    tipo_cambio: num(f, "tipo_cambio") ?? 3.75,
    estado: txt(f, "estado") ?? "comprado",
    notas: txt(f, "notas"),
  };
  if (id) {
    const { error } = await supabase.from("lotes").update(datos).eq("id", id);
    if (error) return { error: traducirError(error.message) };
    // al recibir el lote, los equipos en tránsito pasan a disponibles
    if (datos.estado === "recibido") {
      await supabase
        .from("unidades")
        .update({ estado: "disponible", ingresado_en: datos.fecha_llegada ?? new Date().toISOString().slice(0, 10) })
        .eq("lote_id", id)
        .eq("estado", "en_transito");
    }
    refrescar();
    return { ok: "Importación actualizada." };
  }
  const { data, error } = await supabase.from("lotes").insert(datos).select("id").single();
  if (error) return { error: traducirError(error.message) };
  refrescar();
  redirect(`/admin/importaciones/${data.id}`);
}

/** Reparte flete y aduana del lote entre sus equipos, en proporción a su costo de compra. */
export async function prorratearLote(loteId: number): Promise<Resultado> {
  const { supabase } = await requerirAdmin(); // solo administrador
  const { data: lote } = await supabase.from("lotes").select("*").eq("id", loteId).single();
  const { data: unidades } = await supabase.from("unidades").select("id, costo_usd").eq("lote_id", loteId);
  if (!lote || !unidades?.length) return { error: "El lote no tiene equipos asignados." };
  const totalUsd = unidades.reduce((a, u) => a + Number(u.costo_usd), 0) || unidades.length;
  const gastos = Number(lote.flete_usd) * Number(lote.tipo_cambio) + Number(lote.aduana_pen);
  await Promise.all(
    unidades.map((u) => {
      const peso = totalUsd ? (Number(u.costo_usd) || 1) / totalUsd : 1 / unidades.length;
      return supabase
        .from("unidades")
        .update({ costo_extra_pen: Math.round(gastos * peso * 100) / 100 })
        .eq("id", u.id);
    }),
  );
  refrescar();
  return { ok: `Se repartieron S/ ${gastos.toFixed(2)} de gastos entre ${unidades.length} equipos.` };
}

export async function eliminarLote(id: number): Promise<Resultado> {
  const { supabase, esAdmin } = await obtenerSesion();
  if (!esAdmin) return { error: "Solo un administrador puede eliminar importaciones." };
  const { error } = await supabase.from("lotes").delete().eq("id", id);
  if (error) return { error: traducirError(error.message) };
  refrescar();
  redirect("/admin/importaciones");
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
