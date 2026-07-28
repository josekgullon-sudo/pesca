import type { Metadata } from "next";
import Link from "next/link";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrar() {
  return (
    <div className="mx-auto max-w-sm space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
        <p className="mt-1 text-texto-suave">
          Para apuntar tus capturas. Lo demás se ve sin entrar.
        </p>
      </div>

      <FormularioEntrar />

      <p className="border-t border-borde pt-4">
        ¿Todavía no tienes cuenta?{" "}
        <Link
          href="/registro"
          className="font-semibold text-acento underline underline-offset-2"
        >
          Crear una
        </Link>
      </p>
    </div>
  );
}
