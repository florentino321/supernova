import { createClient } from "@supabase/supabase-js";

/**
 * Cliente sin sesión (rol anon) para las páginas públicas.
 * No lee cookies, así sus consultas se pueden guardar en caché y servir a todos los visitantes.
 */
export function crearClientePublico() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
