import Link from "next/link";
import { FotoEspecie } from "@/components/FotoEspecie";
import { EtiquetaLegal } from "@/components/SemaforoLegal";
import { AVISO_ABUNDANCIAS_ESTIMADAS } from "@/lib/avisos";
import { ETIQUETA_PROBABILIDAD, type Probabilidad } from "@/lib/enums";
import { dondeEstaCadaEspecie } from "@/lib/guia";
import type { Ambito } from "@/lib/ranking";

/**
 * Dónde ir a por cada especie: los sitios donde más hay de cada una.
 *
 * Va en la página de especies, no en el ranking. El ranking es el marcador de
 * lo que ha pescado la gente; esto es guía, sale de las abundancias cargadas y
 * responde a otra pregunta: «quiero un black bass, ¿dónde voy?».
 */
export async function DondeEstaCadaEspecie({ ambito = {} }: { ambito?: Ambito }) {
  const especies = await dondeEstaCadaEspecie(ambito);
  if (especies.length === 0) return null;

  return (
    <div className="space-y-12">
      {/* --- Dónde ir a por cada especie --- */}
      {especies.length > 0 && (
        <section>
          <h2 className="titulo-seccion font-bold">
            Dónde ir a por cada especie
          </h2>
          <p className="mt-2 mb-5 max-w-prose leading-relaxed text-texto-suave">
            Los sitios donde más hay de cada una, de más a menos.{" "}
            {AVISO_ABUNDANCIAS_ESTIMADAS}
          </p>

          <ul className="grid gap-5 lg:grid-cols-2">
            {especies.map((e) => (
              <li key={e.slug} className="tarjeta overflow-hidden">
                <div className="flex items-center gap-4 border-b border-borde p-4">
                  <FotoEspecie
                    nombre={e.nombreComun}
                    imagenUrl={e.imagenUrl}
                    estadoLegal={e.estadoLegal}
                    className="h-16 w-16 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/especies/${e.slug}`}
                      className="text-lg font-bold leading-tight underline-offset-2 hover:underline"
                    >
                      {e.nombreComun}
                    </Link>
                    <p className="truncate text-sm italic text-texto-suave">
                      {e.nombreCientifico}
                    </p>
                    <div className="mt-1.5">
                      <EtiquetaLegal estado={e.estadoLegal} />
                    </div>
                  </div>
                </div>

                <ol className="divide-y divide-borde">
                  {e.sitios.map((s, i) => (
                    <li key={s.slug}>
                      <Link
                        href={`/${s.provincia}/${s.slug}`}
                        className="flex items-center gap-3 p-3 hover:bg-chip-fondo"
                      >
                        <span className="w-6 shrink-0 text-center font-bold tabular-nums text-texto-suave">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">
                            {s.nombre}
                          </span>
                          <span className="block truncate text-sm text-texto-suave">
                            {ETIQUETA_PROBABILIDAD[
                              s.probabilidadCaptura as Probabilidad
                            ] ?? s.probabilidadCaptura}
                            {s.mejorTecnica && ` · a ${s.mejorTecnica}`}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-texto-suave">
                          {s.tiempoCocheMin} min
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  );
}
