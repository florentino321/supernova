import Link from "next/link";
import { Encabezado } from "@/components/encabezado";
import { obtenerSesion } from "@/lib/sesion";
import { fecha } from "@/lib/formato";
import type { Aviso } from "@/lib/tipos";
import { ListaAvisos } from "./lista-avisos";

export const metadata = { title: "Interesados" };

export default async function Interesados({ searchParams }: PageProps<"/admin/interesados">) {
  const sp = await searchParams;
  const ver = sp.ver === "todos" ? "todos" : "pendientes";
  const { supabase } = await obtenerSesion();
  let q = supabase
    .from("avisos")
    .select("*, unidades(id, sku, slug, estado, precio_pen, precio_oferta_pen, modelos(nombre))")
    .order("creado_en", { ascending: false })
    .limit(300);
  if (ver === "pendientes") q = q.eq("estado", "pendiente");
  const { data } = await q;
  const avisos = (data ?? []) as unknown as Aviso[];
  const listos = avisos.filter((a) => a.estado === "pendiente" && a.unidades?.estado === "disponible").length;

  return (
    <>
      <Encabezado
        titulo="Interesados"
        descripcion="Personas que, desde la web, pidieron que les avisemos cuando llegue o se libere un equipo."
      >
        <div className="flex rounded-xl bg-surface-2 p-1 text-sm">
          <Link href="/admin/interesados" className={`rounded-lg px-3 py-1.5 font-medium ${ver === "pendientes" ? "bg-surface shadow-sm" : "text-muted"}`}>Pendientes</Link>
          <Link href="/admin/interesados?ver=todos" className={`rounded-lg px-3 py-1.5 font-medium ${ver === "todos" ? "bg-surface shadow-sm" : "text-muted"}`}>Todos</Link>
        </div>
      </Encabezado>
      <div className="space-y-4 p-4 sm:p-8">
        {listos > 0 && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <strong>{listos}</strong> {listos === 1 ? "persona espera" : "personas esperan"} un equipo que ya está disponible en tienda. ¡Escríbeles!
          </p>
        )}
        <ListaAvisos avisos={avisos} />
        {avisos.length > 0 && <p className="text-xs text-muted">Último registro: {fecha(avisos[0].creado_en)}</p>}
      </div>
    </>
  );
}
