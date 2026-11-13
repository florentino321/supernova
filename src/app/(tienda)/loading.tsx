// Esqueleto mientras carga una página de la tienda (se ve al navegar con conexión lenta).
export default function Cargando() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-busy="true" aria-label="Cargando">
      <div className="h-9 w-64 animate-pulse rounded-xl bg-surface-2" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded-lg bg-surface-2" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="aspect-[4/3] animate-pulse bg-surface-2" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
              <div className="h-5 w-40 animate-pulse rounded bg-surface-2" />
              <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
              <div className="mt-3 h-6 w-28 animate-pulse rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
