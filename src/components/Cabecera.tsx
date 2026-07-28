import Link from "next/link";
import { salir } from "@/app/entrar/actions";
import { auth } from "@/lib/auth";
import { NavegacionCabecera } from "./Navegacion";

export async function Cabecera() {
  const sesion = await auth();
  const nombre = sesion?.user?.name;

  return (
    <header className="border-b border-borde px-4 py-3 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="shrink-0 text-2xl font-bold tracking-tight text-acento"
        >
          Pesca Sevilla
        </Link>

        {/* En escritorio la navegación va aquí; en móvil, en la barra de abajo. */}
        <NavegacionCabecera />

        {nombre ? (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/cuenta"
              className="min-h-11 rounded-lg px-2 py-1 text-sm font-semibold text-texto underline underline-offset-2"
            >
              {nombre}
            </Link>
            <form action={salir}>
              <button
                type="submit"
                className="min-h-11 rounded-lg px-2 text-sm font-semibold text-texto-suave underline underline-offset-2"
              >
                Salir
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/entrar"
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg border-2 border-borde px-3 font-semibold"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
