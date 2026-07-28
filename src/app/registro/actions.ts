"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import {
  comprobarLimite,
  ipDelCliente,
  LIMITE_REGISTRO,
  textoEspera,
} from "@/lib/limites";
import { prisma } from "@/lib/prisma";
import {
  normalizarEmail,
  validarContrasena,
  validarEmail,
  validarNombre,
} from "@/lib/validaciones";

export type EstadoRegistro = { error: string; email?: string } | null;

export async function registrarse(
  _previo: EstadoRegistro,
  fd: FormData,
): Promise<EstadoRegistro> {
  const nombre = String(fd.get("nombre") ?? "").trim();
  const email = normalizarEmail(String(fd.get("email") ?? ""));
  const contrasena = String(fd.get("password") ?? "");
  const repetida = String(fd.get("password2") ?? "");

  const error =
    validarNombre(nombre) ??
    validarEmail(email) ??
    validarContrasena(contrasena, nombre, email) ??
    (contrasena !== repetida ? "Las dos contraseñas no coinciden." : null);

  if (error) return { error, email };

  // El límite se comprueba después de validar, para que un formulario mal
  // relleno no gaste intentos.
  const espera = comprobarLimite(
    `registro:${await ipDelCliente()}`,
    LIMITE_REGISTRO.maximo,
    LIMITE_REGISTRO.ventanaMs,
  );
  if (espera > 0) {
    return {
      error: `Demasiadas cuentas creadas desde aquí. Prueba dentro de ${textoEspera(espera)}.`,
      email,
    };
  }

  const yaExiste = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true },
  });
  if (yaExiste) {
    return { error: "Ya hay una cuenta con ese email.", email };
  }

  try {
    await prisma.usuario.create({
      data: { nombre, email, passwordHash: await hash(contrasena, 12) },
    });
  } catch {
    return { error: "No se ha podido crear la cuenta. Inténtalo otra vez.", email };
  }

  try {
    await signIn("credentials", { email, password: contrasena, redirectTo: "/" });
    return null;
  } catch (e) {
    // La cuenta ya está creada; si el login automático falla, que entre a mano.
    if (e instanceof AuthError) {
      return { error: "Cuenta creada. Entra con tu email y contraseña.", email };
    }
    throw e;
  }
}
