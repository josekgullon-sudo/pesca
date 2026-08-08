/**
 * Sol, luna y periodos solunares para un punto y un día.
 *
 * Todo se calcula aquí dentro. No hay ninguna llamada a ningún servicio: la
 * posición del sol y de la luna es astronomía, y la astronomía se calcula. Eso
 * significa que funciona sin conexión, sin clave de API, sin coste y sin que
 * nadie nos pueda cortar el grifo.
 *
 * Qué es cada cosa, porque no todo tiene el mismo respaldo y la web lo va a
 * decir claramente:
 *
 *  - **Orto y ocaso del sol y de la luna, fase e iluminación**: son datos
 *    exactos. Precisión de un par de minutos, más que de sobra.
 *  - **Amanecer y atardecer como mejores horas**: esto sí tiene explicación
 *    biológica. Con poca luz el depredador ve la silueta de la presa a
 *    contraluz y la presa no lo ve a él. Se puede afirmar.
 *  - **Periodos solunares**: teoría de John Alden Knight, 1926. Muy extendida
 *    entre pescadores y sin respaldo científico sólido. Se enseñan porque la
 *    gente los busca y los usa, pero se presentan como lo que son.
 *
 * Algoritmos: Meeus, *Astronomical Algorithms*, en su versión reducida. Para
 * los ortos y ocasos se muestrea la altura del astro a lo largo del día y se
 * afina por bisección en los cambios de signo, en vez de usar la fórmula
 * cerrada: es más corto, vale igual para el sol y para la luna, y no se
 * complica en latitudes altas ni cuando un astro no sale.
 */

const RAD = Math.PI / 180;
const DIA_MS = 86400000;

/** Días julianos desde J2000.0 para un instante dado. */
function diasDesdeJ2000(fecha: Date): number {
  return fecha.getTime() / DIA_MS - 10957.5;
}

// --- Sol ------------------------------------------------------------------

/** Oblicuidad de la eclíptica, con su deriva secular. */
function oblicuidad(T: number): number {
  return RAD * (23.439291 - 0.0130042 * T);
}

function posicionSol(d: number) {
  const T = d / 36525;

  // Longitud media y anomalía media (Meeus, cap. 25).
  const L0 = RAD * (280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = RAD * (357.52911 + 35999.05029 * T - 0.0001537 * T * T);

  // Ecuación del centro. Con solo el primer término el ocaso se iba dos
  // minutos; los tres hacen que clave.
  const C =
    RAD *
    ((1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
      (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
      0.000289 * Math.sin(3 * M));

  const longitudVerdadera = L0 + C;
  // Corrección de aberración y nutación en longitud, en su forma reducida.
  const omega = RAD * (125.04 - 1934.136 * T);
  const L = longitudVerdadera - RAD * (0.00569 + 0.00478 * Math.sin(omega));

  const e = oblicuidad(T);
  // Distancia Tierra-Sol en km, que hace falta para el ángulo de fase lunar.
  const distanciaKm =
    149598023 * (1.000001018 * (1 - 0.016708634 * 0.016708634)) /
    (1 + 0.016708634 * Math.cos(M + C));

  return {
    ascensionRecta: Math.atan2(Math.sin(L) * Math.cos(e), Math.cos(L)),
    declinacion: Math.asin(Math.sin(e) * Math.sin(L)),
    longitudEcliptica: L,
    anomaliaMedia: M,
    distanciaKm,
  };
}

// --- Luna -----------------------------------------------------------------

function posicionLuna(d: number) {
  const T = d / 36525;

  // Argumentos fundamentales (Meeus, cap. 47).
  const Lm = RAD * (218.3164477 + 13.17639648 * d); // longitud media
  const D = RAD * (297.8501921 + 12.19074912 * d); // elongación media
  const M = RAD * (134.9633964 + 13.06499295 * d); // anomalía media lunar
  const Ms = RAD * (357.5291092 + 0.98560028 * d); // anomalía media solar
  const F = RAD * (93.272095 + 13.22935024 * d); // argumento de latitud

  // Los términos que de verdad pesan de la serie ΣL de Meeus. Con solo el
  // primero la salida de luna se iba nueve minutos; con seis, diez en la
  // puesta. Cada grado de error en la longitud lunar son unos cuatro minutos
  // de hora, así que aquí la precisión se nota directamente en pantalla.
  const longitud =
    Lm +
    RAD *
      (6.288774 * Math.sin(M) +
        1.274027 * Math.sin(2 * D - M) + // evección
        0.658314 * Math.sin(2 * D) + // variación
        0.213618 * Math.sin(2 * M) -
        0.185116 * Math.sin(Ms) - // ecuación anual
        0.114332 * Math.sin(2 * F) +
        0.058793 * Math.sin(2 * D - 2 * M) +
        0.057066 * Math.sin(2 * D - Ms - M) +
        0.053322 * Math.sin(2 * D + M) +
        0.045758 * Math.sin(2 * D - Ms) -
        0.040923 * Math.sin(Ms - M) -
        0.034720 * Math.sin(D) -
        0.030383 * Math.sin(Ms + M) +
        0.015327 * Math.sin(2 * D - 2 * F) -
        0.012528 * Math.sin(M + 2 * F) +
        0.010980 * Math.sin(M - 2 * F) +
        0.010675 * Math.sin(4 * D - M) +
        0.010034 * Math.sin(3 * M) +
        0.008548 * Math.sin(4 * D - 2 * M) -
        0.007888 * Math.sin(2 * D + Ms - M) -
        0.006766 * Math.sin(2 * D + Ms));

  const latitud =
    RAD *
    (5.128122 * Math.sin(F) +
      0.280602 * Math.sin(M + F) +
      0.277693 * Math.sin(M - F) +
      0.173237 * Math.sin(2 * D - F));

  const distanciaKm =
    385000.56 -
    20905.355 * Math.cos(M) -
    3699.111 * Math.cos(2 * D - M) -
    2955.968 * Math.cos(2 * D) -
    569.925 * Math.cos(2 * M);

  const e = oblicuidad(T);
  const ascensionRecta = Math.atan2(
    Math.sin(longitud) * Math.cos(e) - Math.tan(latitud) * Math.sin(e),
    Math.cos(longitud),
  );
  const declinacion = Math.asin(
    Math.sin(latitud) * Math.cos(e) +
      Math.cos(latitud) * Math.sin(e) * Math.sin(longitud),
  );

  return { ascensionRecta, declinacion, distanciaKm, longitud, latitud };
}

/**
 * Tiempo sidéreo local, en radianes.
 *
 * La constante es 280,46061837 y no el 280,16 que circula por ahí: ese valor
 * viene de fórmulas solares simplificadas que lo compensan por otro lado, y
 * aquí desplazaba todo un minuto largo.
 */
function tiempoSidereo(d: number, longitudOeste: number): number {
  const T = d / 36525;
  const theta =
    280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000;
  return RAD * theta - longitudOeste;
}

/**
 * Altura geocéntrica sobre el horizonte menos el umbral de orto y ocaso, en
 * radianes. Cruzar el cero es salir o ponerse.
 *
 * Va todo junto en una función porque en la luna el umbral **depende de la
 * distancia**, que cambia a lo largo del mes. Separarlos fue justo el error
 * que tuvo esto un rato: se descontaba la paralaje de la altura y además se
 * usaba el umbral estándar de +0,125°, que ya la lleva dentro. Contada dos
 * veces, la puesta de luna salía un cuarto de hora antes de tiempo.
 *
 * En el sol, −0,833°: borde superior del disco más refracción atmosférica, la
 * convención de cualquier almanaque.
 *
 * En la luna, h0 = 0,7275·π − 0,5667°, donde π es la paralaje horizontal
 * ecuatorial. Ese 0,7275 es el semidiámetro en función de la paralaje y el
 * −0,5667° la refracción.
 */
function alturaSobreUmbral(
  d: number,
  lat: number,
  lon: number,
  astro: "sol" | "luna",
): number {
  const p = astro === "sol" ? posicionSol(d) : posicionLuna(d);
  const H = tiempoSidereo(d, -lon * RAD) - p.ascensionRecta;
  const phi = lat * RAD;

  const h = Math.asin(
    Math.sin(phi) * Math.sin(p.declinacion) +
      Math.cos(phi) * Math.cos(p.declinacion) * Math.cos(H),
  );

  if (astro === "sol") return h - -0.833 * RAD;

  const paralaje = Math.asin(6378.14 / p.distanciaKm);
  return h - (0.7275 * paralaje - 0.5667 * RAD);
}

/**
 * Instantes en que el astro cruza el horizonte dentro del día local.
 *
 * Se muestrea cada diez minutos y se afina por bisección donde cambia el
 * signo. Devuelve `null` cuando el astro no sale o no se pone ese día, que en
 * la luna pasa de verdad una vez al mes y hay que poder decirlo.
 */
function cruces(
  inicio: Date,
  lat: number,
  lon: number,
  astro: "sol" | "luna",
): { sale: Date | null; pone: Date | null; transito: Date | null; antitransito: Date | null } {
  const PASO_MIN = 10;
  const pasos = (24 * 60) / PASO_MIN;

  const enMinuto = (m: number) =>
    alturaSobreUmbral(
      diasDesdeJ2000(new Date(inicio.getTime() + m * 60000)),
      lat,
      lon,
      astro,
    );

  let sale: Date | null = null;
  let pone: Date | null = null;

  // Máximo y mínimo de altura: el tránsito y el antitránsito, de donde salen
  // los periodos mayores.
  let mejorAlt = -Infinity;
  let peorAlt = Infinity;
  let minTransito = 0;
  let minAntitransito = 0;

  let anterior = enMinuto(0);
  for (let i = 1; i <= pasos; i++) {
    const m = i * PASO_MIN;
    const actual = enMinuto(m);

    if (actual > mejorAlt) {
      mejorAlt = actual;
      minTransito = m;
    }
    if (actual < peorAlt) {
      peorAlt = actual;
      minAntitransito = m;
    }

    if (anterior < 0 && actual >= 0 && !sale) {
      sale = bisectar(enMinuto, m - PASO_MIN, m, inicio);
    }
    if (anterior >= 0 && actual < 0 && !pone) {
      pone = bisectar(enMinuto, m - PASO_MIN, m, inicio);
    }
    anterior = actual;
  }

  return {
    sale,
    pone,
    transito: new Date(inicio.getTime() + minTransito * 60000),
    antitransito: new Date(inicio.getTime() + minAntitransito * 60000),
  };
}

function bisectar(
  f: (m: number) => number,
  a: number,
  b: number,
  inicio: Date,
): Date {
  let lo = a;
  let hi = b;
  for (let i = 0; i < 20; i++) {
    const medio = (lo + hi) / 2;
    if (f(lo) * f(medio) <= 0) hi = medio;
    else lo = medio;
  }
  return new Date(inicio.getTime() + Math.round((lo + hi) / 2) * 60000);
}

// --- Fase lunar -----------------------------------------------------------

export type NombreFase =
  | "Luna nueva"
  | "Creciente"
  | "Cuarto creciente"
  | "Gibosa creciente"
  | "Luna llena"
  | "Gibosa menguante"
  | "Cuarto menguante"
  | "Menguante";

export type Fase = {
  /** 0 = nueva, 0.5 = llena, 1 = nueva otra vez. */
  fraccion: number;
  /** Porcentaje del disco iluminado, 0-100. */
  iluminacion: number;
  nombre: NombreFase;
};

export function faseLunar(fecha: Date): Fase {
  const d = diasDesdeJ2000(fecha);
  const sol = posicionSol(d);
  const luna = posicionLuna(d);

  // Elongación geocéntrica luna-sol. De aquí sale en qué punto del ciclo
  // estamos, y por tanto el nombre de la fase.
  const elongacion = Math.acos(
    Math.cos(luna.latitud) * Math.cos(luna.longitud - sol.longitudEcliptica),
  );
  const fraccion =
    (((luna.longitud - sol.longitudEcliptica) / (2 * Math.PI)) % 1 + 1) % 1;

  // La iluminación no es (1-cos ψ)/2: eso vale si la Tierra estuviera en el
  // Sol. El dato bueno sale del ángulo de fase, que tiene en cuenta que el
  // triángulo Sol-Luna-Tierra no es degenerado. Son varios puntos de
  // diferencia, justo los que faltaban.
  const anguloFase = Math.atan2(
    sol.distanciaKm * Math.sin(elongacion),
    luna.distanciaKm - sol.distanciaKm * Math.cos(elongacion),
  );
  const iluminacion = (1 + Math.cos(anguloFase)) / 2;

  return {
    fraccion,
    iluminacion: Math.round(iluminacion * 100),
    nombre: nombreDeFase(fraccion),
  };
}

function nombreDeFase(f: number): NombreFase {
  if (f < 0.02 || f > 0.98) return "Luna nueva";
  if (f < 0.23) return "Creciente";
  if (f < 0.27) return "Cuarto creciente";
  if (f < 0.48) return "Gibosa creciente";
  if (f < 0.52) return "Luna llena";
  if (f < 0.73) return "Gibosa menguante";
  if (f < 0.77) return "Cuarto menguante";
  return "Menguante";
}

// --- Periodos solunares ---------------------------------------------------

export type Periodo = { desde: Date; hasta: Date };

export type DiaSolunar = {
  fecha: Date;
  fase: Fase;
  amanecer: Date | null;
  atardecer: Date | null;
  salidaLuna: Date | null;
  puestaLuna: Date | null;
  /** Dos horas centradas en el tránsito y el antitránsito lunar. */
  mayores: Periodo[];
  /** Una hora centrada en la salida y en la puesta de luna. */
  menores: Periodo[];
};

function periodo(centro: Date, minutos: number): Periodo {
  return {
    desde: new Date(centro.getTime() - (minutos / 2) * 60000),
    hasta: new Date(centro.getTime() + (minutos / 2) * 60000),
  };
}

/**
 * Todo lo del día para un punto.
 *
 * `inicioDelDia` tiene que ser la medianoche local del sitio. Se pasa ya
 * resuelta desde fuera para no meter aquí una librería de zonas horarias.
 */
export function diaSolunar(
  inicioDelDia: Date,
  latitud: number,
  longitud: number,
): DiaSolunar {
  const sol = cruces(inicioDelDia, latitud, longitud, "sol");
  const luna = cruces(inicioDelDia, latitud, longitud, "luna");

  const mediodia = new Date(inicioDelDia.getTime() + 12 * 3600000);

  const mayores: Periodo[] = [];
  if (luna.transito) mayores.push(periodo(luna.transito, 120));
  if (luna.antitransito) mayores.push(periodo(luna.antitransito, 120));

  const menores: Periodo[] = [];
  if (luna.sale) menores.push(periodo(luna.sale, 60));
  if (luna.pone) menores.push(periodo(luna.pone, 60));

  const porHora = (a: Periodo, b: Periodo) => a.desde.getTime() - b.desde.getTime();

  return {
    fecha: inicioDelDia,
    fase: faseLunar(mediodia),
    amanecer: sol.sale,
    atardecer: sol.pone,
    salidaLuna: luna.sale,
    puestaLuna: luna.pone,
    mayores: mayores.sort(porHora),
    menores: menores.sort(porHora),
  };
}

// ---------------------------------------------------------------------------
// Índice de pesca
// ---------------------------------------------------------------------------

/**
 * Una nota de 0 a 100 para el día.
 *
 * Aquí hay que ser muy claro sobre qué es esto, porque es lo único de la web
 * que no es un dato: **es una estimación nuestra**, no una predicción. Se
 * publica desglosada a propósito, para que cualquiera vea de dónde sale cada
 * punto y decida si le convence.
 *
 * Las tres patas, y lo que respalda a cada una:
 *
 *  - **Luz (0-35)**: cuánto se solapan los periodos solunares con el amanecer
 *    y el atardecer. Es la pata con fundamento de verdad: con poca luz el
 *    depredador ve la silueta de la presa a contraluz y la presa no lo ve a
 *    él, y eso es comportamiento observado, no folclore.
 *  - **Luna (0-40)**: la teoría solunar clásica dice que luna nueva y luna
 *    llena son los mejores días. No está demostrado. Pesa porque es lo que la
 *    gente viene a consultar, pero se dice lo que es.
 *  - **Temporada (0-25)**: si el mes está entre los buenos de ese sitio. Esto
 *    sale de la guía, que es dato propio y no teoría.
 *
 * Lo que NO entra: el tiempo que hará. Haría falta un servicio externo y de
 * momento no lo hay; mejor tres patas honestas que cuatro con una inventada.
 */
export type Desglose = {
  luz: number;
  luna: number;
  temporada: number;
};

export type Indice = {
  total: number;
  desglose: Desglose;
  /** Titular corto para la ficha del día. */
  titular: string;
  descripcion: string;
};

const MAX = { luz: 35, luna: 40, temporada: 25 } as const;

/** Cuántos minutos se solapan dos intervalos. */
function solape(a: Periodo, b: Periodo): number {
  const desde = Math.max(a.desde.getTime(), b.desde.getTime());
  const hasta = Math.min(a.hasta.getTime(), b.hasta.getTime());
  return Math.max(0, (hasta - desde) / 60000);
}

export function indiceDePesca(
  dia: DiaSolunar,
  opciones: { enTemporada?: boolean } = {},
): Indice {
  // --- Luz: solape de los periodos con las dos horas de penumbra ---
  const franjas: Periodo[] = [];
  if (dia.amanecer) franjas.push(periodo(dia.amanecer, 120));
  if (dia.atardecer) franjas.push(periodo(dia.atardecer, 120));

  let minutosSolapados = 0;
  for (const f of franjas) {
    for (const p of dia.mayores) minutosSolapados += solape(f, p);
    // Los menores cuentan la mitad: duran la mitad y valen menos.
    for (const p of dia.menores) minutosSolapados += solape(f, p) * 0.5;
  }
  // 120 minutos de solape ya es lo máximo que se puede pedir.
  const luz = Math.round(MAX.luz * Math.min(1, minutosSolapados / 120));

  // --- Luna: máximo en nueva y en llena, mínimo en los cuartos ---
  // cos(2·2π·fracción) vale 1 en 0 y en 0,5 y -1 en 0,25 y 0,75.
  const ciclo = (Math.cos(4 * Math.PI * dia.fase.fraccion) + 1) / 2;
  const luna = Math.round(MAX.luna * ciclo);

  const temporada = opciones.enTemporada ? MAX.temporada : Math.round(MAX.temporada * 0.4);

  const total = luz + luna + temporada;
  const { titular, descripcion } = etiquetaDe(total);

  return { total, desglose: { luz, luna, temporada }, titular, descripcion };
}

function etiquetaDe(total: number): { titular: string; descripcion: string } {
  if (total >= 80)
    return {
      titular: "Día para no quedarse en casa",
      descripcion:
        "Coinciden varias cosas a favor. Si solo puedes salir un día esta semana, que sea este.",
    };
  if (total >= 65)
    return {
      titular: "Buen día",
      descripcion:
        "Buenas condiciones sobre el papel. Aprovecha los periodos mayores y las dos horas de luz baja.",
    };
  if (total >= 45)
    return {
      titular: "Día normal",
      descripcion:
        "Ni bueno ni malo. Trabájate el amanecer y el atardecer, que es donde de verdad se juega.",
    };
  if (total >= 30)
    return {
      titular: "Día flojo",
      descripcion:
        "Poco a favor. Si puedes elegir, mira los próximos días; si no, céntrate en la primera y la última hora.",
    };
  return {
    titular: "Día malo sobre el papel",
    descripcion:
      "Casi nada a favor hoy. Aun así, el pez no lee calendarios: si te apetece ir, ve.",
  };
}

/** El desglose, con sus máximos, para pintarlo en barras. */
export const MAXIMOS_DESGLOSE = MAX;
