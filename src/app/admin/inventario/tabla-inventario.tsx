"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownUp, Download, Search, Star } from "lucide-react";
import { ChipCondicion, ChipEstado } from "@/components/chips";
import { PlaceholderLaptop } from "@/components/placeholder-laptop";
import { costoUnidad, margen } from "@/lib/calculos";
import { diasEntre, enSoles, enSolesCorto, enPorcentaje, etiquetaEstado } from "@/lib/formato";
import type { Categoria, EstadoUnidad, Marca, Unidad } from "@/lib/tipos";

const pestañas: (EstadoUnidad | "")[] = ["", "disponible", "reservado", "en_transito", "vendido", "garantia", "baja"];
type Orden = "reciente" | "precio" | "dias" | "margen" | "modelo";

export function TablaInventario({
  unidades,
  marcas,
  categorias,
  esAdmin,
  estadoInicial,
}: {
  unidades: Unidad[];
  marcas: Marca[];
  categorias: Categoria[];
  esAdmin: boolean;
  estadoInicial: string;
}) {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<EstadoUnidad | "">((estadoInicial as EstadoUnidad) || "");
  const [marca, setMarca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [orden, setOrden] = useState<Orden>("reciente");
  const [desc, setDesc] = useState(true);

  const filas = useMemo(() => {
    const t = q.toLowerCase();
    const lista = unidades
      .map((u) => {
        const costo = costoUnidad(u);
        const precio = Number(u.precio_oferta_pen ?? u.precio_pen);
        return { u, costo, precio, margen: margen(precio, costo), dias: diasEntre(u.ingresado_en) };
      })
      .filter(({ u }) => {
        if (estado && u.estado !== estado) return false;
        if (marca && String(u.modelos?.marcas?.id) !== marca) return false;
        if (categoria && String(u.modelos?.categorias?.id) !== categoria) return false;
        if (t) {
          const s = [u.sku, u.serie, u.modelos?.nombre, u.procesador, u.gpu, u.color, u.lotes?.codigo].join(" ").toLowerCase();
          if (!s.includes(t)) return false;
        }
        return true;
      });
    const k = {
      reciente: (x: (typeof lista)[0]) => x.u.creado_en,
      precio: (x: (typeof lista)[0]) => x.precio,
      dias: (x: (typeof lista)[0]) => x.dias,
      margen: (x: (typeof lista)[0]) => x.margen,
      modelo: (x: (typeof lista)[0]) => x.u.modelos?.nombre ?? "",
    }[orden];
    return lista.sort((a, b) => {
      const va = k(a), vb = k(b);
      const r = typeof va === "number" ? va - (vb as number) : String(va).localeCompare(String(vb));
      return desc ? -r : r;
    });
  }, [unidades, q, estado, marca, categoria, orden, desc]);

  const conteo = (e: EstadoUnidad | "") => (e ? unidades.filter((u) => u.estado === e).length : unidades.length);
  const enStock = unidades.filter((u) => u.estado === "disponible" || u.estado === "reservado");
  const valorVenta = enStock.reduce((a, u) => a + Number(u.precio_oferta_pen ?? u.precio_pen), 0);
  const valorCosto = enStock.reduce((a, u) => a + costoUnidad(u), 0);
  const lentos = enStock.filter((u) => diasEntre(u.ingresado_en) > 60).length;

  const ordenarPor = (o: Orden) => {
    if (orden === o) setDesc(!desc);
    else {
      setOrden(o);
      setDesc(true);
    }
  };

  const exportar = () => {
    const cab = ["SKU", "Serie", "Modelo", "Marca", "Categoría", "Procesador", "RAM", "Almacenamiento", "GPU", "Condición", "Grado", "Estado", "Lote", "Ingreso", "Días", "Precio", "Oferta", ...(esAdmin ? ["Costo S/", "Margen"] : [])];
    const filasCsv = filas.map(({ u, costo, margen: m, dias }) => [
      u.sku, u.serie, u.modelos?.nombre, u.modelos?.marcas?.nombre, u.modelos?.categorias?.nombre, u.procesador, u.ram_gb,
      u.almacenamiento, u.gpu, u.condicion, u.grado, etiquetaEstado[u.estado], u.lotes?.codigo, u.ingresado_en, dias,
      u.precio_pen, u.precio_oferta_pen ?? "", ...(esAdmin ? [costo, (m * 100).toFixed(1) + "%"] : []),
    ]);
    const csv = [cab, ...filasCsv].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `inventario-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5 p-4 sm:p-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Resumen titulo="Equipos en tienda" valor={String(enStock.length)} nota={`${conteo("en_transito")} en camino desde EE.UU.`} />
        <Resumen titulo="Valor a precio de venta" valor={enSolesCorto(valorVenta)} nota="Disponibles + reservados" />
        {esAdmin ? (
          <Resumen titulo="Capital invertido" valor={enSolesCorto(valorCosto)} nota={`Utilidad potencial ${enSolesCorto(valorVenta - valorCosto)}`} />
        ) : (
          <Resumen titulo="Reservados" valor={String(conteo("reservado"))} nota="Pendientes de pago" />
        )}
        <Resumen titulo="Más de 60 días" valor={String(lentos)} nota="Candidatos a oferta" alerta={lentos > 0} />
      </div>

      <div className="card overflow-hidden">
        <div className="scroll-fino flex gap-1 overflow-x-auto border-b border-line px-3 pt-3">
          {pestañas.map((e) => (
            <button
              key={e || "todos"}
              onClick={() => setEstado(e)}
              className={`shrink-0 rounded-t-lg border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition ${
                estado === e ? "border-navy text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {e ? etiquetaEstado[e] : "Todos"}
              <span className="num ml-1.5 rounded-full bg-surface-2 px-1.5 text-xs">{conteo(e)}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 border-b border-line p-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Buscar por código, modelo o procesador…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input w-auto" value={marca} onChange={(e) => setMarca(e.target.value)}>
            <option value="">Todas las marcas</option>
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <select className="input w-auto" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <button className="btn-ghost" onClick={exportar}>
            <Download className="size-4" /> Excel (CSV)
          </button>
        </div>
        <div className="scroll-fino overflow-x-auto">
          <table className="tabla min-w-[960px]">
            <thead>
              <tr>
                <Th onClick={() => ordenarPor("modelo")}>Equipo</Th>
                <th>Condición</th>
                <th>Estado</th>
                <Th onClick={() => ordenarPor("dias")}>Días</Th>
                {esAdmin && <th className="text-right">Costo</th>}
                <Th onClick={() => ordenarPor("precio")} derecha>Precio</Th>
                {esAdmin && <Th onClick={() => ordenarPor("margen")} derecha>Margen</Th>}
              </tr>
            </thead>
            <tbody>
              {filas.map(({ u, costo, precio, margen: m, dias }) => {
                const img = (u.medios ?? []).find((x) => x.es_portada) ?? (u.medios ?? []).find((x) => x.tipo === "imagen");
                return (
                  <tr key={u.id} className="cursor-pointer">
                    <td>
                      <Link href={`/admin/inventario/${u.id}`} className="flex items-center gap-3">
                        <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img.url} alt="" className="size-full object-cover" />
                          ) : (
                            <PlaceholderLaptop marca={u.modelos?.marcas?.nombre ?? ""} categoria={u.modelos?.categorias?.slug} className="size-full" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-semibold">
                            {u.modelos?.nombre}
                            {u.destacado && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            <span className="font-mono">{u.sku}</span> · {u.ram_gb} GB · {u.almacenamiento} · {u.procesador}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td><ChipCondicion condicion={u.condicion} grado={u.grado} /></td>
                    <td><ChipEstado estado={u.estado} /></td>
                    <td className={`num ${dias > 60 && u.estado === "disponible" ? "font-semibold text-amber" : "text-muted"}`}>
                      {u.estado === "vendido" || u.estado === "en_transito" ? "—" : dias}
                    </td>
                    {esAdmin && <td className="num text-right text-muted">{enSoles(costo)}</td>}
                    <td className="num text-right font-semibold">
                      {enSoles(precio)}
                      {u.precio_oferta_pen != null && <span className="block text-xs font-normal text-accent">en oferta</span>}
                    </td>
                    {esAdmin && (
                      <td className={`num text-right font-semibold ${m < 0.15 ? "text-red-600" : m < 0.25 ? "text-amber" : "text-green"}`}>
                        {enPorcentaje(m)}
                      </td>
                    )}
                  </tr>
                );
              })}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">No hay equipos que coincidan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children, onClick, derecha }: { children: React.ReactNode; onClick: () => void; derecha?: boolean }) {
  return (
    <th className={derecha ? "text-right" : ""}>
      <button onClick={onClick} className="inline-flex items-center gap-1 uppercase hover:text-ink">
        {children} <ArrowDownUp className="size-3" />
      </button>
    </th>
  );
}

function Resumen({ titulo, valor, nota, alerta }: { titulo: string; valor: string; nota: string; alerta?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{titulo}</p>
      <p className={`num mt-1 font-display text-2xl font-extrabold ${alerta ? "text-amber" : ""}`}>{valor}</p>
      <p className="mt-0.5 text-xs text-muted">{nota}</p>
    </div>
  );
}
