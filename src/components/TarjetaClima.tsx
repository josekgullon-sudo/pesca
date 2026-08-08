import { ATRIBUCION, type Clima } from "@/lib/clima";

/**
 * El bloque del tiempo, al lado del solunar.
 *
 * Va aparte de la nota a propósito. La presión y el viento se miran antes de
 * salir y le dicen mucho más a quien pesca que la fase de la luna, pero no
 * entran en el índice: el índice tiene que ser el mismo mirándolo hoy o
 * dentro de un mes, y esto cambia cada hora.
 *
 * Lo que sí se dice es la tendencia de la presión, porque el número suelto no
 * significa nada y lo que la gente mira es si sube o baja.
 */

const FLECHA: Record<Clima["tendencia"], string> = {
  subiendo: "↑",
  bajando: "↓",
  estable: "→",
};

export function TarjetaClima({ clima }: { clima: Clima | null }) {
  // Sin dato no se pinta nada. Ni un hueco, ni un «no disponible»: si el
  // servicio de fuera falla, la página tiene que verse como si nunca hubiera
  // existido ese bloque.
  if (!clima) return null;

  return (
    <section className="tarjeta p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-texto-suave">
        El tiempo ahora
      </h2>

      <dl className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-chip-fondo p-3">
          <dd className="text-2xl font-bold tabular-nums">
            {clima.temperaturaC}°
          </dd>
          <dt className="text-xs text-texto-suave">Temperatura</dt>
        </div>
        <div className="rounded-lg bg-chip-fondo p-3">
          <dd className="text-2xl font-bold tabular-nums">
            {clima.vientoKmH}
            <span className="text-base"> km/h</span>
          </dd>
          <dt className="text-xs text-texto-suave">
            Viento del {clima.vientoDireccion}
          </dt>
        </div>
        <div className="col-span-2 rounded-lg bg-chip-fondo p-3">
          <dd className="text-2xl font-bold tabular-nums">
            {clima.presionHPa}
            <span className="text-base"> hPa</span>{" "}
            <span className="text-base font-semibold text-texto-suave">
              {FLECHA[clima.tendencia]}{" "}
              {clima.tendencia}
              {clima.cambioPresionHPa !== 0 &&
                ` (${clima.cambioPresionHPa > 0 ? "+" : ""}${clima.cambioPresionHPa})`}
            </span>
          </dd>
          <dt className="text-xs text-texto-suave">
            Presión, y cómo va en las últimas horas
          </dt>
        </div>
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-texto-suave">
        No entra en la nota: cambia cada hora y la nota tiene que valer igual
        hoy que dentro de un mes. Datos de{" "}
        <a
          href={ATRIBUCION.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          {ATRIBUCION.nombre}
        </a>{" "}
        ({ATRIBUCION.licencia}).
      </p>
    </section>
  );
}
