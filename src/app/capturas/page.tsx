import type { Metadata } from "next";
import Link from "next/link";
import { formatearFechaCorta, formatearPeso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { metadatosDePagina } from "@/lib/marca";

export const metadata: Metadata = metadatosDePagina({
  titulo: "Capturas de la comunidad",
  descripcion:
    "Lo último que se ha pescado y dónde: especie, peso y sitio de cada " +
    "captura registrada.",
  ruta: "/capturas",
});
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;

function uno(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

const POR_PAGINA = 60;

export default async function PaginaCapturas({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  // El filtro por persona va por id, nunca por email: la web es pública y el
  // email no tiene por qué acabar en una URL que se comparte.
  const usuarioId = uno(params.usuario);
  const especieSlug = uno(params.especie);
  const sitioSlug = uno(params.sitio);

  const where = {
    ...(usuarioId ? { usuarioId } : {}),
    ...(especieSlug ? { especie: { slug: especieSlug } } : {}),
    ...(sitioSlug ? { sitio: { slug: sitioSlug } } : {}),
  };

  const [capturas, total, especies, sitios, pescador] = await Promise.all([
    prisma.captura.findMany({
      where,
      orderBy: [{ fecha: "desc" }, { hora: "desc" }],
      take: POR_PAGINA,
      include: {
        usuario: { select: { id: true, nombre: true } },
        especie: { select: { nombreComun: true, slug: true } },
        sitio: { select: { nombre: true, slug: true } },
        fotos: { orderBy: { esPrincipal: "desc" }, take: 1 },
      },
    }),
    prisma.captura.count({ where }),
    // Especies y sitios son listas acotadas, así que se pueden pintar enteras.
    // La de personas no: con registro abierto puede crecer sin fin.
    prisma.especie.findMany({
      where: { capturas: { some: {} } },
      orderBy: { nombreComun: "asc" },
      select: { slug: true, nombreComun: true },
    }),
    prisma.sitio.findMany({
      where: { capturas: { some: {} }, provincia: { publicada: true } },
      orderBy: { nombre: "asc" },
      select: { slug: true, nombre: true },
    }),
    usuarioId
      ? prisma.usuario.findUnique({
          where: { id: usuarioId },
          select: { nombre: true },
        })
      : Promise.resolve(null),
  ]);

  const filtrando = Boolean(usuarioId || especieSlug || sitioSlug);

  return (
    <div className="contenedor space-y-6 py-10 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Capturas</h1>
          <p className="mt-1 text-texto-suave">
            {total === 0
              ? "Todavía no hay nada."
              : total === 1
                ? "1 captura"
                : `${total} capturas`}
            {pescador && ` de ${pescador.nombre}`}
          </p>
        </div>
        <Link
          href="/capturas/nueva"
          className="inline-flex min-h-touch items-center rounded-xl bg-acento px-5 font-bold text-acento-texto"
        >
          Registrar captura
        </Link>
      </div>

      {total > 0 && (
        <div className="flex flex-wrap gap-2">
          <Chip href="/capturas" activo={!filtrando}>
            Todas
          </Chip>
          {pescador && (
            <Chip href={`/capturas?usuario=${usuarioId}`} activo>
              {pescador.nombre}
            </Chip>
          )}
          {especies.map((e) => (
            <Chip
              key={e.slug}
              href={`/capturas?especie=${e.slug}`}
              activo={especieSlug === e.slug}
            >
              {e.nombreComun}
            </Chip>
          ))}
          {sitios.map((s) => (
            <Chip
              key={s.slug}
              href={`/capturas?sitio=${s.slug}`}
              activo={sitioSlug === s.slug}
            >
              {s.nombre}
            </Chip>
          ))}
        </div>
      )}

      {capturas.length === 0 ? (
        <div className="tarjeta p-8 text-center">
          <p className="text-lg font-bold">
            {filtrando ? "Nada con ese filtro" : "Todavía no hay capturas"}
          </p>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-texto-suave">
            {filtrando
              ? "Prueba a quitar el filtro."
              : "En cuanto se registre la primera aparecerá aquí, y con ella " +
                "empezarán a salir las estadísticas y el ranking."}
          </p>
          <Link
            href={filtrando ? "/capturas" : "/capturas/nueva"}
            className="mt-4 inline-flex min-h-touch items-center rounded-xl bg-acento px-5 font-bold text-acento-texto"
          >
            {filtrando ? "Ver todas" : "Registrar la primera"}
          </Link>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {capturas.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/capturas/${c.id}`}
                  className="flex h-full flex-col tarjeta overflow-hidden"
                >
                  <div className="relative aspect-square bg-chip-fondo">
                    {c.fotos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.fotos[0].url}
                        alt={c.especie.nombreComun}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-sm text-texto-suave">
                        Sin foto
                      </span>
                    )}
                    {c.pesoGramos !== null && (
                      <span className="absolute bottom-0 left-0 rounded-tr-lg bg-acento px-2 py-1 text-sm font-bold text-acento-texto tabular-nums">
                        {formatearPeso(c.pesoGramos)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-auto flex-col p-3">
                    <p className="font-bold leading-tight">
                      {c.especie.nombreComun}
                    </p>
                    <p className="mt-0.5 text-sm text-texto-suave">
                      {c.sitio.nombre}
                    </p>
                    <p className="mt-auto pt-2 text-sm text-texto-suave">
                      {c.usuario.nombre} · {formatearFechaCorta(c.fecha)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {total > capturas.length && (
            <p className="text-center text-texto-suave">
              Se muestran las {capturas.length} más recientes de {total}.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Chip({
  href,
  activo,
  children,
}: {
  href: string;
  activo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={activo ? "true" : undefined}
      className={`inline-flex min-h-11 items-center rounded-xl border-2 px-3 text-sm font-semibold ${
        activo
          ? "border-acento bg-acento text-acento-texto"
          : "border-borde bg-fondo-elevado"
      }`}
    >
      {children}
    </Link>
  );
}
