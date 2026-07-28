import type { Metadata } from "next";
import Link from "next/link";
import { BandaSitio } from "@/components/BandaSitio";
import { FotoEspecie } from "@/components/FotoEspecie";
import { Portada } from "@/components/Portada";
import { usuarioOpcional } from "@/lib/auth";
import { formatearFechaCorta, formatearPeso } from "@/lib/formato";
import { ETIQUETA_TIPO_SITIO, type TipoSitio } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { provinciasPublicadas } from "@/lib/provincias";

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

  const [provincias, sitios, ultimas, misCapturas, totalCapturas, especiesDistintas, mayor] =
    await Promise.all([
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

  // Para la portada, la foto de uno de los sitios que están en su mejor época.
  const fotoPortada =
    destacados.find((s) => s.imagenUrl) ?? sitios.find((s) => s.imagenUrl) ?? null;

  return (
    <div className="space-y-10 [&>section:not(:first-child)]:px-0">
      {/* --- Portada: ilustración a sangre con el titular encima --- */}
      <section className="-mx-4 -mt-6 md:-mx-6 md:-mt-10">
        <div className="relative">
          {/* Si algún sitio tiene ya su foto, la portada la usa; si no, la
              ilustración. Así la web mejora sola según se van bajando fotos. */}
          {fotoPortada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoPortada.imagenUrl ?? ""}
              alt={fotoPortada.nombre}
              className="h-56 w-full object-cover sm:h-72 md:h-80"
            />
          ) : (
            <Portada className="h-56 w-full sm:h-72 md:h-80" />
          )}

          {/* Degradado para que el texto se lea sobre cualquier parte del dibujo */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
          />

          {fotoPortada?.imagenAutor && (
            <p className="absolute top-2 right-3 text-[0.65rem] text-white/60">
              {fotoPortada.nombre} · {fotoPortada.imagenAutor}
              {fotoPortada.imagenLicencia && ` · ${fotoPortada.imagenLicencia}`}
            </p>
          )}

          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-white/85 [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
              {usuario ? `Hola, ${usuario.nombre}` : "Guía de pesca continental"}
            </p>
            <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight text-white [text-shadow:0_2px_8px_rgb(0_0_0/0.55)] sm:text-4xl md:text-5xl">
              {usuario ? "¿Nos vamos a pescar?" : "Dónde pescar en España"}
            </h1>
          </div>
        </div>

        <div className="px-4 pt-5 md:px-6">
          {!usuario && (
            <p className="max-w-prose text-lg leading-relaxed text-texto-suave">
              Embalses y ríos con sus especies, qué llevar para pescarlas y qué
              dice la ley de cada una, provincia por provincia. Se consulta sin
              cuenta.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sitios"
              className="flex min-h-touch flex-1 items-center justify-center rounded-xl bg-acento px-6 text-lg font-bold text-acento-texto shadow-tarjeta"
            >
              Ver dónde ir
            </Link>
            <Link
              href={usuario ? "/capturas/nueva" : "/ranking"}
              className="flex min-h-touch flex-1 items-center justify-center rounded-xl border-2 border-borde bg-fondo-elevado px-6 text-lg font-bold"
            >
              {usuario ? "Registrar captura" : "Ver el ranking"}
            </Link>
          </div>
        </div>
      </section>

      {/* --- Marcador entre los dos --- */}
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold">Cómo vamos</h2>
          <Link
            href="/ranking"
            className="font-semibold text-acento underline underline-offset-2"
          >
            Ver el ranking
          </Link>
        </div>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {usuario && <Marcador titulo="Tuyas" valor={misCapturas} />}
          <Marcador titulo="Capturas" valor={totalCapturas} />
          <Marcador titulo="Especies distintas" valor={especiesDistintas} />
          <Marcador
            titulo="La más gorda"
            valor={mayor ? (formatearPeso(mayor.pesoGramos) ?? "—") : "—"}
            pie={mayor ? `${mayor.especie.nombreComun}, ${mayor.usuario.nombre}` : undefined}
          />
        </dl>
        {totalCapturas === 0 && (
          <p className="mt-3 max-w-prose leading-relaxed text-texto-suave">
            Todo a cero de momento. En cuanto se registren capturas, aquí saldrá
            quién va ganando, y el ranking irá corrigiendo las abundancias que
            trae la guía de fábrica.
          </p>
        )}
      </section>

      {/* --- Últimas capturas --- */}
      {ultimas.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold">Lo último</h2>
            <Link
              href="/capturas"
              className="font-semibold text-acento underline underline-offset-2"
            >
              Ver el diario
            </Link>
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ultimas.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/capturas/${c.id}`}
                  className="block tarjeta overflow-hidden"
                >
                  <div className="aspect-square">
                    {c.fotos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.fotos[0].url}
                        alt={c.especie.nombreComun}
                        className="h-full w-full object-cover"
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
                  <p className="truncate px-2 py-1.5 text-xs font-semibold">
                    {c.especie.nombreComun}
                  </p>
                  <p className="truncate px-2 pb-2 text-xs text-texto-suave">
                    {c.usuario.nombre} · {formatearFechaCorta(c.fecha)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --- Provincias --- */}
      <section id="provincias" className="scroll-mt-4">
        <h2 className="text-xl font-bold">Elige provincia</h2>
        <p className="mt-1 mb-3 max-w-prose text-texto-suave">
          Cada provincia tiene su normativa y sus áreas delimitadas para
          especies invasoras, así que van por separado.
        </p>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {provincias.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/${p.slug}`}
                className="flex h-full flex-col tarjeta p-4"
              >
                <h3 className="text-lg font-bold leading-tight">
                  Pescar en {p.nombre}
                </h3>
                <p className="mt-0.5 text-sm text-texto-suave">
                  {p.comunidad} ·{" "}
                  {p._count.sitios === 1
                    ? "1 sitio"
                    : `${p._count.sitios} sitios`}
                </p>
                {p.descripcion && (
                  <p className="mt-2 line-clamp-3 text-[0.95rem] leading-relaxed text-texto-suave">
                    {p.descripcion}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-4 max-w-prose text-sm leading-relaxed text-texto-suave">
          Vamos añadiendo provincias según conseguimos comprobar su normativa en
          el boletín oficial correspondiente. Publicar una a medias sería peor
          que no publicarla.
        </p>
      </section>

      {/* --- Sitios destacados de la provincia con datos --- */}
      {destacados.length > 0 && (
        <section>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold">
              {enTemporada.length >= 3 ? "Ahora mismo" : "Para empezar"}
            </h2>
          </div>
          <p className="mb-3 text-texto-suave">
            {enTemporada.length >= 3
              ? "Sitios que están en su mejor época este mes."
              : "Algunos de los sitios de la guía."}
          </p>

          <ul className="grid gap-3 sm:grid-cols-3">
            {destacados.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/${s.provincia.slug}/${s.slug}`}
                  className="flex h-full flex-col tarjeta overflow-hidden"
                >
                  <BandaSitio tipo={s.tipo} imagenUrl={s.imagenUrl} slug={s.slug} />
                  <div className="p-4">
                    <h3 className="font-bold leading-tight">{s.nombre}</h3>
                    <p className="mt-0.5 text-sm text-texto-suave">
                      {ETIQUETA_TIPO_SITIO[s.tipo as TipoSitio]} · {s.municipio}
                    </p>
                    <p className="mt-2 font-bold tabular-nums text-acento">
                      {s.tiempoCocheMin} min
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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
