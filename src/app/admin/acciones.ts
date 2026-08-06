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

// ---------------------------------------------------------------------------
// Artículos del blog
// ---------------------------------------------------------------------------

export type EstadoArticulo = { error: string } | { ok: string; slug: string } | null;

/** Convierte un título en algo que sirva de URL. */
function aSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/**
 * Crea o actualiza un artículo.
 *
 * El slug se calcula del título la primera vez y **no se vuelve a tocar** al
 * editar: cambiarlo rompería el enlace que ya esté indexado o compartido, y
 * dejaría un 404 donde había contenido.
 */
export async function guardarArticulo(
  _previo: EstadoArticulo,
  fd: FormData,
): Promise<EstadoArticulo> {
  try {
    await exigirAdmin();
  } catch {
    return { error: "Solo un administrador puede escribir artículos." };
  }

  const slugExistente = texto(fd, "slug");
  const titulo = texto(fd, "titulo");
  const entradilla = texto(fd, "entradilla");
  const contenido = texto(fd, "contenido");
  const provinciaId = texto(fd, "provinciaId");
  const publicada = fd.get("publicada") === "si";

  if (titulo.length < 5) return { error: "El título es demasiado corto." };
  if (entradilla.length < 20) {
    return { error: "La entradilla es lo que sale en Google: escribe al menos una frase." };
  }
  if (contenido.length < 100) return { error: "El artículo es demasiado corto." };

  const datos = {
    titulo,
    entradilla,
    contenido,
    publicada,
    provinciaId: provinciaId || null,
  };

  try {
    if (slugExistente) {
      const antes = await prisma.articulo.findUnique({
        where: { slug: slugExistente },
        select: { publicadaEl: true },
      });
      await prisma.articulo.update({
        where: { slug: slugExistente },
        data: {
          ...datos,
          // La fecha se pone la primera vez que se publica y ya no se mueve.
          publicadaEl: antes?.publicadaEl ?? (publicada ? new Date() : null),
        },
      });
      revalidatePath("/blog");
      revalidatePath(`/blog/${slugExistente}`);
      return { ok: "Guardado.", slug: slugExistente };
    }

    const slug = aSlug(titulo);
    if (!slug) return { error: "Del título no sale una dirección válida." };
    if (await prisma.articulo.findUnique({ where: { slug }, select: { id: true } })) {
      return { error: `Ya hay un artículo en /blog/${slug}. Cambia el título.` };
    }

    await prisma.articulo.create({
      data: { slug, ...datos, publicadaEl: publicada ? new Date() : null },
    });
    revalidatePath("/blog");
    return { ok: "Artículo creado.", slug };
  } catch {
    return { error: "No se ha podido guardar." };
  }
}

/** Publica o retira un artículo sin abrirlo. */
export async function alternarPublicacion(fd: FormData): Promise<void> {
  await exigirAdmin();
  const slug = texto(fd, "slug");
  const a = await prisma.articulo.findUnique({
    where: { slug },
    select: { publicada: true, publicadaEl: true },
  });
  if (!a) return;

  await prisma.articulo.update({
    where: { slug },
    data: {
      publicada: !a.publicada,
      publicadaEl: a.publicadaEl ?? (!a.publicada ? new Date() : null),
    },
  });
  revalidatePath("/blog");
  revalidatePath("/admin/articulos");
}

// ---------------------------------------------------------------------------
// Provincias
// ---------------------------------------------------------------------------

export type EstadoProvincia = { error: string } | { ok: string } | null;

/**
 * Textos legales y descripción de una provincia.
 *
 * Publicar una provincia sin su listado de áreas delimitadas para especies
 * invasoras es peligroso: ese dato decide si un black bass se devuelve al agua
 * o hay obligación de sacrificarlo. Por eso no se deja marcar «publicada» si
 * ese campo está vacío.
 */
export async function guardarProvincia(
  _previo: EstadoProvincia,
  fd: FormData,
): Promise<EstadoProvincia> {
  try {
    await exigirAdmin();
  } catch {
    return { error: "Solo un administrador puede tocar esto." };
  }

  const slug = texto(fd, "slug");
  const areasDelimitadasEEI = texto(fd, "areasDelimitadasEEI");
  const publicada = fd.get("publicada") === "si";
  // Publicar reconociendo que no tenemos el listado. Ver más abajo.
  const conAviso = fd.get("publicarConAviso") === "si";

  const sitios = await prisma.sitio.count({ where: { provincia: { slug } } });
  if (publicada && sitios === 0) {
    return {
      error:
        "Esta provincia no tiene ningún sitio cargado. Publicarla dejaría una " +
        "página vacía, que es lo que Google penaliza como página puente.",
    };
  }

  // Falta el listado de áreas delimitadas, o falta comprobar sitios contra él.
  //
  // Publicar así es una decisión que se puede tomar: el resto de la guía
  // —dónde está cada embalse, cómo se llega, qué hay— vale exactamente igual.
  // Lo que no se puede es publicarla en silencio, porque entonces el visitante
  // lee la ausencia del dato como «no está en área delimitada» y esa es la
  // respuesta que obliga a sacrificar el pez.
  //
  // Así que no se bloquea: se pide decirlo a propósito, y la provincia sale
  // con el aviso en rojo arriba del todo. Marcar esta casilla es asumir eso.
  const sinComprobar = await prisma.sitio.count({
    where: { provincia: { slug }, eeiComprobado: false },
  });
  const faltaEEI = areasDelimitadasEEI.length < 30 || sinComprobar > 0;

  if (publicada && faltaEEI && !conAviso) {
    const queFalta =
      areasDelimitadasEEI.length < 30
        ? "Falta el listado de áreas delimitadas para especies invasoras."
        : `Quedan ${sinComprobar} sitios sin comprobar contra el listado.`;
    return {
      error:
        `${queFalta} Es el dato que decide si un black bass se devuelve al ` +
        "agua o hay que sacrificarlo. Puedes publicarla igualmente, pero " +
        "entonces marca la casilla de abajo: la página saldrá con un aviso " +
        "en rojo diciendo que no lo sabemos, que es lo único honesto.",
    };
  }

  try {
    await prisma.provincia.update({
      where: { slug },
      data: {
        descripcion: texto(fd, "descripcion"),
        areasDelimitadasEEI,
        notasLegales: texto(fd, "notasLegales"),
        urlOrdenDeVedas: texto(fd, "urlOrdenDeVedas") || null,
        publicada,
      },
    });
    revalidatePath("/", "layout");
    return { ok: publicada ? "Guardado y publicada." : "Guardado. Sigue sin publicar." };
  } catch {
    return { error: "No se ha podido guardar." };
  }
}

// ---------------------------------------------------------------------------
// Áreas delimitadas, sitio por sitio
// ---------------------------------------------------------------------------

export type EstadoEEI = { error: string } | { ok: string } | null;

/**
 * Marca un sitio como dentro o fuera del listado de áreas delimitadas.
 *
 * Es el paso que no puede hacer nadie más: hay que leer el listado de la orden
 * de vedas de la provincia y buscar en él el nombre del embalse o del tramo.
 * Hasta que se hace, el sitio queda con `eeiComprobado` en false y la web dice
 * abiertamente que no lo sabe, en vez de dar por buena la respuesta que manda
 * sacrificar el pez.
 *
 * Se puede volver atrás: «no lo sé» es un estado tan legítimo como los otros
 * dos, y quien se equivoque marcando tiene que poder deshacerlo.
 */
export async function marcarAreaEEI(
  _previo: EstadoEEI,
  fd: FormData,
): Promise<EstadoEEI> {
  try {
    await exigirAdmin();
  } catch {
    return { error: "Solo un administrador puede tocar esto." };
  }

  const slug = texto(fd, "sitio");
  const valor = texto(fd, "valor");
  if (!["dentro", "fuera", "no-lo-se"].includes(valor)) {
    return { error: "Valor no válido." };
  }

  const sitio = await prisma.sitio.findUnique({
    where: { slug },
    select: { nombre: true, provincia: { select: { slug: true } } },
  });
  if (!sitio) return { error: "Ese sitio no existe." };

  try {
    await prisma.sitio.update({
      where: { slug },
      data: {
        esAreaDelimitadaEEI: valor === "dentro",
        eeiComprobado: valor !== "no-lo-se",
      },
    });
  } catch {
    return { error: "No se ha podido guardar." };
  }

  revalidatePath(`/${sitio.provincia.slug}`, "layout");
  revalidatePath("/admin/provincias", "layout");

  const dicho =
    valor === "dentro"
      ? "dentro del área delimitada"
      : valor === "fuera"
        ? "fuera del área delimitada"
        : "sin comprobar";
  return { ok: `${sitio.nombre}: ${dicho}.` };
}
