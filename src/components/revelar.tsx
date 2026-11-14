"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ElementType,
  type ReactNode,
} from "react";

// Con "movimiento reducido" (Windows sin efectos de animación) solo hay fundidos, sin desplazamiento: ver globals.css
const sinSuscripcion = () => () => {};

/**
 * true si el componente se montó al navegar dentro de la web; false si viene del HTML del servidor
 * (en ese caso lo que ya está en pantalla no se vuelve a animar).
 */
function useMontadoAlNavegar() {
  const enCliente = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const [alNavegar] = useState(enCliente);
  return alNavegar;
}

// Un solo observador para toda la página: lo que entra junto en pantalla aparece escalonado.
let observador: IntersectionObserver | null = null;
function vigilar(el: HTMLElement) {
  observador ??= new IntersectionObserver(
    (entradas) => {
      let orden = 0;
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        const t = e.target as HTMLElement;
        observador?.unobserve(t);
        t.style.setProperty("--retraso", `${Math.min(orden++, 7) * 70}ms`);
        t.removeAttribute("data-oculto");
        t.setAttribute("data-visible", "");
      }
    },
    { rootMargin: "0px 0px -6% 0px" },
  );
  observador.observe(el);
  return () => observador?.unobserve(el);
}

/** Envuelve un bloque para que aparezca (sube y se desvanece) al llegar a él deslizando. */
export function Revelar({
  children,
  className,
  como: Etiqueta = "div",
}: {
  children: ReactNode;
  className?: string;
  como?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const alNavegar = useMontadoAlNavegar();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!alNavegar) {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) return; // visible desde la carga
    }
    el.setAttribute("data-oculto", "");
    return vigilar(el);
  }, [alNavegar]);

  return (
    <Etiqueta ref={ref} data-revelar="" className={className}>
      {children}
    </Etiqueta>
  );
}

/** Número que sube desde cero cuando aparece en pantalla; al final queda `texto` tal cual. */
export function Contador({
  valor,
  texto,
  prefijo = "",
  sufijo = "",
  className,
}: {
  valor?: number;
  texto: string;
  prefijo?: string;
  sufijo?: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [animado, setAnimado] = useState<string | null>(null);
  const alNavegar = useMontadoAlNavegar();

  useEffect(() => {
    const el = ref.current;
    if (!el || !valor || valor <= 0) return;
    if (!alNavegar && performance.now() > 2500) return; // la página tardó: no reiniciar lo ya leído
    const fmt = new Intl.NumberFormat("es-PE");
    let cuadro = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const inicio = performance.now();
      const paso = (t: number) => {
        const p = Math.min(1, (t - inicio) / 1200);
        setAnimado(p < 1 ? prefijo + fmt.format(Math.round(valor * (1 - (1 - p) ** 3))) + sufijo : null);
        if (p < 1) cuadro = requestAnimationFrame(paso);
      };
      cuadro = requestAnimationFrame(paso);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(cuadro);
    };
  }, [valor, prefijo, sufijo, alNavegar]);

  return (
    <p ref={ref} className={className}>
      {animado ?? texto}
    </p>
  );
}
