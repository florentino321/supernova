import Link from "next/link";
import { Logo } from "@/components/logo";
import { FormLogin } from "./form-login";

export const metadata = { title: "Acceso del personal", robots: { index: false } };

export default async function Login({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const siguiente = typeof sp.siguiente === "string" ? sp.siguiente : "/admin";
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-32 -top-32 size-[460px] rounded-full bg-accent/25 blur-3xl" />
        <Logo claro />
        <div className="relative">
          <p className="font-display text-4xl font-extrabold leading-tight">
            Inventario por unidad,
            <span className="block text-white/55">ventas y estadísticas en un solo lugar.</span>
          </p>
          <ul className="mt-8 space-y-3 text-white/70">
            <li>• Cada laptop con su serie, costo de importación y utilidad real</li>
            <li>• Fotos y videos propios de cada equipo</li>
            <li>• Dashboard de ingresos, rotación y canales de venta</li>
          </ul>
        </div>
        <p className="relative text-sm text-white/40">Panel interno · Laptops Americanas</p>
      </div>
      <div className="grid place-items-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 font-display text-3xl font-extrabold">Acceso del personal</h1>
          <p className="mt-2 text-muted">Ingresa con el usuario y la contraseña que te dio el administrador.</p>
          {sp.error === "inactivo" && (
            <p className="mt-6 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Tu usuario fue desactivado. Consulta con el administrador.
            </p>
          )}
          {sp.error === "sin-perfil" && (
            <p className="mt-6 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Tu usuario no tiene un perfil del personal asignado. Pide a un administrador que te dé acceso.
            </p>
          )}
          <FormLogin siguiente={siguiente} />
          <Link href="/" className="mt-8 block text-center text-sm text-muted hover:text-ink">
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
