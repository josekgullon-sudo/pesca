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
  const [provincias, sitios, especies, articulos] = await Promise.all([
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
  ]);

  const fijas: MetadataRoute.Sitemap = [
    { url: urlAbsoluta("/"), changeFrequency: "daily", priority: 1 },
    { url: urlAbsoluta("/especies"), changeFrequency: "monthly", priority: 0.8 },
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
    ...sitios.map((s) => ({
      url: urlAbsoluta(`/${s.provincia.slug}/${s.slug}`),
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
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
