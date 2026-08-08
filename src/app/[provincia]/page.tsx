import type { Metadata } from "next";
import Link from "next/link";
import { ArticulosRelacionados } from "@/components/ArticulosRelacionados";
import { AvisoBorrador } from "@/components/AvisoBorrador";
import { AvisoEEIProvincia } from "@/components/AvisoEEIProvincia";
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
import { articulosDe } from "@/lib/blog";
import { cargarProvincia } from "@/lib/provincias";
import { schemaMigas } from "@/lib/schema";
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
    select: { nombre: true, descripcion: true, publicada: true },
  });
  if (!p) return { title: "Provincia" };

  // Cada combinación de filtros genera una URL distinta con el mismo contenido:
  // la canónica que pone `metadatosDePagina` es lo que evita que Google las
  // indexe todas y se repartan la fuerza entre decenas de copias.
  const meta = metadatosDePagina({
    titulo: `Dónde pescar en ${p.nombre}: embalses, ríos y especies`,
    descripcion:
      p.descripcion.slice(0, 155) ||
      `Guía de pesca de la provincia de ${p.nombre}.`,
    ruta: `/${provincia}`,
  });

  // Sin publicar solo la ve un administrador, así que Google recibe un 404 y
  // nunca llega aquí. El noindex va igualmente: si algún día cambia la forma
  // de autenticar, el borrador sigue sin poder indexarse por descuido.
  return p.publicada ? meta : { ...meta, robots: { index: false, follow: false } };
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
  // Si se está viendo sin publicar es que quien mira es administrador:
  // `cargarProvincia` responde 404 a cualquier otro.
  const enBorrador = !provincia.publicada;
  // Publicada pero sin el listado de la orden de vedas. Se puede —el resto de
  // la guía vale igual—, pero entonces hay que decirlo bien alto.
  const sinListadoEEI = provincia.areasDelimitadasEEI.trim().length < 30;
  const filtros = leerFiltros(await searchParams);
  const ubicacion = await ubicacionActual();

  const [sitiosBrutos, especies, articulos] = await Promise.all([
    prisma.sitio.findMany({
      where: {
        ...construirWhere(filtros, { tiempoAparte: Boolean(ubicacion) }),
        provinciaId: provincia.id,
      },
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
        latitud: true,
        longitud: true,
        avisosSanitarios: true,
        esAreaDelimitadaEEI: true,
        eeiComprobado: true,
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
    articulosDe({ provinciaSlug: slugProvincia }),
  ]);

  // Con ubicación, la lista se ordena por lo que pilla más cerca y cada tarjeta
  // enseña esa distancia. Sin ella se mantiene el orden por tiempo en coche,
  // que es lo que trae la guía.
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
        // El filtro de tiempo, ahora sí, contra el suyo y no contra el de Dos
        // Hermanas. Ver `construirWhere`.
        .filter((s) => !filtros.tiempo || s.tiempoUsuarioMin <= filtros.tiempo)
        .sort((a, b) => a.distanciaUsuarioKm - b.distanciaUsuarioKm)
    : sitiosBrutos;

  return (
    <div className="contenedor space-y-6 py-10 md:py-14">
      <DatosEstructurados
        schema={schemaMigas([
          { nombre: "Inicio", ruta: "/" },
          { nombre: `Pescar en ${provincia.nombre}`, ruta: `/${provincia.slug}` },
        ])}
      />

      {enBorrador && (
        <AvisoBorrador provincia={provincia.nombre} slug={provincia.slug} />
      )}

      <nav aria-label="Migas de pan" className="text-sm">
        <Link href="/" className="text-texto-suave underline underline-offset-2">
          Inicio
        </Link>
      </nav>

      {/* El título primero y la descripción debajo. Al revés, quien entraba se
          encontraba un párrafo sin saber todavía de qué provincia hablaba. */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titulo-pagina font-bold">
            Dónde pescar en {provincia.nombre}
          </h1>
          <p className="mt-1 text-lg text-texto-suave">
            Embalses y ríos de la provincia, del más cercano al más lejano.
          </p>
        </div>
        <Link
          href={urlConFiltros(`/${provincia.slug}/mapa`, filtros)}
          className="inline-flex min-h-touch shrink-0 items-center rounded-xl border-2 border-borde bg-fondo-elevado px-5 font-semibold hover:border-acento"
        >
          Ver mapa
        </Link>
      </div>

      {provincia.descripcion && (
        <p className="max-w-prose text-lg leading-relaxed text-texto-suave">
          {provincia.descripcion}
        </p>
      )}

      {/* Si la provincia está publicada sin su listado de áreas delimitadas,
          el aviso va aquí: arriba, antes de ver un solo embalse. Abajo, junto
          al resto de notas legales, no lo leería nadie, y el silencio en este
          punto concreto se interpreta como «no está en área delimitada», que
          es la respuesta que manda sacrificar el pez. */}
      {sinListadoEEI && (
        <AvisoEEIProvincia
          provincia={provincia.nombre}
          urlOrdenDeVedas={provincia.urlOrdenDeVedas}
        />
      )}

      {/* A ancho completo y antes de los filtros. Estaba en un enlace pequeño
          al lado del contador de sitios y no lo veía nadie, que es tanto como
          no tenerlo: sin esto la lista se ordena desde Dos Hermanas, que a
          quien viene de fuera no le dice nada. */}
      <SelectorUbicacion actual={ubicacion} variante="barra" />

      {/* En escritorio los filtros se quedan fijos a la izquierda mientras se
          recorre la lista; en móvil van arriba, plegados. */}
      <div className="md:grid md:grid-cols-[17rem_1fr] md:items-start md:gap-8">
        <div className="md:sticky md:top-6">
          <FiltrosSitios base={`/${provincia.slug}`}
            filtros={filtros}
            especies={especies} />
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
                  href={`/${provincia.slug}`}
                  className="font-semibold text-acento underline underline-offset-2"
                >
                  Quita los filtros
                </Link>
              )}
            </p>
          ) : (
            <ul className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
              {sitios.map((s) => (
                <TarjetaSitio key={s.slug} sitio={s} provincia={provincia.slug} />
              ))}
            </ul>
          )}

          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-semibold text-texto-suave">
              De dónde salen las abundancias
            </summary>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-texto-suave">
              {AVISO_ABUNDANCIAS_ESTIMADAS}
            </p>
          </details>

          {/* Los artículos de la provincia, enlazados desde la propia
              provincia. Estaban escritos y solo se llegaba a ellos desde el
              blog: la página que recibe las visitas no los mencionaba. */}
          <div className="mt-8">
            <ArticulosRelacionados
              articulos={articulos}
              titulo={`Guías de pesca en ${provincia.nombre}`}
            />
          </div>

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
