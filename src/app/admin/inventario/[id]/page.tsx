import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BellRing, FileText, HandCoins, History, Images } from "lucide-react";
import { ChipEstado } from "@/components/chips";
import { requerirAdmin } from "@/lib/sesion";
import { diasEntre, enSoles, etiquetaEstado, fecha, fechaHora } from "@/lib/formato";
import type { Medio, Movimiento, Unidad, Venta } from "@/lib/tipos";
import { FormUnidad } from "../form-unidad";
import { datosFormulario } from "../datos-form";
import { GestorMedios } from "./gestor-medios";
import { AccionesUnidad } from "./acciones-unidad";

const textoEvento: Record<string, string> = {
  alta: "Registrado en inventario",
  cambio_estado: "Cambio de estado",
  cambio_precio: "Cambio de precio",
  venta_anulada: "Venta anulada",
  reserva: "Reservado con adelanto",
  reserva_cancelada: "Reserva cancelada",
  reserva_vencida: "Reserva vencida",
};

export default async function DetalleEquipo({ params, searchParams }: PageProps<"/admin/inventario/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, esAdmin } = await requerirAdmin();
  const [{ data: u }, { data: medios }, { data: movimientos }, { data: ventas }, datos, { count: interesados }] = await Promise.all([
    supabase.from("unidades").select("*, modelos(*, marcas(*), categorias(*)), lotes(*)").eq("id", id).maybeSingle(),
    supabase.from("medios").select("*").eq("unidad_id", id).order("posicion"),
    supabase.from("movimientos").select("*").eq("unidad_id", id).order("creado_en", { ascending: false }),
    supabase.from("ventas").select("*, clientes(nombre)").eq("unidad_id", id).order("fecha", { ascending: false }),
    datosFormulario(supabase),
    supabase.from("avisos").select("id", { count: "exact", head: true }).eq("unidad_id", id).eq("estado", "pendiente"),
  ]);
  if (!u) notFound();
  const unidad = u as unknown as Unidad;

  return (
    <>
      <header className="border-b border-line bg-surface px-4 py-6 sm:px-8">
        <Link href="/admin/inventario" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Inventario
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-extrabold">{unidad.modelos?.nombre}</h1>
              <ChipEstado estado={unidad.estado} />
            </div>
            <p className="mt-1 text-sm text-muted">
              <span className="font-mono">{unidad.sku}</span>
              {unidad.serie && <> · Serie <span className="font-mono">{unidad.serie}</span></>} · Ingresó el {fecha(unidad.ingresado_en)} (
              {diasEntre(unidad.ingresado_en)} días)
              {unidad.lotes && <> · Lote <Link className="text-blue hover:underline" href={`/admin/importaciones/${unidad.lotes.id}`}>{unidad.lotes.codigo}</Link></>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(unidad.estado === "disponible" || unidad.estado === "en_transito") && (
              <>
                <Link href={`/admin/reservas/nueva?unidad=${unidad.id}`} className="btn-ghost"><HandCoins className="size-4" /> Separar</Link>
                <Link href={`/admin/cotizaciones/nueva?unidad=${unidad.id}`} className="btn-ghost"><FileText className="size-4" /> Cotizar</Link>
              </>
            )}
            {!!interesados && (
              <Link href="/admin/interesados" className="btn-ghost text-violet"><BellRing className="size-4" /> {interesados} {interesados === 1 ? "interesado" : "interesados"}</Link>
            )}
            <AccionesUnidad unidad={unidad} esAdmin={esAdmin} />
          </div>
        </div>
      </header>

      <div className="space-y-8 p-4 sm:p-8">
        {sp.creado && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Equipo registrado. Ahora sube sus fotos y videos.
          </p>
        )}

        {(ventas ?? []).length > 0 && (
          <section className="card divide-y divide-line">
            {(ventas as unknown as Venta[]).map((v) => (
              <Link key={v.id} href={`/admin/ventas/${v.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-surface-2">
                <span>
                  <span className="font-semibold">Venta {v.codigo}</span>{" "}
                  <span className="text-muted">· {fecha(v.fecha)} · {v.clientes?.nombre ?? "Cliente sin registrar"}</span>
                </span>
                <span className="flex items-center gap-3">
                  {v.estado === "anulada" && <span className="chip bg-red-50 text-red-700">Anulada</span>}
                  <span className="num font-semibold">{enSoles(v.total_pen)}</span>
                </span>
              </Link>
            ))}
          </section>
        )}

        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Images className="size-5" /> Fotos y videos</h2>
          <p className="mb-4 text-sm text-muted">Arrastra para ordenar. La foto marcada como portada se muestra en el catálogo.</p>
          <GestorMedios unidadId={unidad.id} medios={(medios ?? []) as Medio[]} />
        </section>

        <FormUnidad unidad={unidad} {...datos} esAdmin={esAdmin} />

        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><History className="size-5" /> Historial de movimientos</h2>
          <ol className="mt-4 space-y-0">
            {((movimientos ?? []) as Movimiento[]).map((m) => (
              <li key={m.id} className="relative border-l-2 border-line pb-5 pl-5 last:pb-0">
                <span className="absolute -left-[7px] top-1 size-3 rounded-full border-2 border-white bg-navy" />
                <p className="text-sm font-semibold">
                  {textoEvento[m.evento] ?? m.evento}
                  {m.estado_nuevo && m.evento === "cambio_estado" && (
                    <span className="font-normal text-muted">
                      : {m.estado_antes ? etiquetaEstado[m.estado_antes] : "—"} → {etiquetaEstado[m.estado_nuevo]}
                    </span>
                  )}
                </p>
                {m.detalle && <p className="text-sm text-muted">{m.detalle}</p>}
                <p className="text-xs text-muted">{fechaHora(m.creado_en)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
