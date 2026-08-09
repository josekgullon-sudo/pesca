import type { Metadata } from "next";
import Link from "next/link";
import { FiltrosSitios } from "@/components/FiltrosSitios";
import { MapaSitios } from "@/components/MapaSitios";
import { SelectorUbicacion } from "@/components/SelectorUbicacion";
import { AVISO_COORDENADAS_APROXIMADAS } from "@/lib/avisos";
import {
  construirWhere,
  leerFiltros,
  urlConFiltros,
  type ParamsBusqueda,
} from "@/lib/filtros-sitios";
import { metadatosDePagina } from "@/lib/marca";
import { prisma } from "@/lib/prisma";
import { distanciaKm, tiempoEnCocheAprox } from "@/lib/ubicacion";
import { ubicacionActual } from "@/lib/ubicacion-servidor";

/**
 * El mapa de todo lo publicado. El hermano de `/donde-pescar`, y por el mismo
 * motivo: con dos provincias, «Mapa» del menú acababa en la portada.
 */

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return metadatosDePagina({
    titulo: "Mapa de pesca: embalses y ríos",
    descripcion:
      "Dónde están los embalses, ríos y canales de la guía, con el tiempo " +
      "en coche desde donde estés.",
    ruta: "/mapa",
  });
}

export default async function PaginaMapaGeneral({
  searchParams,
}: {
  searchParams: Promise<ParamsBusqueda>;
}) {
  const filtros = leerFiltros(await searchParams);
  const ubicacion = await ubicacionActual();

  const [publicadas, sitios, especies] = await Promise.all([
    prisma.provincia.findMany({
      where: { publicada: true },
      orderBy: { nombre: "asc" },
      select: { slug: true, nombre: true },
    }),
    prisma.sitio.findMany({
      // Solo lo publicado. Los borradores los ve un administrador entrando en
      // la provincia, que es donde sale el aviso de que aún no está
      // terminada; aquí se colarían mezclados con lo bueno y sin distinguirse.
      where: construirWhere(filtros, {
        tiempoAparte: Boolean(ubicacion),
        soloPublicadas: true,
      }),
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
        provincia: { select: { slug: true } },
      },
    }),
    prisma.especie.findMany({
      where: { sitios: { some: { sitio: { provincia: { publicada: true } } } } },
      orderBy: { nombreComun: "asc" },
      select: { slug: true, nombreComun: true },
    }),
  ]);

  const puntos = sitios
    .map((s) => ({
      slug: s.slug,
      nombre: s.nombre,
      tipo: s.tipo,
      municipio: s.municipio,
      tiempoCocheMin: s.tiempoCocheMin,
      tiempoUsuarioMin: ubicacion
        ? tiempoEnCocheAprox(distanciaKm(ubicacion, s))
        : undefined,
      latitud: s.latitud,
      longitud: s.longitud,
      avisoGrave: s.avisosSanitarios
        .toUpperCase()
        .includes("AVISO SANITARIO GRAVE"),
      provincia: s.provincia.slug,
    }))
    .filter(
      (p) =>
        !ubicacion ||
        !filtros.tiempo ||
        (p.tiempoUsuarioMin ?? 0) <= filtros.tiempo,
    );

  return (
    <div className="contenedor space-y-6 py-10 md:py-14">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mapa de pesca</h1>
          <p className="mt-1 text-texto-suave">
            {puntos.length === 1 ? "1 sitio" : `${puntos.length} sitios`}
            {publicadas.length > 1 && ` en ${publicadas.length} provincias`}.
          </p>
        </div>
        <Link
          href={urlConFiltros("/donde-pescar", filtros)}
          className="inline-flex min-h-touch shrink-0 items-center rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold"
        >
          Ver lista
        </Link>
      </div>

      <SelectorUbicacion actual={ubicacion} variante="barra" />

      <div className="md:grid md:grid-cols-[17rem_1fr] md:items-start md:gap-8">
        <div className="order-2 mt-6 md:order-1 md:mt-0 md:sticky md:top-6">
          <FiltrosSitios
            base="/mapa"
            filtros={filtros}
            especies={especies}
            provincias={publicadas}
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
