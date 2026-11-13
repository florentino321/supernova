"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Save, X } from "lucide-react";
import { guardarUnidad, type Resultado } from "../acciones";
import { enSoles, enPorcentaje } from "@/lib/formato";
import { ALMACENAMIENTOS, GPUS, PANTALLAS, PROCESADORES, RAMS } from "@/lib/opciones-equipo";
import { subirArchivo, validarArchivo } from "@/lib/subir-medios";
import type { Unidad } from "@/lib/tipos";
import type { DatosFormulario } from "./datos-form";

const hoyLima = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10);

export function FormUnidad({ unidad, modelos, marcas, categorias, procesadoresUsados, gpusUsadas }: DatosFormulario & { unidad?: Unidad }) {
  const router = useRouter();
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(guardarUnidad, {});

  // ---------- modelo, marca y categoría (se escriben; si el modelo ya existe se completan solos) ----------
  const [modelo, setModelo] = useState(unidad?.modelos?.nombre ?? "");
  const [marca, setMarca] = useState(unidad?.modelos?.marcas?.nombre ?? "");
  const [categoria, setCategoria] = useState(String(unidad?.modelos?.categoria_id ?? ""));
  const alEscribirModelo = (v: string) => {
    setModelo(v);
    const m = modelos.find((x) => x.nombre.toLowerCase() === v.trim().toLowerCase());
    if (m) {
      setMarca(m.marca);
      setCategoria(String(m.categoria_id));
    } else if (!marca) {
      // sugerir la marca por la primera palabra ("Dell Latitude 5420" → Dell)
      const primera = v.trim().split(/\s+/)[0]?.toLowerCase();
      const mm = marcas.find((x) => x.nombre.toLowerCase() === primera);
      if (mm) setMarca(mm.nombre);
    }
  };

  // ---------- precios ----------
  const [costo, setCosto] = useState(unidad?.costo_adquisicion_pen != null ? Number(unidad.costo_adquisicion_pen) : 0);
  const [precio, setPrecio] = useState(Number(unidad?.precio_pen ?? 0));
  const [oferta, setOferta] = useState(unidad?.precio_oferta_pen != null ? Number(unidad.precio_oferta_pen) : 0);
  const venta = oferta > 0 ? oferta : precio;
  const utilidad = venta - costo;

  // ---------- fotos (solo al registrar; luego se gestionan en la ficha) ----------
  const [fotos, setFotos] = useState<{ file: File; url: string }[]>([]);
  const [errorFoto, setErrorFoto] = useState("");
  const [subiendo, setSubiendo] = useState<{ hechas: number; total: number } | null>(null);
  const galeria = useRef<HTMLInputElement>(null);
  const camara = useRef<HTMLInputElement>(null);
  const agregar = (files: FileList | null) => {
    if (!files) return;
    setErrorFoto("");
    const nuevas: { file: File; url: string }[] = [];
    for (const file of Array.from(files)) {
      const motivo = validarArchivo(file);
      if (motivo) setErrorFoto(motivo);
      else nuevas.push({ file, url: URL.createObjectURL(file) });
    }
    setFotos((f) => [...f, ...nuevas]);
  };

  // al registrar un equipo nuevo: subir las fotos elegidas y abrir su ficha
  const procesado = useRef<number | null>(null);
  useEffect(() => {
    const id = estado.id;
    if (!id || unidad || procesado.current === id) return;
    procesado.current = id;
    (async () => {
      let fallidas = 0;
      setSubiendo({ hechas: 0, total: fotos.length });
      for (let i = 0; i < fotos.length; i++) {
        try {
          await subirArchivo(id, fotos[i].file);
        } catch {
          fallidas++;
        }
        setSubiendo({ hechas: i + 1, total: fotos.length });
      }
      router.push(`/admin/inventario/${id}?creado=1${fallidas ? `&fallidas=${fallidas}` : ""}`);
    })();
  }, [estado.id, unidad, fotos, router]);

  const ocupado = pendiente || subiendo !== null;

  return (
    <form action={accion} className="grid gap-6 xl:grid-cols-[1fr_320px]">
      {unidad && <input type="hidden" name="id" value={unidad.id} />}
      <div className="space-y-6">
        <Seccion titulo="Equipo">
          <Campo label="Modelo *" className="sm:col-span-2" nota={modelos.length ? "Escribe o elige uno ya registrado." : undefined}>
            <input
              name="modelo"
              required
              list="lista-modelos"
              value={modelo}
              onChange={(e) => alEscribirModelo(e.target.value)}
              placeholder="Ej.: Dell Latitude 5420"
              className="input"
              autoComplete="off"
            />
            <datalist id="lista-modelos">
              {modelos.map((m) => <option key={m.id} value={m.nombre}>{m.marca}</option>)}
            </datalist>
          </Campo>
          <Campo label="Marca *">
            <input name="marca" required list="lista-marcas" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ej.: Dell" className="input" autoComplete="off" />
            <datalist id="lista-marcas">
              {marcas.map((m) => <option key={m.id} value={m.nombre} />)}
            </datalist>
          </Campo>
          <Campo label="Categoría *">
            <select name="categoria_id" required value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input">
              <option value="">Elige…</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Campo>
          <Campo label="Fecha de ingreso a tienda">
            <input type="date" name="ingresado_en" defaultValue={unidad?.ingresado_en ?? hoyLima()} className="input" />
          </Campo>
          {unidad && (
            <Campo label="Código">
              <input value={unidad.sku} readOnly className="input bg-surface-2 font-mono" />
            </Campo>
          )}
        </Seccion>

        <Seccion titulo="Configuración" nota="Las especificaciones de esta unidad.">
          <Campo label="Procesador *" className="sm:col-span-2">
            <SelectConOtro name="procesador" requerido inicial={unidad?.procesador} grupos={conUsados(PROCESADORES, procesadoresUsados)} placeholder="Ej.: Intel Core i7-1165G7" />
          </Campo>
          <Campo label="Memoria RAM">
            <SelectConOtro name="ram_gb" inicial={unidad ? String(unidad.ram_gb) : "16"} opciones={RAMS.map((r) => [String(r), `${r} GB`])} placeholder="GB" tipo="number" />
          </Campo>
          <Campo label="Almacenamiento *">
            <SelectConOtro name="almacenamiento" requerido inicial={unidad?.almacenamiento ?? "512 GB SSD"} opciones={ALMACENAMIENTOS.map((a) => [a, a])} placeholder="Ej.: 1 TB SSD + 1 TB HDD" />
          </Campo>
          <Campo label="Tarjeta de video" className="sm:col-span-2">
            <SelectConOtro name="gpu" inicial={unidad?.gpu ?? "Gráficos integrados Intel"} grupos={conUsados(GPUS, gpusUsadas)} placeholder="Ej.: NVIDIA GeForce RTX 3060 6 GB" />
          </Campo>
          <Campo label="Pantalla">
            <SelectConOtro name="pantalla_pulg" inicial={unidad ? String(Number(unidad.pantalla_pulg)) : "15.6"} opciones={PANTALLAS.map((p) => [String(p), `${p}″`])} placeholder="Pulgadas" tipo="number" />
          </Campo>
        </Seccion>

        <Seccion titulo="Estado y garantía">
          <Campo label="Condición">
            <select name="condicion" defaultValue={unidad?.condicion ?? "seminuevo"} className="input">
              <option value="nuevo">Nuevo</option>
              <option value="open_box">Open box</option>
              <option value="seminuevo">Seminuevo certificado</option>
              {unidad?.condicion === "remate" && <option value="remate">Remate</option>}
            </select>
          </Campo>
          <Campo label="Grado estético">
            <select name="grado" defaultValue={unidad?.grado ?? "A"} className="input">
              <option value="A">A · Excelente</option>
              <option value="B">B · Detalles leves</option>
              <option value="C">C · Detalles notorios</option>
            </select>
          </Campo>
          <Campo label="Garantía">
            <select name="garantia_meses" defaultValue={String(unidad?.garantia_meses ?? 12)} className="input">
              {[0, 3, 6, 12, 24].map((m) => <option key={m} value={m}>{m ? `${m} meses` : "Sin garantía"}</option>)}
              {unidad && ![0, 3, 6, 12, 24].includes(unidad.garantia_meses) && <option value={unidad.garantia_meses}>{unidad.garantia_meses} meses</option>}
            </select>
          </Campo>
          <Campo label="Estado en inventario">
            <select name="estado" defaultValue={unidad?.estado ?? "disponible"} className="input">
              <option value="disponible">Disponible</option>
              <option value="en_transito">En camino (llega pronto)</option>
              <option value="reservado">Reservado</option>
              <option value="garantia">En garantía / taller</option>
              <option value="baja">De baja</option>
              {unidad?.estado === "vendido" && <option value="vendido">Vendido</option>}
            </select>
          </Campo>
        </Seccion>

        {!unidad && (
          <section className="card p-5">
            <p className="font-display text-lg font-bold">Fotos y videos</p>
            <p className="text-sm text-muted">Se suben al guardar. La primera foto será la portada. Se comprimen solas.</p>
            <input ref={galeria} type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => { agregar(e.target.files); e.target.value = ""; }} />
            <input ref={camara} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { agregar(e.target.files); e.target.value = ""; }} />
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => galeria.current?.click()}>
                <ImagePlus className="size-4" /> Elegir fotos
              </button>
              <button type="button" className="btn-ghost sm:hidden" onClick={() => camara.current?.click()}>
                <Camera className="size-4" /> Tomar foto
              </button>
            </div>
            {errorFoto && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{errorFoto}</p>}
            {fotos.length > 0 && (
              <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {fotos.map((f, i) => (
                  <li key={f.url} className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-surface-2 ${i === 0 ? "border-accent" : "border-line"}`}>
                    {f.file.type.startsWith("video/") ? (
                      <video src={f.url} className="size-full object-cover" muted />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.url} alt="" className="size-full object-cover" />
                    )}
                    {i === 0 && <span className="chip absolute left-1.5 top-1.5 bg-accent text-[10px] text-white">Portada</span>}
                    <button
                      type="button"
                      className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-white/95 text-red-600"
                      onClick={() => setFotos((l) => l.filter((x) => x.url !== f.url))}
                      aria-label="Quitar foto"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <div className="card p-5">
          <p className="font-display text-lg font-bold">Precio</p>
          <div className="mt-4 space-y-4">
            <Campo label="Precio de adquisición (S/)" nota="Todo lo que costó tenerlo en tienda: compra, pasaje, desaduanaje y otros gastos.">
              <input name="costo_adquisicion_pen" type="number" step="0.01" min={0} inputMode="decimal" value={costo || ""} onChange={(e) => setCosto(Number(e.target.value))} className="input" />
            </Campo>
            <Campo label="Precio de venta (S/) *">
              <input name="precio_pen" type="number" step="0.01" inputMode="decimal" required value={precio || ""} onChange={(e) => setPrecio(Number(e.target.value))} className="input text-lg font-semibold" />
            </Campo>
            <Campo label="Precio de oferta (S/)">
              <input name="precio_oferta_pen" type="number" step="0.01" inputMode="decimal" value={oferta || ""} onChange={(e) => setOferta(Number(e.target.value))} placeholder="Opcional" className="input" />
            </Campo>
            {costo > 0 && venta > 0 && (
              <dl className="space-y-1.5 rounded-xl bg-surface-2 p-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Utilidad</dt><dd className={`num font-semibold ${utilidad < 0 ? "text-red-600" : "text-green"}`}>{enSoles(utilidad)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Margen</dt><dd className="num font-semibold">{enPorcentaje(utilidad / venta)}</dd></div>
              </dl>
            )}
          </div>
        </div>
        <div className="card p-5">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span><strong>Publicar en la web</strong><span className="block text-xs text-muted">Visible en el catálogo</span></span>
            <input type="checkbox" name="publicado" defaultChecked={unidad?.publicado ?? true} className="size-5 accent-[var(--navy)]" />
          </label>
        </div>
        {estado.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{estado.error}</p>}
        {estado.ok && unidad && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{estado.ok}</p>}
        <button className="btn-primary w-full py-3" disabled={ocupado}>
          {subiendo ? (
            <><Loader2 className="size-4 animate-spin" /> Subiendo fotos {subiendo.hechas}/{subiendo.total}…</>
          ) : (
            <><Save className="size-4" /> {pendiente ? "Guardando…" : unidad ? "Guardar cambios" : "Registrar equipo"}</>
          )}
        </button>
      </div>
    </form>
  );
}

/** Agrega al final de la lista los valores que ya se usaron y no están en las opciones. */
function conUsados(grupos: [string, string[]][], usados: string[]): [string, string[]][] {
  const todas = new Set(grupos.flatMap(([, o]) => o));
  const extra = usados.filter((u) => !todas.has(u)).sort();
  return extra.length ? [...grupos, ["Usados antes", extra]] : grupos;
}

/**
 * Select con opciones fijas y "Otro…" para escribir un valor que no está en la lista.
 * El valor final se envía en un campo oculto con el nombre indicado.
 */
function SelectConOtro({
  name,
  inicial,
  opciones,
  grupos,
  placeholder,
  requerido,
  tipo = "text",
}: {
  name: string;
  inicial?: string | null;
  opciones?: [valor: string, texto: string][];
  grupos?: [string, string[]][];
  placeholder?: string;
  requerido?: boolean;
  tipo?: "text" | "number";
}) {
  const valores = useMemo(() => new Set([...(opciones ?? []).map(([v]) => v), ...(grupos ?? []).flatMap(([, o]) => o)]), [opciones, grupos]);
  const enLista = !inicial || valores.has(inicial);
  const [eleccion, setEleccion] = useState(enLista ? (inicial ?? "") : "__otro");
  const [otro, setOtro] = useState(enLista ? "" : (inicial ?? ""));
  const valor = eleccion === "__otro" ? otro : eleccion;

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={valor} />
      <select className="input" value={eleccion} onChange={(e) => setEleccion(e.target.value)} required={requerido}>
        <option value="">Elige…</option>
        {opciones?.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        {grupos?.map(([g, os]) => (
          <optgroup key={g} label={g}>
            {os.map((o) => <option key={o} value={o}>{o}</option>)}
          </optgroup>
        ))}
        <option value="__otro">Otro… (escribir)</option>
      </select>
      {eleccion === "__otro" && (
        <input
          className="input"
          type={tipo}
          step={tipo === "number" ? "0.1" : undefined}
          value={otro}
          onChange={(e) => setOtro(e.target.value)}
          placeholder={placeholder}
          required={requerido}
          autoFocus
        />
      )}
    </div>
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

function Campo({ label, nota, className = "", children }: { label: string; nota?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <span className="label">{label}</span>
      {children}
      {nota && <p className="mt-1 text-xs text-muted">{nota}</p>}
    </div>
  );
}
