import Link from "next/link";
import { BandaSitio } from "./BandaSitio";
import { NivelCompacto } from "./NivelDelAgua";
import {
  formatearKm,
  formatearTiempo,
  tiempoEnCocheAprox,
} from "@/lib/ubicacion";
import {
  ETIQUETA_DIFICULTAD,
  ETIQUETA_TIPO_SITIO,
  type DificultadAcceso,
  type TipoSitio,
} from "@/lib/enums";

export type SitioTarjeta = {
  /** Distancia en línea recta desde donde esté el visitante, si la ha dado. */
  distanciaUsuarioKm?: number;
  slug: string;
  nombre: string;
  tipo: string;
  municipio: string;
  dificultadAcceso: string;
  tiempoCocheMin: number;
  distanciaDesdeDosHermanasKm: number;
  tieneSombra: boolean;
  avisosSanitarios: string;
  esAreaDelimitadaEEI: boolean;
  eeiComprobado: boolean;
  nivelPorcentaje?: number | null;
  nivelHm3?: number | null;
  capacidadHm3?: number | null;
  nivelFecha?: Date | null;
  nivelFuente?: string | null;
  imagenUrl: string | null;
  especies: {
    abundancia: number;
    especie: { nombreComun: string; estadoLegal: string };
  }[];
};

/** Un aviso sanitario grave tiene que verse desde el listado, no solo dentro. */
function esAvisoGrave(texto: string) {
  return texto.toUpperCase().includes("AVISO SANITARIO GRAVE");
}

/**
 * Especies que ni siquiera se pueden buscar. Quedan fuera del resumen de "lo
 * que más cae": el cangrejo rojo es lo más abundante del Guadaíra, pero
 * anunciarlo como reclamo sería justo lo contrario de lo que dice la ley.
 * Las de devolución obligatoria sí entran: se pescan, solo que se sueltan.
 */
const NO_SE_PUEDEN_BUSCAR = new Set(["prohibida", "invasora_no_pescable"]);

export function TarjetaSitio({
  sitio,
  provincia,
  nombreProvincia,
}: {
  sitio: SitioTarjeta;
  provincia: string;
  /**
   * Solo en el listado común de `/sitios`, donde se mezclan provincias. Sin
   * esto «Embalse de Bornos» y «Embalse de Cala» salen seguidos sin decir que
   * están en provincias distintas, a dos horas el uno del otro.
   */
  nombreProvincia?: string;
}) {
  const principales = sitio.especies
    .filter((e) => !NO_SE_PUEDEN_BUSCAR.has(e.especie.estadoLegal))
    .sort((a, b) => b.abundancia - a.abundancia)
    .slice(0, 3)
    .map((e) => e.especie.nombreComun);

  return (
    <li>
      <Link
        href={`/${provincia}/${sitio.slug}`}
        className="tarjeta tarjeta-enlace flex h-full flex-col overflow-hidden"
      >
        {/* La foto manda: es lo que hace que un embalse se distinga de otro de
            un vistazo. Antes era una banda de 96 px y todas las fichas se
            parecían. El nombre va encima, que es como se lee un sitio. */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <BandaSitio
            tipo={sitio.tipo}
            imagenUrl={sitio.imagenUrl}
            slug={sitio.slug}
            className="foto-zoom absolute inset-0 h-full w-full"
          />

          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
          />

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            <div className="min-w-0">
              <h3 className="text-lg font-bold leading-tight text-white [text-shadow:0_1px_4px_rgb(0_0_0/0.5)]">
                {sitio.nombre}
              </h3>
              <p className="mt-0.5 truncate text-sm text-white/80">
                {ETIQUETA_TIPO_SITIO[sitio.tipo as TipoSitio]} ·{" "}
                {sitio.municipio}
                {nombreProvincia && ` · ${nombreProvincia}`}
              </p>
            </div>
            {/* Si el visitante ha dicho de dónde sale, manda su tiempo. El de
                Dos Hermanas solo tiene sentido para quien vive allí. */}
            <p className="shrink-0 rounded-lg bg-black/45 px-2.5 py-1 text-right backdrop-blur-sm">
              {sitio.distanciaUsuarioKm !== undefined ? (
                <>
                  <span className="block font-bold tabular-nums text-white">
                    aprox.{" "}
                    {formatearTiempo(tiempoEnCocheAprox(sitio.distanciaUsuarioKm))}
                  </span>
                  <span className="block text-xs tabular-nums text-white/75">
                    {formatearKm(sitio.distanciaUsuarioKm)} en línea recta
                  </span>
                </>
              ) : (
                <>
                  <span className="block font-bold tabular-nums text-white">
                    {sitio.tiempoCocheMin} min
                  </span>
                  <span className="block text-xs tabular-nums text-white/75">
                    {sitio.distanciaDesdeDosHermanasKm} km
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-auto flex-col p-4">
          <NivelCompacto
            nivel={{
              nivelPorcentaje: sitio.nivelPorcentaje ?? null,
              nivelHm3: sitio.nivelHm3 ?? null,
              capacidadHm3: sitio.capacidadHm3 ?? null,
              nivelFecha: sitio.nivelFecha ?? null,
              nivelFuente: sitio.nivelFuente ?? null,
            }}
          />

          {principales.length > 0 && (
            <p className="text-[0.95rem] leading-snug">
              <span className="text-texto-suave">Lo que más cae: </span>
              <span className="font-semibold">{principales.join(", ")}</span>
            </p>
          )}

          <ul className="mt-3 flex flex-auto flex-wrap items-end gap-2 text-xs font-semibold">
            <li className="rounded-lg bg-chip-fondo px-2 py-1 text-chip-texto">
              {ETIQUETA_DIFICULTAD[sitio.dificultadAcceso as DificultadAcceso]}
            </li>
            {sitio.tieneSombra && (
              <li className="rounded-lg bg-chip-fondo px-2 py-1 text-chip-texto">
                Con sombra
              </li>
            )}
            {/* «Sin comprobar» y «fuera del área» no son lo mismo: el segundo
                obliga a sacrificar el pez y el primero no dice nada. */}
            {!sitio.eeiComprobado ? (
              <li className="rounded-lg bg-chip-fondo px-2 py-1 text-chip-texto">
                Área EEI sin comprobar
              </li>
            ) : (
              !sitio.esAreaDelimitadaEEI && (
                <li className="rounded-lg bg-ambar-fondo px-2 py-1 text-ambar-texto">
                  Fuera de área EEI
                </li>
              )
            )}
            {esAvisoGrave(sitio.avisosSanitarios) && (
              <li className="rounded-lg bg-rojo-fondo px-2 py-1 text-rojo-texto">
                ⚠ Aviso sanitario grave
              </li>
            )}
          </ul>
        </div>
      </Link>
    </li>
  );
}
