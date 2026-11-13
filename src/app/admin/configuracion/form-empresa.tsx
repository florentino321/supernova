"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import type { Empresa } from "@/lib/empresa-datos";
import { guardarEmpresa, type Resultado } from "./acciones";

export function FormEmpresa({ empresa: e }: { empresa: Partial<Empresa> }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(guardarEmpresa, {});
  return (
    <form action={accion} className="mx-auto max-w-3xl space-y-6">
      <Seccion titulo="Empresa">
        <Campo label="Nombre comercial *" className="sm:col-span-2">
          <input name="nombre" required defaultValue={e.nombre ?? "Laptops Americanas"} className="input" />
        </Campo>
        <Campo label="Razón social" nota="Como figura en SUNAT">
          <input name="razon_social" defaultValue={e.razon_social ?? ""} className="input" placeholder="Ej.: Laptops Americanas E.I.R.L." />
        </Campo>
        <Campo label="RUC">
          <input name="ruc" inputMode="numeric" maxLength={11} defaultValue={e.ruc ?? ""} className="input font-mono" placeholder="20123456789" />
        </Campo>
      </Seccion>

      <Seccion titulo="Contacto">
        <Campo label="WhatsApp de ventas *" nota="Recibe los mensajes de la web. 9 dígitos o con código de país.">
          <input name="whatsapp" required inputMode="tel" defaultValue={e.whatsapp ?? ""} className="input font-mono" placeholder="987654321" />
        </Campo>
        <Campo label="Teléfono fijo o adicional">
          <input name="telefono" inputMode="tel" defaultValue={e.telefono ?? ""} className="input" placeholder="(062) 123456" />
        </Campo>
        <Campo label="Correo" className="sm:col-span-2">
          <input name="email" type="email" defaultValue={e.email ?? ""} className="input" placeholder="ventas@tuempresa.pe" />
        </Campo>
      </Seccion>

      <Seccion titulo="Tienda">
        <Campo label="Dirección" className="sm:col-span-2">
          <input name="direccion" defaultValue={e.direccion ?? ""} className="input" placeholder="Jr. Huánuco 123, Cercado" />
        </Campo>
        <Campo label="Ciudad">
          <input name="ciudad" defaultValue={e.ciudad ?? "Huánuco, Perú"} className="input" />
        </Campo>
        <Campo label="Horario de atención">
          <input name="horario" defaultValue={e.horario ?? ""} className="input" placeholder="Lunes a sábado · 9:00 a. m. – 8:00 p. m." />
        </Campo>
      </Seccion>

      <Seccion titulo="Redes sociales" nota="Opcional. Pega el enlace de tu página.">
        <Campo label="Facebook"><input name="facebook" defaultValue={e.facebook ?? ""} className="input" placeholder="facebook.com/tu-pagina" /></Campo>
        <Campo label="Instagram"><input name="instagram" defaultValue={e.instagram ?? ""} className="input" placeholder="instagram.com/tu-cuenta" /></Campo>
        <Campo label="TikTok" className="sm:col-span-2"><input name="tiktok" defaultValue={e.tiktok ?? ""} className="input" placeholder="tiktok.com/@tu-cuenta" /></Campo>
      </Seccion>

      {estado.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{estado.error}</p>}
      {estado.ok && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{estado.ok}</p>}
      <button className="btn-primary w-full py-3 sm:w-auto sm:px-8" disabled={pendiente}>
        <Save className="size-4" /> {pendiente ? "Guardando…" : "Guardar configuración"}
      </button>
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

function Campo({ label, nota, className = "", children }: { label: string; nota?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {nota && <span className="mt-1 block text-xs text-muted">{nota}</span>}
    </label>
  );
}
