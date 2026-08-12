import type { MetadataRoute } from "next";
import { urlAbsoluta } from "@/lib/marca";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Sitemap.
 *
 * Solo entra lo que tiene contenido propio y queremos que Google indexe: las
 * provincias publicadas, sus sitios, las especies y las páginas fijas. Las
 * provincias sin publicar quedan fuera, igual que quedan fuera de la web.
 *
 * Las fichas de captura sueltas no entran, y además van con noindex: llevan el
 * nombre de quien las subió. El listado sí, que es el que enseña la actividad.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [provincias, sitios, especies, articulos, aparejos] = await Promise.all([
    prisma.provincia.findMany({
      where: { publicada: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.sitio.findMany({
      where: { provincia: { publicada: true } },
      select: {
        slug: true,
        updatedAt: true,
        provincia: { select: { slug: true } },
      },
    }),
    prisma.especie.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.articulo.findMany({
      where: { publicada: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.aparejo.findMany({ select: { slug: true } }),
  ]);

  const fijas: MetadataRoute.Sitemap = [
    { url: urlAbsoluta("/"), changeFrequency: "daily", priority: 1 },
    // El listado de todo y su mapa. Con una sola provincia publicada son casi
    // un duplicado de la página de esa provincia, y por eso van con menos
    // prioridad que ella: la que interesa que salga en «dónde pescar en
    // Sevilla» es la de Sevilla, no esta.
    { url: urlAbsoluta("/donde-pescar"), changeFrequency: "weekly", priority: 0.7 },
    { url: urlAbsoluta("/mapa"), changeFrequency: "weekly", priority: 0.5 },
    { url: urlAbsoluta("/especies"), changeFrequency: "monthly", priority: 0.8 },
    { url: urlAbsoluta("/aparejos"), changeFrequency: "monthly", priority: 0.8 },
    // Cambia de nota cada día, y es de las páginas a las que la gente vuelve.
    { url: urlAbsoluta("/calendario"), changeFrequency: "daily", priority: 0.9 },
    { url: urlAbsoluta("/ranking"), changeFrequency: "daily", priority: 0.7 },
    { url: urlAbsoluta("/capturas"), changeFrequency: "daily", priority: 0.4 },
    { url: urlAbsoluta("/blog"), changeFrequency: "weekly", priority: 0.8 },
    { url: urlAbsoluta("/normas"), changeFrequency: "yearly", priority: 0.2 },
    { url: urlAbsoluta("/aviso-legal"), changeFrequency: "yearly", priority: 0.2 },
  ];

  return [
    ...fijas,
    ...provincias.flatMap((p) => [
      {
        url: urlAbsoluta(`/${p.slug}`),
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      },
      {
        url: urlAbsoluta(`/${p.slug}/mapa`),
        lastModified: p.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      },
      {
        url: urlAbsoluta(`/${p.slug}/ranking`),
        lastModified: p.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.6,
      },
    ]),
    ...sitios.flatMap((s) => [
      {
        url: urlAbsoluta(`/${s.provincia.slug}/${s.slug}`),
        lastModified: s.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      // El calendario solunar de cada sitio. Una sola dirección por embalse:
      // el mes se navega con parámetros y la canónica apunta siempre aquí. Una
      // URL por embalse y día serían veinte mil páginas casi idénticas, que es
      // justo lo que Google penaliza como contenido de relleno.
      {
        url: urlAbsoluta(`/${s.provincia.slug}/${s.slug}/calendario`),
        changeFrequency: "daily" as const,
        priority: 0.6,
      },
    ]),
    // Las fichas de señuelo. Cada una responde a una búsqueda distinta —«cómo
    // montar un texas rig», «para qué sirve un spinnerbait»— y por eso van al
    // sitemap una a una y no solo el listado.
    ...aparejos.map((a) => ({
      url: urlAbsoluta(`/aparejos/${a.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...especies.map((e) => ({
      url: urlAbsoluta(`/especies/${e.slug}`),
      lastModified: e.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...articulos.map((a) => ({
      url: urlAbsoluta(`/blog/${a.slug}`),
      lastModified: a.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
