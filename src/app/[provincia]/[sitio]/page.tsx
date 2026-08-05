import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { AvisoLegal } from "@/components/AvisoLegal";
import { BarraAbundancia } from "@/components/BarraAbundancia";
import { CapturasDelSitio } from "@/components/CapturasDelSitio";
import { BandaSitio } from "@/components/BandaSitio";
import { DatosEstructurados } from "@/components/DatosEstructurados";
import { MejorEpoca } from "@/components/MejorEpoca";
import { EtiquetaLegal } from "@/components/SemaforoLegal";
import { SubirFoto } from "@/components/SubirFoto";
import {
  AVISO_ABUNDANCIAS_ESTIMADAS,
  AVISO_COORDENADAS_APROXIMADAS,
} from "@/lib/avisos";
import {
  ETIQUETA_DIFICULTAD,
  ETIQUETA_PROBABILIDAD,
  ETIQUETA_TIPO_APAREJO,
  ETIQUETA_TIPO_SITIO,
  TIPOS_APAREJO,
  type DificultadAcceso,
  type Probabilidad,
  type TipoAparejo,
  type TipoSitio,
} from "@/lib/enums";
import { metadatosDePagina } from "@/lib/marca";
import { usuarioOpcional } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cargarProvincia } from "@/lib/provincias";
import { schemaMigas, schemaSitio } from "@/lib/schema";
import { SelectorUbicacion } from "@/components/SelectorUbicacion";
import {
  distanciaKm,
  formatearKm,
  formatearTiempo,
  tiempoEnCocheAprox,
} from "@/lib/ubicacion";
import { ubicacionActual } from "@/lib/ubicacion-servidor";

export const dynamic = "force-dynamic";

async function cargarSitio(provinciaSlug: string, slug: string) {
  return prisma.sitio.findFirst({
    where: { slug, provincia: { slug: provinciaSlug, publicada: true } },
    include: {
      especies: {
        include: { especie: true },
        orderBy: { abundancia: "desc" },
      },
      aparejos: {
        where: { recomendado: true },
        include: { aparejo: true },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provincia: string; sitio: string }>;
}): Promise<Metadata> {
  const { provincia, sitio } = await params;
  const datos = await prisma.sitio.findFirst({
    where: { slug: sitio, provincia: { slug: provincia, publicada: true } },
    select: {
      nombre: true,
      tipo: true,
      municipio: true,
      descripcion: true,
      imagenUrl: true,
      provincia: { select: { nombre: true } },
    },
  });
  if (!datos) return { title: "Sitio" };

  return metadatosDePagina({
    titulo: `${datos.nombre}: qué se pesca y cómo llegar`,
    descripcion:
      datos.descripcion.slice(0, 155) ||
      `Pesca en ${datos.nombre}, ${datos.municipio} (${datos.provincia.nombre}).`,
    ruta: `/${provincia}/${sitio}`,
    tipo: "article",
    // La foto del embalse es lo que se ve al compartir el enlace. Sin ella,
    // WhatsApp y Twitter enseñan una tarjeta vacía y nadie la abre.
    imagen: datos.imagenUrl,
  });
}

const CLASE_PROBABILIDAD: Record<Probabilidad, string> = {
  alta: "bg-verde-fondo text-verde-texto",
  media: "bg-ambar-fondo text-ambar-texto",
  baja: "bg-chip-fondo text-chip-texto",
};

/** Especies que ni siquiera se pueden buscar en esta provincia. */
const NO_SE_PUEDEN_BUSCAR = new Set(["prohibida", "invasora_no_pescable"]);

type FilaEspecieDatos = Prisma.SitioEspecieGetPayload<{
  include: { especie: true };
}>;

function FilaEspecie({
  se,
  atenuada = false,
}: {
  se: FilaEspecieDatos;
  atenuada?: boolean;
}) {
  return (
    <li className="tarjeta p-4">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/especies/${se.especie.slug}`}
          className="text-lg font-bold leading-tight underline-offset-2 hover:underline"
        >
          {se.especie.nombreComun}
        </Link>
        <BarraAbundancia valor={se.abundancia} />
      </div>

      <p className="mt-1 text-sm italic text-texto-suave">
        {se.especie.nombreCientifico}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* En las que no se pueden pescar, la probabilidad va en gris: un
            "probabilidad alta" en verde ahí se lee como una invitación. */}
        <span
          className={`rounded-lg px-2 py-1 text-xs font-bold ${
            atenuada
              ? "bg-chip-fondo text-chip-texto"
              : (CLASE_PROBABILIDAD[se.probabilidadCaptura as Probabilidad] ??
                "bg-chip-fondo text-chip-texto")
          }`}
        >
          {ETIQUETA_PROBABILIDAD[se.probabilidadCaptura as Probabilidad] ??
            se.probabilidadCaptura}
        </span>
        <EtiquetaLegal estado={se.especie.estadoLegal} />
        {!atenuada && se.mejorTecnica && (
          <span className="rounded-lg bg-chip-fondo px-2 py-1 text-xs font-bold text-chip-texto">
            A {se.mejorTecnica}
          </span>
        )}
      </div>

      {se.notas && <p className="mt-3 leading-relaxed">{se.notas}</p>}
    </li>
  );
}

export default async function FichaSitio({
  params,
}: {
  params: Promise<{ provincia: string; sitio: string }>;
}) {
  const { provincia: slugProvincia, sitio: slugSitio } = await params;
  const provincia = await cargarProvincia(slugProvincia);
  const [sitio, usuario, ubicacion] = await Promise.all([
    cargarSitio(slugProvincia, slugSitio),
    usuarioOpcional(),
    ubicacionActual(),
  ]);
  if (!sitio) notFound();

  // Si el visitante ha dicho de dónde sale, el dato de cabecera es el suyo. El
  // de Dos Hermanas solo le sirve a quien vive en Dos Hermanas.
  const desdeMiCasaKm = ubicacion ? distanciaKm(ubicacion, sitio) : null;

  const avisoGrave = sitio.avisosSanitarios
    .toUpperCase()
    .includes("AVISO SANITARIO GRAVE");

  // Las especies van en dos bloques. Si se ordenan solo por abundancia, en
  // sitios como el Guadaíra el primero de la lista es el cangrejo rojo, con su
  // "probabilidad alta" en verde, que es exactamente el mensaje contrario al
  // que dice la ley. Las que ni se pueden buscar van aparte y al final.
  const pescables = sitio.especies.filter(
    (se) => !NO_SE_PUEDEN_BUSCAR.has(se.especie.estadoLegal),
  );
  const noPescables = sitio.especies.filter((se) =>
    NO_SE_PUEDEN_BUSCAR.has(se.especie.estadoLegal),
  );

  // Los aparejos, agrupados por tipo y en el orden en que se usan: primero con
  // qué pescas, luego con qué lo montas, y al final con qué cebas.
  const aparejosPorTipo = TIPOS_APAREJO.map((tipo) => ({
    tipo,
    items: sitio.aparejos
      .filter((a) => a.aparejo.tipo === tipo)
      .sort((a, b) => a.aparejo.nombre.localeCompare(b.aparejo.nombre, "es")),
  })).filter((g) => g.items.length > 0);

  return (
    <article className="contenedor py-10 md:py-14">
      <DatosEstructurados
        schema={[
          schemaSitio({
            nombre: sitio.nombre,
            descripcion: sitio.descripcion,
            municipio: sitio.municipio,
            latitud: sitio.latitud,
            longitud: sitio.longitud,
            imagenUrl: sitio.imagenUrl,
            ruta: `/${provincia.slug}/${sitio.slug}`,
            provincia: provincia.nombre,
          }),
          schemaMigas([
            { nombre: "Inicio", ruta: "/" },
            { nombre: `Pescar en ${provincia.nombre}`, ruta: `/${provincia.slug}` },
            {
              nombre: sitio.nombre,
              ruta: `/${provincia.slug}/${sitio.slug}`,
            },
          ]),
        ]}
      />

      {/* Cabecera con imagen siempre, no solo cuando hay foto: sin ella la
          ficha empezaba con un título suelto sobre fondo beige y no se
          distinguía un embalse de otro. Si no hay foto entra la ilustración
          con el tono del tipo de agua. */}
      <header className="relative isolate mb-8 overflow-hidden rounded-2xl">
        <div aria-hidden className="absolute inset-0 -z-10">
          <BandaSitio
            tipo={sitio.tipo}
            imagenUrl={sitio.imagenUrl}
            slug={sitio.slug}
            className="h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
        </div>

        <div className="flex min-h-[16rem] flex-col justify-end p-5 sm:min-h-[20rem] md:p-8">
          {/* Las mismas migas que se declaran en JSON-LD: Google penaliza
              marcar una ruta de navegación que el visitante no ve. */}
          <nav
            aria-label="Migas de pan"
            className="mb-3 flex flex-wrap items-center gap-x-2 text-sm"
          >
            <Link href="/" className="text-white/75 underline underline-offset-2">
              Inicio
            </Link>
            <span aria-hidden className="text-white/60">
              ›
            </span>
            <Link
              href={`/${provincia.slug}`}
              className="font-semibold text-white underline underline-offset-2"
            >
              Pescar en {provincia.nombre}
            </Link>
          </nav>

          <p className="text-sm font-bold uppercase tracking-wide text-white/85 [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
            {ETIQUETA_TIPO_SITIO[sitio.tipo as TipoSitio]} · {sitio.municipio}
          </p>
          <h1 className="titulo-pagina mt-1 font-bold text-white [text-shadow:0_2px_10px_rgb(0_0_0/0.5)]">
            {sitio.nombre}
          </h1>

          {/* El crédito de la foto: las de Commons son Creative Commons y
              obligan a atribuir. */}
          {sitio.imagenUrl && sitio.imagenAutor && (
            <p className="mt-3 text-xs text-white/60">
              Foto: {sitio.imagenAutor}
              {sitio.imagenLicencia && ` · ${sitio.imagenLicencia}`}
              {sitio.imagenFuente && (
                <>
                  {" · "}
                  <a
                    href={sitio.imagenFuente}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    Wikimedia Commons ↗
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      </header>

      {usuario?.esAdmin && (
        <SubirFoto
          tipo="sitio"
          slug={sitio.slug}
          nombre={sitio.nombre}
          tieneFoto={Boolean(sitio.imagenUrl)}
        />
      )}

      {/* Lo urgente primero: si hay un aviso sanitario grave, se ve antes que
          nada, y a ancho completo en las dos versiones. */}
      {avisoGrave && (
        <section
          role="alert"
          className="mb-8 rounded-xl border-2 border-rojo-texto/40 bg-rojo-fondo p-4 text-rojo-texto"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <span aria-hidden>⚠️</span> Aviso sanitario
          </h2>
          <p className="mt-2 leading-relaxed">{sitio.avisosSanitarios}</p>
        </section>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-10">
      {/* Columna principal */}
      <div className="space-y-8">

      <section className="lg:hidden">
        <h2 className="sr-only">Datos generales</h2>
        <dl className="grid grid-cols-2 gap-3">
        {desdeMiCasaKm !== null ? (
          <Dato titulo={`Desde ${ubicacion!.etiqueta}`}>
            aprox. {formatearTiempo(tiempoEnCocheAprox(desdeMiCasaKm))} ·{" "}
            {formatearKm(desdeMiCasaKm)}
          </Dato>
        ) : (
          <Dato titulo="Desde Dos Hermanas">
            {sitio.tiempoCocheMin} min · {sitio.distanciaDesdeDosHermanasKm} km
          </Dato>
        )}
        <Dato titulo="Acceso">
          {ETIQUETA_DIFICULTAD[sitio.dificultadAcceso as DificultadAcceso].replace(
            "Acceso ",
            "",
          )}
        </Dato>
        <Dato titulo="Sombra">{sitio.tieneSombra ? "Sí" : "No"}</Dato>
        <Dato titulo="Navegable">{sitio.navegable ? "Sí" : "No"}</Dato>
        {sitio.capacidadHm3 !== null && (
          <Dato titulo="Capacidad">{sitio.capacidadHm3} hm³</Dato>
        )}
        </dl>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Qué es</h2>
        <p className="max-w-prose leading-relaxed">{sitio.descripcion}</p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">Cómo se llega</h2>
        <p className="max-w-prose leading-relaxed">{sitio.accesoDescripcion}</p>

        {/* Aquí es donde alguien se pregunta cuánto tarda, así que aquí es
            donde tiene sentido poder decir de dónde sale. Solo se monta una
            vez en la página: el formulario lleva ids y duplicarlo los rompe. */}
        <div className="mt-4">
          <SelectorUbicacion actual={ubicacion} variante="linea" />
          {desdeMiCasaKm !== null && (
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-texto-suave">
              Los {formatearTiempo(tiempoEnCocheAprox(desdeMiCasaKm))} son una
              estimación a partir de la línea recta, no una ruta: por carretera
              de montaña o con el embalse al final de un carril, cuenta más.
            </p>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-texto-suave">
          {AVISO_COORDENADAS_APROXIMADAS}
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${sitio.latitud},${sitio.longitud}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-touch items-center rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold"
        >
          Abrir en Google Maps ↗
        </a>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Mejor época</h2>
        <MejorEpoca json={sitio.mejorEpoca} />
      </section>

      <section>
        <h2 className="mb-1 text-xl font-bold">Qué hay</h2>
        <p className="mb-4 text-sm leading-relaxed text-texto-suave">
          {AVISO_ABUNDANCIAS_ESTIMADAS}
        </p>

        {pescables.length > 0 && (
          <>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-texto-suave">
              Lo que puedes pescar
            </h3>
            <ul className="grid gap-3 xl:grid-cols-2">
              {pescables.map((se) => (
                <FilaEspecie key={se.especieId} se={se} />
              ))}
            </ul>
          </>
        )}

        {noPescables.length > 0 && (
          <>
            <h3 className="mt-6 mb-1 text-sm font-bold uppercase tracking-wide text-texto-suave">
              También hay, pero no se pueden pescar
            </h3>
            <p className="mb-2 text-sm leading-relaxed text-texto-suave">
              No se pueden buscar. Van aquí para que sepas identificarlas y qué
              hacer si caen por accidente.
            </p>
            <ul className="grid gap-3 xl:grid-cols-2">
              {noPescables.map((se) => (
                <FilaEspecie key={se.especieId} se={se} atenuada />
              ))}
            </ul>
          </>
        )}
      </section>

      <CapturasDelSitio sitioId={sitio.id} sitioSlug={sitio.slug} />

      <section>
        <h2 className="mb-3 text-xl font-bold">Qué llevar aquí</h2>
        {aparejosPorTipo.length === 0 ? (
          <p className="text-texto-suave">Sin recomendaciones todavía.</p>
        ) : (
          <div className="space-y-5">
            {aparejosPorTipo.map((g) => (
              <div key={g.tipo}>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-texto-suave">
                  {ETIQUETA_TIPO_APAREJO[g.tipo as TipoAparejo]}
                </h3>
                <ul className="space-y-2">
                  {g.items.map((as) => (
                    <li
                      key={as.aparejoId}
                      className="tarjeta p-3"
                    >
                      <p className="font-semibold">{as.aparejo.nombre}</p>
                      {as.notas && (
                        <p className="mt-1 text-[0.95rem] leading-relaxed text-texto-suave">
                          {as.notas}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      </div>

      {/* Columna lateral: los datos duros y todo lo legal, siempre a la vista
          en escritorio mientras se lee el resto. */}
      <aside className="mt-8 space-y-6 lg:mt-0 lg:sticky lg:top-6">

      <section className="hidden lg:block">
        <h2 className="sr-only">Datos generales</h2>
        <dl className="grid grid-cols-2 gap-3">
          {desdeMiCasaKm !== null ? (
            <Dato titulo={`Desde ${ubicacion!.etiqueta}`}>
              aprox. {formatearTiempo(tiempoEnCocheAprox(desdeMiCasaKm))} ·{" "}
              {formatearKm(desdeMiCasaKm)}
            </Dato>
          ) : (
            <Dato titulo="Desde Dos Hermanas">
              {sitio.tiempoCocheMin} min · {sitio.distanciaDesdeDosHermanasKm} km
            </Dato>
          )}
          <Dato titulo="Acceso">
            {ETIQUETA_DIFICULTAD[
              sitio.dificultadAcceso as DificultadAcceso
            ].replace("Acceso ", "")}
          </Dato>
          <Dato titulo="Sombra">{sitio.tieneSombra ? "Sí" : "No"}</Dato>
          <Dato titulo="Navegable">{sitio.navegable ? "Sí" : "No"}</Dato>
          {sitio.capacidadHm3 !== null && (
            <Dato titulo="Capacidad">{sitio.capacidadHm3} hm³</Dato>
          )}
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Antes de ir</h2>
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-ambar-texto/25 bg-ambar-fondo p-4 text-ambar-texto">
            <h3 className="font-bold">Normativa de este sitio</h3>
            <p className="mt-1 leading-relaxed">{sitio.notasLegales}</p>
          </div>

          {!avisoGrave && sitio.avisosSanitarios && (
            <div className="tarjeta p-4">
              <h3 className="font-bold">Salud y seguridad</h3>
              <p className="mt-1 leading-relaxed">{sitio.avisosSanitarios}</p>
            </div>
          )}

          {sitio.urlNivelAgua && (
            <a
              href={sitio.urlNivelAgua}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-touch items-center rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold"
            >
              Consultar el nivel del agua en embalses.net ↗
            </a>
          )}

          <AvisoLegal variante="destacado" />
        </div>
      </section>

      <Link
        href={`/capturas/nueva?sitio=${sitio.slug}`}
        className="flex min-h-touch items-center justify-center rounded-xl bg-acento px-6 text-lg font-bold text-acento-texto"
      >
        Registrar captura aquí
      </Link>

      </aside>
      </div>
    </article>
  );
}

function Dato({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tarjeta p-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-texto-suave">
        {titulo}
      </dt>
      <dd className="mt-0.5 font-semibold">{children}</dd>
    </div>
  );
}
