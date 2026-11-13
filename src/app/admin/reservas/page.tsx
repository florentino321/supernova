import Link from "next/link";
import { CalendarClock, MessageCircle, Plus } from "lucide-react";
import { Encabezado } from "@/components/encabezado";
import { obtenerSesion } from "@/lib/sesion";
import { whatsappDe } from "@/lib/empresa";
import { enSoles, etiquetaPago, fecha } from "@/lib/formato";
import type { Reserva } from "@/lib/tipos";
import { BotonCancelarReserva } from "./boton-cancelar";

export const metadata = { title: "Reservas" };

const chipEstado: Record<Reserva["estado"], string> = {
  activa: "bg-amber-100 text-amber-800",
  completada: "bg-emerald-50 text-emerald-700",
  cancelada: "bg-slate-100 text-slate-600",
  vencida: "bg-red-50 text-red-700",
};

/** Fecha de hoy en Perú (UTC−5), en formato AAAA-MM-DD. */
const hoyLima = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10);
const diasHasta = (dia: string, hoy: string) => Math.round((new Date(dia).getTime() - new Date(hoy).getTime()) / 86_400_000);

export default async function Reservas({ searchParams }: PageProps<"/admin/reservas">) {
  const sp = await searchParams;
  const { supabase, esAdmin } = await obtenerSesion();
  await supabase.rpc("liberar_reservas_vencidas"); // libera las vencidas antes de mostrar la lista
  const { data } = await supabase
    .from("reservas")
    .select("*, unidades(id, sku, slug, procesador, ram_gb, almacenamiento, modelos(nombre)), clientes(id, nombre, telefono, num_doc), perfiles(nombre)")
    .order("creado_en", { ascending: false })
    .limit(200);
  const reservas = (data ?? []) as unknown as Reserva[];
  const activas = reservas.filter((r) => r.estado === "activa").sort((a, b) => a.vence_en.localeCompare(b.vence_en));
  const otras = reservas.filter((r) => r.estado !== "activa");
  const totalAdelantos = activas.reduce((a, r) => a + Number(r.adelanto_pen), 0);
  const hoy = hoyLima();

  return (
    <>
      <Encabezado titulo="Reservas" descripcion="Equipos separados con adelanto. Si la reserva vence, el equipo vuelve a estar disponible solo.">
        <Link href="/admin/reservas/nueva" className="btn-accent"><Plus className="size-4" /> Nueva reserva</Link>
      </Encabezado>
      <div className="space-y-6 p-4 sm:p-8">
        {sp.creada && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Reserva registrada. El equipo ya figura como &quot;Reservado&quot; en la web.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="card p-4"><p className="label">Reservas activas</p><p className="num font-display text-2xl font-extrabold">{activas.length}</p></div>
          <div className="card p-4"><p className="label">Adelantos recibidos</p><p className="num font-display text-2xl font-extrabold">{enSoles(totalAdelantos)}</p></div>
          <div className="card col-span-2 p-4 lg:col-span-1">
            <p className="label">Vencen hoy o mañana</p>
            <p className="num font-display text-2xl font-extrabold">{activas.filter((r) => diasHasta(r.vence_en, hoy) <= 1).length}</p>
          </div>
        </div>

        <section>
          <h2 className="font-display text-lg font-bold">Activas</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activas.map((r) => {
              const dias = diasHasta(r.vence_en, hoy);
              const saldo = Number(r.precio_acordado_pen) - Number(r.adelanto_pen);
              const wa = whatsappDe(r.clientes?.telefono);
              const recordatorio = `Hola ${r.clientes?.nombre?.split(" ")[0] ?? ""}, te recordamos que tu ${r.unidades?.modelos?.nombre} separada te espera hasta el ${fecha(r.vence_en)}. Saldo a pagar: ${enSoles(saldo)}.`;
              return (
                <article key={r.id} className="card flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted">{r.codigo} · {r.unidades?.sku}</p>
                      <p className="truncate font-semibold">{r.unidades?.modelos?.nombre}</p>
                      <p className="truncate text-sm text-muted">{r.unidades?.ram_gb} GB · {r.unidades?.almacenamiento}</p>
                    </div>
                    <span className={`chip shrink-0 ${dias <= 1 ? "bg-red-50 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                      <CalendarClock className="size-3" /> {dias <= 0 ? "Vence hoy" : dias === 1 ? "Vence mañana" : `${dias} días`}
                    </span>
                  </div>
                  <p className="mt-3 text-sm">
                    <strong>{r.clientes?.nombre ?? "—"}</strong>
                    {r.clientes?.telefono && <span className="text-muted"> · {r.clientes.telefono}</span>}
                  </p>
                  <dl className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-surface-2 p-3 text-sm">
                    <div><dt className="text-xs text-muted">Precio</dt><dd className="num font-semibold">{enSoles(r.precio_acordado_pen)}</dd></div>
                    <div><dt className="text-xs text-muted">Adelanto</dt><dd className="num font-semibold text-green">{enSoles(r.adelanto_pen)}</dd></div>
                    <div><dt className="text-xs text-muted">Saldo</dt><dd className="num font-semibold">{enSoles(saldo)}</dd></div>
                  </dl>
                  <p className="mt-2 text-xs text-muted">
                    Adelanto por {etiquetaPago[r.metodo_pago]} · hasta el {fecha(r.vence_en)}
                    {esAdmin && r.perfiles ? ` · ${r.perfiles.nombre}` : ""}
                  </p>
                  {r.notas && <p className="mt-1 text-xs text-muted">{r.notas}</p>}
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <Link href={`/admin/ventas/nueva?unidad=${r.unidad_id}`} className="btn-accent flex-1 py-2 text-sm">Registrar venta</Link>
                    {wa && (
                      <a
                        href={`https://wa.me/${wa}?text=${encodeURIComponent(recordatorio)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost py-2 text-sm"
                        aria-label="Enviar recordatorio por WhatsApp"
                        title="Enviar recordatorio por WhatsApp"
                      >
                        <MessageCircle className="size-4" />
                      </a>
                    )}
                    <BotonCancelarReserva id={r.id} />
                  </div>
                </article>
              );
            })}
            {activas.length === 0 && (
              <p className="card p-8 text-center text-sm text-muted md:col-span-2 xl:col-span-3">No hay reservas activas.</p>
            )}
          </div>
        </section>

        {otras.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-bold">Historial</h2>
            <div className="card mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Equipo</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3 text-right">Adelanto</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {otras.map((r) => (
                    <tr key={r.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{r.codigo}</td>
                      <td className="px-4 py-3">
                        {r.unidades?.modelos?.nombre} <span className="font-mono text-xs text-muted">{r.unidades?.sku}</span>
                      </td>
                      <td className="px-4 py-3">{r.clientes?.nombre ?? "—"}</td>
                      <td className="num px-4 py-3 text-right">{enSoles(r.adelanto_pen)}</td>
                      <td className="px-4 py-3 text-muted">{fecha(r.creado_en)}</td>
                      <td className="px-4 py-3">
                        {r.venta_id ? (
                          <Link href={`/admin/ventas/${r.venta_id}`} className={`chip ${chipEstado[r.estado]}`}>Vendida →</Link>
                        ) : (
                          <span className={`chip ${chipEstado[r.estado]}`}>{r.estado[0].toUpperCase() + r.estado.slice(1)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
