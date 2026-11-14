"use client";

import { useEffect } from "react";

// Elementos que muestran la "onda" al tocarlos.
const PULSABLES = ".btn,.btn-primary,.btn-accent,.btn-ghost,.btn-whatsapp,[data-pulso]";

/**
 * Efectos globales de la tienda:
 * - Onda al pulsar botones y tarjetas. Se dibuja en una capa aparte (encima del elemento y
 *   recortada a su forma) para no tocar el HTML que maneja React.
 * - Cabecera con sombra al deslizar y barra de progreso de lectura.
 * (Las apariciones al deslizar y los contadores están en ./revelar.tsx)
 */
export function AnimacionesTienda() {
  useEffect(() => {
    const alPulsar = (ev: PointerEvent) => {
      if (ev.button !== 0) return;
      const el = (ev.target as Element | null)?.closest<HTMLElement>(PULSABLES);
      if (!el || el.matches(":disabled")) return;
      const r = el.getBoundingClientRect();
      const estilo = getComputedStyle(el);
      const capa = document.createElement("span");
      capa.className = "onda-capa";
      capa.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${estilo.borderRadius};color:${estilo.color}`;
      const d = Math.hypot(r.width, r.height) * 2;
      const onda = document.createElement("span");
      onda.className = el.hasAttribute("data-pulso") ? "onda onda-suave" : "onda";
      onda.style.cssText = `width:${d}px;height:${d}px;left:${ev.clientX - r.left - d / 2}px;top:${ev.clientY - r.top - d / 2}px`;
      capa.appendChild(onda);
      document.body.appendChild(capa);
      onda.addEventListener("animationend", () => capa.remove(), { once: true });
    };
    document.addEventListener("pointerdown", alPulsar, { passive: true });

    let cuadro = 0;
    const alDesplazar = () => {
      if (cuadro) return;
      cuadro = requestAnimationFrame(() => {
        cuadro = 0;
        const y = scrollY;
        document.getElementById("cabecera")?.toggleAttribute("data-desplazado", y > 12);
        const max = document.documentElement.scrollHeight - innerHeight;
        document.getElementById("progreso-lectura")?.style.setProperty("--progreso", String(max > 0 ? Math.min(1, y / max) : 0));
      });
    };
    addEventListener("scroll", alDesplazar, { passive: true });
    addEventListener("resize", alDesplazar);
    // al cambiar de página el alto cambia: se recalcula la barra
    const ro = new ResizeObserver(alDesplazar);
    ro.observe(document.body);
    alDesplazar();

    return () => {
      document.removeEventListener("pointerdown", alPulsar);
      removeEventListener("scroll", alDesplazar);
      removeEventListener("resize", alDesplazar);
      ro.disconnect();
      cancelAnimationFrame(cuadro);
    };
  }, []);

  return null;
}
