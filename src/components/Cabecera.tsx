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

        {nombre && (
          <form action={salir} className="shrink-0">
            <button
              type="submit"
              className="min-h-touch rounded-lg px-3 text-left text-sm font-semibold text-texto-suave md:min-h-11"
            >
              <span className="block text-texto">{nombre}</span>
              <span className="block underline underline-offset-2">Salir</span>
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
