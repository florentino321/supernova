// Ilustración que se muestra cuando un equipo aún no tiene fotos.
const paletas: Record<string, [string, string]> = {
  gaming: ["#1a0f2e", "#d7263d"],
  ultrabooks: ["#0d2a4a", "#4f9cf9"],
  "ejecutivas-oficina": ["#0d1b2e", "#7c8ba1"],
  workstation: ["#10241f", "#22c55e"],
  "2-en-1-convertibles": ["#2a1a0d", "#f59e0b"],
  "estudiantes-hogar": ["#14213d", "#38bdf8"],
};

export function PlaceholderLaptop({
  marca,
  categoria,
  className = "",
}: {
  marca: string;
  categoria?: string;
  className?: string;
}) {
  const [fondo, acento] = paletas[categoria ?? ""] ?? ["#0d1b2e", "#d7263d"];
  const id = `g-${marca}-${categoria}`.replace(/[^a-z0-9-]/gi, "");
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label={`Laptop ${marca}`}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3f5f8" />
          <stop offset="1" stopColor="#e6eaf0" />
        </linearGradient>
        <linearGradient id={`${id}-scr`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={fondo} />
          <stop offset="1" stopColor={acento} stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}-bg)`} />
      <ellipse cx="200" cy="246" rx="150" ry="10" fill="#0b1626" opacity="0.08" />
      {/* pantalla */}
      <rect x="92" y="58" width="216" height="140" rx="10" fill="#1d2633" />
      <rect x="100" y="66" width="200" height="124" rx="4" fill={`url(#${id}-scr)`} />
      <text
        x="200"
        y="134"
        textAnchor="middle"
        fill="#fff"
        fontSize="22"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        letterSpacing="1"
      >
        {marca.toUpperCase()}
      </text>
      {/* base */}
      <path d="M70 200 h260 l18 30 a6 6 0 0 1 -5 9 h-286 a6 6 0 0 1 -5 -9 z" fill="#c9d0da" />
      <rect x="176" y="204" width="48" height="5" rx="2.5" fill="#aab3c0" />
    </svg>
  );
}
