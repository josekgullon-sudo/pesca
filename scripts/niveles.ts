/**
 * Nivel de los embalses, del boletín hidrológico semanal.
 *
 *     npm run niveles -- --probar    enseña lo que haría, sin tocar nada
 *     npm run niveles                lo aplica
 *
 * ---------------------------------------------------------------------------
 * LÉEME ANTES DE EJECUTARLO CON DATOS DE VERDAD
 * ---------------------------------------------------------------------------
 *
 * Este script se escribió sin poder probarlo contra el boletín real: desde
 * donde se programó no había salida a internet. Eso significa que el formato
 * del fichero está tomado de su documentación, no comprobado con los ojos.
 *
 * Por eso **empieza siempre por `--probar`**. Ese modo descarga, empareja y
 * enseña una tabla con lo que ha encontrado, sin escribir una línea en la base
 * de datos. Si los porcentajes que salgan ahí no cuadran con la realidad, el
 * emparejamiento o el parseo están mal y hay que arreglarlos antes.
 *
 * Un porcentaje equivocado aquí no es un detalle: alguien puede conducir dos
 * horas hasta un embalse que cree al 80 % y encontrárselo al 20 %, con el agua
 * a trescientos metros de donde aparcó.
 *
 * ---------------------------------------------------------------------------
 *
 * Sobre el emparejamiento. El boletín no usa nuestros nombres: «Embalse José
 * Torán» allí es «JOSE TORAN» o «J. TORAN». La primera vez hay que revisar la
 * tabla de `--probar` y, cuando cuadre, se guarda el nombre oficial en
 * `nombreEnBoletin` para no volver a adivinarlo nunca más.
 */

import { prisma } from "../src/lib/prisma";
import { interpretarFecha, normalizar } from "../src/lib/niveles";

/**
 * De dónde salen los datos.
 *
 * El Ministerio publica el boletín hidrológico semanal, y con él un fichero de
 * datos por embalse. Es la fuente oficial y la que citan los demás.
 */
const FUENTE = {
  nombre: "Boletín Hidrológico Semanal (MITECO)",
  // El fichero de datos abiertos del boletín. Si cambia de sitio, es lo único
  // que hay que tocar aquí.
  url: "https://www.miteco.gob.es/content/dam/miteco/es/agua/temas/evaluacion-de-los-recursos-hidricos/boletin-hidrologico/Historico-de-embalses/BD-Embalses.zip",
};

type FilaBoletin = {
  nombre: string;
  capacidadHm3: number;
  volumenHm3: number;
  fecha: Date;
};

/**
 * Descarga y parsea el boletín.
 *
 * Aislado en su propia función a propósito: es la parte que no se ha podido
 * comprobar, así que es la que habrá que cambiar cuando se vea el fichero de
 * verdad. Todo lo demás —emparejar, enseñar, guardar— es independiente.
 */
async function descargarBoletin(): Promise<FilaBoletin[]> {
  const respuesta = await fetch(FUENTE.url, {
    signal: AbortSignal.timeout(60000),
    headers: { "User-Agent": "MapaDePesca/1.0 (https://mapadepesca.es)" },
  });
  if (!respuesta.ok) {
    throw new Error(
      `El boletín contestó ${respuesta.status}. Puede que hayan movido el ` +
        `fichero: comprueba la dirección en FUENTE.url.`,
    );
  }

  const texto = await respuesta.text();
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length < 2) throw new Error("El fichero vino vacío o ilegible.");

  // Se localizan las columnas por su cabecera y no por su posición: si el
  // ministerio mete una columna nueva en medio, esto sigue funcionando en vez
  // de empezar a leer capacidades en la casilla de las cotas.
  const separador = lineas[0].includes(";") ? ";" : ",";
  const cabecera = lineas[0].split(separador).map((c) => normalizar(c));

  const iDe = (...candidatos: string[]) => {
    for (const c of candidatos) {
      const i = cabecera.findIndex((x) => x.includes(c));
      if (i >= 0) return i;
    }
    return -1;
  };

  const iNombre = iDe("embalse nombre", "nombre");
  const iCap = iDe("capacidad total", "capacidad");
  const iVol = iDe("agua total", "volumen", "embalsada");
  const iFecha = iDe("fecha");

  if (iNombre < 0 || iCap < 0 || iVol < 0) {
    throw new Error(
      `No reconozco las columnas del fichero. Cabecera encontrada:\n  ` +
        lineas[0].slice(0, 300),
    );
  }

  const filas: FilaBoletin[] = [];
  for (const linea of lineas.slice(1)) {
    const c = linea.split(separador);
    const nombre = (c[iNombre] ?? "").trim();
    // Los decimales pueden venir con coma.
    const num = (v: string | undefined) =>
      Number((v ?? "").trim().replace(/\./g, "").replace(",", "."));

    const capacidadHm3 = num(c[iCap]);
    const volumenHm3 = num(c[iVol]);
    if (!nombre || !Number.isFinite(capacidadHm3) || !Number.isFinite(volumenHm3)) {
      continue;
    }
    if (capacidadHm3 <= 0) continue;

    const bruto = iFecha >= 0 ? (c[iFecha] ?? "").trim() : "";
    const fecha = bruto ? interpretarFecha(bruto) : new Date();

    filas.push({ nombre, capacidadHm3, volumenHm3, fecha });
  }

  return filas;
}

async function main() {
  const soloProbar = process.argv.includes("--probar");

  console.log(
    soloProbar
      ? "Modo prueba: no se va a escribir nada.\n"
      : "Aplicando los niveles. (Con --probar se ve antes lo que haría.)\n",
  );

  const sitios = await prisma.sitio.findMany({
    where: { tipo: "embalse" },
    select: { id: true, nombre: true, nombreEnBoletin: true, capacidadHm3: true },
    orderBy: { nombre: "asc" },
  });

  let boletin: FilaBoletin[];
  try {
    boletin = await descargarBoletin();
  } catch (e) {
    console.error("No se ha podido leer el boletín:\n ", (e as Error).message);
    console.error(
      "\nEsto es lo que hay que arreglar antes de nada. El script no ha " +
        "tocado la base de datos.",
    );
    process.exitCode = 1;
    return;
  }

  console.log(`El boletín trae ${boletin.length} embalses.\n`);

  const porNombre = new Map(boletin.map((f) => [normalizar(f.nombre), f]));

  const emparejados: { sitio: (typeof sitios)[number]; fila: FilaBoletin; pct: number }[] = [];
  const sinEmparejar: string[] = [];

  for (const s of sitios) {
    const clave = normalizar(s.nombreEnBoletin ?? s.nombre);
    const fila = porNombre.get(clave);
    if (!fila) {
      sinEmparejar.push(s.nombre);
      continue;
    }
    emparejados.push({
      sitio: s,
      fila,
      pct: (fila.volumenHm3 / fila.capacidadHm3) * 100,
    });
  }

  console.log("EMPAREJADOS");
  for (const e of emparejados) {
    console.log(
      `  ${e.sitio.nombre.padEnd(42)} ${e.fila.nombre.padEnd(28)} ` +
        `${e.pct.toFixed(1).padStart(6)}%  ` +
        `${Math.round(e.fila.volumenHm3)}/${Math.round(e.fila.capacidadHm3)} hm³  ` +
        `${e.fila.fecha.toISOString().slice(0, 10)}`,
    );
  }

  if (sinEmparejar.length) {
    console.log("\nSIN EMPAREJAR (se quedan sin nivel, que es lo correcto)");
    for (const n of sinEmparejar) console.log(`  ${n}`);
    console.log(
      "\n  Para arreglarlos, busca su nombre exacto en el boletín y guárdalo " +
        "en el campo `nombreEnBoletin` del sitio.",
    );
  }

  if (soloProbar) {
    console.log(
      "\nNo se ha escrito nada. Comprueba que esos porcentajes tienen sentido " +
        "y vuelve a lanzarlo sin --probar.",
    );
    return;
  }

  for (const e of emparejados) {
    await prisma.sitio.update({
      where: { id: e.sitio.id },
      data: {
        nivelHm3: e.fila.volumenHm3,
        nivelPorcentaje: e.pct,
        nivelFecha: e.fila.fecha,
        nivelFuente: FUENTE.nombre,
        // La capacidad oficial manda sobre la que tuviéramos: viene de la
        // misma fuente que el volumen, así que el porcentaje es coherente.
        capacidadHm3: e.fila.capacidadHm3,
        nombreEnBoletin: e.fila.nombre,
      },
    });
  }

  console.log(`\nActualizados ${emparejados.length} embalses.`);
}

main().finally(() => prisma.$disconnect());
