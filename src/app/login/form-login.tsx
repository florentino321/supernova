"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { iniciarSesion } from "./acciones";

export function FormLogin({ siguiente }: { siguiente: string }) {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, { error: "" });
  return (
    <form action={accion} className="mt-8 space-y-4">
      <input type="hidden" name="siguiente" value={siguiente} />
      <div>
        <label className="label" htmlFor="usuario">Usuario o correo</label>
        <input
          id="usuario"
          name="usuario"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="ej. jperez"
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      {estado.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>}
      <button className="btn-primary w-full py-3" disabled={pendiente}>
        <LogIn className="size-4" /> {pendiente ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
