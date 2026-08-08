import Link from "next/link";

/**
 * Los artículos que hablan de esto, enlazados desde la ficha.
 *
 * Existe por una razón muy concreta. Los artículos enlazaban a las fichas de
 * especie, de sitio y de provincia, pero las fichas no devolvían nada. Y son
 * las fichas las que reciben las visitas de Google: la de cangrejo rojo era la
 * cuarta página con más impresiones de toda la web y no llevaba a ninguna
 * parte. Quien llegaba, leía y se iba.
 *
 * Enlazar hacia dentro es de lo poco del posicionamiento que depende
 * enteramente de nosotros —no de tener suerte ni de que nadie nos enlace— y
 * además es lo que quiere quien está leyendo: acaba de resolver una duda y
 * tiene la siguiente encima.
 */
export function ArticulosRelacionados({
  articulos,
  titulo = "Para saber más",
}: {
  articulos: { slug: string; titulo: string; entradilla: string }[];
  titulo?: string;
}) {
  if (articulos.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-xl font-bold">{titulo}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {articulos.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/blog/${a.slug}`}
              className="tarjeta tarjeta-enlace flex h-full flex-col p-4"
            >
              <h3 className="font-bold leading-tight">{a.titulo}</h3>
              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-texto-suave">
                {a.entradilla}
              </p>
              <span className="mt-2 text-sm font-semibold text-acento underline underline-offset-4">
                Leer
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
