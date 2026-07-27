import type { Metadata } from "next";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrar() {
  return (
    <div className="mx-auto max-w-sm space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
        <p className="mt-1 text-texto-suave">
          App privada. Solo nosotros dos.
        </p>
      </div>

      <FormularioEntrar />
    </div>
  );
}
