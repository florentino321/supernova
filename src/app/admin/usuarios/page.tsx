import { Encabezado } from "@/components/encabezado";
import { requerirAdmin } from "@/lib/sesion";
import type { Perfil } from "@/lib/tipos";
import { GestionUsuarios, type FilaUsuario } from "./gestion-usuarios";

export const metadata = { title: "Usuarios y vendedores" };

export default async function Usuarios() {
  const { supabase, perfil } = await requerirAdmin();
  const [{ data: perfiles }, { data: ventas }] = await Promise.all([
    supabase.from("perfiles").select("*").order("creado_en"),
    supabase.from("ventas").select("vendedor_id, total_pen, fecha").eq("estado", "completada"),
  ]);
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
  const filas: FilaUsuario[] = ((perfiles ?? []) as Perfil[]).map((p) => {
    const suyas = (ventas ?? []).filter((v) => v.vendedor_id === p.id);
    const delMes = suyas.filter((v) => v.fecha >= inicioMes);
    return {
      ...p,
      ventasTotal: suyas.length,
      ingresosTotal: suyas.reduce((a, v) => a + Number(v.total_pen), 0),
      ventasMes: delMes.length,
      ingresosMes: delMes.reduce((a, v) => a + Number(v.total_pen), 0),
      ultimaVenta: suyas.map((v) => v.fecha).sort().at(-1) ?? null,
    };
  });

  return (
    <>
      <Encabezado
        titulo="Usuarios y vendedores"
        descripcion="Crea cuentas para tu equipo. El vendedor solo puede registrar ventas y ver las suyas; el administrador accede a todo."
      />
      <GestionUsuarios filas={filas} miId={perfil.id} />
    </>
  );
}
