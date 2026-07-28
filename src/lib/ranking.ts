import { prisma } from "./prisma";

/**
 * Ámbito del ranking: toda España o una provincia. Se pasa a todas las
 * consultas para no duplicar código entre /ranking y /[provincia]/ranking.
 */
export type Ambito = { provinciaId?: string };

function filtroSitio(a: Ambito) {
  return a.provinciaId ? { sitio: { provinciaId: a.provinciaId } } : {};
}

/**
 * Consultas del ranking.
 *
 * Se agrupa en SQL en vez de traerse todas las capturas y contar en memoria:
 * hoy son cuatro capturas y daría igual, pero el diario solo crece y esto no
 * hay que volver a tocarlo.
 */

/** Las piezas más pesadas, sin distinguir especie. */
export async function rankingPorPeso(ambito: Ambito = {}, limite = 10) {
  return prisma.captura.findMany({
    where: { pesoGramos: { not: null }, ...filtroSitio(ambito) },
    orderBy: { pesoGramos: "desc" },
    take: limite,
    select: {
      id: true,
      pesoGramos: true,
      longitudCm: true,
      fecha: true,
      esEjemplo: true,
      usuario: { select: { nombre: true } },
      sitio: { select: { nombre: true, slug: true } },
      especie: {
        select: {
          nombreComun: true,
          slug: true,
          estadoLegal: true,
          imagenUrl: true,
        },
      },
      fotos: { orderBy: { esPrincipal: "desc" }, take: 1 },
    },
  });
}

export type FilaEspecie = {
  slug: string;
  nombreComun: string;
  estadoLegal: string;
  imagenUrl: string | null;
  capturas: number;
  record: {
    id: string;
    pesoGramos: number;
    usuario: string;
    fotoUrl: string | null;
    esEjemplo: boolean;
  } | null;
};

/** Cuántas van de cada especie y cuál es el récord de cada una. */
export async function rankingPorEspecie(
  ambito: Ambito = {},
): Promise<FilaEspecie[]> {
  const conteos = await prisma.captura.groupBy({
    by: ["especieId"],
    where: filtroSitio(ambito),
    _count: { _all: true },
    orderBy: { _count: { especieId: "desc" } },
  });
  if (conteos.length === 0) return [];

  const [especies, records] = await Promise.all([
    prisma.especie.findMany({
      where: { id: { in: conteos.map((c) => c.especieId) } },
      select: {
        id: true,
        slug: true,
        nombreComun: true,
        estadoLegal: true,
        imagenUrl: true,
      },
    }),
    // El récord de cada especie: la más pesada de cada una.
    Promise.all(
      conteos.map((c) =>
        prisma.captura.findFirst({
          where: {
            especieId: c.especieId,
            pesoGramos: { not: null },
            ...filtroSitio(ambito),
          },
          orderBy: { pesoGramos: "desc" },
          select: {
            id: true,
            especieId: true,
            pesoGramos: true,
            esEjemplo: true,
            usuario: { select: { nombre: true } },
            fotos: { orderBy: { esPrincipal: "desc" }, take: 1 },
          },
        }),
      ),
    ),
  ]);

  const porId = new Map(especies.map((e) => [e.id, e]));

  return conteos
    .map((c): FilaEspecie | null => {
      const especie = porId.get(c.especieId);
      if (!especie) return null;

      const r = records.find((x) => x?.especieId === c.especieId);
      return {
        slug: especie.slug,
        nombreComun: especie.nombreComun,
        estadoLegal: especie.estadoLegal,
        imagenUrl: especie.imagenUrl,
        capturas: c._count._all,
        record:
          r && r.pesoGramos !== null
            ? {
                id: r.id,
                pesoGramos: r.pesoGramos,
                usuario: r.usuario.nombre,
                fotoUrl: r.fotos[0]?.url ?? null,
                esEjemplo: r.esEjemplo,
              }
            : null,
      };
    })
    .filter((f): f is FilaEspecie => f !== null);
}

export type FilaPescador = {
  id: string;
  nombre: string;
  capturas: number;
  especies: number;
  pesoTotal: number;
  mejor: { pesoGramos: number; especie: string } | null;
};

/** El marcador entre pescadores: quién lleva más, quién la más gorda. */
export async function rankingPorPescador(
  ambito: Ambito = {},
  limite = 25,
): Promise<FilaPescador[]> {
  // Solo quien tenga capturas: con registro abierto la tabla de usuarios crece
  // sola y no tiene sentido consultarla entera para pintar ceros.
  const conCapturas = await prisma.captura.groupBy({
    by: ["usuarioId"],
    // Las de muestra no entran aquí: que una cuenta que no es de nadie
    // encabece el marcador de pescadores no enseña nada y confunde. En los
    // pesos y en los récords sí salen, marcadas.
    where: { esEjemplo: false, ...filtroSitio(ambito) },
    _count: { _all: true },
    orderBy: { _count: { usuarioId: "desc" } },
    take: limite,
  });
  if (conCapturas.length === 0) return [];

  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: conCapturas.map((c) => c.usuarioId) } },
    select: { id: true, nombre: true },
  });

  const filas = await Promise.all(
    usuarios.map(async (u) => {
      const [capturas, distintas, suma, mejor] = await Promise.all([
        prisma.captura.count({
          where: { usuarioId: u.id, esEjemplo: false, ...filtroSitio(ambito) },
        }),
        prisma.captura
          .findMany({
            where: { usuarioId: u.id, esEjemplo: false, ...filtroSitio(ambito) },
            distinct: ["especieId"],
            select: { especieId: true },
          })
          .then((r) => r.length),
        prisma.captura.aggregate({
          where: { usuarioId: u.id, esEjemplo: false, ...filtroSitio(ambito) },
          _sum: { pesoGramos: true },
        }),
        prisma.captura.findFirst({
          where: {
            usuarioId: u.id,
            pesoGramos: { not: null },
            esEjemplo: false,
            ...filtroSitio(ambito),
          },
          orderBy: { pesoGramos: "desc" },
          select: {
            pesoGramos: true,
            especie: { select: { nombreComun: true } },
          },
        }),
      ]);

      return {
        id: u.id,
        nombre: u.nombre,
        capturas,
        especies: distintas,
        pesoTotal: suma._sum.pesoGramos ?? 0,
        mejor:
          mejor && mejor.pesoGramos !== null
            ? { pesoGramos: mejor.pesoGramos, especie: mejor.especie.nombreComun }
            : null,
      };
    }),
  );

  // Sin capturas no se sale en el marcador: no aporta nada ver un cero.
  return filas
    .filter((f) => f.capturas > 0)
    .sort((a, b) => b.capturas - a.capturas || b.pesoTotal - a.pesoTotal);
}

/** Sitios con más capturas registradas. */
export async function rankingPorSitio(ambito: Ambito = {}, limite = 8) {
  const conteos = await prisma.captura.groupBy({
    by: ["sitioId"],
    where: filtroSitio(ambito),
    _count: { _all: true },
    orderBy: { _count: { sitioId: "desc" } },
    take: limite,
  });
  if (conteos.length === 0) return [];

  const sitios = await prisma.sitio.findMany({
    where: { id: { in: conteos.map((c) => c.sitioId) } },
    select: {
      id: true,
      slug: true,
      nombre: true,
      tipo: true,
      provincia: { select: { slug: true } },
    },
  });
  const porId = new Map(sitios.map((s) => [s.id, s]));

  return conteos.flatMap((c) => {
    const sitio = porId.get(c.sitioId);
    return sitio ? [{ ...sitio, capturas: c._count._all }] : [];
  });
}
