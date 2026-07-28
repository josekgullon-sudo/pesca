/**
 * Descarga fotos de Wikimedia Commons para las especies y para los sitios.
 *
 *     npm run fotos            solo lo que aún no tiene foto
 *     npm run fotos -- --todas vuelve a bajarlo todo
 *
 * Por qué un script y no imágenes metidas en el repositorio: las fotos de
 * Commons tienen autor y licencia, casi siempre Creative Commons con obligación
 * de atribuir. El script se trae la foto y también quién la hizo y bajo qué
 * licencia, lo guarda en la base de datos y la ficha lo pinta. Así las imágenes
 * son reales y están bien acreditadas.
 *
 * Necesita conexión a internet.
 */

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "../src/lib/prisma.ts";

const CARPETA = path.join(process.cwd(), "datos");
const AGENTE = "MapaDePesca/1.0 (https://mapadepesca.es)";

// --- Funciones puras, separadas para poder probarlas sin red ---------------

/** Los campos de Commons vienen con HTML dentro (enlaces al perfil del autor). */
export function limpiarHtml(texto) {
  if (!texto) return null;
  const limpio = texto
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return limpio || null;
}

/** De https://upload.wikimedia.org/.../Micropterus_salmoides.jpg saca el nombre. */
export function nombreDeFichero(url) {
  if (!url) return null;
  try {
    const partes = new URL(url).pathname.split("/").filter(Boolean);
    // Las miniaturas repiten el nombre del original en el penúltimo tramo.
    const indice = partes.indexOf("thumb");
    const bruto = indice === -1 ? partes.at(-1) : partes.at(-2);
    return bruto ? decodeURIComponent(bruto) : null;
  } catch {
    return null;
  }
}

/**
 * ¿Sirve esta imagen como foto?
 *
 * La imagen principal de un artículo de Wikipedia es la de la ficha, y en las
 * especies eso muchas veces es un mapa de distribución, un grabado antiguo o
 * un esquema en vez de una foto del bicho. Estas son las pistas que lo delatan.
 */
export function pareceFoto(nombreFichero) {
  if (!nombreFichero) return false;

  const n = nombreFichero.toLowerCase();

  // Los SVG nunca son fotos: son mapas, escudos o esquemas.
  if (!/\.(jpe?g|png|webp)$/.test(n)) return false;

  const sospechosas = [
    "map", "mapa", "range", "distribution", "distribucion", "distribución",
    "locator", "location", "localizacion", "localización", "ubicacion",
    "logo", "icon", "icono", "escudo", "bandera", "flag", "coat", "seal",
    "diagram", "diagrama", "chart", "graph", "grafico", "gráfico",
    "stamp", "sello", "drawing", "dibujo", "illustration", "ilustracion",
    "skeleton", "esqueleto", "anatomy", "anatomia", "scheme", "esquema",
    "wikispecies", "disambig", "question_book", "commons-",
  ];
  return !sospechosas.some((s) => n.includes(s));
}

/** Saca autor, licencia y página de origen de la respuesta de imageinfo. */
export function leerMetadatos(json) {
  const paginas = json?.query?.pages;
  if (!paginas) return null;

  const pagina = Object.values(paginas)[0];
  const info = pagina?.imageinfo?.[0];
  if (!info) return null;

  const extra = info.extmetadata ?? {};
  return {
    url: info.url ?? null,
    autor: limpiarHtml(extra.Artist?.value) ?? "Autor no indicado",
    licencia: limpiarHtml(extra.LicenseShortName?.value) ?? "Ver en Commons",
    fuente: info.descriptionurl ?? null,
  };
}

/** ¿Es una licencia que nos deja usar la foto atribuyendo? */
export function licenciaUsable(licencia) {
  if (!licencia) return false;
  const l = licencia.toLowerCase();
  if (l.includes("fair use") || l.includes("non-free")) return false;
  return (
    l.includes("cc") ||
    l.includes("public domain") ||
    l.includes("dominio público") ||
    l.includes("gfdl") ||
    l.includes("attribution")
  );
}

// --- Red -------------------------------------------------------------------

async function pedirJson(url) {
  const respuesta = await fetch(url, { headers: { "User-Agent": AGENTE } });
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  return respuesta.json();
}

/** Todas las imágenes de un artículo, no solo la de la ficha. */
async function imagenesDelArticulo(idioma, titulo) {
  const datos = await pedirJson(
    `https://${idioma}.wikipedia.org/w/api.php?action=query&format=json` +
      `&prop=images&imlimit=40&redirects=1&titles=${encodeURIComponent(titulo)}`,
  );
  const pagina = Object.values(datos?.query?.pages ?? {})[0];
  return (pagina?.images ?? []).map((i) =>
    i.title.replace(/^(File|Archivo|Imagen):/, ""),
  );
}

/**
 * Busca una foto probando varios términos y los dos idiomas. Primero la imagen
 * de la ficha del artículo; si esa no parece una foto, se recorre el resto de
 * imágenes del artículo hasta dar con una que sí lo parezca.
 */
async function buscarFoto(terminos) {
  const motivos = [];

  for (const termino of terminos.filter(Boolean)) {
    for (const idioma of ["es", "en"]) {
      try {
        const resumen = await pedirJson(
          `https://${idioma}.wikipedia.org/api/rest_v1/page/summary/` +
            encodeURIComponent(termino),
        );

        const principal =
          resumen?.originalimage?.source ?? resumen?.thumbnail?.source;
        const nombrePrincipal = nombreDeFichero(principal);

        if (principal && pareceFoto(nombrePrincipal)) {
          return { fichero: nombrePrincipal, motivos };
        }
        if (principal) {
          motivos.push(
            `${idioma}:${termino} descartada la principal ("${nombrePrincipal}")`,
          );
        }

        // La de la ficha no vale: buscamos entre el resto del artículo.
        const titulo = resumen?.titles?.canonical ?? termino;
        for (const fichero of await imagenesDelArticulo(idioma, titulo)) {
          if (pareceFoto(fichero)) return { fichero, motivos };
        }
        motivos.push(`${idioma}:${termino} sin ninguna foto utilizable`);
      } catch (error) {
        motivos.push(`${idioma}:${termino} ${error.message}`);
      }
    }
  }
  return { fichero: null, motivos };
}

async function buscarMetadatos(nombreFichero) {
  const datos = await pedirJson(
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
      "&prop=imageinfo&iiprop=extmetadata|url&titles=" +
      encodeURIComponent(`File:${nombreFichero}`),
  );
  return leerMetadatos(datos);
}

async function descargarYGuardar(url, carpeta, slug, ancho) {
  const respuesta = await fetch(url, { headers: { "User-Agent": AGENTE } });
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status} al descargar`);

  const original = Buffer.from(await respuesta.arrayBuffer());
  const procesada = await sharp(original)
    .rotate()
    .resize({ width: ancho, withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 82 })
    .toBuffer();

  const destino = path.join(CARPETA, carpeta);
  await mkdir(destino, { recursive: true });
  await writeFile(path.join(destino, `${slug}.webp`), procesada);

  return {
    ruta: `/media/${carpeta}/${slug}.webp`,
    kb: Math.round(procesada.length / 1024),
  };
}

/** Baja una foto y devuelve lo que hay que guardar en la base de datos. */
async function conseguirFoto(terminos, carpeta, slug, ancho) {
  const { fichero, motivos } = await buscarFoto(terminos);
  if (!fichero) throw new Error(motivos.join("; ") || "sin foto");

  const meta = await buscarMetadatos(fichero);
  if (meta && !licenciaUsable(meta.licencia)) {
    throw new Error(`licencia no usable (${meta.licencia})`);
  }
  if (!meta?.url) throw new Error("no se ha podido resolver la imagen");

  const { ruta, kb } = await descargarYGuardar(meta.url, carpeta, slug, ancho);
  return {
    kb,
    licencia: meta.licencia,
    datos: {
      imagenUrl: ruta,
      imagenAutor: meta.autor,
      imagenLicencia: meta.licencia,
      imagenFuente: meta.fuente,
    },
  };
}

// --- Programa --------------------------------------------------------------

const fallos = [];

async function procesar(etiqueta, terminos, carpeta, slug, ancho, guardar) {
  try {
    const { kb, licencia, datos } = await conseguirFoto(
      terminos,
      carpeta,
      slug,
      ancho,
    );
    await guardar(datos);
    console.log(`  ✓ ${etiqueta} — ${kb} KB — ${licencia}`);
    return true;
  } catch (error) {
    fallos.push({ etiqueta, motivo: error.message });
    console.log(`  ✗ ${etiqueta} — ${error.message}`);
    return false;
  }
}

async function main() {
  const todas = process.argv.includes("--todas");
  const filtro = todas ? {} : { imagenUrl: null };

  const especies = await prisma.especie.findMany({
    where: filtro,
    orderBy: { nombreComun: "asc" },
    select: { id: true, slug: true, nombreComun: true, nombreCientifico: true },
  });

  const sitios = await prisma.sitio.findMany({
    where: filtro,
    orderBy: { nombre: "asc" },
    select: { id: true, slug: true, nombre: true, municipio: true },
  });

  if (especies.length === 0 && sitios.length === 0) {
    console.log("Todo tiene ya su foto. Usa --todas para rehacerlas.");
    return;
  }

  let bien = 0;

  if (especies.length > 0) {
    console.log(`\nEspecies (${especies.length}):`);
    for (const e of especies) {
      const ok = await procesar(
        `${e.nombreComun} (${e.nombreCientifico})`,
        [e.nombreCientifico, e.nombreComun],
        "especies",
        e.slug,
        900,
        (datos) => prisma.especie.update({ where: { id: e.id }, data: datos }),
      );
      if (ok) bien++;
    }
  }

  if (sitios.length > 0) {
    console.log(`\nSitios (${sitios.length}):`);
    for (const s of sitios) {
      // Los ríos traen el tramo pegado ("Río Viar — de Melonares a Cantillana")
      // y en Wikipedia el artículo se llama solo "Río Viar".
      const base = s.nombre.split("—")[0].trim();
      const municipio = s.municipio.split("/")[0].trim();
      const ok = await procesar(
        s.nombre,
        [s.nombre, base, `${base} (${municipio})`],
        "sitios",
        s.slug,
        1400,
        (datos) => prisma.sitio.update({ where: { id: s.id }, data: datos }),
      );
      if (ok) bien++;
    }
  }

  const total = especies.length + sitios.length;
  console.log(`\n${bien} de ${total} con foto.`);

  if (fallos.length > 0) {
    console.log(
      "\nLo que ha fallado se queda con la ilustración de color, que sigue\n" +
        "funcionando. Puedes reintentarlo con: npm run fotos",
    );

    const sinRed = fallos.some((f) =>
      /fetch failed|ENOTFOUND|ETIMEDOUT|ECONNREFUSED|HTTP 4\d\d/.test(f.motivo),
    );
    if (sinRed) {
      console.log(
        "\nParece un problema de conexión, no de que falten fotos.\n" +
          "Comprueba que tienes internet y que nada bloquea wikipedia.org.",
      );
    }
  }
}

// Cuando se importa desde un test no se ejecuta el programa. Se compara el
// nombre exacto del fichero, no una subcadena: con `includes` bastaba con que
// el test se llamara "t-fotos.mjs" para que el programa arrancara solo.
if (path.basename(process.argv[1] ?? "") === "fotos.mjs") {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
