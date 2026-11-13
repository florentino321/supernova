"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Logo } from "@/components/logo";

// Pantalla de error con la marca (por ejemplo, si se cae la conexión con la base de datos).
export default function ErrorPagina({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="grid flex-1 place-items-center bg-bg px-4 py-16">
      <div className="max-w-md text-center">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="mt-10 font-display text-2xl font-extrabold">Algo salió mal</h1>
        <p className="mt-3 text-ink-2">
          No pudimos cargar esta página. Revisa tu conexión a internet e inténtalo otra vez en unos segundos.
        </p>
        {error.digest && <p className="mt-2 font-mono text-xs text-muted">Código: {error.digest}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="btn-accent"><RotateCcw className="size-4" /> Reintentar</button>
          <Link href="/" className="btn-ghost">Ir al inicio</Link>
        </div>
      </div>
    </div>
  );
}
