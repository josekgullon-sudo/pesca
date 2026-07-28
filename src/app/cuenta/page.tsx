import type { Metadata } from "next";
import Link from "next/link";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BorrarCuenta, CambiarContrasena } from "./FormulariosCuenta";

export const metadata: Metadata = { title: "Mi cuenta" };
export const dynamic = "force-dynamic";

export default async function PaginaCuenta() {
  const usuario = await usuarioActual();
  const capturas = await prisma.captura.count({
    where: { usuarioId: usuario.id },
  });

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi cuenta</h1>
        <p className="mt-1 text-texto-suave">
          {usuario.nombre} · {usuario.email}
          {usuario.esAdmin && " · administrador"}
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-xl font-bold">Mis capturas</h2>
        <p className="leading-relaxed text-texto-suave">
          Llevas {capturas === 1 ? "1 captura" : `${capturas} capturas`}.{" "}
          <Link
            href={`/capturas?usuario=${usuario.id}`}
            className="font-semibold text-acento underline underline-offset-2"
          >
            Verlas
          </Link>
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Cambiar la contraseña</h2>
        <CambiarContrasena />
      </section>

      <section className="border-t border-borde pt-6">
        <h2 className="mb-2 text-xl font-bold">Borrar la cuenta</h2>
        <p className="mb-3 leading-relaxed text-texto-suave">
          Puedes irte cuando quieras y llevarte todo por delante: cuenta,
          capturas y fotos.
        </p>
        <BorrarCuenta />
      </section>
    </div>
  );
}
