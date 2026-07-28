import Link from "next/link";
import { FotoEspecie } from "@/components/FotoEspecie";
import { EtiquetaLegal } from "@/components/SemaforoLegal";
import { formatearFechaCorta, formatearPeso } from "@/lib/formato";
import {
  rankingPorEspecie,
  rankingPorPescador,
  rankingPorPeso,
  rankingPorSitio,
  type Ambito,
} from "@/lib/ranking";

/** Colores del podio. Del cuarto para abajo, tarjeta normal. */
const PODIO = [
  "border-[#b8912f] bg-[#b8912f]/10",
  "border-[#9aa0a6] bg-[#9aa0a6]/10",
  "border-[#a9702f] bg-[#a9702f]/10",
];

/**
 * El ranking, servido igual para toda España y para una provincia. Lo único que
 * cambia es el ámbito de las consultas y los textos de cabecera.
 */
export async function Ranking({
  ambito = {},
  titulo,
  entradilla,
}: {
  ambito?: Ambito;
  titulo: string;
  entradilla: string;
}) {
  const [porPeso, porEspecie, porPescador, porSitio] = await Promise.all([
    rankingPorPeso(ambito, 10),
    rankingPorEspecie(ambito),
    rankingPorPescador(ambito),
    rankingPorSitio(ambito),
  ]);

  const hayAlgo = porEspecie.length > 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{titulo}</h1>
        <p className="mt-1 max-w-prose text-texto-suave">{entradilla}</p>
      </div>

      {!hayAlgo ? (
        <div className="tarjeta p-8 text-center">
          <p className="text-lg font-bold">Todavía no hay capturas</p>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-texto-suave">
            En cuanto se registre la primera, aquí saldrán las piezas más
            gordas, el récord de cada especie y quién va ganando.
          </p>
          <Link
            href="/capturas/nueva"
            className="mt-4 inline-flex min-h-touch items-center rounded-xl bg-acento px-5 font-bold text-acento-texto"
          >
            Registrar una captura
          </Link>
        </div>
      ) : (
        <>
          {/* --- Las más gordas --- */}
          <section>
            <h2 className="mb-1 text-xl font-bold">Las más gordas</h2>
            <p className="mb-3 text-texto-suave">
              Solo entran las capturas con el peso apuntado.
            </p>

            {porPeso.length === 0 ? (
              <p className="tarjeta p-4 leading-relaxed text-texto-suave">
                Todavía nadie ha apuntado el peso de una captura. Es el dato que
                mueve este ranking.
              </p>
            ) : (
              <ol className="space-y-3">
                {porPeso.map((c, i) => (
                  <li key={c.id}>
                    <Link
                      href={`/capturas/${c.id}`}
                      className={`flex items-center gap-3 overflow-hidden rounded-xl border-2 ${
                        PODIO[i] ?? "border-borde bg-fondo-elevado"
                      }`}
                    >
                      <span className="w-10 shrink-0 text-center text-2xl font-bold tabular-nums text-texto-suave">
                        {i + 1}
                      </span>

                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
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

                      <div className="min-w-0 flex-1 py-3">
                        <p className="text-xl font-bold tabular-nums text-acento">
                          {formatearPeso(c.pesoGramos)}
                          {c.longitudCm !== null && (
                            <span className="ml-2 text-base font-semibold text-texto-suave">
                              {c.longitudCm} cm
                            </span>
                          )}
                        </p>
                        <p className="truncate font-semibold">
                          {c.especie.nombreComun}
                        </p>
                        <p className="truncate text-sm text-texto-suave">
                          {c.usuario.nombre} · {c.sitio.nombre} ·{" "}
                          {formatearFechaCorta(c.fecha)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* --- Por especie --- */}
          <section>
            <h2 className="mb-1 text-xl font-bold">Por especie</h2>
            <p className="mb-3 text-texto-suave">
              Cuántas van de cada una y el récord de cada especie.
            </p>

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {porEspecie.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/capturas?especie=${e.slug}`}
                    className="flex h-full gap-3 tarjeta overflow-hidden"
                  >
                    <div className="w-20 shrink-0">
                      {e.record?.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.record.fotoUrl}
                          alt={e.nombreComun}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FotoEspecie
                          nombre={e.nombreComun}
                          imagenUrl={e.imagenUrl}
                          estadoLegal={e.estadoLegal}
                          className="h-full w-full"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 py-3 pr-3">
                      <h3 className="font-bold leading-tight">
                        {e.nombreComun}
                      </h3>
                      <p className="mt-0.5 text-sm font-semibold text-texto-suave">
                        {e.capturas === 1
                          ? "1 captura"
                          : `${e.capturas} capturas`}
                      </p>
                      {e.record ? (
                        <p className="mt-1 text-sm">
                          <span className="font-bold tabular-nums text-acento">
                            {formatearPeso(e.record.pesoGramos)}
                          </span>{" "}
                          <span className="text-texto-suave">
                            · {e.record.usuario}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-texto-suave">
                          Sin pesos apuntados
                        </p>
                      )}
                      <div className="mt-2">
                        <EtiquetaLegal estado={e.estadoLegal} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* --- Entre pescadores --- */}
          {porPescador.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-bold">Quién va ganando</h2>
              <div className="overflow-x-auto tarjeta">
                <table className="w-full min-w-[34rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-borde text-sm uppercase tracking-wide text-texto-suave">
                      <th className="px-4 py-3 font-bold">Pescador</th>
                      <th className="px-4 py-3 text-right font-bold">
                        Capturas
                      </th>
                      <th className="px-4 py-3 text-right font-bold">
                        Especies
                      </th>
                      <th className="px-4 py-3 text-right font-bold">
                        Peso total
                      </th>
                      <th className="px-4 py-3 text-right font-bold">
                        La mayor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {porPescador.map((p) => (
                      <tr key={p.id} className="border-b border-borde last:border-0">
                        <td className="px-4 py-3 font-bold">
                          <Link
                            href={`/capturas?usuario=${p.id}`}
                            className="text-acento underline underline-offset-2"
                          >
                            {p.nombre}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {p.capturas}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {p.especies}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {p.pesoTotal > 0 ? formatearPeso(p.pesoTotal) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.mejor ? (
                            <>
                              <span className="font-bold tabular-nums">
                                {formatearPeso(p.mejor.pesoGramos)}
                              </span>
                              <span className="block text-sm text-texto-suave">
                                {p.mejor.especie}
                              </span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* --- Por sitio --- */}
          {porSitio.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-bold">Dónde cae más</h2>
              <ul className="flex flex-wrap gap-2">
                {porSitio.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/${s.provincia.slug}/${s.slug}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold"
                    >
                      {s.nombre}
                      <span className="rounded-lg bg-acento px-2 py-0.5 text-sm font-bold tabular-nums text-acento-texto">
                        {s.capturas}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Link
            href="/capturas"
            className="inline-flex min-h-touch items-center rounded-xl border-2 border-borde bg-fondo-elevado px-5 font-bold"
          >
            Ver todas las capturas
          </Link>
        </>
      )}
    </div>
  );
}
