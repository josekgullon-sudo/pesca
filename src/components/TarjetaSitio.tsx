import Link from "next/link";
import { BandaSitio } from "./BandaSitio";
import {
  ETIQUETA_DIFICULTAD,
  ETIQUETA_TIPO_SITIO,
  type DificultadAcceso,
  type TipoSitio,
} from "@/lib/enums";

export type SitioTarjeta = {
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
}: {
  sitio: SitioTarjeta;
  provincia: string;
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
        className="flex h-full flex-col tarjeta overflow-hidden"
      >
        <BandaSitio
          tipo={sitio.tipo}
          imagenUrl={sitio.imagenUrl}
          slug={sitio.slug}
          className="h-24"
        />

        <div className="flex flex-auto flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold leading-tight">{sitio.nombre}</h3>
            <p className="mt-0.5 text-sm text-texto-suave">
              {ETIQUETA_TIPO_SITIO[sitio.tipo as TipoSitio]} · {sitio.municipio}
            </p>
          </div>
          <p className="shrink-0 text-right">
            <span className="block text-xl font-bold tabular-nums text-acento">
              {sitio.tiempoCocheMin} min
            </span>
            <span className="block text-xs text-texto-suave tabular-nums">
              {sitio.distanciaDesdeDosHermanasKm} km
            </span>
          </p>
        </div>

        {principales.length > 0 && (
          <p className="mt-3 text-[0.95rem] leading-snug">
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
          {!sitio.esAreaDelimitadaEEI && (
            <li className="rounded-lg bg-ambar-fondo px-2 py-1 text-ambar-texto">
              Fuera de área EEI
            </li>
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
