import Link from "next/link";
import { fechaLarga, hora } from "@/lib/fechas-solunar";
import { diaSolunar, indiceDePesca } from "@/lib/solunar";

/**
 * El solunar de hoy, resumido, para meterlo dentro de otra página.
 *
 * Estaba solo detrás de un enlace a «calendario», y un dato que hay que ir a
 * buscar no lo mira nadie. Lo que la gente quiere saber al abrir la ficha de
 * un embalse es a qué hora salir hoy, así que va aquí, con la nota y las
 * horas, y el calendario completo queda para quien quiera planificar el mes.
 */
export function ResumenSolunar({
  latitud,
  longitud,
  mejorEpoca,
  hoy,
  enlaceCalendario,
  titulo = "Cuándo ir hoy",
}: {
  latitud: number;
  longitud: number;
  mejorEpoca: string;
  /** Medianoche local de hoy. */
  hoy: Date;
  enlaceCalendario: string;
  titulo?: string;
}) {
  const d = diaSolunar(hoy, latitud, longitud);

  let meses: number[] = [];
  try {
    const v: unknown = JSON.parse(mejorEpoca);
    if (Array.isArray(v)) meses = v as number[];
  } catch {
    meses = [];
  }
  const mesDeHoy = new Date(hoy.getTime() + 43200000).getUTCMonth() + 1;
  const i = indiceDePesca(d, { enTemporada: meses.includes(mesDeHoy) });

  const color =
    i.total >= 65 ? "text-verde-texto" : i.total >= 45 ? "text-ambar-texto" : "text-texto-suave";

  return (
    <section className="tarjeta p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{titulo}</h2>
        <p className="text-sm text-texto-suave">{fechaLarga(d.fecha)}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <p className={`text-4xl font-bold tabular-nums ${color}`}>
          {i.total}
          <span className="text-base text-texto-suave">/100</span>
        </p>
        <p className="min-w-0 flex-1 font-semibold leading-snug">{i.titular}</p>
      </div>

      {/* Las dos horas que de verdad importan, y esas sí tienen fundamento. */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Amanecer", hora(d.amanecer)],
          ["Atardecer", hora(d.atardecer)],
          ["Salida luna", hora(d.salidaLuna)],
          ["Puesta luna", hora(d.puestaLuna)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-chip-fondo p-3">
            <p className="text-lg font-bold tabular-nums">{v}</p>
            <p className="text-xs text-texto-suave">{k}</p>
          </div>
        ))}
      </div>

      {d.mayores.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-bold text-texto-suave">
            Periodos mayores de hoy
          </p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {d.mayores.map((p, k) => (
              <li
                key={k}
                className="rounded-lg border-l-4 border-acento bg-chip-fondo px-3 py-1.5 font-bold tabular-nums"
              >
                {hora(p.desde)} – {hora(p.hasta)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-sm leading-relaxed text-texto-suave">
        {d.fase.nombre}, {d.fase.iluminacion}% iluminada. La nota es una
        estimación nuestra, no una predicción.
      </p>

      <Link
        href={enlaceCalendario}
        className="mt-4 inline-flex min-h-touch items-center rounded-xl border-2 border-borde bg-fondo-elevado px-5 font-semibold hover:border-acento"
      >
        Ver el mes completo →
      </Link>
    </section>
  );
}
