"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function Orden() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <select
      className="input w-auto"
      value={params.get("orden") ?? ""}
      onChange={(e) => {
        const p = new URLSearchParams(params.toString());
        if (e.target.value) p.set("orden", e.target.value);
        else p.delete("orden");
        router.replace(`${pathname}?${p.toString()}`, { scroll: false });
      }}
      aria-label="Ordenar"
    >
      <option value="">Recomendados</option>
      <option value="precio_asc">Precio: menor a mayor</option>
      <option value="precio_desc">Precio: mayor a menor</option>
      <option value="recientes">Recién llegados</option>
      <option value="ram">Más memoria RAM</option>
    </select>
  );
}
