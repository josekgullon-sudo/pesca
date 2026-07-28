import type { Metadata } from "next";
import Link from "next/link";
import { FiltrosSitios } from "@/components/FiltrosSitios";
import { MapaSitios } from "@/components/MapaSitios";
import { AVISO_COORDENADAS_APROXIMADAS } from "@/lib/avisos";
import {
  construirWhere,
  leerFiltros,
  urlConFiltros,
  type ParamsBusqueda,
} from "@/lib/filtros-sitios";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Mapa" };
export const dynamic = "force-dynamic";

export default async function PaginaMapa({
  searchParams,
}: {
  searchParams: Promise<ParamsBusqueda>;
}) {
  const params = await searchParams;
  const filtros = leerFiltros(params);

  const [sitios, especies] = await Promise.all([
    prisma.sitio.findMany({
      where: construirWhere(filtros),
      orderBy: { tiempoCocheMin: "asc" },
      select: {
        slug: true,
        nombre: true,
        tipo: true,
        municipio: true,
        tiempoCocheMin: true,
        latitud: true,
        longitud: true,
        avisosSanitarios: true,
      },
    }),
    prisma.especie.findMany({
      where: { sitios: { some: {} } },
      orderBy: { nombreComun: "asc" },
      select: { slug: true, nombreComun: true },
    }),
  ]);

  const puntos = sitios.map((s) => ({
    slug: s.slug,
    nombre: s.nombre,
    tipo: s.tipo,
    municipio: s.municipio,
    tiempoCocheMin: s.tiempoCocheMin,
    latitud: s.latitud,
    longitud: s.longitud,
    avisoGrave: s.avisosSanitarios
      .toUpperCase()
      .includes("AVISO SANITARIO GRAVE"),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mapa</h1>
          <p className="mt-1 text-texto-suave">
            {puntos.length === 1 ? "1 sitio" : `${puntos.length} sitios`} en la
            provincia.
          </p>
        </div>
        <Link
          href={urlConFiltros("/sitios", filtros)}
          className="inline-flex min-h-touch shrink-0 items-center rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold"
        >
          Ver lista
        </Link>
      </div>

      <div className="md:grid md:grid-cols-[17rem_1fr] md:items-start md:gap-8">
        <div className="order-2 mt-6 md:order-1 md:mt-0 md:sticky md:top-6">
          <FiltrosSitios
            base="/sitios/mapa"
            filtros={filtros}
            especies={especies}
          />
        </div>

        <div className="order-1 md:order-2">
          <div className="h-[60vh] min-h-80 overflow-hidden rounded-xl border border-borde md:h-[70vh]">
            <MapaSitios sitios={puntos} />
          </div>

          <ul className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#33633d]" /> Embalse
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#416f87]" /> Río
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#857659]" /> Canal
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#b3261e]" /> Aviso
              sanitario
            </li>
          </ul>
        </div>
      </div>

      <p className="max-w-prose text-sm leading-relaxed text-texto-suave">
        {AVISO_COORDENADAS_APROXIMADAS} El mapa necesita conexión: las teselas
        vienen de OpenStreetMap.
      </p>
    </div>
  );
}
