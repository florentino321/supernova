import { unstable_cache } from "next/cache";
import { crearClientePublico } from "./supabase/publico";

export interface Empresa {
  nombre: string;
  razon_social: string | null;
  ruc: string | null;
  whatsapp: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ciudad: string | null;
  horario: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
}

const PREDETERMINADA: Empresa = {
  nombre: "Laptops Americanas",
  razon_social: null,
  ruc: null,
  whatsapp: "51900000000",
  telefono: null,
  email: null,
  direccion: null,
  ciudad: "Huánuco, Perú",
  horario: null,
  facebook: null,
  instagram: null,
  tiktok: null,
};

/** Etiqueta de caché: la sección Configuración la invalida al guardar. */
export const TAG_EMPRESA = "empresa";

/** Datos de la empresa (tabla `empresa`, una sola fila), en caché para no consultar en cada visita. */
export const obtenerEmpresa = unstable_cache(
  async (): Promise<Empresa> => {
    const { data, error } = await crearClientePublico().from("empresa").select("*").eq("id", 1).maybeSingle();
    if (error) console.error("Error al leer la empresa:", error.message);
    return { ...PREDETERMINADA, ...(data ?? {}) };
  },
  ["empresa"],
  { tags: [TAG_EMPRESA], revalidate: 3600 },
);
