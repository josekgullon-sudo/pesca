import type { Metadata } from "next";
import Link from "next/link";
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
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Sitios" };
export const dynamic = "force-dynamic";

export default async function PaginaSitios({
  searchParams,
}: {
  searchParams: Promise<ParamsBusqueda>;
}) {
  const params = await searchParams;
  const filtros = leerFiltros(params);

  const [sitios, especies] = await Promise.all([
    prisma.sitio.findMany({
      where: construirWhere(filtros),
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
      where: { sitios: { some: {} } },
      orderBy: { nombreComun: "asc" },
      select: { slug: true, nombreComun: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sitios</h1>
          <p className="mt-1 text-texto-suave">
            Embalses y ríos de la provincia, del más cercano al más lejano.
          </p>
        </div>
        <Link
          href={urlConFiltros("/sitios/mapa", filtros)}
          className="inline-flex min-h-touch shrink-0 items-center rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold"
        >
          Ver mapa
        </Link>
      </div>

      {/* En escritorio los filtros se quedan fijos a la izquierda mientras se
          recorre la lista; en móvil van arriba, plegados. */}
      <div className="md:grid md:grid-cols-[17rem_1fr] md:items-start md:gap-8">
        <div className="md:sticky md:top-6">
          <FiltrosSitios base="/sitios" filtros={filtros} especies={especies} />
        </div>

        <div className="mt-6 md:mt-0">
          <p className="mb-3 font-semibold text-texto-suave">
            {sitios.length === 1 ? "1 sitio" : `${sitios.length} sitios`}
          </p>

          {sitios.length === 0 ? (
            <p className="rounded-xl border border-borde bg-fondo-elevado p-4 leading-relaxed">
              No hay ningún sitio que cumpla eso.{" "}
              {hayFiltros(filtros) && (
                <Link
                  href="/sitios"
                  className="font-semibold text-acento underline underline-offset-2"
                >
                  Quita los filtros
                </Link>
              )}
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {sitios.map((s) => (
                <TarjetaSitio key={s.slug} sitio={s} />
              ))}
            </ul>
          )}

          <p className="mt-6 max-w-prose text-sm leading-relaxed text-texto-suave">
            {AVISO_ABUNDANCIAS_ESTIMADAS}
          </p>
        </div>
      </div>
    </div>
  );
}
