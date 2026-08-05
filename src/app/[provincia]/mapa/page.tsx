import type { Metadata } from "next";
import Link from "next/link";
import { AvisoBorrador } from "@/components/AvisoBorrador";
import { FiltrosSitios } from "@/components/FiltrosSitios";
import { MapaSitios } from "@/components/MapaSitios";
import { AVISO_COORDENADAS_APROXIMADAS } from "@/lib/avisos";
import {
  construirWhere,
  leerFiltros,
  urlConFiltros,
  type ParamsBusqueda,
} from "@/lib/filtros-sitios";
import { metadatosDePagina } from "@/lib/marca";
import { prisma } from "@/lib/prisma";
import { cargarProvincia } from "@/lib/provincias";
import { SelectorUbicacion } from "@/components/SelectorUbicacion";
import { distanciaKm, tiempoEnCocheAprox } from "@/lib/ubicacion";
import { ubicacionActual } from "@/lib/ubicacion-servidor";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provincia: string }>;
}): Promise<Metadata> {
  const { provincia } = await params;
  const p = await prisma.provincia.findUnique({
    where: { slug: provincia },
    select: { nombre: true, publicada: true },
  });
  // Los filtros viajan en la URL: sin la canónica que pone el ayudante, cada
  // combinación sería otra página con el mismo mapa.
  const meta = metadatosDePagina({
    titulo: `Mapa de pesca de ${p?.nombre ?? "la provincia"}`,
    descripcion: `Dónde están los embalses y ríos de ${p?.nombre ?? "la provincia"} para pescar.`,
    ruta: `/${provincia}/mapa`,
  });

  // Una provincia sin publicar solo la ve un administrador. Ver page.tsx.
  return p?.publicada ? meta : { ...meta, robots: { index: false, follow: false } };
}

export default async function PaginaMapa({
  params,
  searchParams,
}: {
  params: Promise<{ provincia: string }>;
  searchParams: Promise<ParamsBusqueda>;
}) {
  const { provincia: slugProvincia } = await params;
  const provincia = await cargarProvincia(slugProvincia);
  const filtros = leerFiltros(await searchParams);
  const ubicacion = await ubicacionActual();

  const [sitios, especies] = await Promise.all([
    prisma.sitio.findMany({
      where: {
        ...construirWhere(filtros, { tiempoAparte: Boolean(ubicacion) }),
        provinciaId: provincia.id,
      },
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
      where: { sitios: { some: { sitio: { provinciaId: provincia.id } } } },
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
      provincia: provincia.slug,
    }))
    // Con ubicación el filtro de tiempo se aplica aquí, contra el tiempo
    // estimado desde su punto. Ver `construirWhere`.
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
          <h1 className="text-3xl font-bold tracking-tight">
            Mapa de {provincia.nombre}
          </h1>
          <p className="mt-1 text-texto-suave">
            {puntos.length === 1 ? "1 sitio" : `${puntos.length} sitios`} en la
            provincia.
          </p>
        </div>
        <Link
          href={urlConFiltros(`/${provincia.slug}`, filtros)}
          className="inline-flex min-h-touch shrink-0 items-center rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold"
        >
          Ver lista
        </Link>
      </div>

      {!provincia.publicada && (
        <AvisoBorrador provincia={provincia.nombre} slug={provincia.slug} />
      )}

      <SelectorUbicacion actual={ubicacion} variante="barra" />

      <div className="md:grid md:grid-cols-[17rem_1fr] md:items-start md:gap-8">
        <div className="order-2 mt-6 md:order-1 md:mt-0 md:sticky md:top-6">
          <FiltrosSitios
            base={`/${provincia.slug}/mapa`}
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
