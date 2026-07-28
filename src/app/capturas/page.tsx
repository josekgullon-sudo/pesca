import type { Metadata } from "next";
import Link from "next/link";
import { formatearFechaCorta, formatearPeso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Diario" };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;

function uno(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function PaginaCapturas({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const usuarioSlug = uno(params.usuario);
  const especieSlug = uno(params.especie);
  const sitioSlug = uno(params.sitio);

  const where = {
    ...(usuarioSlug ? { usuario: { email: usuarioSlug } } : {}),
    ...(especieSlug ? { especie: { slug: especieSlug } } : {}),
    ...(sitioSlug ? { sitio: { slug: sitioSlug } } : {}),
  };

  const [capturas, usuarios, especies, sitios] = await Promise.all([
    prisma.captura.findMany({
      where,
      orderBy: [{ fecha: "desc" }, { hora: "desc" }],
      take: 120,
      include: {
        usuario: { select: { nombre: true } },
        especie: { select: { nombreComun: true, estadoLegal: true, slug: true } },
        sitio: { select: { nombre: true, slug: true } },
        fotos: { orderBy: { esPrincipal: "desc" }, take: 1 },
      },
    }),
    prisma.usuario.findMany({
      orderBy: { nombre: "asc" },
      select: { nombre: true, email: true },
    }),
    prisma.especie.findMany({
      where: { capturas: { some: {} } },
      orderBy: { nombreComun: "asc" },
      select: { slug: true, nombreComun: true },
    }),
    prisma.sitio.findMany({
      where: { capturas: { some: {} } },
      orderBy: { nombre: "asc" },
      select: { slug: true, nombre: true },
    }),
  ]);

  const filtrando = Boolean(usuarioSlug || especieSlug || sitioSlug);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diario</h1>
          <p className="mt-1 text-texto-suave">
            {capturas.length === 0
              ? "Todavía no hay nada."
              : capturas.length === 1
                ? "1 captura"
                : `${capturas.length} capturas`}
          </p>
        </div>
        <Link
          href="/capturas/nueva"
          className="inline-flex min-h-touch items-center rounded-xl bg-acento px-5 font-bold text-acento-texto"
        >
          Registrar captura
        </Link>
      </div>

      {(usuarios.length > 0 || especies.length > 0) && capturas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Chip href="/capturas" activo={!filtrando}>
            Todas
          </Chip>
          {usuarios.map((u) => (
            <Chip
              key={u.email}
              href={`/capturas?usuario=${encodeURIComponent(u.email)}`}
              activo={usuarioSlug === u.email}
            >
              {u.nombre}
            </Chip>
          ))}
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
        <div className="rounded-xl border border-borde bg-fondo-elevado p-8 text-center">
          <p className="text-lg font-bold">
            {filtrando ? "Nada con ese filtro" : "El diario está vacío"}
          </p>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-texto-suave">
            {filtrando
              ? "Prueba a quitar el filtro."
              : "Cuando registréis la primera captura aparecerá aquí, y con ella " +
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
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {capturas.map((c) => (
            <li key={c.id}>
              <Link
                href={`/capturas/${c.id}`}
                className="flex h-full flex-col overflow-hidden rounded-xl border border-borde bg-fondo-elevado"
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
