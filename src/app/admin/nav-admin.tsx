"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BellRing, Boxes, ExternalLink, FileText, HandCoins, Laptop, Plane, Receipt, UserCog, Users } from "lucide-react";

const items = [
  { href: "/admin", texto: "Dashboard", icono: BarChart3, exacto: true, soloAdmin: true },
  { href: "/admin/inventario", texto: "Inventario", icono: Laptop, soloAdmin: true },
  { href: "/admin/ventas", texto: "Ventas", textoVendedor: "Mis ventas", icono: Receipt, soloAdmin: false },
  { href: "/admin/reservas", texto: "Reservas", icono: HandCoins, soloAdmin: false },
  { href: "/admin/cotizaciones", texto: "Cotizaciones", icono: FileText, soloAdmin: false },
  { href: "/admin/interesados", texto: "Interesados", icono: BellRing, soloAdmin: false },
  { href: "/admin/importaciones", texto: "Importaciones", icono: Plane, soloAdmin: true },
  { href: "/admin/modelos", texto: "Modelos y marcas", icono: Boxes, soloAdmin: true },
  { href: "/admin/clientes", texto: "Clientes", icono: Users, soloAdmin: true },
  { href: "/admin/usuarios", texto: "Usuarios y vendedores", icono: UserCog, soloAdmin: true },
];

export function NavAdmin({ esAdmin }: { esAdmin: boolean }) {
  const path = usePathname();
  return (
    <nav className="scroll-fino flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
      {items
        .filter((i) => esAdmin || !i.soloAdmin)
        .map((i) => {
          const activo = i.exacto ? path === i.href : path.startsWith(i.href) && !(i.href === "/admin/ventas" && !esAdmin && path === "/admin/ventas/nueva");
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                activo ? "bg-white text-navy" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <i.icono className="size-4" />
              {!esAdmin && i.textoVendedor ? i.textoVendedor : i.texto}
            </Link>
          );
        })}
      {!esAdmin && (
        <Link
          href="/admin/ventas/nueva"
          className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Receipt className="size-4" /> Registrar venta
        </Link>
      )}
      <Link
        href="/"
        target="_blank"
        className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 hover:text-white lg:mt-4"
      >
        <ExternalLink className="size-4" /> Ver tienda
      </Link>
    </nav>
  );
}
