import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { obtenerSesion } from "@/lib/sesion";
import { whatsappDe } from "@/lib/empresa";
import { obtenerEmpresa } from "@/lib/empresa-datos";
import { DatosEmisor } from "@/components/datos-emisor";
import { estadoCotizacion, totalCotizacion } from "@/lib/cotizaciones";
import { enSoles, etiquetaCondicion, fecha } from "@/lib/formato";
import type { Cotizacion } from "@/lib/tipos";
import { BotonesCotizacion } from "./botones-cotizacion";

export const metadata = { title: "Cotización" };

export default async function DetalleCotizacion({ params, searchParams }: PageProps<"/admin/cotizaciones/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase } = await obtenerSesion();
  const [{ data }, { data: ventas }, empresa] = await Promise.all([
    supabase
      .from("cotizaciones")
      .select("*, clientes(*), perfiles(nombre), cotizacion_items(*, unidades(id, sku, slug, procesador, ram_gb, ram_tipo, almacenamiento, gpu, pantalla_pulg, pantalla_detalle, condicion, grado, garantia_meses, estado, modelos(nombre, marcas(nombre))))")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("ventas").select("id, codigo").eq("cotizacion_id", id),
    obtenerEmpresa(),
  ]);
  if (!data) notFound();
  const c = data as unknown as Cotizacion;
  const items = c.cotizacion_items ?? [];
  const subtotal = items.reduce((a, i) => a + Number(i.precio_pen), 0);
  const total = totalCotizacion(c);
  const [txtEstado, colorEstado] = estadoCotizacion(c);
  const noDisponibles = items.filter((i) => i.unidades && !["disponible", "reservado", "en_transito"].includes(i.unidades.estado));
  const wa = whatsappDe(c.clientes?.telefono);
  const mensaje = `Hola ${c.clientes?.nombre?.split(" ")[0] ?? ""}, te envío la cotización ${c.codigo} de Laptops Americanas por ${enSoles(total)}, válida hasta el ${fecha(c.valida_hasta)}.`;

  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-3xl print:max-w-none">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href="/admin/cotizaciones" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> Cotizaciones
          </Link>
          <BotonesCotizacion
            id={c.id}
            pendiente={c.estado === "pendiente"}
            whatsapp={wa ? `https://wa.me/${wa}?text=${encodeURIComponent(mensaje)}` : null}
          />
        </div>
        {sp.nueva && (
          <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 print:hidden">
            Cotización creada. Usa &quot;Imprimir / PDF&quot; para guardarla y enviarla al cliente.
          </p>
        )}
        {c.estado === "pendiente" && noDisponibles.length > 0 && (
          <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 print:hidden">
            Atención: {noDisponibles.map((i) => i.unidades?.sku).join(", ")} ya no {noDisponibles.length === 1 ? "está disponible" : "están disponibles"}.
          </p>
        )}
        {ventas && ventas.length > 0 && (
          <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 print:hidden">
            Convertida en venta:{" "}
            {ventas.map((v, i) => (
              <span key={v.id}>
                {i > 0 && ", "}
                <Link href={`/admin/ventas/${v.id}`} className="font-mono font-semibold underline">{v.codigo}</Link>
              </span>
            ))}
          </p>
        )}

        <article className="card relative overflow-hidden p-8 print:border-0">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
            <div>
              <Logo />
              <DatosEmisor e={empresa} />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">Cotización</p>
              <p className="font-mono text-2xl font-bold">{c.codigo}</p>
              <p className="text-sm text-muted">Emitida el {fecha(c.fecha)}</p>
              <span className={`chip mt-2 print:hidden ${colorEstado}`}>{txtEstado}</span>
            </div>
          </div>

          <div className="grid gap-6 border-b border-line py-6 sm:grid-cols-2">
            <div>
              <p className="label">Cliente</p>
              <p className="font-semibold">{c.clientes?.nombre ?? "Cliente varios"}</p>
              {c.clientes && (
                <p className="text-sm text-muted">
                  {c.clientes.tipo_doc} {c.clientes.num_doc ?? "—"}
                  {c.clientes.telefono && <> · {c.clientes.telefono}</>}
                </p>
              )}
            </div>
            <div>
              <p className="label">Validez</p>
              <p className="font-semibold">Hasta el {fecha(c.valida_hasta)}</p>
              <p className="text-sm text-muted">Atiende: {c.perfiles?.nombre ?? "—"}</p>
            </div>
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2">Descripción</th>
                <th className="pb-2 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const u = i.unidades!;
                return (
                  <tr key={i.id} className="border-t border-line align-top">
                    <td className="py-3">
                      <p className="font-semibold">{u.modelos?.nombre}</p>
                      <p className="text-muted">
                        {u.procesador} · {u.ram_gb} GB {u.ram_tipo ?? ""} · {u.almacenamiento}
                        {u.gpu && <> · {u.gpu}</>} · {u.pantalla_pulg}″ {u.pantalla_detalle ?? ""}
                      </p>
                      <p className="text-muted">
                        {etiquetaCondicion[u.condicion]}
                        {u.condicion === "seminuevo" || u.condicion === "remate" ? ` grado ${u.grado}` : ""} · Garantía {u.garantia_meses} meses · Código{" "}
                        <span className="font-mono">{u.sku}</span>
                      </p>
                      {Number(i.descuento_pen) > 0 && <p className="text-green">Descuento −{enSoles(i.descuento_pen)}</p>}
                    </td>
                    <td className="num py-3 text-right">
                      {Number(i.descuento_pen) > 0 && <span className="block text-xs text-muted line-through">{enSoles(i.precio_pen)}</span>}
                      {enSoles(Number(i.precio_pen) - Number(i.descuento_pen))}
                    </td>
                  </tr>
                );
              })}
              {subtotal !== total && (
                <tr className="border-t border-line">
                  <td className="py-2 text-muted">Ahorro total</td>
                  <td className="num py-2 text-right text-green">−{enSoles(subtotal - total)}</td>
                </tr>
              )}
              <tr className="border-t-2 border-ink">
                <td className="py-3 font-semibold">Total</td>
                <td className="num py-3 text-right font-display text-2xl font-extrabold">{enSoles(total)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 rounded-xl bg-surface-2 p-4 text-sm">
            <p className="font-semibold">Condiciones</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
              <li>Precios en soles. Pago con Yape, Plin, transferencia, tarjeta o efectivo.</li>
              <li>Cada equipo es una pieza única: la cotización no lo separa. Para guardarlo, se requiere un adelanto.</li>
              <li>Incluye limpieza interna, cargador original y comprobante con número de serie.</li>
            </ul>
          </div>
          {c.notas && <p className="mt-4 text-sm text-ink-2"><strong>Notas:</strong> {c.notas}</p>}
        </article>
      </div>
    </div>
  );
}
