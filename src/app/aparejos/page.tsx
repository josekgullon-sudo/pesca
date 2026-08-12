import type { Metadata } from "next";
import Link from "next/link";
import { DatosEstructurados } from "@/components/DatosEstructurados";
import { FotoAparejo } from "@/components/FotoAparejo";
import { ETIQUETA_TIPO_APAREJO, type TipoAparejo } from "@/lib/enums";
import { metadatosDePagina } from "@/lib/marca";
import { prisma } from "@/lib/prisma";
import { schemaMigas } from "@/lib/schema";

/**
 * El catálogo de señuelos y cebos.
 *
 * Los aparejos llevaban desde el principio en la base de datos —con su
 * efectividad por especie, sus notas y a qué embalses van— y no tenían página
 * propia: solo asomaban dentro de la ficha de una especie o de un sitio. Es
 * decir, había diecinueve fichas escritas a las que no se podía llegar.
 *
 * Se agrupan por tipo y no por especie a propósito. Quien busca «vinilo para
 * black bass» ya sabe lo que quiere; quien está empezando necesita ver primero
 * que hay cinco familias de cosas y que no son intercambiables.
 */

export const metadata: Metadata = metadatosDePagina({
  titulo: "Señuelos y cebos: cuál usar y cómo se monta cada uno",
  descripcion:
    "Los señuelos y cebos que funcionan en los embalses de Andalucía, con " +
    "para qué especie sirve cada uno, cuánto cuesta y cómo se monta paso a paso.",
  ruta: "/aparejos",
});
export const dynamic = "force-dynamic";

/** El orden con el que se leen: de lo que se lanza a lo que se echa al agua. */
const ORDEN: { tipo: TipoAparejo; explicacion: string }[] = [
  {
    tipo: "vinilo",
    explicacion:
      "Señuelos blandos. Baratos, se cambian en un momento y son lo primero " +
      "que hay que aprender a montar: casi todo el black bass de esta guía se " +
      "saca con uno de estos.",
  },
  {
    tipo: "senuelo_duro",
    explicacion:
      "Vienen armados de fábrica. Cada uno trabaja a una profundidad y con un " +
      "movimiento, así que la gracia no está en el señuelo sino en elegir cuál " +
      "toca según el agua y la hora.",
  },
  {
    tipo: "montaje",
    explicacion:
      "No son señuelos: son formas de armar el conjunto. Saber montar estos " +
      "tres cambia más los resultados que comprar señuelos nuevos.",
  },
  {
    tipo: "cebo_natural",
    explicacion:
      "Lo de siempre, y lo que más pesca. Barato, sencillo y con lo que se " +
      "empieza si nunca has cogido una caña.",
  },
  {
    tipo: "engodo",
    explicacion:
      "No van al anzuelo: van al agua, para juntar al pez donde tú estás y " +
      "que se quede rebuscando. Sin engodo, a fondo se pesca mucho peor.",
  },
];

export default async function PaginaAparejos() {
  const aparejos = await prisma.aparejo.findMany({
    orderBy: { nombre: "asc" },
    select: {
      slug: true,
      nombre: true,
      tipo: true,
      descripcion: true,
      precioAproxEur: true,
      imagenUrl: true,
      comoMontar: true,
      especies: {
        orderBy: { efectividad: "desc" },
        select: {
          efectividad: true,
          especie: { select: { slug: true, nombreComun: true } },
        },
      },
    },
  });

  return (
    <div className="contenedor space-y-8 py-10 md:py-14">
      <DatosEstructurados
        schema={schemaMigas([
          { nombre: "Inicio", ruta: "/" },
          { nombre: "Señuelos y cebos", ruta: "/aparejos" },
        ])}
      />

      <nav aria-label="Migas de pan" className="text-sm">
        <Link href="/" className="text-texto-suave underline underline-offset-2">
          Inicio
        </Link>
      </nav>

      <div>
        <h1 className="titulo-pagina font-bold">Señuelos y cebos</h1>
        <p className="mt-2 max-w-prose text-lg leading-relaxed text-texto-suave">
          Lo que de verdad hace falta llevar a un embalse de aquí, con para qué
          sirve cada cosa, lo que cuesta y{" "}
          <strong className="text-texto">cómo se monta paso a paso</strong>.
        </p>
        <p className="mt-2 max-w-prose leading-relaxed text-texto-suave">
          No hay marcas ni enlaces de compra: esto no vende nada. Los precios
          son de orientación, de lo que cuesta la unidad en cualquier tienda.
        </p>
      </div>

      {ORDEN.map((grupo) => {
        const lista = aparejos.filter((a) => a.tipo === grupo.tipo);
        if (lista.length === 0) return null;

        return (
          <section key={grupo.tipo}>
            <h2 className="titulo-seccion font-bold">
              {ETIQUETA_TIPO_APAREJO[grupo.tipo]}
            </h2>
            <p className="mt-1 mb-4 max-w-prose leading-relaxed text-texto-suave">
              {grupo.explicacion}
            </p>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lista.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/aparejos/${a.slug}`}
                    className="tarjeta tarjeta-enlace flex h-full flex-col overflow-hidden"
                  >
                    <FotoAparejo
                      nombre={a.nombre}
                      imagenUrl={a.imagenUrl}
                      tipo={a.tipo}
                      className="aspect-[16/10] w-full"
                    />
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold leading-tight">{a.nombre}</h3>
                        {a.precioAproxEur !== null && (
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-texto-suave">
                            ~{a.precioAproxEur} €
                          </span>
                        )}
                      </div>

                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-texto-suave">
                        {a.descripcion}
                      </p>

                      {a.especies.length > 0 && (
                        <p className="mt-3 text-sm text-texto-suave">
                          Para{" "}
                          <strong className="text-texto">
                            {a.especies
                              .slice(0, 3)
                              .map((e) => e.especie.nombreComun.toLowerCase())
                              .join(", ")}
                          </strong>
                        </p>
                      )}

                      {a.comoMontar && (
                        <p className="mt-auto pt-3 text-sm font-semibold text-acento">
                          Cómo se monta →
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="tarjeta p-5">
        <h2 className="text-lg font-bold">Si estás empezando</h2>
        <p className="mt-2 max-w-prose leading-relaxed text-texto-suave">
          No hace falta nada de la lista de arriba salvo tres cosas: un bote de{" "}
          <Link href="/aparejos/maiz-dulce" className="text-acento underline underline-offset-2">
            maíz dulce
          </Link>
          , un{" "}
          <Link
            href="/aparejos/montaje-fondo-corredizo"
            className="text-acento underline underline-offset-2"
          >
            montaje de fondo corredizo
          </Link>{" "}
          y paciencia. Con eso se pesca carpa en cualquier embalse de esta guía.
          Lo tienes contado en{" "}
          <Link
            href="/blog/empezar-a-pescar-equipo-basico"
            className="font-semibold text-acento underline underline-offset-2"
          >
            qué necesitas para empezar
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
