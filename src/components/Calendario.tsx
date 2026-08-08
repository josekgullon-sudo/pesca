import Link from "next/link";
import {
  DIAS_SEMANA,
  diasDelMes,
  fechaLarga,
  hora,
  medianocheLocal,
  mesLargo,
  primerDiaSemana,
} from "@/lib/fechas-solunar";
import {
  diaSolunar,
  indiceDePesca,
  MAXIMOS_DESGLOSE,
  type DiaSolunar,
  type Indice,
} from "@/lib/solunar";

/**
 * El calendario solunar de un punto.
 *
 * Todo se calcula en el servidor y en el momento: no hay tabla en la base de
 * datos ni tarea nocturna que rellenar. Un mes entero son unos treinta
 * cálculos de posición lunar, que es trabajo de milisegundos.
 *
 * Sobre la honestidad de esto, que es lo que más me importa de esta pantalla:
 * los datos de sol y luna son exactos y se presentan como tales; el índice es
 * una estimación nuestra y se presenta desglosado para que se vea de dónde
 * sale cada punto. La teoría solunar no está demostrada y la página lo dice
 * con esas palabras. Preferimos que alguien nos discuta la fórmula a que se
 * crea que esto es una predicción.
 */

type Punto = { latitud: number; longitud: number };

/** Meses buenos del sitio, del JSON que guarda la guía. */
function mesesBuenos(mejorEpoca: string): number[] {
  try {
    const v: unknown = JSON.parse(mejorEpoca);
    return Array.isArray(v) ? (v as number[]) : [];
  } catch {
    return [];
  }
}

function claseNota(n: number): string {
  if (n >= 80) return "text-verde-texto";
  if (n >= 65) return "text-verde-texto";
  if (n >= 45) return "text-ambar-texto";
  return "text-texto-suave";
}

function fondoNota(n: number): string {
  if (n >= 80) return "border-verde-texto/50 bg-verde-fondo";
  if (n >= 65) return "border-verde-texto/25";
  if (n >= 45) return "border-ambar-texto/30";
  return "border-borde";
}

const ICONO_FASE: Record<string, string> = {
  "Luna nueva": "🌑",
  Creciente: "🌒",
  "Cuarto creciente": "🌓",
  "Gibosa creciente": "🌔",
  "Luna llena": "🌕",
  "Gibosa menguante": "🌖",
  "Cuarto menguante": "🌗",
  Menguante: "🌘",
};

function Periodos({
  titulo, lista, fuerte,
}: {
  titulo: string;
  lista: { desde: Date; hasta: Date }[];
  fuerte: boolean;
}) {
  if (lista.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-texto-suave">{titulo}</p>
      <ul className="space-y-2">
        {lista.map((p, i) => (
          <li
            key={i}
            className={`rounded-lg border-l-4 px-3 py-2 tabular-nums ${
              fuerte
                ? "border-acento bg-chip-fondo font-bold"
                : "border-borde bg-chip-fondo/60"
            }`}
          >
            {hora(p.desde)} – {hora(p.hasta)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Barra({ etiqueta, valor, maximo, nota }: { etiqueta: string; valor: number; maximo: number; nota: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">{etiqueta}</span>
        <span className="tabular-nums text-texto-suave">
          {valor}/{maximo}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-chip-fondo">
        <div
          className="h-full rounded-full bg-acento"
          style={{ width: `${(valor / maximo) * 100}%` }}
        />
      </div>
      <p className="mt-1 text-xs leading-relaxed text-texto-suave">{nota}</p>
    </div>
  );
}

export function Calendario({
  punto,
  mejorEpoca,
  anio,
  mes,
  hoy,
  baseUrl,
  nombreSitio,
}: {
  punto: Punto;
  mejorEpoca: string;
  anio: number;
  mes: number;
  /** Medianoche local de hoy, para marcarlo y para los próximos siete días. */
  hoy: Date;
  /** Ruta de esta página, para navegar entre meses. */
  baseUrl: string;
  nombreSitio: string;
}) {
  const buenos = mesesBuenos(mejorEpoca);

  const calcular = (medianoche: Date, mesDelDia: number) => {
    const d = diaSolunar(medianoche, punto.latitud, punto.longitud);
    return { d, i: indiceDePesca(d, { enTemporada: buenos.includes(mesDelDia) }) };
  };

  const deHoy = calcular(hoy, new Date(hoy.getTime() + 43200000).getUTCMonth() + 1);

  // Próximos siete días, empezando hoy.
  const proximos: { fecha: Date; d: DiaSolunar; i: Indice }[] = [];
  for (let k = 0; k < 7; k++) {
    const m = new Date(hoy.getTime() + k * 86400000);
    const mesK = new Date(m.getTime() + 43200000).getUTCMonth() + 1;
    proximos.push({ fecha: m, ...calcular(m, mesK) });
  }

  // El mes que se está mirando.
  const total = diasDelMes(anio, mes);
  const hueco = primerDiaSemana(anio, mes);
  const delMes = Array.from({ length: total }, (_, k) => {
    const medianoche = medianocheLocal(anio, mes, k + 1);
    return { dia: k + 1, ...calcular(medianoche, mes) };
  });

  const mejores = [...delMes].sort((a, b) => b.i.total - a.i.total).slice(0, 5);

  const mesAnterior = mes === 1 ? { a: anio - 1, m: 12 } : { a: anio, m: mes - 1 };
  const mesSiguiente = mes === 12 ? { a: anio + 1, m: 1 } : { a: anio, m: mes + 1 };
  const hoyEsDelMes =
    new Date(hoy.getTime() + 43200000).getUTCMonth() + 1 === mes &&
    new Date(hoy.getTime() + 43200000).getUTCFullYear() === anio;
  const diaDeHoy = new Date(hoy.getTime() + 43200000).getUTCDate();

  return (
    <div className="space-y-10">
      {/* --- Hoy --- */}
      <section className="tarjeta p-5 md:p-6">
        <p className="text-sm font-bold uppercase tracking-wide text-texto-suave">
          {fechaLarga(deHoy.d.fecha)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-5">
          <p className={`text-5xl font-bold tabular-nums ${claseNota(deHoy.i.total)}`}>
            {deHoy.i.total}
            <span className="text-xl text-texto-suave">/100</span>
          </p>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-tight">{deHoy.i.titular}</h2>
            <p className="mt-1 leading-relaxed text-texto-suave">
              {deHoy.i.descripcion}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* --- Luna y sol: esto son datos, no estimaciones --- */}
        <section className="tarjeta p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-texto-suave">
            Luna y sol
          </h2>
          <p className="mt-3 flex items-center gap-2 text-xl font-bold">
            <span aria-hidden className="text-2xl">
              {ICONO_FASE[deHoy.d.fase.nombre] ?? "🌙"}
            </span>
            {deHoy.d.fase.nombre}
          </p>
          <p className="text-sm text-texto-suave">
            {deHoy.d.fase.iluminacion}% iluminada
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {[
              ["Salida de luna", hora(deHoy.d.salidaLuna)],
              ["Puesta de luna", hora(deHoy.d.puestaLuna)],
              ["Amanecer", hora(deHoy.d.amanecer)],
              ["Atardecer", hora(deHoy.d.atardecer)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-chip-fondo p-3">
                <dd className="text-lg font-bold tabular-nums">{v}</dd>
                <dt className="text-xs text-texto-suave">{k}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* --- Periodos --- */}
        <section className="tarjeta space-y-4 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-texto-suave">
            Periodos solunares
          </h2>
          <Periodos titulo="Mayores" lista={deHoy.d.mayores} fuerte />
          <Periodos titulo="Menores" lista={deHoy.d.menores} fuerte={false} />
        </section>

        {/* --- De dónde sale la nota --- */}
        <section className="tarjeta space-y-4 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-texto-suave">
            De dónde sale la nota
          </h2>
          <Barra
            etiqueta="Luz"
            valor={deHoy.i.desglose.luz}
            maximo={MAXIMOS_DESGLOSE.luz}
            nota="Cuánto coinciden los periodos con el amanecer y el atardecer."
          />
          <Barra
            etiqueta="Luna"
            valor={deHoy.i.desglose.luna}
            maximo={MAXIMOS_DESGLOSE.luna}
            nota="Máximo en luna nueva y llena. Es tradición, no está demostrado."
          />
          <Barra
            etiqueta="Temporada"
            valor={deHoy.i.desglose.temporada}
            maximo={MAXIMOS_DESGLOSE.temporada}
            nota={`Si ${nombreSitio} está en su mejor época este mes.`}
          />
        </section>
      </div>

      {/* --- Siete días --- */}
      <section>
        <h2 className="titulo-seccion mb-4 font-bold">Los próximos siete días</h2>
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {proximos.map((p, k) => (
            <li
              key={k}
              className={`tarjeta border-2 p-3 text-center ${fondoNota(p.i.total)}`}
            >
              <p className="text-xs font-bold uppercase text-texto-suave">
                {k === 0
                  ? "Hoy"
                  : new Intl.DateTimeFormat("es-ES", {
                      timeZone: "Europe/Madrid",
                      weekday: "short",
                    }).format(p.fecha)}
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {new Intl.DateTimeFormat("es-ES", {
                  timeZone: "Europe/Madrid",
                  day: "numeric",
                }).format(p.fecha)}
              </p>
              <p aria-hidden className="text-lg">
                {ICONO_FASE[p.d.fase.nombre] ?? "🌙"}
              </p>
              <p className={`font-bold tabular-nums ${claseNota(p.i.total)}`}>
                {p.i.total}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* --- El mes --- */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="titulo-seccion font-bold">{mesLargo(medianocheLocal(anio, mes, 15))}</h2>
          <div className="flex gap-2">
            <Link
              href={`${baseUrl}?anio=${mesAnterior.a}&mes=${mesAnterior.m}`}
              className="inline-flex min-h-touch items-center rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold hover:border-acento"
            >
              ← Anterior
            </Link>
            <Link
              href={`${baseUrl}?anio=${mesSiguiente.a}&mes=${mesSiguiente.m}`}
              className="inline-flex min-h-touch items-center rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold hover:border-acento"
            >
              Siguiente →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="pb-1 text-center text-xs font-bold text-texto-suave">
              {d}
            </div>
          ))}
          {Array.from({ length: hueco }, (_, k) => (
            <div key={`hueco-${k}`} />
          ))}
          {delMes.map((x) => (
            <div
              key={x.dia}
              className={`rounded-lg border-2 p-1.5 text-center sm:p-2 ${fondoNota(x.i.total)} ${
                hoyEsDelMes && x.dia === diaDeHoy ? "ring-2 ring-acento" : ""
              }`}
            >
              <p className="text-sm font-bold tabular-nums">{x.dia}</p>
              <p aria-hidden className="text-sm leading-none">
                {ICONO_FASE[x.d.fase.nombre] ?? "🌙"}
              </p>
              <p className={`text-sm font-bold tabular-nums ${claseNota(x.i.total)}`}>
                {x.i.total}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --- Mejores días --- */}
      <section>
        <h2 className="titulo-seccion mb-4 font-bold">
          Los mejores días de {mesLargo(medianocheLocal(anio, mes, 15))}
        </h2>
        <ul className="space-y-2">
          {mejores.map((x, k) => (
            <li
              key={x.dia}
              className={`tarjeta flex flex-wrap items-center justify-between gap-3 border-2 p-4 ${fondoNota(x.i.total)}`}
            >
              <div>
                <p className="font-bold">
                  {k + 1}. {fechaLarga(medianocheLocal(anio, mes, x.dia))}
                </p>
                <p className="text-sm text-texto-suave">
                  {ICONO_FASE[x.d.fase.nombre]} {x.d.fase.nombre} ·{" "}
                  {x.d.fase.iluminacion}% iluminada
                </p>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${claseNota(x.i.total)}`}>
                {x.i.total}
                <span className="text-sm text-texto-suave">/100</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* --- El descargo, y no en letra pequeña --- */}
      <section className="rounded-xl border-2 border-borde bg-fondo-elevado p-5">
        <h2 className="text-lg font-bold">Qué es esto y qué no</h2>
        <div className="mt-2 max-w-prose space-y-2 leading-relaxed text-texto-suave">
          <p>
            <strong className="text-texto">Las horas de sol y luna son datos.</strong>{" "}
            Están calculadas para las coordenadas de {nombreSitio} con precisión
            de un par de minutos. Ahí no hay opinión.
          </p>
          <p>
            <strong className="text-texto">La nota de 0 a 100 es una estimación nuestra</strong>,
            no una predicción. Por eso la enseñamos desglosada: para que veas de
            dónde sale cada punto y decidas si te convence.
          </p>
          <p>
            <strong className="text-texto">Y los periodos solunares son una teoría</strong>{" "}
            de 1926, muy extendida entre pescadores y sin respaldo científico
            sólido. Los damos porque se usan y porque la gente los consulta, no
            porque estén demostrados. Lo que sí tiene fundamento es el amanecer
            y el atardecer: con poca luz el depredador ve la silueta de la presa
            a contraluz y la presa no lo ve a él.
          </p>
          <p>
            El pez no lee calendarios. Esto sirve para elegir entre dos días
            cuando puedes elegir, no para quedarte en casa.
          </p>
        </div>
      </section>
    </div>
  );
}
