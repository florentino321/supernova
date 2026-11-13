"use client";

// Último recurso si falla el diseño principal: HTML mínimo sin dependencias.
export default function ErrorGlobal({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, background: "#f6f7f9", color: "#0b1626" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ fontWeight: 800, letterSpacing: 1 }}>LAPTOPS AMERICANAS</p>
          <h1 style={{ fontSize: 24 }}>Algo salió mal</h1>
          <p style={{ color: "#3c4859" }}>Inténtalo de nuevo en unos segundos.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 12, border: 0, background: "#d7263d", color: "#fff", fontWeight: 600 }}>
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
