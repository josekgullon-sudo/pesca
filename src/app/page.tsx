import type { Metadata } from "next";
import Link from "next/link";
import { BandaSitio } from "@/components/BandaSitio";
import { FotoEspecie } from "@/components/FotoEspecie";
import { MapaSitios } from "@/components/MapaSitios";
import { Portada } from "@/components/Portada";
import { usuarioOpcional } from "@/lib/auth";
import { AVISO_COORDENADAS_APROXIMADAS } from "@/lib/avisos";
import { formatearFechaCorta, formatearPeso } from "@/lib/formato";
import { ETIQUETA_TIPO_SITIO, type TipoSitio } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { provinciasPublicadas, rutaDeSitios } from "@/lib/provincias";

// El título y la descripción los pone el layout —si se repitieran aquí, la
// plantilla «%s · Mapa de Pesca» dejaría el nombre dos veces—, así que solo
// hace falta la canónica, para que las visitas con ?utm_... no cuenten como
// otra portada distinta.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export const dynamic = "force-dynamic";

/** Mes actual, para saber qué sitios están en su mejor época. */
function mesActual() {
  return new Date().getMonth() + 1;
}

export default async function Home() {
  const usuario = await usuarioOpcional();
  const mes = mesActual();

  const [
    rutaSitios,
    provincias,
    sitios,
    ultimas,
    misCapturas,
    totalCapturas,
    especiesDistintas,
    mayor,
  ] = await Promise.all([
      rutaDeSitios(),
      provinciasPublicadas(),
      prisma.sitio.findMany({
        where: { provincia: { publicada: true } },
        orderBy: { tiempoCocheMin: "asc" },
        take: 20,
        select: {
          slug: true,
          nombre: true,
          tipo: true,
          municipio: true,
          tiempoCocheMin: true,
          mejorEpoca: true,
          latitud: true,
          longitud: true,
          avisosSanitarios: true,
          imagenUrl: true,
          imagenAutor: true,
          imagenLicencia: true,
          provincia: { select: { slug: true } },
        },
      }),
      prisma.captura.findMany({
        orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
        take: 6,
        include: {
          usuario: { select: { nombre: true } },
          especie: { select: { nombreComun: true, estadoLegal: true, imagenUrl: true } },
          sitio: { select: { nombre: true } },
          fotos: { orderBy: { esPrincipal: "desc" }, take: 1 },
        },
      }),
      usuario
        ? prisma.captura.count({ where: { usuarioId: usuario.id } })
        : Promise.resolve(0),
      prisma.captura.count(),
      prisma.captura
        .findMany({ distinct: ["especieId"], select: { especieId: true } })
        .then((r) => r.length),
      prisma.captura.findFirst({
        where: { pesoGramos: { not: null } },
        orderBy: { pesoGramos: "desc" },
        select: {
          id: true,
          pesoGramos: true,
          especie: { select: { nombreComun: true } },
          usuario: { select: { nombre: true } },
        },
      }),
    ]);

  // "En temporada": los que tienen este mes marcado como buena época.
  const enTemporada = sitios.filter((s) => {
    try {
      const meses: unknown = JSON.parse(s.mejorEpoca);
      return Array.isArray(meses) && meses.includes(mes);
    } catch {
      return false;
    }
  });
  const destacados = (enTemporada.length >= 3 ? enTemporada : sitios).slice(0, 3);

  // Los puntos del mapa de la portada. Se pintan todos los sitios cargados, no
  // solo los destacados: el mapa vale precisamente para ver el conjunto.
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
    provincia: s.provincia.slug,
  }));

  // Para la portada, la foto de uno de los sitios que están en su mejor época.
  const fotoPortada =
    destacados.find((s) => s.imagenUrl) ?? sitios.find((s) => s.imagenUrl) ?? null;

  return (
    <div>
      {/* --- Portada a sangre: la foto ocupa la pantalla de borde a borde y el
          titular va encima, no debajo. Es lo primero que ve quien llega de
          Google y tiene que decir de qué va esto en dos segundos. --- */}
      {/* La foto va de fondo y el contenido manda en la altura: con altura fija
          y el texto colocado encima en absoluto, en un móvil estrecho el
          titular crecía hacia arriba y se salía por encima de la cabecera. */}
      <section className="relative isolate">
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          {/* Si algún sitio tiene ya su foto, la portada la usa; si no, la
              ilustración. Así la web mejora sola según se van bajando fotos. */}
          {fotoPortada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoPortada.imagenUrl ?? ""}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Portada className="h-full w-full" />
          )}

          {/* Oscurecido de arriba abajo: abajo para que se lea el texto, arriba
              para que la cabecera pegajosa no se pierda sobre una foto clara. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30" />
        </div>

        {fotoPortada?.imagenAutor && (
          <p className="absolute top-3 right-4 text-[0.7rem] text-white/55">
            {fotoPortada.nombre} · {fotoPortada.imagenAutor}
            {fotoPortada.imagenLicencia && ` · ${fotoPortada.imagenLicencia}`}
          </p>
        )}

        <div className="contenedor flex min-h-[22rem] flex-col justify-end py-12 sm:min-h-[26rem] md:py-16 lg:min-h-[32rem]">
          <p className="text-sm font-bold uppercase tracking-widest text-white/85 [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
            {usuario ? `Hola, ${usuario.nombre}` : "Guía de pesca continental"}
          </p>
          <h1 className="titulo-hero mt-2 max-w-3xl font-bold text-white [text-shadow:0_2px_12px_rgb(0_0_0/0.5)]">
            {usuario ? "¿Nos vamos a pescar?" : "Dónde pescar en España"}
          </h1>

          {!usuario && (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85 [text-shadow:0_1px_6px_rgb(0_0_0/0.5)] md:text-xl">
              Embalses y ríos con sus especies, qué llevar para pescarlas y qué
              dice la ley de cada una, provincia por provincia. Se consulta sin
              cuenta.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={rutaSitios}
              className="inline-flex min-h-touch items-center justify-center rounded-xl bg-acento px-8 text-lg font-bold text-acento-texto shadow-elevada hover:brightness-110"
            >
              Ver dónde ir
            </Link>
            <Link
              href={usuario ? "/capturas/nueva" : "/ranking"}
              className="inline-flex min-h-touch items-center justify-center rounded-xl border-2 border-white/40 bg-white/10 px-8 text-lg font-bold text-white backdrop-blur-sm hover:bg-white/20"
            >
              {usuario ? "Registrar captura" : "Ver el ranking"}
            </Link>
          </div>
        </div>
      </section>

      <div className="contenedor space-y-16 py-12 md:py-16">
        {/* --- Qué es esto, para quien cae aquí desde Google y no sabe qué
            está mirando. --- */}
        <section className="grid gap-8 sm:grid-cols-3 sm:gap-10">
          <Argumento numero="1" titulo="Dónde ir">
            Embalses y tramos de río con lo que se pesca en cada uno, cómo es el
            acceso y cuánto se tarda en coche.
          </Argumento>
          <Argumento numero="2" titulo="Qué dice la ley">
            Cada especie con su semáforo: cuál te puedes llevar, cuál hay que
            devolver y cuál no se puede devolver al agua.
          </Argumento>
          <Argumento numero="3" titulo="Qué se está pescando">
            Las capturas de la gente, con foto y peso, y el ranking por especie
            y por sitio.
          </Argumento>
        </section>

        {/* --- Provincias --- */}
        <section id="provincias" className="scroll-mt-20">
          <h2 className="titulo-seccion font-bold">Elige provincia</h2>
          <p className="mt-2 mb-5 max-w-prose text-lg text-texto-suave">
            Cada provincia tiene su normativa y sus áreas delimitadas para
            especies invasoras, así que van por separado.
          </p>

          {/* La rejilla se ajusta a cuántas hay. Con una sola provincia, tres
              columnas dejaban la única tarjeta encogida en una esquina y la
              sección parecía rota en vez de recién empezada. */}
          <ul
            className={`grid gap-5 ${
              provincias.length >= 3
                ? "sm:grid-cols-2 lg:grid-cols-3"
                : provincias.length === 2
                  ? "sm:grid-cols-2"
                  : "max-w-3xl"
            }`}
          >
            {provincias.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/${p.slug}`}
                  className="tarjeta tarjeta-enlace flex h-full flex-col p-6"
                >
                  <h3 className="text-xl font-bold leading-tight">
                    Pescar en {p.nombre}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-acento">
                    {p.comunidad} ·{" "}
                    {p._count.sitios === 1
                      ? "1 sitio"
                      : `${p._count.sitios} sitios`}
                  </p>
                  {p.descripcion && (
                    <p
                      className={`mt-3 leading-relaxed text-texto-suave ${
                        provincias.length > 1 ? "line-clamp-4" : ""
                      }`}
                    >
                      {p.descripcion}
                    </p>
                  )}
                  <span className="mt-4 font-semibold text-acento underline underline-offset-4">
                    Ver los sitios de {p.nombre}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-5 max-w-prose leading-relaxed text-texto-suave">
            Vamos añadiendo provincias según conseguimos comprobar su normativa
            en el boletín oficial correspondiente. Publicar una a medias sería
            peor que no publicarla.
          </p>
        </section>

        {/* --- El mapa, en la portada. Buscar dónde pescar es una pregunta
            geográfica: la mayoría quiere ver qué tiene cerca antes que leer
            una lista ordenada por minutos en coche. --- */}
        {puntos.length > 0 && (
          <section>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="titulo-seccion font-bold">Dónde están</h2>
                <p className="mt-1 text-lg text-texto-suave">
                  {puntos.length === 1
                    ? "El sitio de la guía en el mapa."
                    : `Los ${puntos.length} sitios de la guía en el mapa.`}{" "}
                  Pulsa un punto para abrir su ficha.
                </p>
              </div>
              {rutaSitios !== "/" && (
                <Link
                  href={`${rutaSitios}/mapa`}
                  className="font-semibold text-acento underline underline-offset-4"
                >
                  Abrir el mapa completo
                </Link>
              )}
            </div>

            <div className="h-[24rem] overflow-hidden rounded-2xl border border-borde md:h-[32rem]">
              <MapaSitios sitios={puntos} />
            </div>

            <p className="mt-3 max-w-prose text-sm leading-relaxed text-texto-suave">
              {AVISO_COORDENADAS_APROXIMADAS} El mapa necesita conexión: las
              teselas vienen de OpenStreetMap.
            </p>
          </section>
        )}

        {/* --- Sitios destacados de la provincia con datos --- */}
        {destacados.length > 0 && (
          <section>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="titulo-seccion font-bold">
                  {enTemporada.length >= 3 ? "Ahora mismo" : "Para empezar"}
                </h2>
                <p className="mt-1 text-lg text-texto-suave">
                  {enTemporada.length >= 3
                    ? "Sitios que están en su mejor época este mes."
                    : "Algunos de los sitios de la guía."}
                </p>
              </div>
              <Link
                href={rutaSitios}
                className="font-semibold text-acento underline underline-offset-4"
              >
                Verlos todos
              </Link>
            </div>

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destacados.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/${s.provincia.slug}/${s.slug}`}
                    className="tarjeta tarjeta-enlace flex h-full flex-col overflow-hidden"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <BandaSitio
                        tipo={s.tipo}
                        imagenUrl={s.imagenUrl}
                        slug={s.slug}
                        className="foto-zoom absolute inset-0 h-full w-full"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <h3 className="text-lg font-bold leading-tight text-white [text-shadow:0_1px_4px_rgb(0_0_0/0.5)]">
                          {s.nombre}
                        </h3>
                        <p className="text-sm text-white/80">
                          {ETIQUETA_TIPO_SITIO[s.tipo as TipoSitio]} ·{" "}
                          {s.municipio}
                        </p>
                      </div>
                    </div>
                    <p className="p-4 font-bold tabular-nums text-acento">
                      A {s.tiempoCocheMin} min en coche
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* --- Últimas capturas --- */}
        {ultimas.length > 0 && (
          <section>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="titulo-seccion font-bold">Lo último que ha caído</h2>
              <Link
                href="/capturas"
                className="font-semibold text-acento underline underline-offset-4"
              >
                Ver todas
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {ultimas.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/capturas/${c.id}`}
                    className="tarjeta tarjeta-enlace block overflow-hidden"
                  >
                    <div className="aspect-square overflow-hidden">
                      {c.fotos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.fotos[0].url}
                          alt={c.especie.nombreComun}
                          className="foto-zoom h-full w-full object-cover"
                        />
                      ) : (
                        <FotoEspecie
                          nombre={c.especie.nombreComun}
                          imagenUrl={c.especie.imagenUrl}
                          estadoLegal={c.especie.estadoLegal}
                          className="h-full w-full"
                        />
                      )}
                    </div>
                    <p className="truncate px-3 pt-2 font-semibold">
                      {c.especie.nombreComun}
                    </p>
                    <p className="truncate px-3 pb-3 text-sm text-texto-suave">
                      {c.usuario.nombre} · {formatearFechaCorta(c.fecha)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* --- Marcador --- */}
        <section>
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="titulo-seccion font-bold">Cómo vamos</h2>
            <Link
              href="/ranking"
              className="font-semibold text-acento underline underline-offset-4"
            >
              Ver el ranking
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {usuario && <Marcador titulo="Tuyas" valor={misCapturas} />}
            <Marcador titulo="Capturas" valor={totalCapturas} />
            <Marcador titulo="Especies distintas" valor={especiesDistintas} />
            <Marcador
              titulo="La más gorda"
              valor={mayor ? (formatearPeso(mayor.pesoGramos) ?? "—") : "—"}
              pie={
                mayor
                  ? `${mayor.especie.nombreComun}, ${mayor.usuario.nombre}`
                  : undefined
              }
            />
          </dl>
        </section>

        {/* --- Empezar --- */}
        <section className="tarjeta overflow-hidden bg-ribera-800 p-8 text-center text-ribera-50 md:p-12">
          <h2 className="titulo-seccion font-bold">
            {usuario ? "¿Has pescado algo?" : "Apunta lo que pesques"}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg leading-relaxed text-ribera-100">
            Foto, peso y sitio. Con eso entras en el ranking y la guía se va
            afinando: las abundancias que trae de fábrica son estimaciones
            nuestras, y lo que de verdad cae lo dicen las capturas.
          </p>
          <Link
            href={usuario ? "/capturas/nueva" : "/registro"}
            className="mt-6 inline-flex min-h-touch items-center justify-center rounded-xl bg-ribera-50 px-8 text-lg font-bold text-ribera-900 hover:bg-white"
          >
            {usuario ? "Registrar captura" : "Crear cuenta y empezar"}
          </Link>
        </section>
      </div>
    </div>
  );
}

function Argumento({
  numero,
  titulo,
  children,
}: {
  numero: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t-2 border-acento pt-5">
      <p className="text-sm font-bold tabular-nums text-acento">{numero}</p>
      <h2 className="mt-1 text-xl font-bold">{titulo}</h2>
      <p className="mt-2 leading-relaxed text-texto-suave">{children}</p>
    </div>
  );
}

function Marcador({
  titulo,
  valor,
  pie,
}: {
  titulo: string;
  valor: number | string;
  pie?: string;
}) {
  return (
    <div className="tarjeta p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-texto-suave">
        {titulo}
      </dt>
      <dd className="mt-1 text-3xl font-bold tabular-nums text-acento">
        {valor}
      </dd>
      {pie && <p className="mt-0.5 text-xs text-texto-suave">{pie}</p>}
    </div>
  );
}
