/**
 * Valores válidos de los campos enumerados del schema.
 *
 * Prisma sobre SQLite no soporta `enum`, así que en la base de datos son
 * `String`. Este fichero es la fuente de verdad para TypeScript y para las
 * etiquetas que se muestran en la interfaz.
 */

// --- Sitios ---------------------------------------------------------------

export const TIPOS_SITIO = ["embalse", "rio", "canal"] as const;
export type TipoSitio = (typeof TIPOS_SITIO)[number];

export const ETIQUETA_TIPO_SITIO: Record<TipoSitio, string> = {
  embalse: "Embalse",
  rio: "Río",
  canal: "Canal",
};

export const DIFICULTADES_ACCESO = ["facil", "media", "dificil"] as const;
export type DificultadAcceso = (typeof DIFICULTADES_ACCESO)[number];

export const ETIQUETA_DIFICULTAD: Record<DificultadAcceso, string> = {
  facil: "Acceso fácil",
  media: "Acceso medio",
  dificil: "Acceso difícil",
};

// --- Especies -------------------------------------------------------------

export const ESTADOS_LEGALES = [
  "pescable",
  "devolucion_obligatoria",
  "prohibida",
  "invasora_area_delimitada",
  "invasora_no_pescable",
] as const;
export type EstadoLegal = (typeof ESTADOS_LEGALES)[number];

export const ETIQUETA_ESTADO_LEGAL: Record<EstadoLegal, string> = {
  pescable: "Pescable",
  devolucion_obligatoria: "Devolución obligatoria",
  prohibida: "Pesca prohibida",
  invasora_area_delimitada: "Invasora — solo en área delimitada",
  invasora_no_pescable: "Invasora no pescable",
};

/** Semáforo legal de la ficha de especie. */
export type ColorSemaforo = "verde" | "ambar" | "rojo";

export const SEMAFORO_POR_ESTADO: Record<EstadoLegal, ColorSemaforo> = {
  pescable: "verde",
  invasora_area_delimitada: "ambar",
  devolucion_obligatoria: "rojo",
  prohibida: "rojo",
  invasora_no_pescable: "rojo",
};

export const RESUMEN_SEMAFORO: Record<EstadoLegal, string> = {
  pescable: "Se puede pescar y llevar.",
  invasora_area_delimitada:
    "Solo se puede pescar dentro de las áreas delimitadas para especies exóticas invasoras. Fuera de ellas es obligatorio sacrificarla y no devolverla al agua.",
  devolucion_obligatoria:
    "Devolución obligatoria al agua, con el menor daño posible.",
  prohibida: "Su pesca está prohibida. Devuélvela de inmediato.",
  invasora_no_pescable:
    "No se puede pescar dirigidamente. Si cae por accidente, no debe devolverse al agua.",
};

export const COMESTIBILIDADES = ["si", "no", "desaconsejado"] as const;
export type Comestibilidad = (typeof COMESTIBILIDADES)[number];

export const ETIQUETA_COMESTIBILIDAD: Record<Comestibilidad, string> = {
  si: "Comestible",
  no: "No comestible",
  desaconsejado: "Consumo desaconsejado",
};

// --- Sitio/Especie --------------------------------------------------------

export const PROBABILIDADES = ["alta", "media", "baja"] as const;
export type Probabilidad = (typeof PROBABILIDADES)[number];

export const ETIQUETA_PROBABILIDAD: Record<Probabilidad, string> = {
  alta: "Probabilidad alta",
  media: "Probabilidad media",
  baja: "Probabilidad baja",
};

// --- Aparejos -------------------------------------------------------------

export const TIPOS_APAREJO = [
  "vinilo",
  "senuelo_duro",
  "cebo_natural",
  "engodo",
  "montaje",
] as const;
export type TipoAparejo = (typeof TIPOS_APAREJO)[number];

export const ETIQUETA_TIPO_APAREJO: Record<TipoAparejo, string> = {
  vinilo: "Vinilo",
  senuelo_duro: "Señuelo duro",
  cebo_natural: "Cebo natural",
  engodo: "Engodo",
  montaje: "Montaje",
};

// --- Meses ----------------------------------------------------------------

export const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

/** `mejorEpoca` se guarda como JSON de números de mes (1-12). */
export function parseMeses(json: string): number[] {
  try {
    const valor: unknown = JSON.parse(json);
    if (!Array.isArray(valor)) return [];
    return valor.filter(
      (m): m is number => typeof m === "number" && m >= 1 && m <= 12,
    );
  } catch {
    return [];
  }
}

export function serializeMeses(meses: number[]): string {
  return JSON.stringify([...new Set(meses)].sort((a, b) => a - b));
}
