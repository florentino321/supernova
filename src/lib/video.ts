/** Convierte un enlace de YouTube o TikTok en una URL para incrustar. */
export function urlEmbebida(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host === "youtube.com") {
      if (u.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
      if (u.pathname.startsWith("/embed/")) return url;
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const id = u.pathname.match(/video\/(\d+)/)?.[1];
      if (id) return `https://www.tiktok.com/embed/v2/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function esVertical(url: string) {
  return /tiktok\.com|youtube\.com\/shorts/.test(url);
}
