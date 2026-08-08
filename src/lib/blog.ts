import { prisma } from "./prisma";

/**
 * Consultas del blog.
 *
 * Solo se sirve lo publicado, igual que con las provincias: un borrador no se
 * ve ni entra en el sitemap. Un artículo a medias posicionado es peor que uno
 * que no existe.
 */

/**
 * La foto que enseña un artículo.
 *
 * Si tiene la suya, esa. Si no, la de la especie o el sitio del que habla.
 *
 * Lo segundo es lo que hace que esto funcione sin trabajo extra: un artículo
 * sobre el cangrejo rojo ya tiene una foto de cangrejo rojo en la base de
 * datos, con su autor y su licencia; obligar a subirla otra vez a mano solo
 * garantizaba que la mitad de los artículos se quedaran sin ninguna. Y sin
 * foto, la tarjeta que sale al compartir el enlace por WhatsApp va vacía.
 *
 * La atribución viaja con la imagen, venga de donde venga: las de Commons son
 * Creative Commons y hay obligación de acreditarlas donde se muestren.
 */
export type ImagenArticulo = {
  url: string;
  autor: string | null;
  licencia: string | null;
  fuente: string | null;
  /** De dónde sale, para poder decir «Foto: el embalse de X». */
  prestada: string | null;
};

type ConImagen = {
  imagenUrl: string | null;
  imagenAutor: string | null;
  imagenLicencia: string | null;
  imagenFuente: string | null;
};

export function imagenDe(
  articulo: ConImagen & {
    especie?: (ConImagen & { nombreComun: string }) | null;
  },
): ImagenArticulo | null {
  if (articulo.imagenUrl) {
    return {
      url: articulo.imagenUrl,
      autor: articulo.imagenAutor,
      licencia: articulo.imagenLicencia,
      fuente: articulo.imagenFuente,
      prestada: null,
    };
  }

  const e = articulo.especie;
  if (e?.imagenUrl) {
    return {
      url: e.imagenUrl,
      autor: e.imagenAutor,
      licencia: e.imagenLicencia,
      fuente: e.imagenFuente,
      prestada: e.nombreComun,
    };
  }

  return null;
}

const IMAGEN_ESPECIE = {
  select: {
    nombreComun: true,
    imagenUrl: true,
    imagenAutor: true,
    imagenLicencia: true,
    imagenFuente: true,
  },
} as const;

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
      imagenAutor: true,
      imagenLicencia: true,
      imagenFuente: true,
      especie: IMAGEN_ESPECIE,
      provincia: { select: { slug: true, nombre: true } },
    },
  });
}

export async function articulo(slug: string) {
  const a = await prisma.articulo.findUnique({
    where: { slug },
    include: {
      provincia: { select: { slug: true, nombre: true, publicada: true } },
      especie: { select: { slug: true, ...IMAGEN_ESPECIE.select } },
    },
  });
  return a?.publicada ? a : null;
}

/**
 * Los artículos de una provincia o de una especie, para enlazarlos desde su
 * página.
 *
 * Los enlaces iban solo en un sentido: el artículo apuntaba a la ficha y la
 * ficha no devolvía nada. Eso deja las páginas que reciben las visitas de
 * Google convertidas en un callejón sin salida —ni el visitante sigue leyendo,
 * ni la página reparte fuerza a lo demás—, que es de lo poco en SEO que
 * depende enteramente de nosotros y no de tener suerte.
 */
export async function articulosDe(
  filtro: { provinciaSlug: string } | { especieSlug: string },
  limite = 4,
) {
  return prisma.articulo.findMany({
    where: {
      publicada: true,
      ...("provinciaSlug" in filtro
        ? { provincia: { slug: filtro.provinciaSlug } }
        : { especie: { slug: filtro.especieSlug } }),
    },
    orderBy: { publicadaEl: "desc" },
    take: limite,
    select: { slug: true, titulo: true, entradilla: true },
  });
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
