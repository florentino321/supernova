import Link from "next/link";

export function Logo({ claro = false, href = "/" }: { claro?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="Laptops Americanas, inicio">
      <span className="relative grid size-9 place-items-center rounded-xl bg-accent text-white">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="5" width="16" height="11" rx="1.5" />
          <path d="M2 19h20" strokeLinecap="round" />
        </svg>
        <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-white bg-blue" />
      </span>
      <span className={`font-display leading-none ${claro ? "text-white" : "text-ink"}`}>
        <span className="block text-[15px] font-extrabold tracking-tight">LAPTOPS</span>
        <span className={`block text-[11px] font-semibold tracking-[0.2em] ${claro ? "text-white/60" : "text-muted"}`}>
          AMERICANAS
        </span>
      </span>
    </Link>
  );
}
