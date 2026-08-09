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
import { interpretarFecha } from "./niveles";

export type FilaEmbalse = {
  nombre: string;
  capacidadHm3: number;
  volumenHm3: number;
  fecha: Date;
};

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
  let elegida: { nombre: string; cols: Record<string, string> } | null = null;

  for (const t of radiografia.tablas) {
    const nombre = buscarColumna(t.columnas, "embalse_nombre", "nombre_embalse", "embalse", "nombre");
    const capacidad = buscarColumna(t.columnas, "capacidad_total", "capacidad");
    const volumen = buscarColumna(t.columnas, "agua_total", "volumen", "embalsada", "agua");
    const fecha = buscarColumna(t.columnas, "fecha");

    if (nombre && capacidad && volumen) {
      elegida = { nombre: t.nombre, cols: { nombre, capacidad, volumen, ...(fecha ? { fecha } : {}) } };
      break;
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
  const columnas = Object.values(elegida.cols);
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
    if (!previa || fecha > previa.fecha) {
      ultima.set(nombre, { nombre, capacidadHm3, volumenHm3, fecha });
    }
  }

  return { filas: [...ultima.values()], radiografia };
}
