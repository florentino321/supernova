import { ImageResponse } from "next/og";

// Vista previa al compartir la página principal o el catálogo.
export const alt = "Laptops Americanas · Laptops importadas de EE.UU.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Imagen() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", background: "#0d1b2e", color: "white", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", width: 64, height: 64, borderRadius: 16, background: "#d7263d" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 34, fontWeight: 800 }}>LAPTOPS</span>
            <span style={{ fontSize: 18, letterSpacing: 8, color: "rgba(255,255,255,0.6)" }}>AMERICANAS</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>Laptops de Estados Unidos,</span>
          <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, color: "rgba(255,255,255,0.55)" }}>revisadas una por una.</span>
        </div>
        <span style={{ fontSize: 28, color: "rgba(255,255,255,0.75)" }}>Garantía real · Envíos a todo el Perú · Huánuco</span>
      </div>
    ),
    size,
  );
}
