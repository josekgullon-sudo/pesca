import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { rutaEnDisco } from "@/lib/imagenes";

/**
 * Sirve las imágenes guardadas en `datos/`.
 *
 * Existe porque Next.js recorre `public/` al compilar y solo sirve los ficheros
 * que había entonces: una foto subida en producción daba 404 hasta el siguiente
 * build. Esta ruta las lee del disco en cada petición.
 *
 * Es pública, como el resto de la web: las fotos se ven en las fichas de sitio,
 * en las de especie y en el ranking sin necesidad de entrar. Lo que decide qué
 * puede indexar Google es robots.txt, no esta ruta.
 */

const TIPOS: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ ruta: string[] }> },
) {
  const { ruta } = await params;
  const fichero = rutaEnDisco(ruta);

  if (!fichero) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  try {
    const info = await stat(fichero);
    if (!info.isFile()) throw new Error("no es un fichero");

    const contenido = await readFile(fichero);
    const tipo = TIPOS[path.extname(fichero).toLowerCase()] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(contenido), {
      headers: {
        "Content-Type": tipo,
        "Content-Length": String(info.size),
        // El nombre del fichero es aleatorio y nunca se reescribe, así que se
        // puede cachear para siempre. `public` para que también cacheen el
        // proxy y cualquier CDN que se ponga delante: son los ficheros más
        // pesados de la web y los que más veces se piden.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("No encontrado", { status: 404 });
  }
}
