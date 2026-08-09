import type { Metadata } from "next";
import Link from "next/link";
import { DatosEstructurados } from "@/components/DatosEstructurados";
import { FiltrosSitios } from "@/components/FiltrosSitios";
import { SelectorUbicacion } from "@/components/SelectorUbicacion";
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
import { schemaMigas } from "@/lib/schema";
import { distanciaKm, tiempoEnCocheAprox } from "@/lib/ubicacion";
import { ubicacionActual } from "@/lib/ubicacion-servidor";

/**
 * Todos los sitios, de todas las provincias publicadas.
 *
 * Esta página nació de un fallo que se destapó al publicar la segunda
 * provincia: «Sitios» del menú llevaba a la portada. El destino lo decidía una
 * función que sabía ir a la provincia cuando solo había una, y con dos se
 * rendía y devolvía «/». Con una provincia el listado de la provincia ERA el
 * listado de sitios; con dos hacía falta este, y no existía.
 *
 * Se ordena por cercanía como el de provincia, y el filtro de provincia sirve
 * para volver a acotar. La ficha de cada sitio sigue viviendo bajo su
 * provincia: esto es una vista, no una segunda dirección para lo mismo.
 */

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return metadatosDePagina({
    titulo: "Dónde pescar: todos los embalses y ríos de la guía",
    descripcion:
      "Listado completo de embalses, ríos y canales con especies, acceso, " +
      "nivel del agua y a cuánto están en coche.",
    ruta: "/donde-pescar",
  });
}

export default async function PaginaSitios({
  searchParams,
}: {
  searchParams: Promise<ParamsBusqueda>;
}) {
  const filtros = leerFiltros(await searchParams);
  const ubicacion = await ubicacionActual();

  const publicadas = await prisma.provincia.findMany({
    where: { publicada: true },
    orderBy: { nombre: "asc" },
    select: { slug: true, nombre: true },
  });


  const [sitiosBrutos, especies] = await Promise.all([
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
        dificultadAcceso: true,
        tiempoCocheMin: true,
        distanciaDesdeDosHermanasKm: true,
        tieneSombra: true,
        latitud: true,
        longitud: true,
        avisosSanitarios: true,
        esAreaDelimitadaEEI: true,
        eeiComprobado: true,
        nivelPorcentaje: true,
        nivelHm3: true,
        capacidadHm3: true,
        nivelFecha: true,
        nivelFuente: true,
        imagenUrl: true,
        provincia: { select: { slug: true, nombre: true } },
        especies: {
          select: {
            abundancia: true,
            especie: { select: { nombreComun: true, estadoLegal: true } },
          },
        },
      },
    }),
    prisma.especie.findMany({
      where: { sitios: { some: { sitio: { provincia: { publicada: true } } } } },
      orderBy: { nombreComun: "asc" },
      select: { slug: true, nombreComun: true },
    }),
  ]);

  // Igual que en la provincia: con ubicación manda la distancia a su punto, y
  // el filtro de tiempo se aplica aquí. Ver `construirWhere`.
  const sitios = ubicacion
    ? sitiosBrutos
        .map((s) => {
          const distanciaUsuarioKm = distanciaKm(ubicacion, s);
          return {
            ...s,
            distanciaUsuarioKm,
            tiempoUsuarioMin: tiempoEnCocheAprox(distanciaUsuarioKm),
          };
        })
        .filter((s) => !filtros.tiempo || s.tiempoUsuarioMin <= filtros.tiempo)
        .sort((a, b) => a.distanciaUsuarioKm - b.distanciaUsuarioKm)
    : sitiosBrutos;

  return (
    <div className="contenedor space-y-6 py-10 md:py-14">
      <DatosEstructurados
        schema={schemaMigas([
          { nombre: "Inicio", ruta: "/" },
          { nombre: "Dónde pescar", ruta: "/donde-pescar" },
        ])}
      />

      <nav aria-label="Migas de pan" className="text-sm">
        <Link href="/" className="text-texto-suave underline underline-offset-2">
          Inicio
        </Link>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titulo-pagina font-bold">Dónde pescar</h1>
          <p className="mt-1 text-lg text-texto-suave">
            {publicadas.length === 1
              ? "Embalses y ríos de la guía, del más cercano al más lejano."
              : `Embalses y ríos de ${publicadas.length} provincias, del más cercano al más lejano.`}
          </p>
        </div>
        <Link
          href={urlConFiltros("/mapa", filtros)}
          className="inline-flex min-h-touch shrink-0 items-center rounded-xl border-2 border-borde bg-fondo-elevado px-5 font-semibold hover:border-acento"
        >
          Ver mapa
        </Link>
      </div>

      <SelectorUbicacion actual={ubicacion} variante="barra" />

      <div className="md:grid md:grid-cols-[17rem_1fr] md:items-start md:gap-8">
        <div className="md:sticky md:top-6">
          <FiltrosSitios
            base="/donde-pescar"
            filtros={filtros}
            especies={especies}
            provincias={publicadas}
          />
        </div>

        <div className="mt-6 md:mt-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold text-texto-suave">
              {sitios.length === 1 ? "1 sitio" : `${sitios.length} sitios`}
              {ubicacion && ", del más cercano al más lejano"}
            </p>
            {ubicacion && (
              <p className="text-sm text-texto-suave">
                Los tiempos en coche son estimados desde {ubicacion.etiqueta}.
              </p>
            )}
          </div>

          {sitios.length === 0 ? (
            <p className="tarjeta p-4 leading-relaxed">
              No hay ningún sitio que cumpla eso.{" "}
              {hayFiltros(filtros) && (
                <Link
                  href="/donde-pescar"
                  className="font-semibold text-acento underline underline-offset-2"
                >
                  Quita los filtros
                </Link>
              )}
            </p>
          ) : (
            <ul className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
              {sitios.map((s) => (
                <TarjetaSitio
                  key={`${s.provincia.slug}-${s.slug}`}
                  sitio={s}
                  provincia={s.provincia.slug}
                  // Solo cuando hay más de una: repetir «Sevilla» en las
                  // cincuenta tarjetas de Sevilla no informa de nada.
                  nombreProvincia={
                    publicadas.length > 1 && !filtros.provincia
                      ? s.provincia.nombre
                      : undefined
                  }
                />
              ))}
            </ul>
          )}

          {/* Las normas cambian de una provincia a otra, y aquí salen
              mezcladas. El sitio donde eso se explica bien es la página de
              cada provincia, así que desde aquí se lleva a ellas. */}
          <section className="mt-8 tarjeta p-5">
            <h2 className="text-lg font-bold">Normas por provincia</h2>
            <p className="mt-2 max-w-prose leading-relaxed text-texto-suave">
              Las vedas, las tallas y las áreas donde se puede pescar black
              bass o lucio las fija cada provincia, y no coinciden. Antes de ir,
              mira la de la tuya.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {publicadas.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/${p.slug}`}
                    className="inline-flex min-h-touch items-center rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold hover:border-acento"
                  >
                    Pescar en {p.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-semibold text-texto-suave">
              De dónde salen las abundancias
            </summary>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-texto-suave">
              {AVISO_ABUNDANCIAS_ESTIMADAS}
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
