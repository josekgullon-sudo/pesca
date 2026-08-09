/**
 * Nivel de los embalses.
 *
 *     npm run niveles -- --descubrir   prueba fuentes y dice cuál sirve
 *     npm run niveles -- --probar      empareja y enseña la tabla, sin escribir
 *     npm run niveles                  lo aplica
 *
 * También:
 *     npm run niveles -- --probar --url=https://…      otra dirección
 *     npm run niveles -- --probar --fichero=datos.csv  un fichero de disco
 *
 * ---------------------------------------------------------------------------
 *
 * Este script se escribió sin poder salir a internet, así que la dirección de
 * la fuente iba a ciegas. El primer intento apuntaba a `BD-Embalses.zip` del
 * Ministerio, que resultó ser un ZIP con una base de datos de Access dentro:
 * imposible de leer sin herramientas aparte.
 *
 * De ahí salieron dos cosas que ahora tiene el script. `--descubrir`, que
 * prueba varias fuentes y dice de cada una qué es lo que devuelve. Y que la
 * dirección se pueda pasar por parámetro, para no tener que tocar el código
 * cada vez que se prueba una.
 *
 * Y sigue en pie lo de siempre: **empieza por `--probar`**. Un porcentaje
 * equivocado manda a alguien a conducir dos horas hasta un embalse que cree
 * lleno y se lo encuentra al 20 %, con el agua a trescientos metros de donde
 * aparcó.
 */

import { readFile } from "node:fs/promises";
import { prisma } from "../src/lib/prisma";
import {
  crearBuscador,
  interpretarFecha,
  normalizar,
  type FilaBoletin,
} from "../src/lib/niveles";
import { reconocer } from "../src/lib/formato-descarga";
import { leerBoletin } from "../src/lib/boletin-embalses";

/**
 * Fuentes candidatas, de más a menos preferible.
 *
 * Ninguna está confirmada: son las que hay que probar con `--descubrir` desde
 * una máquina con internet. La que salga como CSV o JSON es la buena, y se
 * pasa luego con `--url=`.
 */
const OFICIAL =
  "https://www.miteco.gob.es/content/dam/miteco/es/agua/temas/evaluacion-de-los-recursos-hidricos/boletin-hidrologico/Historico-de-embalses/BD-Embalses.zip";

const CANDIDATAS = [
  {
    nombre: "datos.gob.es — estado de los embalses",
    url: "https://datos.gob.es/es/catalogo/e00125301-estado-de-los-embalses-y-pantanos.csv",
  },
  {
    nombre: "MITECO — boletín hidrológico, embalses en CSV",
    url: "https://www.miteco.gob.es/content/dam/miteco/es/agua/temas/evaluacion-de-los-recursos-hidricos/boletin-hidrologico/embalses.csv",
  },
  {
    nombre: "CH Guadalquivir — SAIH, embalses",
    url: "https://www.chguadalquivir.es/saih/datos/embalses.csv",
  },
  {
    nombre: "MITECO — el ZIP que ya sabemos que trae Access",
    url: "https://www.miteco.gob.es/content/dam/miteco/es/agua/temas/evaluacion-de-los-recursos-hidricos/boletin-hidrologico/Historico-de-embalses/BD-Embalses.zip",
  },
];

const FUENTE_NOMBRE = "Boletín Hidrológico Semanal (MITECO)";

async function bajar(url: string): Promise<Uint8Array> {
  const respuesta = await fetch(url, {
    signal: AbortSignal.timeout(60000),
    headers: { "User-Agent": "MapaDePesca/1.0 (https://mapadepesca.es)" },
  });
  if (!respuesta.ok) throw new Error(`contestó ${respuesta.status}`);
  return new Uint8Array(await respuesta.arrayBuffer());
}

/**
 * Prueba las candidatas y cuenta qué devuelve cada una.
 *
 * Se ejecuta desde el servidor, que sí tiene internet, y su salida es
 * suficiente para saber cuál sirve sin tener que abrir ninguna a mano.
 */
async function descubrir() {
  console.log("Probando fuentes. No se escribe nada.\n");

  for (const c of CANDIDATAS) {
    process.stdout.write(`${c.nombre}\n  ${c.url}\n  `);
    try {
      const datos = await bajar(c.url);
      const d = reconocer(datos);
      console.log(`${(datos.length / 1024).toFixed(0)} KB · ${d.formato.toUpperCase()}`);
      console.log(`  ${d.explicacion}`);
      for (const p of d.pistas) console.log(`  · ${p}`);
    } catch (e) {
      console.log(`no se ha podido: ${(e as Error).message}`);
    }
    console.log();
  }

  console.log(
    "Pásame esta salida entera. Con ella sé qué fuente sirve y termino el\n" +
      "parseo con el formato real delante.",
  );
}

/** Lee CSV o JSON. Si es otra cosa, lo dice con claridad y no adivina. */
function interpretar(datos: Uint8Array): FilaBoletin[] {
  const d = reconocer(datos);

  if (d.formato === "zip") {
    const { filas, radiografia, problema } = leerBoletin(datos);
    if (problema) {
      console.error(`\n${problema}\n`);
      for (const t of radiografia.tablas) {
        console.error(`  Tabla «${t.nombre}» (${t.filas} filas)`);
        console.error(`    ${t.columnas.join(", ")}`);
      }
      throw new Error("no he sabido encontrar los datos dentro de la base.");
    }
    console.log(
      `Leído de la tabla «${radiografia.tablaElegida}» de la base de Access.`,
    );
    return filas;
  }

  if (d.formato !== "csv" && d.formato !== "json") {
    const detalle = d.pistas.length ? `\n  ${d.pistas.join("\n  ")}` : "";
    throw new Error(
      `lo que hay en esa dirección es ${d.formato.toUpperCase()}, no datos ` +
        `que pueda leer.\n  ${d.explicacion}${detalle}\n\n` +
        `  Prueba con: npm run niveles -- --descubrir`,
    );
  }

  const texto = new TextDecoder("utf-8").decode(datos);

  if (d.formato === "json") {
    const crudo: unknown = JSON.parse(texto);
    const lista = Array.isArray(crudo)
      ? crudo
      : ((crudo as Record<string, unknown>).embalses ?? []);
    return (lista as Record<string, unknown>[])
      .map((o) => ({
        nombre: String(o.nombre ?? o.embalse ?? ""),
        capacidadHm3: Number(o.capacidad ?? o.capacidadHm3 ?? 0),
        volumenHm3: Number(o.volumen ?? o.agua ?? o.embalsada ?? 0),
        fecha: interpretarFecha(String(o.fecha ?? "")),
      }))
      .filter((f) => f.nombre && f.capacidadHm3 > 0);
  }

  const lineas = texto.split(/\r?\n/).filter((l) => l.trim());
  const separador = (lineas[0].match(/;/g) ?? []).length >= 2 ? ";" : ",";
  const cabecera = lineas[0].split(separador).map((c) => normalizar(c));

  const iDe = (...candidatos: string[]) => {
    for (const c of candidatos) {
      const i = cabecera.findIndex((x) => x.includes(c));
      if (i >= 0) return i;
    }
    return -1;
  };

  const iNombre = iDe("embalse nombre", "nombre embalse", "nombre");
  const iCap = iDe("capacidad total", "capacidad");
  const iVol = iDe("agua total", "volumen", "embalsada", "actual");
  const iFecha = iDe("fecha");

  if (iNombre < 0 || iCap < 0 || iVol < 0) {
    throw new Error(
      `es un CSV pero no reconozco sus columnas.\n  Cabecera: ${lineas[0].slice(0, 300)}`,
    );
  }

  const num = (v: string | undefined) =>
    Number((v ?? "").trim().replace(/\./g, "").replace(",", "."));

  const filas: FilaBoletin[] = [];
  for (const linea of lineas.slice(1)) {
    const c = linea.split(separador);
    const nombre = (c[iNombre] ?? "").trim();
    const capacidadHm3 = num(c[iCap]);
    const volumenHm3 = num(c[iVol]);
    if (!nombre || !(capacidadHm3 > 0) || !Number.isFinite(volumenHm3)) continue;
    filas.push({
      nombre,
      capacidadHm3,
      volumenHm3,
      fecha: iFecha >= 0 ? interpretarFecha((c[iFecha] ?? "").trim()) : new Date(),
    });
  }
  return filas;
}

async function main() {
  const args = process.argv.slice(2);
  // Se imprime antes que nada. Si no sale ni esta línea, el problema está en
  // los imports o el proceso ni llegó a ejecutarse.
  console.log(
    `niveles.ts · versión ${process.env.VERSION_APP ?? "desconocida"} · Node ${process.version}`,
  );

  if (args.includes("--descubrir")) {
    await descubrir();
    return;
  }

  const soloProbar = args.includes("--probar");
  const url = args.find((a) => a.startsWith("--url="))?.slice(6);
  const fichero = args.find((a) => a.startsWith("--fichero="))?.slice(10);

  console.log(
    soloProbar
      ? "Modo prueba: no se va a escribir nada.\n"
      : "Aplicando los niveles.\n",
  );

  let filas: FilaBoletin[];
  try {
    const origen = fichero ?? url ?? OFICIAL;
    console.log(`Descargando ${origen}`);
    const datos = fichero
      ? new Uint8Array(await readFile(fichero))
      : await bajar(url ?? OFICIAL);
    console.log(`Descargados ${(datos.length / 1048576).toFixed(1)} MB. Abriendo...`);
    filas = interpretar(datos);
  } catch (e) {
    console.error(`No se ha podido leer la fuente: ${(e as Error).message}`);
    console.error("\nLa base de datos no se ha tocado.");
    process.exitCode = 1;
    return;
  }

  console.log(`La fuente trae ${filas.length} embalses.\n`);

  const sitios = await prisma.sitio.findMany({
    where: { tipo: "embalse" },
    select: { id: true, nombre: true, nombreEnBoletin: true },
    orderBy: { nombre: "asc" },
  });

  const { buscar, parecidosA } = crearBuscador(filas);

  const emparejados: { id: string; nombre: string; fila: FilaBoletin; pct: number }[] = [];
  const sinEmparejar: { nombre: string; parecidos: string[] }[] = [];

  for (const s of sitios) {
    const fila = buscar(s.nombreEnBoletin ?? s.nombre);
    if (!fila) {
      sinEmparejar.push({ nombre: s.nombre, parecidos: parecidosA(s.nombre) });
      continue;
    }
    emparejados.push({
      id: s.id,
      nombre: s.nombre,
      fila,
      pct: (fila.volumenHm3 / fila.capacidadHm3) * 100,
    });
  }

  console.log("EMPAREJADOS");
  for (const e of emparejados) {
    console.log(
      `  ${e.nombre.padEnd(40)} ${e.fila.nombre.padEnd(26)} ` +
        `${e.pct.toFixed(1).padStart(6)}%  ` +
        `${Math.round(e.fila.volumenHm3)}/${Math.round(e.fila.capacidadHm3)} hm³  ` +
        `${e.fila.fecha.toISOString().slice(0, 10)}`,
    );
  }

  if (sinEmparejar.length) {
    console.log("\nSIN EMPAREJAR (se quedan sin nivel, que es lo correcto)");
    for (const n of sinEmparejar) {
      console.log(`  ${n.nombre}`);
      if (n.parecidos.length) {
        console.log(`      parecidos en el boletín: ${n.parecidos.join(", ")}`);
      } else {
        console.log(`      no hay nada parecido: probablemente no viene`);
      }
    }
    console.log(
      "\n  Para arreglarlos, pon el nombre exacto del boletín en el campo\n" +
        "  `nombreEnBoletin` del sitio. Con «A + B» se suman varios.",
    );
  }

  if (soloProbar) {
    console.log("\nNo se ha escrito nada. Si esos porcentajes cuadran, quita --probar.");
    return;
  }

  for (const e of emparejados) {
    await prisma.sitio.update({
      where: { id: e.id },
      data: {
        nivelHm3: e.fila.volumenHm3,
        nivelPorcentaje: e.pct,
        nivelFecha: e.fila.fecha,
        nivelFuente: FUENTE_NOMBRE,
        capacidadHm3: e.fila.capacidadHm3,
        nombreEnBoletin: e.fila.nombre,
      },
    });
  }

  console.log(`\nActualizados ${emparejados.length} embalses.`);
}

/**
 * El `.catch` no estaba, y por eso un fallo aquí dentro dejaba el script
 * terminando sin imprimir absolutamente nada: la peor forma de fallar que
 * hay, porque no se distingue de haber ido bien.
 *
 * El aviso de memoria es por lo que hace este script en concreto: descarga
 * diez megas comprimidos, los descomprime y carga una base de Access entera
 * con años de histórico. En un VPS pequeño eso se puede llevar por delante el
 * proceso, y a un proceso matado por falta de memoria no le da tiempo a
 * quejarse: se va con SIGKILL y sin una línea.
 */
main()
  .catch((e) => {
    console.error("\nHa fallado:", e instanceof Error ? e.message : e);
    if (e instanceof Error && e.stack) console.error(e.stack);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

process.on("exit", (codigo) => {
  if (codigo === 0) return;
  console.error(
    `\nSalida ${codigo}. Si además no ha salido ningún mensaje de error, lo ` +
      `más probable es que\nse haya quedado sin memoria al abrir la base. ` +
      `Compruébalo con:\n  dmesg | tail -20 | grep -i -E "killed|oom"`,
  );
});
