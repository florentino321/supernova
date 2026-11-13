// Los datos de contacto (WhatsApp, correo, RUC, dirección…) se editan en el panel,
// sección "Configuración", y se leen con obtenerEmpresa() de "./empresa-datos".

export const LEMA = "Laptops importadas de EE.UU., revisadas una por una";

/** Reglas para separar un equipo con adelanto (se muestran en la web y se usan en el panel). */
export const RESERVA = {
  dias: 7, // días que se guarda el equipo
  porcentaje: 0.1, // adelanto sugerido: 10 % del precio…
  minimo: 100, // …y como mínimo S/ 100
};
export const adelantoSugerido = (precio: number) =>
  Math.min(Math.max(RESERVA.minimo, Math.ceil((precio * RESERVA.porcentaje) / 10) * 10), Math.floor(precio / 2));

/**
 * Los vendedores ingresan con un "usuario" (sin correo). Internamente Supabase Auth
 * lo guarda como un correo sintético en un dominio reservado que nunca recibe correos.
 * Debe coincidir con DOMINIO en supabase/functions/gestionar-personal/index.ts
 */
export const DOMINIO_USUARIOS = "personal.laptopsamericanas.invalid";
export const correoDeUsuario = (usuarioOCorreo: string) => {
  const v = usuarioOCorreo.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${DOMINIO_USUARIOS}`;
};

/** Enlace a WhatsApp con mensaje prellenado. `numero` con código de país, solo dígitos (p. ej. 51987654321). */
export function enlaceWhatsApp(numero: string, mensaje: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

/** Número de WhatsApp de un cliente con código de Perú (51) si se guardó con 9 dígitos. */
export function whatsappDe(tel?: string | null) {
  const t = (tel ?? "").replace(/\D/g, "");
  if (!t) return null;
  return t.length === 9 ? `51${t}` : t;
}
