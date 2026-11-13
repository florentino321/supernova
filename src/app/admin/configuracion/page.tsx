import { Encabezado } from "@/components/encabezado";
import { requerirAdmin } from "@/lib/sesion";
import type { Empresa } from "@/lib/empresa-datos";
import { FormEmpresa } from "./form-empresa";

export const metadata = { title: "Configuración" };

export default async function Configuracion() {
  const { supabase } = await requerirAdmin();
  const { data } = await supabase.from("empresa").select("*").eq("id", 1).maybeSingle();
  return (
    <>
      <Encabezado
        titulo="Configuración"
        descripcion="Datos de la empresa que aparecen en la web, en las notas de venta y en las cotizaciones."
      />
      <div className="p-4 sm:p-8">
        <FormEmpresa empresa={(data ?? {}) as Partial<Empresa>} />
      </div>
    </>
  );
}
