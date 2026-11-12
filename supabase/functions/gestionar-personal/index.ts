// Edge Function: gestión de usuarios del personal (solo administradores).
// Usa la clave de servicio, que vive únicamente en el servidor de Supabase.
// Acciones: crear, cambiar_password, activar, cambiar_rol, actualizar.
import { createClient } from "npm:@supabase/supabase-js@2";

// Los vendedores inician sesión con un "usuario"; internamente se guarda como correo sintético.
// Dominio reservado (RFC 2606): nunca recibe correos, así nadie puede pedir recuperación de contraseña.
const DOMINIO = "personal.laptopsamericanas.invalid";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const ROLES = ["admin", "vendedor"];
const validarUsuario = (u: string) => /^[a-z0-9._-]{3,30}$/.test(u);
const validarPassword = (p: string) => typeof p === "string" && p.length >= 8 && p.length <= 72;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1) ¿quién llama? debe ser un administrador activo
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: sesion, error: eSesion } = await admin.auth.getUser(token);
    if (eSesion || !sesion.user) return json({ error: "Sesión no válida." }, 401);
    const { data: yo } = await admin.from("perfiles").select("id, rol, activo").eq("id", sesion.user.id).maybeSingle();
    if (!yo || yo.rol !== "admin" || !yo.activo) return json({ error: "Solo un administrador puede gestionar usuarios." }, 403);

    const b = await req.json();
    switch (b.accion) {
      case "crear": {
        const usuario = String(b.usuario ?? "").trim().toLowerCase();
        const nombre = String(b.nombre ?? "").trim();
        const rol = String(b.rol ?? "vendedor");
        if (!nombre) return json({ error: "Escribe el nombre completo." }, 400);
        if (!validarUsuario(usuario)) return json({ error: "El usuario debe tener de 3 a 30 caracteres: letras minúsculas, números, punto, guion o guion bajo." }, 400);
        if (!validarPassword(b.password)) return json({ error: "La contraseña debe tener al menos 8 caracteres." }, 400);
        if (!ROLES.includes(rol)) return json({ error: "Rol no válido." }, 400);
        const { data: existe } = await admin.from("perfiles").select("id").eq("usuario", usuario).maybeSingle();
        if (existe) return json({ error: `El usuario "${usuario}" ya existe.` }, 409);

        const { data, error } = await admin.auth.admin.createUser({
          email: `${usuario}@${DOMINIO}`,
          password: b.password,
          email_confirm: true,
          app_metadata: { rol, usuario },
          user_metadata: { nombre },
        });
        if (error) return json({ error: error.message }, 400);
        // Auth guarda app_metadata después del INSERT, por eso el perfil se crea aquí explícitamente.
        const { error: ePerfil } = await admin.from("perfiles").upsert({
          id: data.user.id,
          nombre,
          rol,
          usuario,
          email: data.user.email,
          activo: true,
          creado_por: yo.id,
        });
        if (ePerfil) {
          await admin.auth.admin.deleteUser(data.user.id); // no dejar cuentas sin perfil
          return json({ error: `No se pudo crear el perfil: ${ePerfil.message}` }, 500);
        }
        return json({ ok: `Usuario ${usuario} creado.`, id: data.user.id });
      }

      case "cambiar_password": {
        if (!validarPassword(b.password)) return json({ error: "La contraseña debe tener al menos 8 caracteres." }, 400);
        const { error } = await admin.auth.admin.updateUserById(b.id, { password: b.password });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: "Contraseña actualizada." });
      }

      case "activar": {
        const activo = Boolean(b.activo);
        if (b.id === yo.id && !activo) return json({ error: "No puedes desactivar tu propio usuario." }, 400);
        const { error } = await admin.auth.admin.updateUserById(b.id, { ban_duration: activo ? "none" : "876000h" });
        if (error) return json({ error: error.message }, 400);
        await admin.from("perfiles").update({ activo }).eq("id", b.id);
        return json({ ok: activo ? "Usuario activado." : "Usuario desactivado: ya no puede ingresar." });
      }

      case "cambiar_rol": {
        const rol = String(b.rol);
        if (!ROLES.includes(rol)) return json({ error: "Rol no válido." }, 400);
        if (b.id === yo.id) return json({ error: "No puedes cambiar tu propio rol." }, 400);
        const { data: u } = await admin.auth.admin.getUserById(b.id);
        const { error } = await admin.auth.admin.updateUserById(b.id, {
          app_metadata: { ...(u.user?.app_metadata ?? {}), rol },
        });
        if (error) return json({ error: error.message }, 400);
        await admin.from("perfiles").update({ rol }).eq("id", b.id);
        return json({ ok: `Rol cambiado a ${rol}.` });
      }

      case "actualizar": {
        const nombre = String(b.nombre ?? "").trim();
        if (!nombre) return json({ error: "Escribe el nombre." }, 400);
        await admin.from("perfiles").update({ nombre }).eq("id", b.id);
        await admin.auth.admin.updateUserById(b.id, { user_metadata: { nombre } });
        return json({ ok: "Datos actualizados." });
      }

      default:
        return json({ error: "Acción no reconocida." }, 400);
    }
  } catch (e) {
    return json({ error: `Error interno: ${(e as Error).message}` }, 500);
  }
});
