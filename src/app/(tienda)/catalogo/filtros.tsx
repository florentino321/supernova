"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import type { Categoria, Marca } from "@/lib/tipos";

export function Filtros({ marcas, categorias }: { marcas: Marca[]; categorias: Categoria[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pendiente, startTransition] = useTransition();
  const [texto, setTexto] = useState(params.get("q") ?? "");

  const set = (clave: string, valor: string | null) => {
    const p = new URLSearchParams(params.toString());
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    startTransition(() => router.replace(`${pathname}?${p.toString()}`, { scroll: false }));
  };

  // búsqueda con pequeña espera mientras se escribe
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== texto) set("q", texto || null);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const activos = ["q", "marca", "categoria", "condicion", "ram", "max", "oferta", "estado"].filter((k) => params.get(k));

  return (
    <aside className={`space-y-6 transition ${pendiente ? "opacity-60" : ""}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          className="input pl-9"
          placeholder="Buscar modelo, procesador, GPU…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </div>

      <Grupo titulo="Categoría">
        {categorias.map((c) => (
          <Opcion key={c.id} activo={params.get("categoria") === c.slug} onClick={() => set("categoria", params.get("categoria") === c.slug ? null : c.slug)}>
            {c.nombre}
          </Opcion>
        ))}
      </Grupo>

      <Grupo titulo="Marca">
        <div className="flex flex-wrap gap-1.5">
          {marcas.map((m) => {
            const on = params.get("marca") === m.slug;
            return (
              <button
                key={m.id}
                onClick={() => set("marca", on ? null : m.slug)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                  on ? "border-navy bg-navy text-white" : "border-line bg-surface text-ink-2 hover:border-ink-2"
                }`}
              >
                {m.nombre}
              </button>
            );
          })}
        </div>
      </Grupo>

      <Grupo titulo="Condición">
        {[
          ["nuevo", "Nuevo"],
          ["open_box", "Open box"],
          ["seminuevo", "Seminuevo certificado"],
          ["remate", "Remate"],
        ].map(([v, t]) => (
          <Opcion key={v} activo={params.get("condicion") === v} onClick={() => set("condicion", params.get("condicion") === v ? null : v)}>
            {t}
          </Opcion>
        ))}
      </Grupo>

      <Grupo titulo="Memoria RAM mínima">
        <div className="grid grid-cols-4 gap-1.5">
          {["8", "16", "32"].map((r) => {
            const on = params.get("ram") === r;
            return (
              <button
                key={r}
                onClick={() => set("ram", on ? null : r)}
                className={`rounded-lg border py-1.5 text-xs font-semibold ${on ? "border-navy bg-navy text-white" : "border-line bg-surface"}`}
              >
                {r} GB
              </button>
            );
          })}
        </div>
      </Grupo>

      <Grupo titulo="Precio máximo">
        <select className="input" value={params.get("max") ?? ""} onChange={(e) => set("max", e.target.value || null)}>
          <option value="">Cualquier precio</option>
          {[1000, 1500, 2000, 2500, 3000, 4000, 5000].map((p) => (
            <option key={p} value={p}>
              Hasta S/ {p.toLocaleString("es-PE")}
            </option>
          ))}
        </select>
      </Grupo>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-[var(--accent)]"
          checked={params.get("oferta") === "1"}
          onChange={(e) => set("oferta", e.target.checked ? "1" : null)}
        />
        Solo ofertas y remates
      </label>

      {activos.length > 0 && (
        <button
          className="btn-ghost w-full"
          onClick={() => {
            setTexto("");
            startTransition(() => router.replace(pathname, { scroll: false }));
          }}
        >
          <X className="size-4" /> Limpiar filtros ({activos.length})
        </button>
      )}
    </aside>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label">{titulo}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Opcion({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
        activo ? "bg-navy font-semibold text-white" : "text-ink-2 hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}
