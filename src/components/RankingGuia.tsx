import Link from "next/link";
import { BandaSitio } from "@/components/BandaSitio";
import { FotoEspecie } from "@/components/FotoEspecie";
import { EtiquetaLegal } from "@/components/SemaforoLegal";
import { AVISO_ABUNDANCIAS_ESTIMADAS } from "@/lib/avisos";
import {
  ETIQUETA_PROBABILIDAD,
  ETIQUETA_TIPO_SITIO,
  type Probabilidad,
  type TipoSitio,
} from "@/lib/enums";
import { dondeEstaCadaEspecie, sitiosPorVariedad } from "@/lib/guia";
import type { Ambito } from "@/lib/ranking";

/**
 * La parte del ranking que no depende de que haya capturas.
 *
 * Sale de la guía: qué especies hay y en qué cantidad en cada sitio. Existe
 * porque un ranking vacío no le sirve a nadie —ni al visitante, que se va, ni a
 * Google, que no tiene qué indexar— y porque esta información ya la teníamos
 * cargada y contrastada; solo faltaba enseñarla ordenada.
 */

const NOMBRE_MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export async function RankingGuia({ ambito = {} }: { ambito?: Ambito }) {
  const mes = new Date().getMonth() + 1;

  const [especies, sitios] = await Promise.all([
    dondeEstaCadaEspecie(ambito),
    sitiosPorVariedad(ambito, mes),
  ]);

  if (especies.length === 0 && sitios.length === 0) return null;

  const enTemporada = sitios.filter((s) => s.enTemporada);

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

      {/* --- En su mejor época ahora mismo --- */}
      {enTemporada.length > 0 && (
        <section>
          <h2 className="titulo-seccion font-bold">
            En su mejor época en {NOMBRE_MES[mes - 1]}
          </h2>
          <p className="mt-2 mb-5 max-w-prose leading-relaxed text-texto-suave">
            {enTemporada.length === 1
              ? "Este sitio tiene marcado este mes como buena época."
              : `Estos ${enTemporada.length} sitios tienen marcado este mes como buena época.`}
          </p>

          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {enTemporada.slice(0, 6).map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/${s.provincia}/${s.slug}`}
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
                      <p className="truncate text-sm text-white/80">
                        {ETIQUETA_TIPO_SITIO[s.tipo as TipoSitio]} ·{" "}
                        {s.municipio}
                      </p>
                    </div>
                  </div>
                  <p className="p-4 text-[0.95rem] leading-snug">
                    <span className="text-texto-suave">Lo que más cae: </span>
                    <span className="font-semibold">
                      {s.principales.join(", ")}
                    </span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --- Sitios con más variedad --- */}
      {sitios.length > 0 && (
        <section>
          <h2 className="titulo-seccion font-bold">
            Los sitios con más variedad
          </h2>
          <p className="mt-2 mb-5 max-w-prose leading-relaxed text-texto-suave">
            Ordenados por cuántas especies pescables tienen anotadas y en qué
            cantidad. No quiere decir que sean los mejores un día concreto:
            quiere decir que hay más cosas que buscar.
          </p>

          <ol className="space-y-3">
            {sitios.map((s, i) => (
              <li key={s.slug}>
                <Link
                  href={`/${s.provincia}/${s.slug}`}
                  className="tarjeta tarjeta-enlace flex items-center gap-4 p-4"
                >
                  <span className="w-8 shrink-0 text-center text-xl font-bold tabular-nums text-texto-suave">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold leading-tight">
                      {s.nombre}
                      {s.enTemporada && (
                        <span className="ml-2 rounded-lg bg-verde-fondo px-2 py-0.5 text-xs font-bold text-verde-texto">
                          En temporada
                        </span>
                      )}
                    </span>
                    <span className="block text-sm text-texto-suave">
                      {ETIQUETA_TIPO_SITIO[s.tipo as TipoSitio]} · {s.municipio}
                    </span>
                    <span className="mt-1 block text-[0.95rem]">
                      <span className="text-texto-suave">
                        {s.especies === 1
                          ? "1 especie pescable: "
                          : `${s.especies} especies pescables: `}
                      </span>
                      <span className="font-semibold">
                        {s.principales.join(", ")}
                        {s.especies > s.principales.length && "…"}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-bold tabular-nums text-acento">
                      {s.tiempoCocheMin} min
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
