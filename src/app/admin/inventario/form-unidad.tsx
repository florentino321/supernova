"use client";

import { useActionState, useRef, useState } from "react";
import { Save } from "lucide-react";
import { guardarUnidad, type Resultado } from "../acciones";
import { enSoles, enPorcentaje } from "@/lib/formato";
import type { Lote, Modelo, Unidad } from "@/lib/tipos";

type Plantilla = Partial<Unidad> & { modelo_id: number };

export function FormUnidad({
  unidad,
  modelos,
  lotes,
  plantillas,
  esAdmin,
}: {
  unidad?: Unidad;
  modelos: Modelo[];
  lotes: Lote[];
  plantillas: Plantilla[];
  esAdmin: boolean;
}) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(guardarUnidad, {});
  const form = useRef<HTMLFormElement>(null);
  const [costoUsd, setCostoUsd] = useState(Number(unidad?.costo_usd ?? 0));
  const [extra, setExtra] = useState(Number(unidad?.costo_extra_pen ?? 0));
  const [loteId, setLoteId] = useState(String(unidad?.lote_id ?? ""));
  const [precio, setPrecio] = useState(Number(unidad?.precio_pen ?? 0));
  const [oferta, setOferta] = useState(unidad?.precio_oferta_pen != null ? Number(unidad.precio_oferta_pen) : 0);

  const tc = Number(lotes.find((l) => String(l.id) === loteId)?.tipo_cambio ?? 3.75);
  const costo = costoUsd * tc + extra;
  const venta = oferta > 0 ? oferta : precio;
  const utilidad = venta - costo;

  // al elegir modelo en un equipo nuevo, sugerir la configuración del último equipo de ese modelo
  const alElegirModelo = (id: string) => {
    if (unidad || !form.current) return;
    const p = plantillas.find((x) => String(x.modelo_id) === id);
    if (!p) return;
    const campos = ["procesador", "ram_gb", "ram_tipo", "almacenamiento_gb", "almacenamiento", "gpu", "pantalla_pulg", "pantalla_detalle", "color", "sistema"] as const;
    for (const c of campos) {
      const el = form.current.elements.namedItem(c) as HTMLInputElement | null;
      if (el && !el.value && p[c] != null) el.value = String(p[c]);
    }
  };

  const porModelo = new Map<string, Modelo[]>();
  modelos.forEach((m) => {
    const k = m.marcas?.nombre ?? "Otros";
    porModelo.set(k, [...(porModelo.get(k) ?? []), m]);
  });

  return (
    <form ref={form} action={accion} className="grid gap-6 xl:grid-cols-[1fr_320px]">
      {unidad && <input type="hidden" name="id" value={unidad.id} />}
      <div className="space-y-6">
        <Seccion titulo="Identificación">
          <Campo label="Modelo *" className="sm:col-span-2">
            <select name="modelo_id" required defaultValue={unidad?.modelo_id ?? ""} className="input" onChange={(e) => alElegirModelo(e.target.value)}>
              <option value="">Elige un modelo…</option>
              {[...porModelo.entries()].map(([marca, ms]) => (
                <optgroup key={marca} label={marca}>
                  {ms.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </optgroup>
              ))}
            </select>
          </Campo>
          <Campo label="Código (SKU)">
            <input name="sku" defaultValue={unidad?.sku} placeholder="Se genera solo" className="input font-mono" />
          </Campo>
          <Campo label="N.º de serie">
            <input name="serie" defaultValue={unidad?.serie ?? ""} className="input font-mono" placeholder="Service tag / serial" />
          </Campo>
          <Campo label="Importación (lote)">
            <select name="lote_id" value={loteId} onChange={(e) => setLoteId(e.target.value)} className="input">
              <option value="">Sin lote</option>
              {lotes.map((l) => <option key={l.id} value={l.id}>{l.codigo} · {l.proveedor}</option>)}
            </select>
          </Campo>
          <Campo label="Fecha de ingreso a tienda">
            <input type="date" name="ingresado_en" defaultValue={unidad?.ingresado_en ?? new Date().toISOString().slice(0, 10)} className="input" />
          </Campo>
        </Seccion>

        <Seccion titulo="Configuración (variante)" nota="Las especificaciones reales de ESTA unidad.">
          <Campo label="Procesador *" className="sm:col-span-2">
            <input name="procesador" required defaultValue={unidad?.procesador} placeholder="Intel Core i7-8750H" className="input" />
          </Campo>
          <Campo label="RAM (GB)">
            <input name="ram_gb" type="number" min={2} defaultValue={unidad?.ram_gb ?? 16} className="input" />
          </Campo>
          <Campo label="Tipo de RAM">
            <input name="ram_tipo" defaultValue={unidad?.ram_tipo ?? ""} placeholder="DDR4" className="input" />
          </Campo>
          <Campo label="Almacenamiento total (GB)">
            <input name="almacenamiento_gb" type="number" min={16} defaultValue={unidad?.almacenamiento_gb ?? 512} className="input" />
          </Campo>
          <Campo label="Detalle de almacenamiento">
            <input name="almacenamiento" defaultValue={unidad?.almacenamiento ?? ""} placeholder="512 GB SSD NVMe" className="input" />
          </Campo>
          <Campo label="Tarjeta de video" className="sm:col-span-2">
            <input name="gpu" defaultValue={unidad?.gpu ?? ""} placeholder="NVIDIA GeForce RTX 3060 6 GB" className="input" />
          </Campo>
          <Campo label="Pantalla (pulgadas)">
            <input name="pantalla_pulg" type="number" step="0.1" defaultValue={unidad?.pantalla_pulg ?? 15.6} className="input" />
          </Campo>
          <Campo label="Detalle de pantalla">
            <input name="pantalla_detalle" defaultValue={unidad?.pantalla_detalle ?? ""} placeholder="Full HD 144 Hz" className="input" />
          </Campo>
          <Campo label="Color">
            <input name="color" defaultValue={unidad?.color ?? ""} className="input" />
          </Campo>
          <Campo label="Sistema operativo">
            <input name="sistema" defaultValue={unidad?.sistema ?? "Windows 11 Pro"} className="input" />
          </Campo>
        </Seccion>

        <Seccion titulo="Estado y garantía">
          <Campo label="Condición">
            <select name="condicion" defaultValue={unidad?.condicion ?? "seminuevo"} className="input">
              <option value="nuevo">Nuevo</option>
              <option value="open_box">Open box</option>
              <option value="seminuevo">Seminuevo certificado</option>
              <option value="remate">Remate</option>
            </select>
          </Campo>
          <Campo label="Grado estético">
            <select name="grado" defaultValue={unidad?.grado ?? "A"} className="input">
              <option value="A">A · Excelente</option>
              <option value="B">B · Detalles leves</option>
              <option value="C">C · Detalles notorios</option>
            </select>
          </Campo>
          <Campo label="Garantía (meses)">
            <input name="garantia_meses" type="number" min={0} defaultValue={unidad?.garantia_meses ?? 12} className="input" />
          </Campo>
          <Campo label="Estado en inventario">
            <select name="estado" defaultValue={unidad?.estado ?? "disponible"} className="input">
              <option value="en_transito">En tránsito</option>
              <option value="disponible">Disponible</option>
              <option value="reservado">Reservado</option>
              <option value="garantia">En garantía / taller</option>
              <option value="baja">De baja</option>
              {unidad?.estado === "vendido" && <option value="vendido">Vendido</option>}
            </select>
          </Campo>
        </Seccion>

        <Seccion titulo="Textos">
          <Campo label="Descripción para la web" className="sm:col-span-2">
            <textarea name="descripcion" rows={4} defaultValue={unidad?.descripcion ?? ""} className="input" />
          </Campo>
          <Campo label="Notas internas (no se publican)" className="sm:col-span-2">
            <textarea name="notas_internas" rows={2} defaultValue={unidad?.notas_internas ?? ""} className="input" placeholder="Batería al 87 %, se cambió teclado…" />
          </Campo>
        </Seccion>
      </div>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <div className="card p-5">
          <p className="font-display text-lg font-bold">Precio</p>
          <div className="mt-4 space-y-4">
            {esAdmin ? (
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Costo compra (USD)">
                  <input name="costo_usd" type="number" step="0.01" value={costoUsd || ""} onChange={(e) => setCostoUsd(Number(e.target.value))} className="input" />
                </Campo>
                <Campo label="Gastos extra (S/)">
                  <input name="costo_extra_pen" type="number" step="0.01" value={extra || ""} onChange={(e) => setExtra(Number(e.target.value))} className="input" />
                </Campo>
              </div>
            ) : (
              <>
                <input type="hidden" name="costo_usd" value={costoUsd} />
                <input type="hidden" name="costo_extra_pen" value={extra} />
              </>
            )}
            <Campo label="Precio de venta (S/) *">
              <input name="precio_pen" type="number" step="0.01" required value={precio || ""} onChange={(e) => setPrecio(Number(e.target.value))} className="input text-lg font-semibold" />
            </Campo>
            <Campo label="Precio de oferta (S/)">
              <input name="precio_oferta_pen" type="number" step="0.01" value={oferta || ""} onChange={(e) => setOferta(Number(e.target.value))} placeholder="Opcional" className="input" />
            </Campo>
            {esAdmin && (
              <dl className="space-y-1.5 rounded-xl bg-surface-2 p-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Tipo de cambio</dt><dd className="num">{tc.toFixed(3)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Costo total</dt><dd className="num font-semibold">{enSoles(costo)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Utilidad</dt><dd className={`num font-semibold ${utilidad < 0 ? "text-red-600" : "text-green"}`}>{enSoles(utilidad)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Margen</dt><dd className="num font-semibold">{venta ? enPorcentaje(utilidad / venta) : "—"}</dd></div>
              </dl>
            )}
          </div>
        </div>
        <div className="card space-y-3 p-5">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span><strong>Publicar en la web</strong><span className="block text-xs text-muted">Visible en el catálogo</span></span>
            <input type="checkbox" name="publicado" defaultChecked={unidad?.publicado ?? true} className="size-5 accent-[var(--navy)]" />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span><strong>Destacado</strong><span className="block text-xs text-muted">Aparece en la portada</span></span>
            <input type="checkbox" name="destacado" defaultChecked={unidad?.destacado ?? false} className="size-5 accent-[var(--navy)]" />
          </label>
        </div>
        {estado.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{estado.error}</p>}
        {estado.ok && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{estado.ok}</p>}
        <button className="btn-primary w-full py-3" disabled={pendiente}>
          <Save className="size-4" /> {pendiente ? "Guardando…" : unidad ? "Guardar cambios" : "Registrar equipo"}
        </button>
      </div>
    </form>
  );
}

function Seccion({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <p className="font-display text-lg font-bold">{titulo}</p>
      {nota && <p className="text-sm text-muted">{nota}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Campo({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}
