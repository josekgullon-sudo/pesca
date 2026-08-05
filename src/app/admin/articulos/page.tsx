import Link from "next/link";
import { formatearFecha } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { alternarPublicacion } from "../acciones";

export const dynamic = "force-dynamic";

export default async function ListaArticulos() {
  const articulos = await prisma.articulo.findMany({
    orderBy: [{ publicada: "asc" }, { publicadaEl: "desc" }],
    select: {
      slug: true,
      titulo: true,
      entradilla: true,
      publicada: true,
      publicadaEl: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="titulo-seccion font-bold">Artículos</h2>
        <Link
          href="/admin/articulos/nuevo"
          className="inline-flex min-h-touch items-center rounded-xl bg-acento px-5 font-bold text-acento-texto"
        >
          Escribir uno nuevo
        </Link>
      </div>

      {articulos.length === 0 ? (
        <p className="tarjeta p-6 text-texto-suave">Todavía no hay artículos.</p>
      ) : (
        <ul className="space-y-3">
          {articulos.map((a) => (
            <li key={a.slug} className="tarjeta p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/articulos/${a.slug}`}
                      className="text-lg font-bold leading-tight underline-offset-2 hover:underline"
                    >
                      {a.titulo}
                    </Link>
                    {a.publicada ? (
                      <span className="rounded-lg bg-verde-fondo px-2 py-0.5 text-xs font-bold text-verde-texto">
                        Publicado
                      </span>
                    ) : (
                      <span className="rounded-lg bg-chip-fondo px-2 py-0.5 text-xs font-bold text-chip-texto">
                        Borrador
                      </span>
                    )}
                  </div>
                  <p className="mt-1 leading-relaxed text-texto-suave">
                    {a.entradilla}
                  </p>
                  <p className="mt-2 text-sm text-texto-suave">
                    /blog/{a.slug}
                    {a.publicadaEl && ` · ${formatearFecha(a.publicadaEl)}`}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {a.publicada && (
                    <Link
                      href={`/blog/${a.slug}`}
                      className="inline-flex min-h-11 items-center rounded-xl border-2 border-borde px-4 font-semibold hover:border-acento"
                    >
                      Ver
                    </Link>
                  )}
                  <form action={alternarPublicacion}>
                    <input type="hidden" name="slug" value={a.slug} />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center rounded-xl border-2 border-borde px-4 font-semibold hover:border-acento"
                    >
                      {a.publicada ? "Retirar" : "Publicar"}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
