import {
  AVISO_EEI_PROVINCIA_SIN_LISTADO,
  TITULO_EEI_PROVINCIA_SIN_LISTADO,
  URL_PORTAL_CAZA_Y_PESCA,
} from "@/lib/avisos";

/**
 * El aviso de una provincia publicada sin su listado de áreas delimitadas.
 *
 * Va arriba, antes de los sitios, y en rojo y no en ámbar: no es un «ten en
 * cuenta que», es el único dato de toda la guía cuya ausencia puede acabar en
 * una sanción o en un pez muerto sin motivo. El resto de la ficha —dónde está,
 * cómo se llega, qué hay— sigue valiendo, y por eso la provincia se publica;
 * pero esto no se puede leer por encima.
 */
export function AvisoEEIProvincia({
  provincia,
  urlOrdenDeVedas,
}: {
  provincia: string;
  urlOrdenDeVedas?: string | null;
}) {
  return (
    <section
      role="alert"
      aria-labelledby="aviso-eei"
      className="rounded-xl border-2 border-rojo-texto/40 bg-rojo-fondo p-5 text-rojo-texto"
    >
      <h2 id="aviso-eei" className="flex items-start gap-2 text-lg font-bold">
        <span aria-hidden>⚠️</span>
        <span>{TITULO_EEI_PROVINCIA_SIN_LISTADO}</span>
      </h2>
      <p className="mt-2 max-w-prose leading-relaxed">
        {AVISO_EEI_PROVINCIA_SIN_LISTADO}
      </p>
      <p className="mt-2 max-w-prose leading-relaxed">
        Lo decimos porque preferimos reconocer que no lo sabemos a inventarlo:
        de este dato depende que devuelvas al agua un pez que la ley obliga a
        sacrificar, o que sacrifiques uno que podías haber soltado.
      </p>
      <a
        href={urlOrdenDeVedas || URL_PORTAL_CAZA_Y_PESCA}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex min-h-touch items-center rounded-lg bg-rojo-texto px-4 font-bold text-rojo-fondo"
      >
        Ver la orden de vedas de {provincia} ↗
      </a>
    </section>
  );
}
