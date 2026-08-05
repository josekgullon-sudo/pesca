import Link from "next/link";
import { salir } from "@/app/entrar/actions";
import { auth } from "@/lib/auth";
import { NOMBRE } from "@/lib/marca";
import { rutaDeSitios } from "@/lib/provincias";
import { Marca } from "./Marca";
import { NavegacionCabecera } from "./Navegacion";

export async function Cabecera() {
  const [sesion, rutaSitios] = await Promise.all([auth(), rutaDeSitios()]);
  const nombre = sesion?.user?.name;
  const esAdmin = sesion?.user?.rol === "admin";

  return (
    // Pegajosa en escritorio: los listados son largos y tener siempre a mano la
    // navegación evita subir del todo para cambiar de sección. En móvil no hace
    // falta, que para eso está la barra de abajo, y ahí la pantalla es oro.
    <header className="bg-cabecera-fondo text-cabecera-texto md:sticky md:top-0 md:z-40">
      <div className="contenedor flex items-center justify-between gap-6 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 text-cabecera-texto"
        >
          <Marca className="h-8 w-8 text-ribera-300" />
          <span className="text-xl font-bold tracking-tight md:text-2xl">
            {NOMBRE}
          </span>
        </Link>

        {/* En escritorio la navegación va aquí; en móvil, en la barra de abajo. */}
        <NavegacionCabecera rutaSitios={rutaSitios} />

        {nombre ? (
          <div className="flex shrink-0 items-center gap-1">
            {esAdmin && (
              <Link
                href="/admin"
                className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-cabecera-texto hover:bg-white/10 md:inline-flex"
              >
                Admin
              </Link>
            )}
            <Link
              href="/cuenta"
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-cabecera-texto hover:bg-white/10"
            >
              {nombre}
            </Link>
            <form action={salir}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-cabecera-texto-suave hover:bg-white/10 hover:text-cabecera-texto"
              >
                Salir
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/entrar"
            className="inline-flex min-h-11 shrink-0 items-center rounded-xl border-2 border-cabecera-texto-suave/40 px-4 font-semibold text-cabecera-texto hover:border-cabecera-texto-suave hover:bg-white/10"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
