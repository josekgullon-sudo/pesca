import type { Prisma } from "@/generated/prisma/client";
import {
  DIFICULTADES_ACCESO,
  ETIQUETA_DIFICULTAD,
  ETIQUETA_TIPO_SITIO,
  TIPOS_SITIO,
  type DificultadAcceso,
  type TipoSitio,
} from "./enums";

/**
 * Los filtros del listado de sitios viven en la URL, no en estado de React.
 * Así el listado se renderiza entero en el servidor, funciona sin JavaScript y
 * un filtro concreto se puede guardar en marcadores o mandar por WhatsApp.
 */

export type FiltrosSitios = {
  tipo?: TipoSitio;
  /** Minutos de coche como máximo desde Dos Hermanas. */
  tiempo?: number;
  dificultad?: DificultadAcceso;
  /** Slug de una especie que tenga que estar presente en el sitio. */
  especie?: string;
};

export type ParamsBusqueda = Record<string, string | string[] | undefined>;

const TIEMPOS_VALIDOS = [40, 60, 90];

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export function leerFiltros(params: ParamsBusqueda): FiltrosSitios {
  const tipo = primero(params.tipo);
  const tiempo = Number(primero(params.tiempo));
  const dificultad = primero(params.dificultad);
  const especie = primero(params.especie);

  return {
    tipo: TIPOS_SITIO.includes(tipo as TipoSitio)
      ? (tipo as TipoSitio)
      : undefined,
    tiempo: TIEMPOS_VALIDOS.includes(tiempo) ? tiempo : undefined,
    dificultad: DIFICULTADES_ACCESO.includes(dificultad as DificultadAcceso)
      ? (dificultad as DificultadAcceso)
      : undefined,
    especie: especie || undefined,
  };
}

export function construirWhere(f: FiltrosSitios): Prisma.SitioWhereInput {
  return {
    ...(f.tipo ? { tipo: f.tipo } : {}),
    ...(f.dificultad ? { dificultadAcceso: f.dificultad } : {}),
    ...(f.tiempo ? { tiempoCocheMin: { lte: f.tiempo } } : {}),
    ...(f.especie
      ? { especies: { some: { especie: { slug: f.especie } } } }
      : {}),
  };
}

export function hayFiltros(f: FiltrosSitios): boolean {
  return Boolean(f.tipo || f.tiempo || f.dificultad || f.especie);
}

/** Serializa los filtros actuales sobre otra ruta, sin cambiar ninguno. */
export function urlConFiltros(base: string, filtros: FiltrosSitios): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filtros)) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  const cadena = params.toString();
  return cadena ? `${base}?${cadena}` : base;
}

/**
 * Devuelve la URL resultante de cambiar un filtro, conservando los demás.
 * Pasar `undefined` como valor quita ese filtro.
 */
export function urlConFiltro(
  base: string,
  filtros: FiltrosSitios,
  clave: keyof FiltrosSitios,
  valor: string | number | undefined,
): string {
  const params = new URLSearchParams();
  const combinados: Record<string, unknown> = { ...filtros, [clave]: valor };

  for (const [k, v] of Object.entries(combinados)) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }

  const cadena = params.toString();
  return cadena ? `${base}?${cadena}` : base;
}

// --- Definición de los grupos de filtros que se pintan como botones ---------

export type OpcionFiltro = {
  etiqueta: string;
  clave: keyof FiltrosSitios;
  valor: string | number | undefined;
};

export type GrupoFiltro = { titulo: string; opciones: OpcionFiltro[] };

export const GRUPOS_FILTRO: GrupoFiltro[] = [
  {
    titulo: "Tipo",
    opciones: [
      { etiqueta: "Todos", clave: "tipo", valor: undefined },
      ...TIPOS_SITIO.map((t) => ({
        etiqueta: ETIQUETA_TIPO_SITIO[t],
        clave: "tipo" as const,
        valor: t,
      })),
    ],
  },
  {
    titulo: "A cuánto en coche",
    opciones: [
      { etiqueta: "Lo que sea", clave: "tiempo", valor: undefined },
      { etiqueta: "40 min", clave: "tiempo", valor: 40 },
      { etiqueta: "1 hora", clave: "tiempo", valor: 60 },
      { etiqueta: "Hora y media", clave: "tiempo", valor: 90 },
    ],
  },
  {
    titulo: "Acceso",
    opciones: [
      { etiqueta: "Cualquiera", clave: "dificultad", valor: undefined },
      ...DIFICULTADES_ACCESO.map((d) => ({
        etiqueta: ETIQUETA_DIFICULTAD[d].replace("Acceso ", ""),
        clave: "dificultad" as const,
        valor: d,
      })),
    ],
  },
];

/** ¿Está activa esta opción con los filtros actuales? */
export function opcionActiva(f: FiltrosSitios, o: OpcionFiltro): boolean {
  const actual = f[o.clave];
  if (o.valor === undefined) return actual === undefined;
  return String(actual) === String(o.valor);
}
