"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

export type EstadoLogin = { error: string } | null;

export async function entrar(
  _previo: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
    return null;
  } catch (error) {
    // Un login correcto termina lanzando el redirect de Next: hay que dejarlo
    // pasar. Solo los AuthError son fallos de verdad.
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos." };
    }
    throw error;
  }
}

export async function salir() {
  await signOut({ redirectTo: "/entrar" });
}
