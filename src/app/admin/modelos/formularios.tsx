"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { eliminarModelo, guardarCategoria, guardarMarca, guardarModelo, type Resultado } from "../acciones";
import type { Categoria, Marca, Modelo } from "@/lib/tipos";

export function FormModelo({ modelo, marcas, categorias, onListo }: { modelo?: Modelo; marcas: Marca[]; categorias: Categoria[]; onListo?: () => void }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(guardarModelo, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.ok) {
      if (!modelo) ref.current?.reset();
      onListo?.();
    }
  }, [estado, modelo, onListo]);
  return (
    <form ref={ref} action={accion} className="grid gap-3 sm:grid-cols-2">
      {modelo && <input type="hidden" name="id" value={modelo.id} />}
      <div className="sm:col-span-2"><span className="label">Nombre del modelo *</span><input name="nombre" required defaultValue={modelo?.nombre} placeholder="Dell Latitude 7420" className="input" /></div>
      <div>
        <span className="label">Marca *</span>
        <select name="marca_id" required defaultValue={modelo?.marca_id ?? ""} className="input">
          <option value="">Elige…</option>
          {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
      </div>
      <div>
        <span className="label">Categoría *</span>
        <select name="categoria_id" required defaultValue={modelo?.categoria_id ?? ""} className="input">
          <option value="">Elige…</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>
      <div><span className="label">Año</span><input name="anio" type="number" min={2010} max={2030} defaultValue={modelo?.anio ?? ""} className="input" /></div>
      <div className="sm:col-span-2"><span className="label">Descripción general</span><textarea name="descripcion" rows={2} defaultValue={modelo?.descripcion ?? ""} className="input" /></div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="btn-primary" disabled={pendiente}>{pendiente ? "Guardando…" : modelo ? "Guardar" : "Crear modelo"}</button>
        {estado.error && <span className="text-sm text-red-600">{estado.error}</span>}
        {estado.ok && <span className="text-sm text-green">{estado.ok}</span>}
      </div>
    </form>
  );
}

export function FilaModelo({ modelo, marcas, categorias, unidades, disponibles, esAdmin }: {
  modelo: Modelo; marcas: Marca[]; categorias: Categoria[]; unidades: number; disponibles: number; esAdmin: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [pendiente, start] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <>
      <tr>
        <td className="font-semibold">{modelo.nombre}<span className="block text-xs font-normal text-muted">{modelo.anio ?? "—"}</span></td>
        <td>{modelo.marcas?.nombre}</td>
        <td>{modelo.categorias?.nombre}</td>
        <td className="num text-right">{unidades}<span className="block text-xs text-muted">{disponibles} disponibles</span></td>
        <td className="text-right">
          <div className="inline-flex gap-1">
            <button className="btn-ghost px-2.5 py-1.5" onClick={() => setEditando(!editando)} aria-label="Editar"><Pencil className="size-3.5" /></button>
            {esAdmin && unidades === 0 && (
              <button
                className="btn-danger px-2.5 py-1.5"
                disabled={pendiente}
                aria-label="Eliminar"
                onClick={() => confirm(`¿Eliminar ${modelo.nombre}?`) && start(async () => {
                  const r = await eliminarModelo(modelo.id);
                  if (r.error) setError(r.error);
                  router.refresh();
                })}
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </td>
      </tr>
      {editando && (
        <tr>
          <td colSpan={5} className="bg-surface-2">
            <FormModelo modelo={modelo} marcas={marcas} categorias={categorias} onListo={() => setEditando(false)} />
          </td>
        </tr>
      )}
    </>
  );
}

export function FormSimple({ tipo }: { tipo: "marca" | "categoria" }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(tipo === "marca" ? guardarMarca : guardarCategoria, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (estado.ok) ref.current?.reset(); }, [estado]);
  return (
    <form ref={ref} action={accion} className="mt-3">
      <div className="flex gap-2">
        <input name="nombre" required placeholder={tipo === "marca" ? "Nueva marca" : "Nueva categoría"} className="input" />
        <button className="btn-ghost" disabled={pendiente}>Agregar</button>
      </div>
      {estado.error && <p className="mt-1 text-xs text-red-600">{estado.error}</p>}
      {estado.ok && <p className="mt-1 text-xs text-green">{estado.ok}</p>}
    </form>
  );
}
