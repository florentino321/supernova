"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, BellRing, Clock, FileText, HandCoins, Minus, Plus, TrendingUp } from "lucide-react";
import { compacto, enSoles, enSolesCorto, enPorcentaje, etiquetaCanal, etiquetaPago, fecha } from "@/lib/formato";
import type { Canal, EstadoUnidad, MetodoPago } from "@/lib/tipos";

export type FilaVenta = {
  id: number; codigo: string; fecha: string; total: number; descuento: number; costo: number;
  canal: Canal; pago: MetodoPago; cliente: string; ciudad: string;
  modelo: string; marca: string; categoria: string; unidadId: number; diasParaVender: number;
};
export type FilaInventario = {
  id: number; sku: string; estado: EstadoUnidad; ingresado: string; precio: number; costo: number;
  modelo: string; marca: string; categoria: string;
};

// Paleta categórica validada (orden fijo) + rampa ordinal azul
const C = { s1: "#2a78d6", s2: "#eb6834", s3: "#1baf7a", s4: "#eda100", grid: "#e8ebef", eje: "#6b7686" };
const RAMPA = ["#86b6ef", "#5598e7", "#256abf", "#184f95"];

const PERIODOS = [
  { id: "30d", t: "30 días" },
  { id: "90d", t: "90 días" },
  { id: "6m", t: "6 meses" },
  { id: "12m", t: "12 meses" },
  { id: "anio", t: "Este año" },
  { id: "todo", t: "Todo" },
] as const;
type Periodo = (typeof PERIODOS)[number]["id"];

const DIA = 86_400_000;
function rango(p: Periodo, hoy: Date, primera: Date): [Date, Date] {
  const fin = new Date(hoy.getTime() + DIA);
  const ini = new Date(hoy);
  if (p === "30d") ini.setDate(ini.getDate() - 29);
  if (p === "90d") ini.setDate(ini.getDate() - 89);
  if (p === "6m") ini.setMonth(ini.getMonth() - 6);
  if (p === "12m") ini.setMonth(ini.getMonth() - 12);
  if (p === "anio") ini.setMonth(0, 1);
  if (p === "todo") return [primera, fin];
  ini.setHours(0, 0, 0, 0);
  return [ini, fin];
}

const mesCorto = (d: Date) => d.toLocaleDateString("es-PE", { month: "short", year: "2-digit" }).replace(".", "");

export type Pendientes = { reservas: number; adelantos: number; interesados: number; cotizaciones: number };

export function Dashboard({ ventas, inventario, esAdmin, nombre, pendientes }: {
  ventas: FilaVenta[]; inventario: FilaInventario[]; esAdmin: boolean; nombre: string; pendientes: Pendientes;
}) {
  const [periodo, setPeriodo] = useState<Periodo>("12m");
  const [marca, setMarca] = useState("");
  const [categoria, setCategoria] = useState("");

  const hoy = useMemo(() => new Date(), []);
  const marcas = useMemo(() => [...new Set(inventario.map((u) => u.marca))].sort(), [inventario]);
  const categorias = useMemo(() => [...new Set(inventario.map((u) => u.categoria))].sort(), [inventario]);

  const d = useMemo(() => {
    const primera = ventas.length ? new Date(ventas[0].fecha) : hoy;
    const [ini, fin] = rango(periodo, hoy, primera);
    const largo = fin.getTime() - ini.getTime();
    const filtro = (v: FilaVenta) =>
      (!marca || v.marca === marca) && (!categoria || v.categoria === categoria);
    const base = ventas.filter(filtro);
    const actuales = base.filter((v) => +new Date(v.fecha) >= +ini && +new Date(v.fecha) < +fin);
    const previas = base.filter((v) => +new Date(v.fecha) >= ini.getTime() - largo && +new Date(v.fecha) < +ini);

    const resumen = (l: FilaVenta[]) => {
      const ingresos = l.reduce((a, v) => a + v.total, 0);
      const costo = l.reduce((a, v) => a + v.costo, 0);
      return {
        ingresos,
        utilidad: ingresos - costo,
        margen: ingresos ? (ingresos - costo) / ingresos : 0,
        unidades: l.length,
        ticket: l.length ? ingresos / l.length : 0,
        dias: l.length ? l.reduce((a, v) => a + v.diasParaVender, 0) / l.length : 0,
      };
    };

    // serie temporal: semanas para periodos cortos, meses para largos
    const semanal = periodo === "30d" || periodo === "90d";
    const cubetas: { clave: string; etiqueta: string; ingresos: number; utilidad: number; unidades: number }[] = [];
    if (semanal) {
      for (let t = ini.getTime(); t < fin.getTime(); t += 7 * DIA) {
        const s = new Date(t);
        cubetas.push({ clave: String(t), etiqueta: s.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }).replace(".", ""), ingresos: 0, utilidad: 0, unidades: 0 });
      }
    } else {
      const c = new Date(ini.getFullYear(), ini.getMonth(), 1);
      while (c < fin) {
        cubetas.push({ clave: `${c.getFullYear()}-${c.getMonth()}`, etiqueta: mesCorto(c), ingresos: 0, utilidad: 0, unidades: 0 });
        c.setMonth(c.getMonth() + 1);
      }
    }
    actuales.forEach((v) => {
      const f = new Date(v.fecha);
      const b = semanal
        ? cubetas[Math.min(cubetas.length - 1, Math.floor((f.getTime() - ini.getTime()) / (7 * DIA)))]
        : cubetas.find((x) => x.clave === `${f.getFullYear()}-${f.getMonth()}`);
      if (!b) return;
      b.ingresos += v.total;
      b.utilidad += v.total - v.costo;
      b.unidades += 1;
    });

    const agrupar = (k: (v: FilaVenta) => string) => {
      const m = new Map<string, { nombre: string; ingresos: number; utilidad: number; unidades: number }>();
      actuales.forEach((v) => {
        const n = k(v);
        const r = m.get(n) ?? { nombre: n, ingresos: 0, utilidad: 0, unidades: 0 };
        r.ingresos += v.total;
        r.utilidad += v.total - v.costo;
        r.unidades += 1;
        m.set(n, r);
      });
      return [...m.values()].sort((a, b) => b.ingresos - a.ingresos);
    };
    const porMarcaTodo = agrupar((v) => v.marca);
    const porMarca = porMarcaTodo.length > 7
      ? [...porMarcaTodo.slice(0, 6), porMarcaTodo.slice(6).reduce((a, x) => ({ nombre: "Otras", ingresos: a.ingresos + x.ingresos, utilidad: a.utilidad + x.utilidad, unidades: a.unidades + x.unidades }), { nombre: "Otras", ingresos: 0, utilidad: 0, unidades: 0 })]
      : porMarcaTodo;

    // inventario actual (no depende del periodo)
    const inv = inventario.filter((u) => (!marca || u.marca === marca) && (!categoria || u.categoria === categoria));
    const enStock = inv.filter((u) => u.estado === "disponible" || u.estado === "reservado");
    const dias = (u: FilaInventario) => Math.max(0, Math.round((hoy.getTime() - new Date(`${u.ingresado}T12:00:00`).getTime()) / DIA));
    const aging = [
      { nombre: "0–30 días", n: 0 },
      { nombre: "31–60 días", n: 0 },
      { nombre: "61–90 días", n: 0 },
      { nombre: "Más de 90", n: 0 },
    ];
    enStock.forEach((u) => {
      const x = dias(u);
      aging[x <= 30 ? 0 : x <= 60 ? 1 : x <= 90 ? 2 : 3].n += 1;
    });

    return {
      actual: resumen(actuales),
      previo: resumen(previas),
      hayPrevio: previas.length > 0,
      cubetas,
      porCategoria: agrupar((v) => v.categoria),
      porMarca,
      porCanal: agrupar((v) => etiquetaCanal[v.canal]),
      porPago: agrupar((v) => etiquetaPago[v.pago]),
      porCiudad: agrupar((v) => v.ciudad).slice(0, 6),
      topModelos: agrupar((v) => v.modelo).sort((a, b) => (esAdmin ? b.utilidad - a.utilidad : b.ingresos - a.ingresos)).slice(0, 6),
      ultimas: [...actuales].reverse().slice(0, 6),
      estados: (["disponible", "reservado", "en_transito", "garantia"] as EstadoUnidad[]).map((e) => ({ e, n: inv.filter((u) => u.estado === e).length })),
      valorStock: enStock.reduce((a, u) => a + u.precio, 0),
      costoStock: enStock.reduce((a, u) => a + u.costo, 0),
      enStock: enStock.length,
      aging,
      lentos: enStock.map((u) => ({ ...u, dias: dias(u) })).sort((a, b) => b.dias - a.dias).slice(0, 5),
    };
  }, [ventas, inventario, periodo, marca, categoria, hoy, esAdmin]);

  const nombrePeriodo = PERIODOS.find((p) => p.id === periodo)!.t.toLowerCase();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface px-4 pt-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Hola, {nombre.split(" ")[0]} · {hoy.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="font-display text-3xl font-extrabold">Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/inventario/nuevo" className="btn-ghost"><Plus className="size-4" /> Equipo</Link>
            <Link href="/admin/ventas/nueva" className="btn-accent"><Plus className="size-4" /> Venta</Link>
          </div>
        </div>
        {/* filtros en una sola fila */}
        <div className="scroll-fino mt-5 flex items-center gap-2 overflow-x-auto pb-4">
          <div className="flex shrink-0 rounded-xl bg-surface-2 p-1">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodo(p.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${periodo === p.id ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
              >
                {p.t}
              </button>
            ))}
          </div>
          <select className="input w-auto shrink-0 py-2" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="input w-auto shrink-0 py-2" value={marca} onChange={(e) => setMarca(e.target.value)}>
            <option value="">Todas las marcas</option>
            {marcas.map((m) => <option key={m}>{m}</option>)}
          </select>
          {(marca || categoria) && (
            <button className="shrink-0 text-sm font-medium text-blue" onClick={() => { setMarca(""); setCategoria(""); }}>Limpiar</button>
          )}
        </div>
      </header>

      <div className="space-y-6 p-4 sm:p-8">
        {/* ---------- KPIs ---------- */}
        <section className={`grid grid-cols-2 gap-3 md:grid-cols-3 ${esAdmin ? "xl:grid-cols-6" : "xl:grid-cols-4"}`}>
          <Kpi titulo="Ingresos" valor={enSolesCorto(d.actual.ingresos)} actual={d.actual.ingresos} previo={d.previo.ingresos} hayPrevio={d.hayPrevio} destacado />
          {esAdmin && <Kpi titulo="Utilidad bruta" valor={enSolesCorto(d.actual.utilidad)} actual={d.actual.utilidad} previo={d.previo.utilidad} hayPrevio={d.hayPrevio} />}
          {esAdmin && <Kpi titulo="Margen bruto" valor={enPorcentaje(d.actual.margen)} actual={d.actual.margen} previo={d.previo.margen} hayPrevio={d.hayPrevio} puntos />}
          <Kpi titulo="Equipos vendidos" valor={String(d.actual.unidades)} actual={d.actual.unidades} previo={d.previo.unidades} hayPrevio={d.hayPrevio} />
          <Kpi titulo="Ticket promedio" valor={enSolesCorto(d.actual.ticket)} actual={d.actual.ticket} previo={d.previo.ticket} hayPrevio={d.hayPrevio} />
          <Kpi titulo="Días para vender" valor={d.actual.unidades ? `${Math.round(d.actual.dias)} d` : "—"} actual={d.actual.dias} previo={d.previo.dias} hayPrevio={d.hayPrevio} inverso />
        </section>

        {/* ---------- Pendientes del día ---------- */}
        <section className="grid gap-3 sm:grid-cols-3">
          <Pendiente href="/admin/reservas" icono={<HandCoins className="size-5" />} titulo="Reservas activas" valor={pendientes.reservas}
            detalle={pendientes.reservas ? `${enSoles(pendientes.adelantos)} en adelantos` : "Ningún equipo separado"} />
          <Pendiente href="/admin/interesados" icono={<BellRing className="size-5" />} titulo="Interesados por contactar" valor={pendientes.interesados}
            detalle={pendientes.interesados ? "Pidieron aviso desde la web" : "Sin pendientes"} />
          <Pendiente href="/admin/cotizaciones" icono={<FileText className="size-5" />} titulo="Cotizaciones vigentes" valor={pendientes.cotizaciones}
            detalle={pendientes.cotizaciones ? "Esperando respuesta del cliente" : "Sin cotizaciones abiertas"} />
        </section>

        {/* ---------- Serie temporal ---------- */}
        <section className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">{esAdmin ? "Ingresos y utilidad" : "Ingresos"}</h2>
              <p className="text-sm text-muted">{periodo === "30d" || periodo === "90d" ? "Por semana" : "Por mes"} · últimos {nombrePeriodo}</p>
            </div>
            <div className="flex gap-4 text-sm text-ink-2">
              <Leyenda color={C.s1} texto="Ingresos" />
              {esAdmin && <Leyenda color={C.s2} texto="Utilidad bruta" linea />}
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={d.cubetas} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="etiqueta" tickLine={false} axisLine={{ stroke: C.grid }} tick={{ fill: C.eje, fontSize: 12 }} interval="preserveStartEnd" minTickGap={12} />
                <YAxis tickFormatter={compacto} tickLine={false} axisLine={false} tick={{ fill: C.eje, fontSize: 12 }} width={64} />
                <Tooltip content={(p) => <TooltipSerie {...p} esAdmin={esAdmin} />} cursor={{ fill: "rgba(11,22,38,0.04)" }} />
                <Bar dataKey="ingresos" name="Ingresos" fill={C.s1} radius={[4, 4, 0, 0]} maxBarSize={36} />
                {esAdmin && <Line dataKey="utilidad" name="Utilidad" stroke={C.s2} strokeWidth={2} dot={{ r: 4, fill: C.s2, stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 5 }} />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {d.actual.unidades === 0 && <p className="text-center text-sm text-muted">No hay ventas en este periodo con los filtros elegidos.</p>}
        </section>

        {/* ---------- Desglose (una sola tarjeta con pestañas) ---------- */}
        <Desglose
          sub={`Ingresos · últimos ${nombrePeriodo}`}
          esAdmin={esAdmin}
          grupos={{
            Categoría: d.porCategoria,
            Marca: d.porMarca,
            Canal: d.porCanal,
            "Método de pago": d.porPago,
            Ciudad: d.porCiudad,
          }}
        />

        {/* ---------- Inventario ---------- */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">Inventario actual</h2>
                <p className="text-sm text-muted">Foto de hoy · no depende del periodo</p>
              </div>
              <div className="text-right">
                <p className="num font-display text-2xl font-extrabold">{enSolesCorto(d.valorStock)}</p>
                <p className="text-xs text-muted">
                  valor de venta de {d.enStock} equipos{esAdmin && d.costoStock > 0 ? ` · invertido ${enSolesCorto(d.costoStock)}` : ""}
                </p>
              </div>
            </div>
            <BarraSegmentada estados={d.estados} />
            <h3 className="mt-6 text-sm font-semibold">Antigüedad del stock</h3>
            <div className="mt-2 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.aging} margin={{ top: 16, right: 0, left: 0, bottom: 0 }} barCategoryGap="22%">
                  <XAxis dataKey="nombre" tickLine={false} axisLine={{ stroke: C.grid }} tick={{ fill: C.eje, fontSize: 12 }} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(11,22,38,0.04)" }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <CajaTooltip titulo={String(label)} filas={[["Equipos", String(payload[0].value)]]} />
                      ) : null
                    }
                  />
                  <Bar dataKey="n" radius={[4, 4, 0, 0]} label={{ position: "top", fill: "#3c4859", fontSize: 12 }}>
                    {d.aging.map((_, i) => (
                      <Cell key={i} fill={RAMPA[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Clock className="size-4 text-amber" /> Más tiempo en tienda</h2>
            <p className="text-sm text-muted">Candidatos a oferta o promoción en redes</p>
            <ul className="mt-4 divide-y divide-line">
              {d.lentos.map((u) => (
                <li key={u.id}>
                  <Link href={`/admin/inventario/${u.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-blue">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{u.modelo}</span>
                      <span className="font-mono text-xs text-muted">{u.sku}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className={`num block text-sm font-semibold ${u.dias > 90 ? "text-red-600" : u.dias > 60 ? "text-amber" : ""}`}>{u.dias} días</span>
                      <span className="num text-xs text-muted">{enSoles(u.precio)}</span>
                    </span>
                  </Link>
                </li>
              ))}
              {d.lentos.length === 0 && <li className="py-6 text-center text-sm text-muted">Sin equipos en stock.</li>}
            </ul>
          </section>
        </div>

        {/* ---------- Top modelos y últimas ventas ---------- */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold"><TrendingUp className="size-4 text-green" /> {esAdmin ? "Modelos más rentables" : "Modelos más vendidos"}</h2>
            <p className="text-sm text-muted">Últimos {nombrePeriodo}</p>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 font-semibold">Modelo</th>
                  <th className="py-2 text-right font-semibold">Uds.</th>
                  <th className="py-2 text-right font-semibold">Ingresos</th>
                  {esAdmin && <th className="py-2 text-right font-semibold">Utilidad</th>}
                </tr>
              </thead>
              <tbody>
                {d.topModelos.map((m) => (
                  <tr key={m.nombre} className="border-t border-line">
                    <td className="py-2.5 font-medium">{m.nombre}</td>
                    <td className="num py-2.5 text-right">{m.unidades}</td>
                    <td className="num py-2.5 text-right">{enSoles(m.ingresos)}</td>
                    {esAdmin && <td className="num py-2.5 text-right font-semibold">{enSoles(m.utilidad)}</td>}
                  </tr>
                ))}
                {d.topModelos.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted">Sin ventas en el periodo.</td></tr>}
              </tbody>
            </table>
          </section>
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Últimas ventas</h2>
              <Link href="/admin/ventas" className="text-sm font-medium text-blue hover:underline">Ver historial →</Link>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {d.ultimas.map((v) => (
                <li key={v.id}>
                  <Link href={`/admin/ventas/${v.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-blue">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{v.modelo}</span>
                      <span className="text-xs text-muted">{v.cliente} · {etiquetaCanal[v.canal]} · {fecha(v.fecha)}</span>
                    </span>
                    <span className="num shrink-0 text-sm font-semibold">{enSoles(v.total)}</span>
                  </Link>
                </li>
              ))}
              {d.ultimas.length === 0 && <li className="py-6 text-center text-sm text-muted">Sin ventas en el periodo.</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
function Kpi({ titulo, valor, actual, previo, hayPrevio, destacado, inverso, puntos }: {
  titulo: string; valor: string; actual: number; previo: number; hayPrevio: boolean; destacado?: boolean; inverso?: boolean; puntos?: boolean;
}) {
  let delta: number | null = null;
  if (hayPrevio && previo) delta = puntos ? (actual - previo) * 100 : (actual - previo) / Math.abs(previo);
  const bueno = delta === null ? null : inverso ? delta < 0 : delta > 0;
  const Icono = delta === null || Math.abs(delta) < 0.005 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className={`rounded-2xl border p-4 ${destacado ? "border-navy bg-navy text-white" : "card"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${destacado ? "text-white/60" : "text-muted"}`}>{titulo}</p>
      <p className="num mt-1 font-display text-2xl font-extrabold">{valor}</p>
      <p className={`mt-1 flex items-center gap-1 text-xs ${destacado ? "text-white/70" : "text-muted"}`}>
        {delta === null ? (
          "sin periodo previo"
        ) : (
          <>
            <span className={`inline-flex items-center font-semibold ${destacado ? "text-white" : bueno ? "text-[#006300]" : "text-red-600"}`}>
              <Icono className="size-3.5" />
              {puntos ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} pts` : `${delta > 0 ? "+" : ""}${(delta * 100).toFixed(0)}%`}
            </span>
            vs. periodo anterior
          </>
        )}
      </p>
    </div>
  );
}

function Pendiente({ href, icono, titulo, valor, detalle }: { href: string; icono: React.ReactNode; titulo: string; valor: number; detalle: string }) {
  return (
    <Link href={href} className="card flex items-center gap-4 p-4 transition hover:border-ink-2">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${valor ? "bg-amber-100 text-amber-800" : "bg-surface-2 text-muted"}`}>{icono}</span>
      <span className="min-w-0">
        <span className="block text-sm text-muted">{titulo}</span>
        <span className="num block font-display text-2xl font-extrabold leading-tight">{valor}</span>
        <span className="block truncate text-xs text-muted">{detalle}</span>
      </span>
    </Link>
  );
}

function Leyenda({ color, texto, linea }: { color: string; texto: string; linea?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      {linea ? <span className="h-0.5 w-4 rounded" style={{ background: color }} /> : <span className="size-2.5 rounded-sm" style={{ background: color }} />}
      {texto}
    </span>
  );
}

function CajaTooltip({ titulo, filas }: { titulo: string; filas: [string, string, string?][] }) {
  return (
    <div className="min-w-44 rounded-xl border border-line bg-white px-3 py-2.5 text-sm shadow-lg">
      <p className="mb-1.5 font-semibold text-ink">{titulo}</p>
      {filas.map(([k, v, color]) => (
        <p key={k} className="flex items-center justify-between gap-4 text-ink-2">
          <span className="flex items-center gap-1.5">
            {color && <span className="size-2 rounded-full" style={{ background: color }} />}
            {k}
          </span>
          <span className="num font-semibold text-ink">{v}</span>
        </p>
      ))}
    </div>
  );
}

function TooltipSerie({ active, payload, label, esAdmin }: { active?: boolean; payload?: readonly { payload?: unknown }[]; label?: unknown; esAdmin: boolean }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as { ingresos: number; utilidad: number; unidades: number };
  const filas: [string, string, string?][] = [["Ingresos", enSoles(p.ingresos), C.s1]];
  if (esAdmin) filas.push(["Utilidad", enSoles(p.utilidad), C.s2], ["Margen", p.ingresos ? enPorcentaje(p.utilidad / p.ingresos) : "—"]);
  filas.push(["Equipos vendidos", String(p.unidades)]);
  return <CajaTooltip titulo={String(label)} filas={filas} />;
}

type Grupo = { nombre: string; ingresos: number; utilidad: number; unidades: number };

function Desglose({ sub, grupos, esAdmin }: { sub: string; grupos: Record<string, Grupo[]>; esAdmin: boolean }) {
  const claves = Object.keys(grupos);
  const [dim, setDim] = useState(claves[0]);
  const datos = grupos[dim] ?? [];
  const total = datos.reduce((a, x) => a + x.ingresos, 0);
  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">¿De dónde vienen las ventas?</h2>
          <p className="text-sm text-muted">{sub}</p>
        </div>
        <div className="scroll-fino flex max-w-full overflow-x-auto rounded-xl bg-surface-2 p-1">
          {claves.map((k) => (
            <button
              key={k}
              onClick={() => setDim(k)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${dim === k ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <ul className="mt-5 grid gap-x-10 gap-y-3 md:grid-cols-2">
        {datos.map((x) => {
          const pct = total ? x.ingresos / total : 0;
          return (
            <li key={x.nombre} className="group">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium">{x.nombre}</span>
                <span className="num shrink-0 text-ink-2">
                  <span className="font-semibold text-ink">{enSolesCorto(x.ingresos)}</span> · {(pct * 100).toFixed(0)}% · {x.unidades} {x.unidades === 1 ? "venta" : "ventas"}
                  {esAdmin && x.ingresos > 0 && <> · margen {enPorcentaje(x.utilidad / x.ingresos)}</>}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full transition-all group-hover:brightness-110" style={{ width: `${pct * 100}%`, background: C.s1 }} />
              </div>
            </li>
          );
        })}
        {datos.length === 0 && <li className="py-6 text-center text-sm text-muted md:col-span-2">Sin ventas en el periodo.</li>}
      </ul>
    </section>
  );
}

const colorEstadoGrafico: Record<string, string> = { disponible: C.s3, reservado: C.s4, en_transito: "#6250d6", garantia: C.s1 };
const nombreEstado: Record<string, string> = { disponible: "Disponibles", reservado: "Reservados", en_transito: "En tránsito", garantia: "En garantía" };

function BarraSegmentada({ estados }: { estados: { e: EstadoUnidad; n: number }[] }) {
  const total = estados.reduce((a, x) => a + x.n, 0);
  return (
    <div className="mt-5">
      <div className="flex h-9 gap-0.5 overflow-hidden rounded-lg">
        {estados.filter((x) => x.n > 0).map((x) => (
          <div
            key={x.e}
            className="grid place-items-center text-xs font-semibold"
            style={{ width: `${(x.n / total) * 100}%`, background: colorEstadoGrafico[x.e], color: x.e === "reservado" ? "#0b0b0b" : "#fff" }}
            title={`${nombreEstado[x.e]}: ${x.n}`}
          >
            {x.n}
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
        {estados.map((x) => (
          <span key={x.e} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: colorEstadoGrafico[x.e] }} />
            {nombreEstado[x.e]} <span className="num font-semibold text-ink">{x.n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
