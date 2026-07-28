import Link from "next/link";
import { BandaSitio } from "@/components/BandaSitio";
import { FotoEspecie } from "@/components/FotoEspecie";
import { usuarioOpcional } from "@/lib/auth";
import { formatearFechaCorta, formatearPeso } from "@/lib/formato";
import { ETIQUETA_TIPO_SITIO, type TipoSitio } from "@/lib/enums";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Mes actual, para saber qué sitios están en su mejor época. */
function mesActual() {
  return new Date().getMonth() + 1;
}

export default async function Home() {
  const usuario = await usuarioOpcional();
  const mes = mesActual();

  const [sitios, ultimas, misCapturas, totalCapturas, especiesDistintas, mayor] =
    await Promise.all([
      prisma.sitio.findMany({
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

  return (
    <div className="space-y-10">
      {/* --- Portada --- */}
      <section>
        {usuario ? (
          <p className="font-semibold text-texto-suave">Hola, {usuario.nombre}</p>
        ) : (
          <p className="font-semibold text-texto-suave">
            Guía de pesca de la provincia de Sevilla
          </p>
        )}
        <h1 className="mt-1 text-4xl font-bold leading-tight tracking-tight">
          {usuario ? "¿Nos vamos a pescar?" : "Dónde pescar en Sevilla"}
        </h1>
        {!usuario && (
          <p className="mt-2 max-w-prose text-lg leading-relaxed text-texto-suave">
            Catorce embalses y ríos con sus especies, qué llevar para pescarlas
            y qué dice la ley de cada una. Todo se puede consultar sin cuenta;
            entrar solo hace falta para apuntar capturas.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sitios"
            className="flex min-h-touch flex-1 items-center justify-center rounded-xl bg-acento px-6 text-lg font-bold text-acento-texto"
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
                  className="block overflow-hidden rounded-xl border border-borde bg-fondo-elevado"
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

      {/* --- Sitios en su mejor época --- */}
      <section>
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold">
            {enTemporada.length >= 3 ? "Ahora mismo" : "Lo más cerca"}
          </h2>
          <Link
            href="/sitios"
            className="font-semibold text-acento underline underline-offset-2"
          >
            Ver los {sitios.length}
          </Link>
        </div>
        <p className="mb-3 text-texto-suave">
          {enTemporada.length >= 3
            ? "Sitios que están en su mejor época este mes."
            : "Los que menos coche te cuestan."}
        </p>

        <ul className="grid gap-3 sm:grid-cols-3">
          {destacados.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/sitios/${s.slug}`}
                className="flex h-full flex-col overflow-hidden rounded-xl border border-borde bg-fondo-elevado"
              >
                <BandaSitio tipo={s.tipo} imagenUrl={s.imagenUrl} />
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
    <div className="rounded-xl border border-borde bg-fondo-elevado p-4">
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
