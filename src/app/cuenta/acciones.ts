"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut, usuarioActual } from "@/lib/auth";
import { borrarImagen } from "@/lib/imagenes";
import { prisma } from "@/lib/prisma";
import { validarContrasena } from "@/lib/validaciones";

export type EstadoCuenta = { error: string } | { ok: string } | null;

export async function cambiarContrasena(
  _previo: EstadoCuenta,
  fd: FormData,
): Promise<EstadoCuenta> {
  const usuario = await usuarioActual();
  const actual = String(fd.get("actual") ?? "");
  const nueva = String(fd.get("nueva") ?? "");
  const repetida = String(fd.get("nueva2") ?? "");

  const fila = await prisma.usuario.findUnique({
    where: { id: usuario.id },
    select: { passwordHash: true },
  });
  if (!fila || !(await compare(actual, fila.passwordHash))) {
    return { error: "La contraseña actual no es correcta." };
  }

  const problema = validarContrasena(nueva, usuario.nombre, usuario.email);
  if (problema) return { error: problema };
  if (nueva !== repetida) return { error: "Las dos contraseñas no coinciden." };

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { passwordHash: await hash(nueva, 12) },
  });

  return { ok: "Contraseña cambiada." };
}

/**
 * Borra la cuenta y todo lo que cuelga de ella.
 *
 * Las capturas se van en cascada por el schema, pero las fotos son ficheros en
 * disco y hay que borrarlas a mano o quedarían huérfanas ocupando sitio. Es
 * también lo que exige el derecho de supresión: que no quede nada.
 */
export async function borrarCuenta(
  _previo: EstadoCuenta,
  fd: FormData,
): Promise<EstadoCuenta> {
  const usuario = await usuarioActual();
  const confirmacion = String(fd.get("confirmacion") ?? "").trim();
  const contrasena = String(fd.get("password") ?? "");

  if (confirmacion !== "BORRAR") {
    return { error: 'Escribe BORRAR en mayúsculas para confirmar.' };
  }

  const fila = await prisma.usuario.findUnique({
    where: { id: usuario.id },
    select: { passwordHash: true },
  });
  if (!fila || !(await compare(contrasena, fila.passwordHash))) {
    return { error: "La contraseña no es correcta." };
  }

  const fotos = await prisma.fotoCaptura.findMany({
    where: { captura: { usuarioId: usuario.id } },
    select: { url: true },
  });

  await prisma.usuario.delete({ where: { id: usuario.id } });
  await Promise.all(fotos.map((f) => borrarImagen(f.url)));

  revalidatePath("/");
  revalidatePath("/capturas");
  revalidatePath("/ranking");

  await signOut({ redirectTo: "/" });
  redirect("/");
}
