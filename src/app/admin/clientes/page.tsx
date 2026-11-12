import { Encabezado } from "@/components/encabezado";
import { requerirAdmin } from "@/lib/sesion";
import type { Cliente } from "@/lib/tipos";
import { TablaClientes } from "./tabla-clientes";

export const metadata = { title: "Clientes" };

export default async function Clientes() {
  const { supabase } = await requerirAdmin();
  const [{ data: clientes }, { data: ventas }] = await Promise.all([
    supabase.from("clientes").select("*").order("nombre"),
    supabase.from("ventas").select("id, cliente_id, total_pen, fecha, codigo").eq("estado", "completada"),
  ]);
  const resumen = new Map<number, { compras: number; total: number; ultima: string }>();
  (ventas ?? []).forEach((v) => {
    if (!v.cliente_id) return;
    const r = resumen.get(v.cliente_id) ?? { compras: 0, total: 0, ultima: "" };
    r.compras += 1;
    r.total += Number(v.total_pen);
    if (v.fecha > r.ultima) r.ultima = v.fecha;
    resumen.set(v.cliente_id, r);
  });
  const filas = ((clientes ?? []) as Cliente[]).map((c) => ({ ...c, ...(resumen.get(c.id) ?? { compras: 0, total: 0, ultima: "" }) }));
  return (
    <>
      <Encabezado titulo="Clientes" descripcion={`${filas.length} clientes registrados · ${filas.filter((f) => f.compras > 1).length} recurrentes`} />
      <TablaClientes filas={filas} />
    </>
  );
}
