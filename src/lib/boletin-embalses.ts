/**
 * Leer el boletín de embalses del Ministerio.
 *
 * El fichero oficial es un ZIP con una base de datos de Access dentro. Suena
 * peor de lo que es: se descomprime y se lee en JavaScript puro, sin depender
 * de nada instalado en el sistema.
 *
 * Que sea la base histórica y no una foto del día tiene una ventaja: trae una
 * fila por embalse y semana desde hace años. De ahí sale el dato de hoy —la
 * fila más reciente de cada embalse— y, el día que se quiera, la evolución.
 *
 * Está escrito sin haber visto el fichero por dentro: desde donde se programa
 * esto no hay salida a internet. Por eso, en vez de dar por supuestos los
 * nombres de las tablas y las columnas, los **busca** por lo que significan y,
 * si no los encuentra, devuelve lo que sí ha visto para poder arreglarlo de
 * una sola pasada en lugar de a ciegas.
 */

import { unzipSync } from "fflate";
import MDBReader from "mdb-reader";
import { interpretarFecha, type FilaBoletin } from "./niveles";

/** Es la misma fila que emparejamos después; el tipo vive en `niveles.ts`. */
export type FilaEmbalse = FilaBoletin;

/** Lo que se ha encontrado dentro, para poder diagnosticar sin adivinar. */
export type Radiografia = {
  tablas: { nombre: string; columnas: string[]; filas: number }[];
  /** Una fila de ejemplo de la tabla elegida, si se ha elegido alguna. */
  ejemplo?: Record<string, unknown>;
  tablaElegida?: string;
};

function normalizarColumna(c: string): string {
  return c
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_");
}

/**
 * Qué columna es cada cosa.
 *
 * Se saca aparte para poder probarlo con los nombres reales, porque aquí ya
 * me equivoqué una vez y de forma silenciosa: en esta base la capacidad es
 * `AGUA_TOTAL` y el volumen de hoy es `AGUA_ACTUAL`, y yo buscaba `AGUA_TOTAL`
 * como si fuera el volumen. Con esa confusión todos los embalses habrían
 * salido al 100 %, que es un fallo que encima parece plausible.
 */
export type Columnas = {
  nombre: string;
  capacidad: string;
  volumen: string;
  fecha: string | null;
  ambito: string | null;
};

export function elegirColumnas(columnas: string[]): Columnas | null {
  const nombre = buscarColumna(columnas, "embalse_nombre", "nombre_embalse", "embalse");
  // El orden importa: «agua_total» es la capacidad, no el volumen actual.
  const capacidad = buscarColumna(columnas, "agua_total", "capacidad_total", "capacidad");
  const volumen = buscarColumna(columnas, "agua_actual", "volumen_actual", "volumen", "embalsada");
  const fecha = buscarColumna(columnas, "fecha");
  const ambito = buscarColumna(columnas, "ambito");

  if (!nombre || !capacidad || !volumen) return null;
  if (capacidad === volumen) return null; // no pueden ser la misma columna
  return { nombre, capacidad, volumen, fecha, ambito };
}

/** Busca una columna por lo que significa, no por cómo se llama exactamente. */
function buscarColumna(columnas: string[], ...pistas: string[]): string | null {
  const normalizadas = columnas.map((c) => ({ real: c, n: normalizarColumna(c) }));
  for (const pista of pistas) {
    const hallada = normalizadas.find((c) => c.n.includes(pista));
    if (hallada) return hallada.real;
  }
  return null;
}

function aNumero(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    return Number(v.trim().replace(/\./g, "").replace(",", "."));
  }
  return NaN;
}

function aFecha(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === "string" && v.trim()) return interpretarFecha(v.trim());
  return null;
}

/**
 * Saca del ZIP la última medición de cada embalse.
 *
 * Devuelve también la radiografía de lo que ha visto: con ella se arregla el
 * emparejamiento de columnas sin tener que descargar nada otra vez.
 */
export function leerBoletin(zip: Uint8Array): {
  filas: FilaEmbalse[];
  radiografia: Radiografia;
  problema?: string;
} {
  const contenido = unzipSync(zip);
  const nombreMdb = Object.keys(contenido).find((f) => /\.(mdb|accdb)$/i.test(f));
  if (!nombreMdb) {
    return {
      filas: [],
      radiografia: { tablas: [] },
      problema: `Dentro del ZIP no hay ninguna base de datos. Trae: ${Object.keys(contenido).join(", ")}`,
    };
  }

  const lector = new MDBReader(Buffer.from(contenido[nombreMdb]));
  const nombresTabla = lector.getTableNames();

  const radiografia: Radiografia = {
    tablas: nombresTabla.map((n) => {
      const t = lector.getTable(n);
      return { nombre: n, columnas: t.getColumnNames(), filas: t.rowCount };
    }),
  };

  // La tabla buena es la que tiene a la vez nombre de embalse, capacidad y
  // volumen. Buscarla así, y no por su nombre, es lo que hace que esto siga
  // funcionando si el Ministerio le cambia el nombre a la tabla.
  let elegida: { nombre: string; cols: Columnas } | null = null;

  for (const t of radiografia.tablas) {
    const cols = elegirColumnas(t.columnas);
    // Se queda con la que más filas tenga: la base trae también tablas
    // auxiliares que pueden cuadrar de columnas y no traer los datos.
    if (cols && (!elegida || t.filas > (radiografia.tablas.find((x) => x.nombre === elegida!.nombre)?.filas ?? 0))) {
      elegida = { nombre: t.nombre, cols };
    }
  }

  if (!elegida) {
    return {
      filas: [],
      radiografia,
      problema:
        "Ninguna tabla tiene a la vez nombre de embalse, capacidad y volumen. " +
        "Abajo van las tablas y sus columnas para poder ajustarlo.",
    };
  }

  radiografia.tablaElegida = elegida.nombre;

  const tabla = lector.getTable(elegida.nombre);

  // Solo las cuatro columnas que hacen falta, no la tabla entera. La base
  // histórica trae una fila por embalse y semana desde hace años, y cargarla
  // completa en un VPS pequeño es la clase de cosa que se lleva por delante
  // el proceso sin dar tiempo ni a que se queje.
  const columnas = [
    elegida.cols.nombre,
    elegida.cols.capacidad,
    elegida.cols.volumen,
    ...(elegida.cols.fecha ? [elegida.cols.fecha] : []),
  ];
  const datos = tabla.getData({ columns: columnas }) as Record<string, unknown>[];
  radiografia.ejemplo = datos[0];

  // Una fila por embalse y semana: nos quedamos con la más reciente de cada uno.
  const ultima = new Map<string, FilaEmbalse>();

  for (const fila of datos) {
    const nombre = String(fila[elegida.cols.nombre] ?? "").trim();
    const capacidadHm3 = aNumero(fila[elegida.cols.capacidad]);
    const volumenHm3 = aNumero(fila[elegida.cols.volumen]);
    if (!nombre || !(capacidadHm3 > 0) || !Number.isFinite(volumenHm3)) continue;

    const fecha = elegida.cols.fecha ? aFecha(fila[elegida.cols.fecha]) : null;
    if (!fecha) continue;

    const previa = ultima.get(nombre);
    // Más reciente gana. Y si empatan en fecha —un mismo embalse puede venir
    // repetido por el indicador de aprovechamiento eléctrico—, gana el de
    // mayor capacidad, que es el registro del embalse completo.
    if (
      !previa ||
      fecha > previa.fecha ||
      (fecha.getTime() === previa.fecha.getTime() && capacidadHm3 > previa.capacidadHm3)
    ) {
      ultima.set(nombre, { nombre, capacidadHm3, volumenHm3, fecha });
    }
  }

  return { filas: [...ultima.values()], radiografia };
}
