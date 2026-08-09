import { notFound } from "next/navigation";
import { usuarioOpcional } from "./auth";
import { prisma } from "./prisma";

/**
 * Ayudas para las páginas de provincia.
 *
 * Una provincia sin publicar responde 404 aunque exista en la base de datos:
 * es la forma de tenerlas todas creadas sin que Google indexe páginas vacías.
 *
 * Con una excepción: un administrador sí la ve, en vista previa y con un aviso
 * encima. Publicar a ciegas no tiene sentido —hay que poder leer los textos y
 * las fichas antes de darle al botón— y el 404 dejaba la única forma de
 * revisarlo en publicarlo primero, que es justo al revés.
 */

export async function cargarProvincia(slug: string) {
  const provincia = await prisma.provincia.findUnique({ where: { slug } });
  if (!provincia) notFound();

  if (!provincia.publicada) {
    const usuario = await usuarioOpcional();
    if (!usuario?.esAdmin) notFound();
  }

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
 *
 * Si la base de datos no responde, devuelve la portada en vez de propagar el
 * error. Esto lo llama la cabecera, que sale en TODAS las páginas: sin este
 * respaldo, un problema con la base de datos tira la web entera, y al compilar
 * la imagen de Docker —donde todavía no hay base de datos— el build fallaba al
 * pregenerar /entrar.
 */
export async function rutaDeSitios(): Promise<string> {
  try {
    const publicadas = await prisma.provincia.findMany({
      where: { publicada: true },
      select: { slug: true },
      take: 2,
    });
    // Con una sola provincia su página ya es el listado de sitios, y llevar
    // ahí es mejor: una URL menos y la que Google tiene indexada.
    //
    // Con varias va al listado común. Antes devolvía «/» y el resultado era
    // que pulsar «Sitios» te dejaba en la portada, que es justo de donde
    // venías. Duró lo que tardó en publicarse la segunda provincia.
    if (publicadas.length === 1) return `/${publicadas[0].slug}`;
    return publicadas.length === 0 ? "/" : "/donde-pescar";
  } catch {
    return "/";
  }
}
