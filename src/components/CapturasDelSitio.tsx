import Link from "next/link";
import { FotoEspecie } from "@/components/FotoEspecie";
import { formatearFechaCorta, formatearPeso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

/**
 * Lo que se ha pescado de verdad en este sitio.
 *
 * Va justo debajo de "qué hay", que son estimaciones nuestras: aquí abajo está
 * lo que ha caído. Con el tiempo esta sección vale más que la de arriba.
 */
export async function CapturasDelSitio({
  sitioId,
  sitioSlug,
}: {
  sitioId: string;
  sitioSlug: string;
}) {
  const [capturas, total, porEspecie] = await Promise.all([
    prisma.captura.findMany({
      where: { sitioId },
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      take: 12,
      select: {
        id: true,
        pesoGramos: true,
        fecha: true,
        usuario: { select: { nombre: true } },
        especie: {
          select: { nombreComun: true, estadoLegal: true, imagenUrl: true },
        },
        fotos: { orderBy: { esPrincipal: "desc" }, take: 1 },
      },
    }),
    prisma.captura.count({ where: { sitioId } }),
    prisma.captura.groupBy({
      by: ["especieId"],
      where: { sitioId },
      _count: { _all: true },
      orderBy: { _count: { especieId: "desc" } },
    }),
  ]);

  if (total === 0) {
    return (
      <section>
        <h2 className="mb-2 text-xl font-bold">Lo que se ha pescado aquí</h2>
        <p className="max-w-prose rounded-xl border border-borde bg-fondo-elevado p-4 leading-relaxed text-texto-suave">
          Todavía nadie ha registrado ninguna captura en este sitio. La primera
          que se apunte sale aquí.
        </p>
      </section>
    );
  }

  const especies = await prisma.especie.findMany({
    where: { id: { in: porEspecie.map((e) => e.especieId) } },
    select: { id: true, nombreComun: true },
  });
  const nombrePorId = new Map(especies.map((e) => [e.id, e.nombreComun]));

  return (
    <section>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold">Lo que se ha pescado aquí</h2>
        {total > capturas.length && (
          <Link
            href={`/capturas?sitio=${sitioSlug}`}
            className="font-semibold text-acento underline underline-offset-2"
          >
            Ver las {total}
          </Link>
        )}
      </div>

      <p className="mb-3 text-texto-suave">
        {total === 1 ? "1 captura registrada" : `${total} capturas registradas`}
        {porEspecie.length > 0 && (
          <>
            {": "}
            {porEspecie
              .map(
                (e) =>
                  `${nombrePorId.get(e.especieId) ?? "?"} (${e._count._all})`,
              )
              .join(", ")}
          </>
        )}
        .
      </p>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {capturas.map((c) => (
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
              <p className="truncate px-2 pt-1.5 text-xs font-semibold">
                {c.especie.nombreComun}
              </p>
              <p className="truncate px-2 pb-2 text-xs text-texto-suave">
                {c.pesoGramos !== null
                  ? formatearPeso(c.pesoGramos)
                  : c.usuario.nombre}{" "}
                · {formatearFechaCorta(c.fecha)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
