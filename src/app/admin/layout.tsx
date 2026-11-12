import { Logo } from "@/components/logo";
import { obtenerSesion } from "@/lib/sesion";
import { cerrarSesion } from "../login/acciones";
import { NavAdmin } from "./nav-admin";
import { LogOut } from "lucide-react";

export const metadata = { title: { default: "Panel", template: "%s · Panel Laptops Americanas" } };

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  const { perfil, esAdmin } = await obtenerSesion();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="z-30 flex flex-col bg-navy text-white print:hidden lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between px-5 py-5">
          <Logo claro href={esAdmin ? "/admin" : "/admin/ventas"} />
          <form action={cerrarSesion} className="lg:hidden">
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white" aria-label="Cerrar sesión">
              <span className="max-w-28 truncate">@{perfil.usuario}</span> <LogOut className="size-4" />
            </button>
          </form>
        </div>
        <NavAdmin esAdmin={esAdmin} />
        <div className="mt-auto hidden border-t border-white/10 p-4 lg:block">
          <p className="truncate text-sm font-semibold">{perfil.nombre}</p>
          <p className="truncate text-xs text-white/50">@{perfil.usuario}</p>
          <span className="chip mt-2 bg-white/10 text-white/80">{perfil.rol === "admin" ? "Administrador" : "Vendedor"}</span>
          <form action={cerrarSesion}>
            <button className="mt-4 flex items-center gap-2 text-sm text-white/60 hover:text-white">
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
