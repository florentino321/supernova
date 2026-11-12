"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { correoDeUsuario } from "@/lib/empresa";

export async function iniciarSesion(_: { error: string }, form: FormData) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: correoDeUsuario(String(form.get("usuario") ?? "")),
    password: String(form.get("password") ?? ""),
  });
  if (error) {
    if (/banned/i.test(error.message)) return { error: "Tu usuario está desactivado. Consulta con el administrador." };
    return { error: "Usuario o contraseña incorrectos." };
  }
  const { data: perfil } = await supabase.from("perfiles").select("rol, activo").eq("id", data.user.id).maybeSingle();
  if (!perfil || !perfil.activo) {
    await supabase.auth.signOut();
    return { error: "Tu usuario no tiene acceso al panel. Consulta con el administrador." };
  }
  // el vendedor entra directo a sus ventas; el administrador, al destino pedido o al dashboard
  if (perfil.rol !== "admin") redirect("/admin/ventas");
  const siguiente = String(form.get("siguiente") ?? "/admin");
  redirect(siguiente.startsWith("/admin") ? siguiente : "/admin");
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
