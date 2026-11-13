// Datos de contacto de la empresa (editar aquí).
export const EMPRESA = {
  nombre: "Laptops Americanas",
  lema: "Laptops importadas de EE.UU., revisadas una por una",
  ciudad: "Huánuco, Perú",
  direccion: "Centro de Huánuco (dirección por confirmar)", // reemplazar por la dirección real
  horario: "Lunes a sábado · 9:00 a. m. – 8:00 p. m.",
  whatsapp: "51900000000", // reemplazar por el número real
  email: "ventas@laptopsamericanas.pe",
  redes: {
    tiktok: "https://www.tiktok.com/",
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
  },
};

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

export function enlaceWhatsApp(mensaje: string) {
  return `https://wa.me/${EMPRESA.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

/** Número de WhatsApp de un cliente con código de Perú (51) si se guardó con 9 dígitos. */
export function whatsappDe(tel?: string | null) {
  const t = (tel ?? "").replace(/\D/g, "");
  if (!t) return null;
  return t.length === 9 ? `51${t}` : t;
}
