import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioOpcional } from "@/lib/auth";
import { FormularioRegistro } from "./FormularioRegistro";

export const metadata: Metadata = {
  title: "Crear cuenta",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function PaginaRegistro() {
  if (await usuarioOpcional()) redirect("/");

  return (
    <div className="mx-auto max-w-md space-y-6 py-2">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Crear cuenta</h1>
        <p className="mt-2 leading-relaxed text-texto-suave">
          Solo hace falta para apuntar tus capturas y salir en el ranking. La
          guía y todo lo demás se puede consultar sin cuenta.
        </p>
      </div>

      <FormularioRegistro />

      <p className="text-sm leading-relaxed text-texto-suave">
        Al crear la cuenta aceptas las{" "}
        <Link href="/normas" className="font-semibold text-acento underline underline-offset-2">
          normas de uso
        </Link>{" "}
        y el tratamiento de tus datos que se explica en el{" "}
        <Link href="/aviso-legal" className="font-semibold text-acento underline underline-offset-2">
          aviso legal
        </Link>
        .
      </p>

      <p className="border-t border-borde pt-4">
        ¿Ya tienes cuenta?{" "}
        <Link href="/entrar" className="font-semibold text-acento underline underline-offset-2">
          Entrar
        </Link>
      </p>
    </div>
  );
}
