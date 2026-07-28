"use server";

import { revalidatePath } from "next/cache";
import { usuarioActual } from "@/lib/auth";
import { borrarImagen, ErrorImagen, guardarImagen } from "@/lib/imagenes";
import { prisma } from "@/lib/prisma";

/**
 * Subida de fotos de especies y de sitios desde la propia web.
 *
 * El script `npm run fotos` baja lo que hay en Wikimedia Commons, que sirve
 * para arrancar pero no siempre acierta: para algunas especies la única imagen
 * libre es un dibujo o un ejemplar en una bandeja. Esto permite reemplazarlas
 * una a una sin tocar el servidor ni volver a desplegar.
 *
 * Solo para administradores. Es la única parte de la web que escribe en el
 * contenido de la guía, así que el rol se comprueba aquí dentro y no solo
 * escondiendo el formulario: quien conozca la dirección de la acción puede
 * llamarla igual.
 */

export type EstadoSubida = { error: string } | { ok: string } | null;

function texto(fd: FormData, campo: string): string {
  return String(fd.get(campo) ?? "").trim();
}

async function exigirAdmin() {
  const usuario = await usuarioActual();
  if (!usuario.esAdmin) throw new Error("Solo un administrador puede hacer esto.");
  return usuario;
}

export async function subirFoto(
  _previo: EstadoSubida,
  fd: FormData,
): Promise<EstadoSubida> {
  try {
    await exigirAdmin();
  } catch {
    return { error: "Solo un administrador puede cambiar las fotos." };
  }

  const tipo = texto(fd, "tipo"); // "especie" | "sitio"
  const slug = texto(fd, "slug");
  const archivo = fd.get("foto");

  if (tipo !== "especie" && tipo !== "sitio") {
    return { error: "No sé si eso es una especie o un sitio." };
  }
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Elige una imagen." };
  }

  // La atribución es opcional pero se pide: si la foto tiene dueño y no se
  // apunta aquí, dentro de un mes ya nadie sabe de dónde salió.
  const autor = texto(fd, "autor");
  const licencia = texto(fd, "licencia");
  const fuente = texto(fd, "fuente");

  const anterior =
    tipo === "especie"
      ? await prisma.especie.findUnique({ where: { slug }, select: { imagenUrl: true } })
      : await prisma.sitio.findUnique({ where: { slug }, select: { imagenUrl: true } });

  if (!anterior) return { error: "No existe eso que quieres cambiar." };

  let url: string;
  try {
    url = await guardarImagen(archivo, tipo === "especie" ? "especies" : "sitios");
  } catch (e) {
    return {
      error: e instanceof ErrorImagen ? e.message : "No se ha podido guardar la imagen.",
    };
  }

  const datos = {
    imagenUrl: url,
    imagenAutor: autor || null,
    imagenLicencia: licencia || null,
    imagenFuente: fuente || null,
  };

  try {
    if (tipo === "especie") {
      await prisma.especie.update({ where: { slug }, data: datos });
    } else {
      await prisma.sitio.update({ where: { slug }, data: datos });
    }
  } catch {
    // Si la base de datos falla, el fichero recién escrito sobra.
    await borrarImagen(url);
    return { error: "No se ha podido guardar. La imagen no se ha cambiado." };
  }

  // La anterior se borra del disco: si no, cada cambio deja un fichero muerto
  // ocupando sitio para siempre.
  if (anterior.imagenUrl && anterior.imagenUrl !== url) {
    await borrarImagen(anterior.imagenUrl);
  }

  revalidatePath("/", "layout");
  return { ok: "Foto cambiada." };
}
