import type { Metadata } from "next";
import Link from "next/link";
import { articulosPublicados, imagenDe } from "@/lib/blog";
import { formatearFecha } from "@/lib/formato";
import { metadatosDePagina } from "@/lib/marca";

export const metadata: Metadata = metadatosDePagina({
  titulo: "Blog de pesca: licencias, normativa y consejos",
  descripcion:
    "Qué necesitas para pescar legalmente, qué hacer con las especies " +
    "invasoras, cuándo sale cada pez y cómo devolverlo bien al agua.",
  ruta: "/blog",
});

export const dynamic = "force-dynamic";

export default async function PaginaBlog() {
  const articulos = await articulosPublicados();

  return (
    <div className="contenedor py-10 md:py-14">
      <div className="max-w-prose">
        <h1 className="titulo-pagina font-bold">Blog</h1>
        <p className="mt-3 text-lg leading-relaxed text-texto-suave">
          Las preguntas que no responde una ficha de embalse: qué papeles hacen
          falta, qué hacer con un pez que no se puede devolver, cuándo sale cada
          especie y con qué empezar.
        </p>
      </div>

      {articulos.length === 0 ? (
        <p className="mt-8 tarjeta p-6 text-texto-suave">
          Todavía no hay ningún artículo publicado.
        </p>
      ) : (
        <ul className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {articulos.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/blog/${a.slug}`}
                className="tarjeta tarjeta-enlace flex h-full flex-col overflow-hidden"
              >
                {(() => {
                  const img = imagenDe(a);
                  return img ? (
                    <div className="aspect-[16/9] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt=""
                        className="foto-zoom h-full w-full object-cover"
                      />
                    </div>
                  ) : null;
                })()}
                <div className="flex flex-auto flex-col p-6">
                <p className="text-sm font-semibold text-acento">
                  {a.provincia ? a.provincia.nombre : "Toda España"}
                  {a.publicadaEl && ` · ${formatearFecha(a.publicadaEl)}`}
                </p>
                <h2 className="mt-2 text-xl font-bold leading-tight">
                  {a.titulo}
                </h2>
                <p className="mt-3 flex-auto leading-relaxed text-texto-suave">
                  {a.entradilla}
                </p>
                <span className="mt-4 font-semibold text-acento underline underline-offset-4">
                  Leer
                </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
