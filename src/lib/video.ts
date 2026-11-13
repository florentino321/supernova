/** Extrae el id de un video de YouTube (youtu.be, watch?v=, shorts, embed). */
export function idYoutube(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return u.pathname.slice(1) || null;
    if (host === "youtube.com") {
      if (u.pathname.startsWith("/shorts/") || u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
      return u.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

/** URL para incrustar un video de YouTube (solo se carga cuando el visitante lo pide). */
export function urlEmbebida(url: string): string | null {
  const id = idYoutube(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/** Enlaces de video aceptados en el panel: YouTube o TikTok (TikTok se abre en su app). */
export function esEnlaceVideoValido(url: string) {
  if (idYoutube(url)) return true;
  try {
    const host = new URL(url).hostname;
    return host === "tiktok.com" || host.endsWith(".tiktok.com");
  } catch {
    return false;
  }
}
