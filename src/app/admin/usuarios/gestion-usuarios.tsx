"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, Pencil, Power, RefreshCw, ShieldCheck, UserPlus, X } from "lucide-react";
import { enSoles, fecha } from "@/lib/formato";
import type { Perfil, Rol } from "@/lib/tipos";
import {
  activarUsuario,
  actualizarNombre,
  cambiarPassword,
  cambiarRol,
  crearUsuario,
  type ResultadoUsuario,
} from "./acciones";

export type FilaUsuario = Perfil & {
  ventasTotal: number;
  ingresosTotal: number;
  ventasMes: number;
  ingresosMes: number;
  ultimaVenta: string | null;
};

/** Contraseña aleatoria fácil de dictar (sin caracteres confusos como 0/O, 1/l). */
function generarPassword() {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const numeros = "23456789";
  const r = (s: string) => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length];
  return Array.from({ length: 6 }, () => r(letras)).join("") + "-" + Array.from({ length: 4 }, () => r(numeros)).join("");
}

/** Sugiere un usuario a partir del nombre: "Juan Pérez Soto" → "jperez". */
function sugerirUsuario(nombre: string) {
  const partes = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return "";
  if (partes.length === 1) return partes[0].slice(0, 20);
  return (partes[0][0] + partes[1]).slice(0, 20);
}

export function GestionUsuarios({ filas, miId }: { filas: FilaUsuario[]; miId: string }) {
  const [creando, setCreando] = useState(false);
  const activos = filas.filter((f) => f.activo);
  const vendedores = activos.filter((f) => f.rol === "vendedor");
  const ventasMes = filas.reduce((a, f) => a + f.ventasMes, 0);
  const ingresosMes = filas.reduce((a, f) => a + f.ingresosMes, 0);

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi t="Vendedores activos" v={String(vendedores.length)} />
        <Kpi t="Administradores" v={String(activos.filter((f) => f.rol === "admin").length)} />
        <Kpi t="Ventas del equipo este mes" v={String(ventasMes)} />
        <Kpi t="Ingresos del mes" v={enSoles(ingresosMes)} />
      </div>

      {creando ? (
        <FormNuevo onCerrar={() => setCreando(false)} />
      ) : (
        <button className="btn-primary" onClick={() => setCreando(true)}>
          <UserPlus className="size-4" /> Nuevo vendedor
        </button>
      )}

      <div className="card scroll-fino overflow-x-auto">
        <table className="tabla min-w-[900px]">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th className="text-right">Ventas del mes</th>
              <th className="text-right">Total vendido</th>
              <th>Última venta</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <FilaTabla key={f.id} f={f} esYo={f.id === miId} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl bg-surface-2 p-5 text-sm text-ink-2">
        <p className="flex items-center gap-2 font-semibold text-ink"><ShieldCheck className="size-4 text-green" /> Qué puede hacer cada rol</p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          <li><strong>Administrador:</strong> dashboard, inventario, fotos y videos, importaciones, modelos, clientes, todas las ventas (incluida la anulación), costos y utilidades, y gestión de usuarios.</li>
          <li><strong>Vendedor:</strong> registrar ventas (con cliente nuevo o existente), ver e imprimir solo sus propias ventas. No ve costos, utilidades ni otras secciones.</li>
        </ul>
      </div>
    </div>
  );
}

function FormNuevo({ onCerrar }: { onCerrar: () => void }) {
  const [estado, accion, pendiente] = useActionState<ResultadoUsuario, FormData>(crearUsuario, {});
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [usuarioEditado, setUsuarioEditado] = useState(false);
  const [password, setPassword] = useState(generarPassword);
  const [ver, setVer] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  if (estado.credenciales) {
    const texto = `Acceso al panel de Laptops Americanas\nUsuario: ${estado.credenciales.usuario}\nContraseña: ${estado.credenciales.password}`;
    return (
      <div className="card border-emerald-200 bg-emerald-50/60 p-5">
        <p className="flex items-center gap-2 font-display text-lg font-bold text-emerald-900"><Check className="size-5" /> {estado.ok}</p>
        <p className="mt-1 text-sm text-emerald-900/80">Entrega estos datos al vendedor. Por seguridad, la contraseña no se volverá a mostrar.</p>
        <div className="mt-4 grid max-w-md gap-2 rounded-xl border border-emerald-200 bg-white p-4 font-mono text-sm">
          <p><span className="text-muted">Usuario:</span> {estado.credenciales.usuario}</p>
          <p><span className="text-muted">Contraseña:</span> {estado.credenciales.password}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="btn-ghost"
            onClick={async () => {
              await navigator.clipboard.writeText(texto);
              setCopiado(true);
            }}
          >
            <Copy className="size-4" /> {copiado ? "Copiado" : "Copiar datos"}
          </button>
          <button className="btn-primary" onClick={onCerrar}>Listo</button>
        </div>
      </div>
    );
  }

  return (
    <form ref={form} action={accion} className="card p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-bold">Nuevo usuario</p>
        <button type="button" onClick={onCerrar} aria-label="Cerrar"><X className="size-5 text-muted" /></button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <span className="label">Nombre completo *</span>
          <input
            name="nombre"
            required
            className="input"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (!usuarioEditado) setUsuario(sugerirUsuario(e.target.value));
            }}
            placeholder="Juan Pérez Soto"
          />
        </div>
        <div>
          <span className="label">Usuario *</span>
          <input
            name="usuario"
            required
            pattern="[a-z0-9._\-]{3,30}"
            title="3 a 30 caracteres: minúsculas, números, punto, guion o guion bajo"
            className="input font-mono"
            value={usuario}
            onChange={(e) => {
              setUsuarioEditado(true);
              setUsuario(e.target.value.toLowerCase().replace(/\s/g, ""));
            }}
            placeholder="jperez"
            autoComplete="off"
          />
        </div>
        <div>
          <span className="label">Rol</span>
          <select name="rol" defaultValue="vendedor" className="input">
            <option value="vendedor">Vendedor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <span className="label">Contraseña * (mínimo 8 caracteres)</span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                name="password"
                required
                minLength={8}
                type={ver ? "text" : "password"}
                className="input pr-10 font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" onClick={() => setVer(!ver)} aria-label={ver ? "Ocultar" : "Mostrar"}>
                {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setPassword(generarPassword())}>
              <RefreshCw className="size-4" /> Generar
            </button>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className="btn-primary" disabled={pendiente}>
          <UserPlus className="size-4" /> {pendiente ? "Creando…" : "Crear usuario"}
        </button>
        {estado.error && <p className="text-sm text-red-600">{estado.error}</p>}
      </div>
    </form>
  );
}

function FilaTabla({ f, esYo }: { f: FilaUsuario; esYo: boolean }) {
  const [modo, setModo] = useState<"" | "password" | "nombre">("");
  const [valor, setValor] = useState("");
  const [msg, setMsg] = useState<{ t: string; error?: boolean } | null>(null);
  const [pendiente, start] = useTransition();

  useEffect(() => {
    if (!msg || msg.error) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  const ejecutar = (fn: () => Promise<ResultadoUsuario>, despues?: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r.error ? { t: r.error, error: true } : { t: r.ok ?? "Listo." });
      if (!r.error) despues?.();
    });

  return (
    <>
      <tr className={f.activo ? "" : "opacity-60"}>
        <td>
          <span className="font-semibold">{f.nombre}</span>
          {esYo && <span className="chip ml-2 bg-blue-50 text-blue-700">Tú</span>}
          <span className="block font-mono text-xs text-muted">@{f.usuario}</span>
        </td>
        <td>
          {esYo ? (
            <span className="chip bg-navy text-white">Administrador</span>
          ) : (
            <select
              className="input w-auto py-1.5 text-xs"
              value={f.rol}
              disabled={pendiente}
              onChange={(e) => {
                const rol = e.target.value as Rol;
                if (confirm(`¿Cambiar el rol de ${f.nombre} a ${rol === "admin" ? "Administrador" : "Vendedor"}?`)) ejecutar(() => cambiarRol(f.id, rol));
              }}
              aria-label={`Rol de ${f.nombre}`}
            >
              <option value="vendedor">Vendedor</option>
              <option value="admin">Administrador</option>
            </select>
          )}
        </td>
        <td>
          {f.activo ? <span className="chip bg-emerald-50 text-emerald-700">● Activo</span> : <span className="chip bg-slate-100 text-slate-600">Desactivado</span>}
        </td>
        <td className="num text-right">
          {f.ventasMes}
          <span className="block text-xs text-muted">{enSoles(f.ingresosMes)}</span>
        </td>
        <td className="num text-right">
          {enSoles(f.ingresosTotal)}
          <span className="block text-xs text-muted">{f.ventasTotal} ventas</span>
        </td>
        <td className="text-sm text-muted">{f.ultimaVenta ? fecha(f.ultimaVenta) : "—"}</td>
        <td className="text-right">
          <div className="inline-flex gap-1">
            <button className="btn-ghost px-2.5 py-1.5" title="Editar nombre" onClick={() => { setModo(modo === "nombre" ? "" : "nombre"); setValor(f.nombre); }}>
              <Pencil className="size-3.5" />
            </button>
            <button className="btn-ghost px-2.5 py-1.5" title="Cambiar contraseña" onClick={() => { setModo(modo === "password" ? "" : "password"); setValor(generarPassword()); }}>
              <KeyRound className="size-3.5" />
            </button>
            {!esYo && (
              <button
                className={`${f.activo ? "btn-danger" : "btn-ghost"} px-2.5 py-1.5`}
                title={f.activo ? "Desactivar" : "Activar"}
                disabled={pendiente}
                onClick={() => {
                  if (f.activo && !confirm(`¿Desactivar a ${f.nombre}? Ya no podrá ingresar al panel. Sus ventas se conservan.`)) return;
                  ejecutar(() => activarUsuario(f.id, !f.activo));
                }}
              >
                <Power className="size-3.5" />
              </button>
            )}
          </div>
          {msg && <p className={`mt-1 text-xs ${msg.error ? "text-red-600" : "text-green"}`}>{msg.t}</p>}
        </td>
      </tr>
      {modo && (
        <tr>
          <td colSpan={7} className="bg-surface-2">
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (modo === "password") ejecutar(() => cambiarPassword(f.id, valor), () => setModo(""));
                else ejecutar(() => actualizarNombre(f.id, valor), () => setModo(""));
              }}
            >
              <label className="min-w-64 flex-1">
                <span className="label">{modo === "password" ? `Nueva contraseña para @${f.usuario}` : "Nombre completo"}</span>
                <input className={`input ${modo === "password" ? "font-mono" : ""}`} value={valor} onChange={(e) => setValor(e.target.value)} minLength={modo === "password" ? 8 : 1} required />
              </label>
              {modo === "password" && (
                <button type="button" className="btn-ghost" onClick={() => setValor(generarPassword())}><RefreshCw className="size-4" /> Generar</button>
              )}
              <button className="btn-primary" disabled={pendiente}>{pendiente ? "Guardando…" : "Guardar"}</button>
              <button type="button" className="btn-ghost" onClick={() => setModo("")}>Cancelar</button>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}

function Kpi({ t, v }: { t: string; v: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t}</p>
      <p className="num mt-1 font-display text-2xl font-extrabold">{v}</p>
    </div>
  );
}
