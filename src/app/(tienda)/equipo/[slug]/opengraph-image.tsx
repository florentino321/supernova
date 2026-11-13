import { ImageResponse } from "next/og";
import { obtenerEquipo, portada } from "@/lib/catalogo";
import { enSoles, etiquetaCondicion } from "@/lib/formato";

// Vista previa al compartir el enlace (WhatsApp, Facebook, Messenger…): foto, modelo y precio.
export const alt = "Laptop en Laptops Americanas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const estadoTexto: Record<string, [string, string]> = {
  disponible: ["En tienda", "#0f9d58"],
  reservado: ["Reservado", "#d97706"],
  en_transito: ["Llega pronto", "#7c3aed"],
  vendido: ["Vendido", "#3c4859"],
};

export default async function Imagen({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = await obtenerEquipo(slug);
  const foto = u ? portada(u) : null;
  const precio = u ? Number(u.precio_oferta_pen ?? u.precio_pen) : 0;
  const [estado, colorEstado] = estadoTexto[u?.estado ?? ""] ?? ["", "#3c4859"];

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#0d1b2e", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", width: 540, height: 630, background: "#f0f2f5", alignItems: "center", justifyContent: "center" }}>
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto.url} alt="" width={540} height={630} style={{ objectFit: "cover", width: 540, height: 630 }} />
          ) : (
            <svg width="320" height="220" viewBox="0 0 24 17" fill="none" stroke="#0d1b2e" strokeWidth="1.2">
              <rect x="3" y="1" width="18" height="12" rx="1.2" />
              <path d="M1 15.5h22" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "44px 48px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", width: 44, height: 44, borderRadius: 12, background: "#d7263d" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>LAPTOPS</span>
              <span style={{ fontSize: 13, letterSpacing: 5, color: "rgba(255,255,255,0.6)" }}>AMERICANAS</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 2 }}>
              {u?.modelos?.marcas?.nombre ?? ""}
            </span>
            <span style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.05, marginTop: 6 }}>{u?.modelos?.nombre ?? "Laptop importada de EE.UU."}</span>
            {u && (
              <span style={{ fontSize: 24, color: "rgba(255,255,255,0.75)", marginTop: 16 }}>
                {`${u.procesador} · ${u.ram_gb} GB RAM · ${u.almacenamiento}`}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {estado && (
                <span style={{ display: "flex", background: colorEstado, borderRadius: 999, padding: "6px 18px", fontSize: 22 }}>{estado}</span>
              )}
              {u && (
                <span style={{ fontSize: 22, color: "rgba(255,255,255,0.7)" }}>
                  {`${etiquetaCondicion[u.condicion]} · Garantía ${u.garantia_meses} meses`}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 14 }}>
              {u && <span style={{ fontSize: 64, fontWeight: 700 }}>{enSoles(precio)}</span>}
              {u?.precio_oferta_pen != null && (
                <span style={{ fontSize: 28, color: "rgba(255,255,255,0.5)", textDecoration: "line-through" }}>{enSoles(u.precio_pen)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
