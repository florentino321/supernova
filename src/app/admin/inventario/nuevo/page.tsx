import Link from "next/link";
import { Encabezado } from "@/components/encabezado";
import { requerirAdmin } from "@/lib/sesion";
import { FormUnidad } from "../form-unidad";
import { datosFormulario } from "../datos-form";

export const metadata = { title: "Registrar equipo" };

export default async function NuevoEquipo() {
  const { supabase, esAdmin } = await requerirAdmin();
  const datos = await datosFormulario(supabase);
  return (
    <>
      <Encabezado
        titulo="Registrar equipo"
        descripcion="Primero guarda los datos; después podrás subir fotos y videos de esta unidad."
      >
        <Link href="/admin/inventario" className="btn-ghost">Cancelar</Link>
      </Encabezado>
      <div className="p-4 sm:p-8">
        <FormUnidad {...datos} esAdmin={esAdmin} />
      </div>
    </>
  );
}
