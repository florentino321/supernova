/**
 * Dirección pública del sitio (para enlaces al compartir, sitemap y SEO).
 * En Vercel se toma sola del dominio de producción; en local, localhost.
 */
export const URL_SITIO = (() => {
  const propia = process.env.NEXT_PUBLIC_SITIO_URL;
  if (propia) return propia.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
})();
