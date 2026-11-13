import { requerirAdmin } from "@/lib/sesion";
import { costoUnidad } from "@/lib/calculos";
import { hoyLima } from "@/lib/cotizaciones";
import { Dashboard, type FilaInventario, type FilaVenta } from "./dashboard";

export const metadata = { title: "Dashboard" };

export default async function PaginaDashboard() {
  const { supabase, esAdmin, perfil } = await requerirAdmin();
  await supabase.rpc("liberar_reservas_vencidas");
  const [{ data: ventas }, { data: unidades }, { data: reservas }, { count: avisos }, { count: cotizaciones }] = await Promise.all([
    supabase
      .from("ventas")
      .select(
        "id, codigo, fecha, total_pen, descuento_pen, costo_total_pen, canal, metodo_pago, estado, clientes(nombre, ciudad), unidades(id, sku, ingresado_en, condicion, modelos(nombre, marcas(nombre), categorias(nombre)))",
      )
      .eq("estado", "completada")
      .order("fecha"),
    supabase
      .from("unidades")
      .select("id, sku, estado, ingresado_en, precio_pen, precio_oferta_pen, costo_usd, costo_extra_pen, costo_adquisicion_pen, condicion, lotes(tipo_cambio), modelos(nombre, marcas(nombre), categorias(nombre))"),
    supabase.from("reservas").select("adelanto_pen").eq("estado", "activa"),
    supabase.from("avisos").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
    supabase.from("cotizaciones").select("id", { count: "exact", head: true }).eq("estado", "pendiente").gte("valida_hasta", hoyLima()),
  ]);
  const pendientes = {
    reservas: reservas?.length ?? 0,
    adelantos: (reservas ?? []).reduce((a, r) => a + Number(r.adelanto_pen), 0),
    interesados: avisos ?? 0,
    cotizaciones: cotizaciones ?? 0,
  };

  type V = {
    id: number; codigo: string; fecha: string; total_pen: number; descuento_pen: number; costo_total_pen: number;
    canal: FilaVenta["canal"]; metodo_pago: FilaVenta["pago"];
    clientes: { nombre: string; ciudad: string | null } | null;
    unidades: { id: number; sku: string; ingresado_en: string; condicion: string; modelos: { nombre: string; marcas: { nombre: string }; categorias: { nombre: string } } };
  };
  const filasVentas: FilaVenta[] = ((ventas ?? []) as unknown as V[]).map((v) => ({
    id: v.id,
    codigo: v.codigo,
    fecha: v.fecha,
    total: Number(v.total_pen),
    descuento: Number(v.descuento_pen),
    // el vendedor no recibe costos
    costo: esAdmin ? Number(v.costo_total_pen) : 0,
    canal: v.canal,
    pago: v.metodo_pago,
    cliente: v.clientes?.nombre ?? "Cliente varios",
    ciudad: v.clientes?.ciudad ?? "—",
    modelo: v.unidades?.modelos?.nombre ?? "",
    marca: v.unidades?.modelos?.marcas?.nombre ?? "",
    categoria: v.unidades?.modelos?.categorias?.nombre ?? "",
    unidadId: v.unidades?.id,
    diasParaVender: Math.max(0, Math.round((new Date(v.fecha).getTime() - new Date(v.unidades?.ingresado_en ?? v.fecha).getTime()) / 86_400_000)),
  }));

  type U = {
    id: number; sku: string; estado: FilaInventario["estado"]; ingresado_en: string; precio_pen: number; precio_oferta_pen: number | null;
    costo_usd: number; costo_extra_pen: number; costo_adquisicion_pen: number | null; lotes: { tipo_cambio: number } | null;
    modelos: { nombre: string; marcas: { nombre: string }; categorias: { nombre: string } };
  };
  const filasInv: FilaInventario[] = ((unidades ?? []) as unknown as U[]).map((u) => ({
    id: u.id,
    sku: u.sku,
    estado: u.estado,
    ingresado: u.ingresado_en,
    precio: Number(u.precio_oferta_pen ?? u.precio_pen),
    costo: esAdmin ? costoUnidad(u) : 0,
    modelo: u.modelos?.nombre ?? "",
    marca: u.modelos?.marcas?.nombre ?? "",
    categoria: u.modelos?.categorias?.nombre ?? "",
  }));

  return <Dashboard ventas={filasVentas} inventario={filasInv} esAdmin={esAdmin} nombre={perfil.nombre} pendientes={pendientes} />;
}
