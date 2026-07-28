import { notFound } from "next/navigation";
import { prisma } from "./prisma";

/**
 * Ayudas para las páginas de provincia.
 *
 * Una provincia sin publicar responde 404 aunque exista en la base de datos:
 * es la forma de tenerlas todas creadas sin que Google indexe páginas vacías.
 */

export async function cargarProvincia(slug: string) {
  const provincia = await prisma.provincia.findUnique({ where: { slug } });
  if (!provincia || !provincia.publicada) notFound();
  return provincia;
}

export async function provinciasPublicadas() {
  return prisma.provincia.findMany({
    where: { publicada: true },
    orderBy: { nombre: "asc" },
    select: {
      slug: true,
      nombre: true,
      comunidad: true,
      descripcion: true,
      _count: { select: { sitios: true } },
    },
  });
}

/**
 * A dónde lleva "Sitios" en la navegación. Con una sola provincia publicada va
 * directo a ella; con varias, a la portada, que es donde está el listado.
 */
export async function rutaDeSitios(): Promise<string> {
  const publicadas = await prisma.provincia.findMany({
    where: { publicada: true },
    select: { slug: true },
    take: 2,
  });
  return publicadas.length === 1 ? `/${publicadas[0].slug}` : "/";
}
