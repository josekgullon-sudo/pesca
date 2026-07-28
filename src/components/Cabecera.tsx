import Link from "next/link";
import { salir } from "@/app/entrar/actions";
import { auth } from "@/lib/auth";
import { rutaDeSitios } from "@/lib/provincias";
import { NavegacionCabecera } from "./Navegacion";

export async function Cabecera() {
  const [sesion, rutaSitios] = await Promise.all([auth(), rutaDeSitios()]);
  const nombre = sesion?.user?.name;

  return (
    <header className="bg-cabecera-fondo px-4 py-3 text-cabecera-texto md:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="shrink-0 text-2xl font-bold tracking-tight text-cabecera-texto"
        >
          Pesca Sevilla
        </Link>

        {/* En escritorio la navegación va aquí; en móvil, en la barra de abajo. */}
        <NavegacionCabecera rutaSitios={rutaSitios} />

        {nombre ? (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/cuenta"
              className="min-h-11 rounded-lg px-2 py-1 text-sm font-semibold text-cabecera-texto underline underline-offset-2"
            >
              {nombre}
            </Link>
            <form action={salir}>
              <button
                type="submit"
                className="min-h-11 rounded-lg px-2 text-sm font-semibold text-cabecera-texto-suave underline underline-offset-2"
              >
                Salir
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/entrar"
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg border-2 border-cabecera-texto-suave/50 px-3 font-semibold text-cabecera-texto"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
