import Link from "next/link";
import { salir } from "@/app/entrar/actions";
import { auth } from "@/lib/auth";

export async function Cabecera() {
  const sesion = await auth();
  const nombre = sesion?.user?.name;

  return (
    <header className="flex items-center justify-between gap-3 border-b border-borde px-4 py-3">
      <Link href="/" className="text-2xl font-bold tracking-tight text-acento">
        Pesca Sevilla
      </Link>

      {nombre && (
        <form action={salir}>
          <button
            type="submit"
            className="min-h-touch rounded-lg px-3 text-left text-sm font-semibold text-texto-suave"
          >
            <span className="block text-texto">{nombre}</span>
            <span className="block underline underline-offset-2">Salir</span>
          </button>
        </form>
      )}
    </header>
  );
}
