/**
 * Lo normal en un embalse para estas fechas.
 *
 * El porcentaje a secas ordena mal. En agosto de 2026 casi todos los embalses
 * andaluces andan entre el 60 % y el 100 %, así que un ranking por «cuánta
 * agua lleva» los deja a casi todos empatados, y encima diciendo lo mismo de
 * uno que va sobrado y de otro que está vaciado a base de bien.
 *
 * Lo que sí distingue es **compararlo con él mismo**. Un embalse al 62 % que
 * en agosto suele estar al 40 % va largo; otro al 62 % que suele estar al 85 %
 * lleva veinte puntos menos de los que le tocan, y eso se nota en la orilla:
 * el agua está donde no estaba, y los puestos de siempre quedan en seco.
 *
 * El dato ya lo estábamos descargando y tirando. El fichero del Ministerio no
 * es una foto del día: trae una fila por embalse y semana desde 1988. De ahí
 * sale la mediana de estas mismas fechas en los años anteriores.
 *
 * Se usa la mediana y no la media a propósito: un año de sequía extrema o uno
 * de riadas arrastra la media entera, y lo que se busca es «lo normal», no «el
 * promedio incluyendo los años raros».
 */

/** Una medición cualquiera del histórico. */
export type Medicion = {
  nombre: string;
  fecha: Date;
  porcentaje: number;
};

/** A qué distancia del día del año se considera «estas mismas fechas». */
const DIAS_DE_MARGEN = 10;

/** Cuántos años distintos hacen falta para fiarse de la mediana. */
const ANIOS_MINIMOS = 5;

export function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 === 1
    ? orden[medio]
    : (orden[medio - 1] + orden[medio]) / 2;
}

/** Día del año, de 0 a 365. */
function diaDelAnio(f: Date): number {
  const inicio = Date.UTC(f.getUTCFullYear(), 0, 1);
  return Math.floor((f.getTime() - inicio) / 86400000);
}

/**
 * Cuántos días separan dos fechas del calendario, sin mirar el año.
 *
 * Da la vuelta por diciembre: el 28 de diciembre y el 3 de enero están a seis
 * días, no a trescientos cincuenta y nueve. Sin esto, los embalses se quedaban
 * sin histórico justo en la semana de fin de año.
 */
function distanciaEnElCalendario(a: Date, b: Date): number {
  const d = Math.abs(diaDelAnio(a) - diaDelAnio(b));
  return Math.min(d, 365 - d);
}

/**
 * La mediana histórica de cada embalse para las fechas de su última medición.
 *
 * Solo mira años ANTERIORES al de la medición: incluir el año en curso sería
 * comparar el dato consigo mismo y acercar la mediana a él, que es justo lo
 * contrario de lo que se quiere saber.
 */
export function medianasParaEstasFechas(
  historico: Medicion[],
  ultimaPorEmbalse: Map<string, Date>,
): Map<string, number> {
  const porEmbalse = new Map<string, { valores: number[]; anios: Set<number> }>();

  for (const m of historico) {
    const referencia = ultimaPorEmbalse.get(m.nombre);
    if (!referencia) continue;
    if (m.fecha.getUTCFullYear() >= referencia.getUTCFullYear()) continue;
    if (distanciaEnElCalendario(m.fecha, referencia) > DIAS_DE_MARGEN) continue;

    let acc = porEmbalse.get(m.nombre);
    if (!acc) {
      acc = { valores: [], anios: new Set() };
      porEmbalse.set(m.nombre, acc);
    }
    acc.valores.push(m.porcentaje);
    acc.anios.add(m.fecha.getUTCFullYear());
  }

  const salida = new Map<string, number>();
  for (const [nombre, acc] of porEmbalse) {
    // Con dos o tres años no hay «lo normal», hay dos o tres años. Y una
    // mediana calculada sobre eso se enseñaría con la misma seguridad que una
    // buena, que es peor que no enseñar nada.
    if (acc.anios.size < ANIOS_MINIMOS) continue;
    const m = mediana(acc.valores);
    if (m !== null) salida.set(nombre, m);
  }
  return salida;
}
