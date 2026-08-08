/**
 * Fechas locales para el calendario solunar.
 *
 * Todo el cálculo astronómico trabaja con instantes absolutos, pero el
 * calendario es cosa de días *locales*: «el 8 de agosto en el embalse» empieza
 * a medianoche de Madrid, no a medianoche UTC. Y en España eso son dos horas
 * en verano y una en invierno.
 *
 * Se resuelve con `Intl` y sin librería de zonas horarias: se pregunta al
 * propio motor qué hora local corresponde a un instante y se despeja el
 * desfase. Es la única fuente que está siempre al día con los cambios de hora.
 */

export const ZONA = "Europe/Madrid";

/** Desfase de la zona respecto a UTC en ese instante, en milisegundos. */
function desfase(instante: Date): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instante);

  const v = Object.fromEntries(partes.map((p) => [p.type, p.value])) as Record<
    string,
    string
  >;

  const comoSiFueraUTC = Date.UTC(
    Number(v.year),
    Number(v.month) - 1,
    Number(v.day),
    Number(v.hour) % 24,
    Number(v.minute),
    Number(v.second),
  );

  return comoSiFueraUTC - instante.getTime();
}

/**
 * La medianoche local de un día del calendario.
 *
 * Se itera dos veces porque el desfase depende del instante y el instante
 * depende del desfase: la primera pasada usa el de medianoche UTC, que en los
 * dos fines de semana del cambio de hora puede ser el equivocado.
 */
export function medianocheLocal(anio: number, mes: number, dia: number): Date {
  let t = Date.UTC(anio, mes - 1, dia);
  for (let i = 0; i < 2; i++) {
    t = Date.UTC(anio, mes - 1, dia) - desfase(new Date(t));
  }
  return new Date(t);
}

/** El día del calendario (año, mes, día) al que pertenece un instante. */
export function diaLocalDe(instante: Date): { anio: number; mes: number; dia: number } {
  const v = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: ZONA,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(instante)
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  return { anio: Number(v.year), mes: Number(v.month), dia: Number(v.dia ?? v.day) };
}

/**
 * «07:31», en hora local del sitio.
 *
 * Redondea al minuto más cercano, como cualquier almanaque. `Intl` trunca, y
 * truncar un orto calculado a las 07:31:50 lo deja en 07:31 cuando lo que se
 * ve es 07:32.
 */
export function hora(d: Date | null): string {
  if (!d) return "—";
  const alMinuto = new Date(Math.round(d.getTime() / 60000) * 60000);
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: ZONA,
    hour: "2-digit",
    minute: "2-digit",
  }).format(alMinuto);
}

/** «sábado, 8 de agosto». */
export function fechaLarga(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

/** «agosto de 2026». */
export function mesLargo(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: ZONA,
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Iniciales de los días, empezando en lunes. */
export const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

/** Cuántos días tiene un mes. */
export function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

/** Qué día de la semana (0 = lunes) cae el 1 de ese mes. */
export function primerDiaSemana(anio: number, mes: number): number {
  const d = new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay();
  return (d + 6) % 7;
}
