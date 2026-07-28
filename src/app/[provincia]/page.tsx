import type { Metadata } from "next";
import Link from "next/link";
import { DatosEstructurados } from "@/components/DatosEstructurados";
import { FiltrosSitios } from "@/components/FiltrosSitios";
import { TarjetaSitio } from "@/components/TarjetaSitio";
import { AVISO_ABUNDANCIAS_ESTIMADAS } from "@/lib/avisos";
import {
  construirWhere,
  hayFiltros,
  leerFiltros,
  urlConFiltros,
  type ParamsBusqueda,
} from "@/lib/filtros-sitios";
import { metadatosDePagina } from "@/lib/marca";
import { prisma } from "@/lib/prisma";
import { cargarProvincia } from "@/lib/provincias";
import { schemaMigas } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provincia: string }>;
}): Promise<Metadata> {
  const { provincia } = await params;
  const p = await prisma.provincia.findUnique({
    where: { slug: provincia, publicada: true },
    select: { nombre: true, descripcion: true },
  });
  if (!p) return { title: "Provincia" };

  // Cada combinación de filtros genera una URL distinta con el mismo contenido:
  // la canónica que pone `metadatosDePagina` es lo que evita que Google las
  // indexe todas y se repartan la fuerza entre decenas de copias.
  return metadatosDePagina({
    titulo: `Dónde pescar en ${p.nombre}: embalses, ríos y especies`,
    descripcion:
      p.descripcion.slice(0, 155) ||
      `Guía de pesca de la provincia de ${p.nombre}.`,
    ruta: `/${provincia}`,
  });
}

export default async function PaginaProvincia({
  params,
  searchParams,
}: {
  params: Promise<{ provincia: string }>;
  searchParams: Promise<ParamsBusqueda>;
}) {
  const { provincia: slugProvincia } = await params;
  const provincia = await cargarProvincia(slugProvincia);
  const filtros = leerFiltros(await searchParams);

  const [sitios, especies] = await Promise.all([
    prisma.sitio.findMany({
      where: { ...construirWhere(filtros), provinciaId: provincia.id },
      // Lo más cerca primero: casi siempre es el criterio que decide.
      orderBy: { tiempoCocheMin: "asc" },
      select: {
        slug: true,
        nombre: true,
        tipo: true,
        municipio: true,
        dificultadAcceso: true,
        tiempoCocheMin: true,
        distanciaDesdeDosHermanasKm: true,
        tieneSombra: true,
        avisosSanitarios: true,
        esAreaDelimitadaEEI: true,
        imagenUrl: true,
        especies: {
          select: {
            abundancia: true,
            especie: { select: { nombreComun: true, estadoLegal: true } },
          },
        },
      },
    }),
    // Solo las especies que están en algún sitio: no tiene sentido ofrecer un
    // filtro que no puede devolver nada.
    prisma.especie.findMany({
      where: { sitios: { some: { sitio: { provinciaId: provincia.id } } } },
      orderBy: { nombreComun: "asc" },
      select: { slug: true, nombreComun: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <DatosEstructurados
        schema={schemaMigas([
          { nombre: "Inicio", ruta: "/" },
          { nombre: `Pescar en ${provincia.nombre}`, ruta: `/${provincia.slug}` },
        ])}
      />

      <nav aria-label="Migas de pan" className="text-sm">
        <Link href="/" className="text-texto-suave underline underline-offset-2">
          Inicio
        </Link>
      </nav>

      {provincia.descripcion && (
        <p className="max-w-prose text-lg leading-relaxed text-texto-suave">
          {provincia.descripcion}
        </p>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dónde pescar en {provincia.nombre}
          </h1>
          <p className="mt-1 text-texto-suave">
            Embalses y ríos de la provincia, del más cercano al más lejano.
          </p>
        </div>
        <Link
          href={urlConFiltros(`/${provincia.slug}/mapa`, filtros)}
          className="inline-flex min-h-touch shrink-0 items-center rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold"
        >
          Ver mapa
        </Link>
      </div>

      {/* En escritorio los filtros se quedan fijos a la izquierda mientras se
          recorre la lista; en móvil van arriba, plegados. */}
      <div className="md:grid md:grid-cols-[17rem_1fr] md:items-start md:gap-8">
        <div className="md:sticky md:top-6">
          <FiltrosSitios base={`/${provincia.slug}`}
            filtros={filtros}
            especies={especies} />
        </div>

        <div className="mt-6 md:mt-0">
          <p className="mb-3 font-semibold text-texto-suave">
            {sitios.length === 1 ? "1 sitio" : `${sitios.length} sitios`}
          </p>

          {sitios.length === 0 ? (
            <p className="tarjeta p-4 leading-relaxed">
              No hay ningún sitio que cumpla eso.{" "}
              {hayFiltros(filtros) && (
                <Link
                  href={`/${provincia.slug}`}
                  className="font-semibold text-acento underline underline-offset-2"
                >
                  Quita los filtros
                </Link>
              )}
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {sitios.map((s) => (
                <TarjetaSitio key={s.slug} sitio={s} provincia={provincia.slug} />
              ))}
            </ul>
          )}

          <p className="mt-6 max-w-prose text-sm leading-relaxed text-texto-suave">
            {AVISO_ABUNDANCIAS_ESTIMADAS}
          </p>

          {provincia.areasDelimitadasEEI && (
            <section className="mt-8 rounded-xl border-2 border-ambar-texto/25 bg-ambar-fondo p-4 text-ambar-texto">
              <h2 className="text-lg font-bold">
                Áreas delimitadas para especies invasoras en {provincia.nombre}
              </h2>
              <p className="mt-2 leading-relaxed">
                Black bass, lucio, carpa común y trucha arcoíris solo se pueden
                pescar en estas aguas. Fuera de ellas hay obligación de
                sacrificarlos y no devolverlos al agua.
              </p>
              <p className="mt-2 leading-relaxed">
                {provincia.areasDelimitadasEEI}
              </p>
              {provincia.notasLegales && (
                <p className="mt-2 leading-relaxed">{provincia.notasLegales}</p>
              )}
              {provincia.urlOrdenDeVedas && (
                <a
                  href={provincia.urlOrdenDeVedas}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-touch items-center rounded-lg bg-ambar-texto px-4 font-semibold text-ambar-fondo"
                >
                  Comprobar la orden de vedas vigente ↗
                </a>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
