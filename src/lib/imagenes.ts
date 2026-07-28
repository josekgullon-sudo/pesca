import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Guardado de imágenes en el sistema de ficheros local.
 *
 * Las fotos llegan del móvil, que hoy dispara a 12 megapíxeles: un JPEG de
 * 4 o 5 MB por captura. Se redimensionan a 1600 px de ancho como máximo y se
 * pasan a WebP, con lo que un archivo típico se queda en 150-250 KB. Con dos
 * usuarios y unas cuantas capturas por salida eso es la diferencia entre
 * llenar el disco del VPS en un año o no llenarlo nunca.
 *
 * IMPORTANTE: las imágenes NO van en `public/`. Next.js recorre esa carpeta
 * al compilar y solo sirve los ficheros que existían entonces, así que una
 * foto subida en producción daba 404 hasta el siguiente build. Se guardan en
 * `datos/` y las sirve la ruta /media, que las lee del disco en cada petición.
 * De paso, `datos/` es un único directorio que copiar o montar como volumen
 * en el VPS, separado del código.
 */

const ANCHO_MAXIMO = 1600;
const CALIDAD_WEBP = 82;

/** Formatos que aceptamos. Cualquier otra cosa se rechaza sin tocar el disco. */
const TIPOS_ACEPTADOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
]);

/** Tope antes de procesar. Un móvil no manda 25 MB en una foto normal. */
const TAMANO_MAXIMO_BYTES = 25 * 1024 * 1024;

export class ErrorImagen extends Error {}

export type CarpetaImagen = "uploads" | "especies" | "sitios";

export const RAIZ_DATOS = path.join(process.cwd(), "datos");

/** Prefijo público de las imágenes. Lo sirve src/app/media/[...ruta]/route.ts */
export const PREFIJO_MEDIA = "/media";

/**
 * Resuelve una ruta pública (/media/uploads/x.webp) a un fichero dentro de
 * `datos/`, o devuelve null si se sale de ahí. Es la única puerta de entrada:
 * si esto es correcto, no hay forma de leer un fichero de fuera.
 */
export function rutaEnDisco(partes: string[]): string | null {
  if (partes.length !== 2) return null;

  const [carpeta, nombre] = partes;
  if (!["uploads", "especies", "sitios"].includes(carpeta)) return null;
  if (!/^[\w-]+\.(webp|jpg|jpeg|png)$/.test(nombre)) return null;

  const destino = path.join(RAIZ_DATOS, carpeta, nombre);

  // Cinturón y tirantes: aunque el regex ya impide "..", comprobamos que el
  // resultado sigue colgando de datos/.
  const raiz = path.resolve(RAIZ_DATOS) + path.sep;
  if (!path.resolve(destino).startsWith(raiz)) return null;

  return destino;
}

/**
 * Procesa una imagen y la deja en `datos/<carpeta>/`. Devuelve la ruta pública
 * (la que va a la base de datos y al atributo src).
 */
export async function guardarImagen(
  archivo: File,
  carpeta: CarpetaImagen = "uploads",
): Promise<string> {
  if (archivo.size === 0) throw new ErrorImagen("El archivo está vacío.");
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    throw new ErrorImagen("La imagen pesa más de 25 MB.");
  }
  if (archivo.type && !TIPOS_ACEPTADOS.has(archivo.type)) {
    throw new ErrorImagen(`Formato no admitido: ${archivo.type}`);
  }

  const entrada = Buffer.from(await archivo.arrayBuffer());

  let salida: Buffer;
  try {
    salida = await sharp(entrada)
      // `rotate()` sin argumentos aplica la orientación EXIF. Sin esto, las
      // fotos hechas en vertical con el móvil salen tumbadas.
      .rotate()
      .resize({
        width: ANCHO_MAXIMO,
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: CALIDAD_WEBP })
      .toBuffer();
  } catch {
    throw new ErrorImagen("No se ha podido leer la imagen.");
  }

  // Nombre aleatorio: el que traiga el móvil no es de fiar y además así dos
  // fotos con el mismo nombre no se pisan.
  const nombre = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.webp`;
  const destino = path.join(RAIZ_DATOS, carpeta);

  await mkdir(destino, { recursive: true });
  await writeFile(path.join(destino, nombre), salida);

  return `${PREFIJO_MEDIA}/${carpeta}/${nombre}`;
}

/**
 * Borra una imagen guardada. No lanza si ya no está: al borrar una captura no
 * queremos que falle todo porque el fichero se perdiera por otro lado.
 */
export async function borrarImagen(rutaPublica: string): Promise<void> {
  const partes = rutaPublica.replace(`${PREFIJO_MEDIA}/`, "").split("/");
  const destino = rutaEnDisco(partes);
  if (!destino) return;

  try {
    await unlink(destino);
  } catch {
    // Da igual: si no está, el objetivo ya se cumplió.
  }
}
