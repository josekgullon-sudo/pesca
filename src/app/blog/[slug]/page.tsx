import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvisoLegal } from "@/components/AvisoLegal";
import { DatosEstructurados } from "@/components/DatosEstructurados";
import { articulo, articulosRelacionados, imagenDe } from "@/lib/blog";
import { formatearFecha } from "@/lib/formato";
import { Markdown } from "@/lib/markdown";
import { metadatosDePagina, NOMBRE, urlAbsoluta } from "@/lib/marca";
import { schemaMigas } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await articulo(slug);
  if (!a) return { title: "Artículo" };

  return metadatosDePagina({
    titulo: a.titulo,
    descripcion: a.entradilla.slice(0, 155),
    ruta: `/blog/${slug}`,
    tipo: "article",
    imagen: imagenDe(a)?.url ?? null,
  });
}

export default async function FichaArticulo({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = await articulo(slug);
  if (!a) notFound();

  const otros = await articulosRelacionados(slug);
  const imagen = imagenDe(a);

  return (
    <article className="contenedor py-10 md:py-14">
      <DatosEstructurados
        schema={[
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: a.titulo,
            description: a.entradilla,
            url: urlAbsoluta(`/blog/${a.slug}`),
            datePublished: a.publicadaEl?.toISOString(),
            dateModified: a.updatedAt.toISOString(),
            inLanguage: "es-ES",
            // Sin autor personal: lo firma la web, que es de donde sale.
            author: { "@type": "Organization", name: NOMBRE },
            publisher: { "@type": "Organization", name: NOMBRE },
            ...(imagen ? { image: urlAbsoluta(imagen.url) } : {}),
          },
          schemaMigas([
            { nombre: "Inicio", ruta: "/" },
            { nombre: "Blog", ruta: "/blog" },
            { nombre: a.titulo, ruta: `/blog/${a.slug}` },
          ]),
        ]}
      />

      <div className="mx-auto max-w-prose">
        <nav
          aria-label="Migas de pan"
          className="mb-6 flex flex-wrap items-center gap-x-2 text-sm"
        >
          <Link href="/" className="text-texto-suave underline underline-offset-2">
            Inicio
          </Link>
          <span aria-hidden className="text-texto-suave">
            ›
          </span>
          <Link
            href="/blog"
            className="font-semibold text-acento underline underline-offset-2"
          >
            Blog
          </Link>
        </nav>

        <header className="mb-8">
          <p className="text-sm font-semibold text-acento">
            {a.provincia?.publicada ? (
              <Link href={`/${a.provincia.slug}`} className="hover:underline">
                Pesca en {a.provincia.nombre}
              </Link>
            ) : (
              "Toda España"
            )}
            {a.publicadaEl && ` · ${formatearFecha(a.publicadaEl)}`}
          </p>
          <h1 className="titulo-pagina mt-2 font-bold">{a.titulo}</h1>
          <p className="mt-4 text-xl leading-relaxed text-texto-suave">
            {a.entradilla}
          </p>

          {imagen && (
            <figure className="mt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagen.url}
                alt=""
                className="aspect-[16/9] w-full rounded-xl object-cover"
              />
              {/* La atribución no es opcional: las fotos de Commons son
                  Creative Commons y hay que acreditarlas donde se muestran. */}
              {(imagen.autor || imagen.prestada) && (
                <figcaption className="mt-2 text-xs text-texto-suave">
                  {imagen.prestada && `${imagen.prestada}. `}
                  {imagen.autor && `Foto: ${imagen.autor}`}
                  {imagen.licencia && ` · ${imagen.licencia}`}
                  {imagen.fuente && (
                    <>
                      {" · "}
                      <a
                        href={imagen.fuente}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2"
                      >
                        Wikimedia Commons ↗
                      </a>
                    </>
                  )}
                </figcaption>
              )}
            </figure>
          )}
        </header>

        <Markdown>{a.contenido}</Markdown>

        {/* Todo artículo que roce la normativa acaba en el mismo sitio: lo que
            manda es el boletín, no nosotros. */}
        <div className="mt-10 border-t border-borde pt-6">
          <AvisoLegal variante="destacado" />
        </div>

        {otros.length > 0 && (
          <section className="mt-12">
            <h2 className="titulo-seccion font-bold">Sigue leyendo</h2>
            <ul className="mt-5 space-y-4">
              {otros.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={`/blog/${o.slug}`}
                    className="tarjeta tarjeta-enlace block p-5"
                  >
                    <p className="font-bold leading-tight">{o.titulo}</p>
                    <p className="mt-1 leading-relaxed text-texto-suave">
                      {o.entradilla}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
