import { redirect } from "next/navigation";
import { cache } from "react";
import { crearClienteServidor } from "./supabase/server";
import type { Perfil } from "./tipos";

/** Devuelve el usuario y su perfil, o redirige al login. Se memoriza por petición. */
export const obtenerSesion = cache(async () => {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", user.id).maybeSingle();
  if (!perfil) redirect("/login?error=sin-perfil");
  if (!perfil.activo) redirect("/login?error=inactivo");
  return { supabase, user, perfil: perfil as Perfil, esAdmin: perfil.rol === "admin" };
});

/** Para páginas exclusivas del administrador: el vendedor vuelve a su sección de ventas. */
export async function requerirAdmin() {
  const sesion = await obtenerSesion();
  if (!sesion.esAdmin) redirect("/admin/ventas?sin-permiso=1");
  return sesion;
}
