"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { borrarImagen, ErrorImagen, guardarImagen } from "@/lib/imagenes";
import {
  comprobarLimite,
  LIMITE_CAPTURAS,
  textoEspera,
} from "@/lib/limites";
import { prisma } from "@/lib/prisma";

export type EstadoCaptura = { error: string } | null;

function texto(fd: FormData, campo: string): string {
  return String(fd.get(campo) ?? "").trim();
}

function numeroOpcional(fd: FormData, campo: string): number | null {
  const bruto = texto(fd, campo).replace(",", ".");
  if (!bruto) return null;
  const n = Number(bruto);
  return Number.isFinite(n) ? n : null;
}

/**
 * Guarda una captura.
 *
 * Las fotos se procesan antes de tocar la base de datos: si una falla, no
 * queremos dejar una captura a medias. Y si la escritura en base de datos
 * falla después, se borran los ficheros que ya se habían guardado.
 */
export async function crearCaptura(
  _previo: EstadoCaptura,
  fd: FormData,
): Promise<EstadoCaptura> {
  const usuario = await usuarioActual();

  const sitioId = texto(fd, "sitioId");
  const especieId = texto(fd, "especieId");
  if (!sitioId) return { error: "Elige el sitio." };
  if (!especieId) return { error: "Elige la especie." };

  // Con registro abierto, cualquiera puede subir fotos al disco del servidor.
  // El límite va por usuario y no por IP: la sesión ya identifica a quién es.
  const espera = comprobarLimite(
    `capturas:${usuario.id}`,
    LIMITE_CAPTURAS.maximo,
    LIMITE_CAPTURAS.ventanaMs,
  );
  if (espera > 0) {
    return {
      error: `Has registrado muchas capturas seguidas. Espera ${textoEspera(espera)}.`,
    };
  }

  const fecha = texto(fd, "fecha");
  const hora = texto(fd, "hora");
  if (!fecha) return { error: "Falta la fecha." };

  const pesoGramos = numeroOpcional(fd, "pesoGramos");
  const longitudCm = numeroOpcional(fd, "longitudCm");
  if (pesoGramos !== null && (pesoGramos <= 0 || pesoGramos > 200_000)) {
    return { error: "Ese peso no puede ser: revísalo." };
  }
  if (longitudCm !== null && (longitudCm <= 0 || longitudCm > 300)) {
    return { error: "Esa longitud no puede ser: revísala." };
  }

  const rutasGuardadas: string[] = [];
  try {
    const fotos = fd
      .getAll("fotos")
      .filter((f): f is File => f instanceof File && f.size > 0);

    for (const foto of fotos) {
      rutasGuardadas.push(await guardarImagen(foto, "uploads"));
    }

    const captura = await prisma.captura.create({
      data: {
        usuarioId: usuario.id,
        sitioId,
        especieId,
        fecha: new Date(`${fecha}T00:00:00`),
        hora: hora || "00:00",
        pesoGramos: pesoGramos === null ? null : Math.round(pesoGramos),
        longitudCm,
        aparejoId: texto(fd, "aparejoId") || null,
        tecnicaId: texto(fd, "tecnicaId") || null,
        latitud: numeroOpcional(fd, "latitud"),
        longitud: numeroOpcional(fd, "longitud"),
        liberado: fd.get("liberado") === "on",
        condicionesMeteo: texto(fd, "condicionesMeteo") || null,
        temperaturaC: numeroOpcional(fd, "temperaturaC"),
        notas: texto(fd, "notas"),
        // Lo genera el cliente para que reintentar no duplique la captura.
        clienteUuid: texto(fd, "clienteUuid") || null,
        syncedAt: new Date(),
        fotos: {
          create: rutasGuardadas.map((url, i) => ({
            url,
            esPrincipal: i === 0,
          })),
        },
      },
      select: { id: true },
    });

    revalidatePath("/capturas");
    revalidatePath("/");
    redirect(`/capturas/${captura.id}`);
  } catch (error) {
    // El redirect de Next viaja como excepción: hay que dejarlo pasar.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    // Si algo falló después de escribir fotos, no las dejamos huérfanas.
    await Promise.all(rutasGuardadas.map(borrarImagen));

    if (error instanceof ErrorImagen) return { error: error.message };

    // Dos envíos del mismo formulario offline: no es un fallo de verdad.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return { error: "Esta captura ya estaba guardada." };
    }

    console.error("Error guardando captura:", error);
    return { error: "No se ha podido guardar. Inténtalo otra vez." };
  }

  return null;
}

export async function borrarCaptura(formData: FormData) {
  const usuario = await usuarioActual();
  const id = String(formData.get("id") ?? "");

  const captura = await prisma.captura.findUnique({
    where: { id },
    select: { usuarioId: true, fotos: { select: { url: true } } },
  });

  // Cada uno borra lo suyo. Los admin, además, cualquiera: con registro
  // abierto hace falta poder retirar lo que no debería estar.
  const puedeBorrar =
    captura && (captura.usuarioId === usuario.id || usuario.esAdmin);
  if (!captura || !puedeBorrar) {
    redirect("/capturas");
  }

  await prisma.captura.delete({ where: { id } });
  await Promise.all(captura.fotos.map((f) => borrarImagen(f.url)));

  revalidatePath("/capturas");
  revalidatePath("/");
  redirect("/capturas");
}
