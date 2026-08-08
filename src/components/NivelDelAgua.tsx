/**
 * Cuánta agua lleva el embalse.
 *
 * Es de los datos más útiles que puede dar una guía de pesca: a media
 * capacidad quedan orillas enteras al descubierto, los puestos de siempre se
 * van a diez metros del agua y la estructura sumergida que buscaba el bass
 * pasa a estar en seco.
 *
 * **La fecha va siempre pegada al número, y no en letra pequeña.** El boletín
 * hidrológico es semanal, no en tiempo real; un porcentaje suelto, en agosto y
 * con el embalse bajando, miente por omisión. Hay webs que llaman «tiempo
 * real» a datos de hace seis semanas y así es como se pierde la confianza.
 */

export type Nivel = {
  nivelPorcentaje: number | null;
  nivelHm3: number | null;
  capacidadHm3: number | null;
  nivelFecha: Date | null;
  nivelFuente: string | null;
};

/** Verde llenos, ámbar a media asta, rojo bajo mínimos. */
function color(p: number): { barra: string; texto: string } {
  if (p >= 60) return { barra: "bg-verde-texto", texto: "text-verde-texto" };
  if (p >= 30) return { barra: "bg-ambar-texto", texto: "text-ambar-texto" };
  return { barra: "bg-rojo-texto", texto: "text-rojo-texto" };
}

function cuandoSeMidio(fecha: Date): string {
  const dias = Math.floor((Date.now() - fecha.getTime()) / 86400000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 14) return `hace ${dias} días`;
  const semanas = Math.round(dias / 7);
  return `hace ${semanas} semanas`;
}

/** La versión compacta, para la tarjeta del listado. */
export function NivelCompacto({ nivel }: { nivel: Nivel }) {
  if (nivel.nivelPorcentaje === null) return null;
  const p = Math.round(nivel.nivelPorcentaje);
  const c = color(p);

  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-sm font-bold tabular-nums ${c.texto}`}>
          {p}% de capacidad
        </span>
        {nivel.nivelFecha && (
          <span className="text-xs text-texto-suave">
            {cuandoSeMidio(nivel.nivelFecha)}
          </span>
        )}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-chip-fondo">
        <div
          className={`h-full rounded-full ${c.barra}`}
          style={{ width: `${Math.min(100, p)}%` }}
        />
      </div>
    </div>
  );
}

/** La versión de la ficha, con los hectómetros y la fuente. */
export function NivelDelAgua({
  nivel,
  nombre,
}: {
  nivel: Nivel;
  nombre: string;
}) {
  if (nivel.nivelPorcentaje === null) return null;
  const p = Math.round(nivel.nivelPorcentaje);
  const c = color(p);

  return (
    <section className="tarjeta p-5">
      <h2 className="text-xl font-bold">Cuánta agua lleva</h2>

      <div className="mt-3 flex flex-wrap items-baseline gap-3">
        <p className={`text-4xl font-bold tabular-nums ${c.texto}`}>{p}%</p>
        {nivel.nivelHm3 !== null && nivel.capacidadHm3 !== null && (
          <p className="text-texto-suave tabular-nums">
            {Math.round(nivel.nivelHm3)} de {Math.round(nivel.capacidadHm3)} hm³
          </p>
        )}
      </div>

      <div className="mt-2 h-3 overflow-hidden rounded-full bg-chip-fondo">
        <div
          className={`h-full rounded-full ${c.barra}`}
          style={{ width: `${Math.min(100, p)}%` }}
        />
      </div>

      {nivel.nivelFecha && (
        <p className="mt-3 text-sm leading-relaxed text-texto-suave">
          Medido el{" "}
          <strong className="text-texto">
            {new Intl.DateTimeFormat("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "Europe/Madrid",
            }).format(nivel.nivelFecha)}
          </strong>{" "}
          ({cuandoSeMidio(nivel.nivelFecha)})
          {nivel.nivelFuente && `. Fuente: ${nivel.nivelFuente}`}. El boletín
          es semanal, así que esto no es tiempo real.
        </p>
      )}

      {p < 40 && (
        <p className="mt-3 max-w-prose rounded-lg bg-ambar-fondo p-3 text-sm leading-relaxed text-ambar-texto">
          Con {nombre} por debajo del 40 % el agua se retira mucho de la orilla
          habitual. Cuenta con caminar y con que los accesos que conozcas
          queden lejos del agua.
        </p>
      )}
    </section>
  );
}
