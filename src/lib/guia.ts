import { prisma } from "./prisma";
import type { Ambito } from "./ranking";

/**
 * Rankings sacados de la guía, no de las capturas.
 *
 * El ranking de capturas depende de que la gente registre cosas, y hasta que
 * eso pase la página está vacía —que es la peor carta de presentación posible y
 * además no le da a Google nada que indexar—. Esto se calcula con lo que ya
 * está cargado y contrastado: qué especie es más abundante en cada sitio, dónde
 * está la mejor población de cada una, y qué sitios están en su mejor época
 * ahora mismo.
 *
 * Es información real, no relleno. Las abundancias son estimaciones nuestras y
 * así se dice en la página, pero salen de la guía, no de un generador.
 */

/** Especies que ni se pueden buscar: fuera de cualquier ranking de «dónde ir». */
const NO_SE_PUEDEN_BUSCAR = ["prohibida", "invasora_no_pescable"];

function filtroProvincia(a: Ambito) {
  return a.provinciaId ? { provinciaId: a.provinciaId } : {};
}

export type SitioDeEspecie = {
  slug: string;
  nombre: string;
  provincia: string;
  municipio: string;
  tiempoCocheMin: number;
  abundancia: number;
  probabilidadCaptura: string;
  mejorTecnica: string | null;
};

export type EspecieConSitios = {
  slug: string;
  nombreComun: string;
  nombreCientifico: string;
  estadoLegal: string;
  imagenUrl: string | null;
  /** Suma de abundancias: sirve para ordenar las especies entre sí. */
  peso: number;
  sitios: SitioDeEspecie[];
};

/**
 * Para cada especie que se puede pescar, los sitios donde más hay, de más a
 * menos. Es el «dónde voy a por X», que es la pregunta que trae a la gente.
 */
export async function dondeEstaCadaEspecie(
  ambito: Ambito = {},
  sitiosPorEspecie = 4,
): Promise<EspecieConSitios[]> {
  const especies = await prisma.especie.findMany({
    where: {
      estadoLegal: { notIn: NO_SE_PUEDEN_BUSCAR },
      sitios: {
        some: { sitio: { provincia: { publicada: true }, ...filtroProvincia(ambito) } },
      },
    },
    select: {
      slug: true,
      nombreComun: true,
      nombreCientifico: true,
      estadoLegal: true,
      imagenUrl: true,
      sitios: {
        where: {
          sitio: { provincia: { publicada: true }, ...filtroProvincia(ambito) },
        },
        orderBy: { abundancia: "desc" },
        select: {
          abundancia: true,
          probabilidadCaptura: true,
          mejorTecnica: true,
          sitio: {
            select: {
              slug: true,
              nombre: true,
              municipio: true,
              tiempoCocheMin: true,
              provincia: { select: { slug: true } },
            },
          },
        },
      },
    },
  });

  return especies
    .map((e) => ({
      slug: e.slug,
      nombreComun: e.nombreComun,
      nombreCientifico: e.nombreCientifico,
      estadoLegal: e.estadoLegal,
      imagenUrl: e.imagenUrl,
      peso: e.sitios.reduce((total, s) => total + s.abundancia, 0),
      sitios: e.sitios.slice(0, sitiosPorEspecie).map((s) => ({
        slug: s.sitio.slug,
        nombre: s.sitio.nombre,
        provincia: s.sitio.provincia.slug,
        municipio: s.sitio.municipio,
        tiempoCocheMin: s.sitio.tiempoCocheMin,
        abundancia: s.abundancia,
        probabilidadCaptura: s.probabilidadCaptura,
        mejorTecnica: s.mejorTecnica,
      })),
    }))
    .sort((a, b) => b.peso - a.peso || a.nombreComun.localeCompare(b.nombreComun, "es"));
}

export type SitioConVariedad = {
  slug: string;
  nombre: string;
  provincia: string;
  tipo: string;
  municipio: string;
  tiempoCocheMin: number;
  imagenUrl: string | null;
  /** Cuántas especies pescables hay anotadas. */
  especies: number;
  /** Las tres más abundantes, para el resumen. */
  principales: string[];
  /** Suma de abundancias de las pescables: ordena los sitios entre sí. */
  peso: number;
  enTemporada: boolean;
};

/**
 * Los sitios ordenados por lo que se puede sacar de ellos: cuántas especies
 * pescables tienen y en qué abundancia. No es «el mejor sitio» —eso depende del
 * día—, es dónde hay más cosas anotadas.
 */
export async function sitiosPorVariedad(
  ambito: Ambito = {},
  mes: number,
  limite = 10,
): Promise<SitioConVariedad[]> {
  const sitios = await prisma.sitio.findMany({
    where: { provincia: { publicada: true }, ...filtroProvincia(ambito) },
    select: {
      slug: true,
      nombre: true,
      tipo: true,
      municipio: true,
      tiempoCocheMin: true,
      imagenUrl: true,
      mejorEpoca: true,
      provincia: { select: { slug: true } },
      especies: {
        where: { especie: { estadoLegal: { notIn: NO_SE_PUEDEN_BUSCAR } } },
        orderBy: { abundancia: "desc" },
        select: {
          abundancia: true,
          especie: { select: { nombreComun: true } },
        },
      },
    },
  });

  return sitios
    .map((s) => ({
      slug: s.slug,
      nombre: s.nombre,
      provincia: s.provincia.slug,
      tipo: s.tipo,
      municipio: s.municipio,
      tiempoCocheMin: s.tiempoCocheMin,
      imagenUrl: s.imagenUrl,
      especies: s.especies.length,
      principales: s.especies.slice(0, 3).map((e) => e.especie.nombreComun),
      peso: s.especies.reduce((total, e) => total + e.abundancia, 0),
      enTemporada: mesesDe(s.mejorEpoca).includes(mes),
    }))
    .filter((s) => s.especies > 0)
    .sort((a, b) => b.peso - a.peso || b.especies - a.especies)
    .slice(0, limite);
}

/** `mejorEpoca` es un JSON con los números de mes. Si viene roto, ninguno. */
function mesesDe(json: string): number[] {
  try {
    const valor: unknown = JSON.parse(json);
    return Array.isArray(valor) ? valor.filter((m) => typeof m === "number") : [];
  } catch {
    return [];
  }
}
