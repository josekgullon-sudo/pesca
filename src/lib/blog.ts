import { prisma } from "./prisma";

/**
 * Consultas del blog.
 *
 * Solo se sirve lo publicado, igual que con las provincias: un borrador no se
 * ve ni entra en el sitemap. Un artículo a medias posicionado es peor que uno
 * que no existe.
 */

export async function articulosPublicados(limite?: number) {
  return prisma.articulo.findMany({
    where: { publicada: true },
    orderBy: { publicadaEl: "desc" },
    take: limite,
    select: {
      slug: true,
      titulo: true,
      entradilla: true,
      publicadaEl: true,
      imagenUrl: true,
      provincia: { select: { slug: true, nombre: true } },
    },
  });
}

export async function articulo(slug: string) {
  const a = await prisma.articulo.findUnique({
    where: { slug },
    include: { provincia: { select: { slug: true, nombre: true, publicada: true } } },
  });
  return a?.publicada ? a : null;
}

/** Otros artículos para el pie de la ficha, sin repetir el que se está leyendo. */
export async function articulosRelacionados(slugActual: string, limite = 3) {
  return prisma.articulo.findMany({
    where: { publicada: true, slug: { not: slugActual } },
    orderBy: { publicadaEl: "desc" },
    take: limite,
    select: { slug: true, titulo: true, entradilla: true },
  });
}
