/**
 * Descarga una foto para cada especie desde Wikimedia Commons.
 *
 *     npm run fotos            solo las especies que aún no tienen foto
 *     npm run fotos -- --todas vuelve a bajar todas
 *
 * Por qué un script y no imágenes metidas en el repo: las fotos de Commons
 * tienen autor y licencia, casi siempre Creative Commons con obligación de
 * atribuir. El script se trae la foto y también quién la hizo y bajo qué
 * licencia, lo guarda en la base de datos y la ficha lo pinta. Así las
 * imágenes son reales y están bien acreditadas.
 *
 * Necesita conexión a internet.
 */

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "../src/lib/prisma.ts";

const ANCHO = 900;
const CARPETA = path.join(process.cwd(), "datos", "especies");
const AGENTE = "PescaSevilla/1.0 (app privada de dos usuarios)";

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
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status} en ${url}`);
  return respuesta.json();
}

/** Imagen principal del artículo de Wikipedia de ese nombre científico. */
async function buscarImagen(nombreCientifico) {
  for (const idioma of ["es", "en"]) {
    try {
      const datos = await pedirJson(
        `https://${idioma}.wikipedia.org/api/rest_v1/page/summary/` +
          encodeURIComponent(nombreCientifico),
      );
      const url = datos?.originalimage?.source ?? datos?.thumbnail?.source;
      if (url) return url;
    } catch {
      // Probamos con el siguiente idioma.
    }
  }
  return null;
}

async function buscarMetadatos(nombreFichero) {
  const datos = await pedirJson(
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
      "&prop=imageinfo&iiprop=extmetadata|url&titles=" +
      encodeURIComponent(`File:${nombreFichero}`),
  );
  return leerMetadatos(datos);
}

async function descargarYGuardar(url, slug) {
  const respuesta = await fetch(url, { headers: { "User-Agent": AGENTE } });
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status} al descargar`);

  const original = Buffer.from(await respuesta.arrayBuffer());
  const procesada = await sharp(original)
    .rotate()
    .resize({ width: ANCHO, withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 82 })
    .toBuffer();

  await mkdir(CARPETA, { recursive: true });
  await writeFile(path.join(CARPETA, `${slug}.webp`), procesada);

  return { ruta: `/media/especies/${slug}.webp`, kb: Math.round(procesada.length / 1024) };
}

// --- Programa --------------------------------------------------------------

async function main() {
  const todas = process.argv.includes("--todas");

  const especies = await prisma.especie.findMany({
    where: todas ? {} : { imagenUrl: null },
    orderBy: { nombreComun: "asc" },
    select: { id: true, slug: true, nombreComun: true, nombreCientifico: true },
  });

  if (especies.length === 0) {
    console.log("Todas las especies tienen ya su foto. Usa --todas para rehacerlas.");
    return;
  }

  console.log(`Buscando fotos para ${especies.length} especies...\n`);
  let bien = 0;
  const fallos = [];

  for (const especie of especies) {
    const etiqueta = `${especie.nombreComun} (${especie.nombreCientifico})`;
    try {
      const urlImagen = await buscarImagen(especie.nombreCientifico);
      if (!urlImagen) throw new Error("sin imagen en Wikipedia");

      const fichero = nombreDeFichero(urlImagen);
      const meta = fichero ? await buscarMetadatos(fichero) : null;

      if (meta && !licenciaUsable(meta.licencia)) {
        throw new Error(`licencia no usable (${meta.licencia})`);
      }

      // Preferimos el original a la miniatura del resumen.
      const { ruta, kb } = await descargarYGuardar(
        meta?.url ?? urlImagen,
        especie.slug,
      );

      await prisma.especie.update({
        where: { id: especie.id },
        data: {
          imagenUrl: ruta,
          imagenAutor: meta?.autor ?? null,
          imagenLicencia: meta?.licencia ?? null,
          imagenFuente: meta?.fuente ?? null,
        },
      });

      bien++;
      console.log(`  ✓ ${etiqueta} — ${kb} KB — ${meta?.licencia ?? "?"}`);
    } catch (error) {
      fallos.push({ etiqueta, motivo: error.message });
      console.log(`  ✗ ${etiqueta} — ${error.message}`);
    }
  }

  console.log(`\n${bien} de ${especies.length} con foto.`);

  if (fallos.length > 0) {
    console.log(
      "\nLas que han fallado se quedan con la silueta de color, que sigue\n" +
        "funcionando. Puedes reintentar más tarde o subir una foto propia.",
    );
  }
}

// Cuando se importa desde un test no se ejecuta el programa.
if (process.argv[1]?.includes("fotos-especies")) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
