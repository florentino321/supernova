"use server";

import { revalidatePath } from "next/cache";
import { requerirAdmin } from "@/lib/sesion";
import type { Rol } from "@/lib/tipos";

export type ResultadoUsuario = { error?: string; ok?: string; credenciales?: { usuario: string; password: string } };

/** Llama a la Edge Function "gestionar-personal" con la sesión del administrador. */
async function llamar(cuerpo: Record<string, unknown>): Promise<ResultadoUsuario> {
  const { supabase } = await requerirAdmin();
  const { data, error } = await supabase.functions.invoke("gestionar-personal", { body: cuerpo });
  if (error) {
    let mensaje = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      const j = await ctx?.json();
      if (j?.error) mensaje = j.error;
    } catch {
      // respuesta sin JSON
    }
    return { error: mensaje };
  }
  revalidatePath("/admin/usuarios");
  return { ok: data?.ok ?? "Listo." };
}

export async function crearUsuario(_: ResultadoUsuario, f: FormData): Promise<ResultadoUsuario> {
  const usuario = String(f.get("usuario") ?? "").trim().toLowerCase();
  const password = String(f.get("password") ?? "");
  const r = await llamar({
    accion: "crear",
    nombre: String(f.get("nombre") ?? "").trim(),
    usuario,
    password,
    rol: String(f.get("rol") ?? "vendedor"),
  });
  return r.error ? r : { ...r, credenciales: { usuario, password } };
}

export async function cambiarPassword(id: string, password: string) {
  return llamar({ accion: "cambiar_password", id, password });
}

export async function activarUsuario(id: string, activo: boolean) {
  return llamar({ accion: "activar", id, activo });
}

export async function cambiarRol(id: string, rol: Rol) {
  return llamar({ accion: "cambiar_rol", id, rol });
}

export async function actualizarNombre(id: string, nombre: string) {
  return llamar({ accion: "actualizar", id, nombre });
}
