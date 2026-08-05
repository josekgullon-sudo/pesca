/**
 * De dónde sale el visitante, para poder decirle a qué distancia le pilla cada
 * sitio.
 *
 * Hasta ahora las distancias venían medidas desde Dos Hermanas, que es de donde
 * salía quien montó la guía. Para una web nacional eso no significa nada: a
 * alguien de Huelva le da igual que un embalse esté a 40 minutos de Dos
 * Hermanas.
 *
 * Dos formas de saberlo, y las dos son voluntarias:
 *
 *  - **El GPS del navegador.** Preciso, pero pide permiso y mucha gente dice
 *    que no —con razón—.
 *  - **El código postal.** No pide permiso a nadie y es lo que la gente teclea
 *    sin pensárselo. A cambio es aproximado: se resuelve al centro de la
 *    provincia, así que puede irse decenas de kilómetros. Se dice claramente
 *    en la interfaz, porque una distancia que parece exacta y no lo es es peor
 *    que una que se presenta como aproximada.
 *
 * Este módulo no importa nada del servidor: lo usan las dos partes.
 */

export const COOKIE_UBICACION = "ubicacion";

/** Un año. Es una preferencia, no un dato que caduque. */
export const DIAS_UBICACION = 365;

export type Ubicacion = {
  latitud: number;
  longitud: number;
  /** Lo que se le enseña a la persona: «Sevilla (41013)» o «Tu ubicación». */
  etiqueta: string;
  /** El código postal solo da el centro de la provincia. */
  aproximada: boolean;
};

/**
 * Los dos primeros dígitos de un código postal español son la provincia. Aquí
 * van los cincuenta y dos con las coordenadas de su capital, que es la
 * referencia estable: los límites provinciales no se mueven.
 */
const PROVINCIAS_CP: Record<string, { nombre: string; lat: number; lon: number }> = {
  "01": { nombre: "Álava", lat: 42.8467, lon: -2.6716 },
  "02": { nombre: "Albacete", lat: 38.9943, lon: -1.8585 },
  "03": { nombre: "Alicante", lat: 38.3452, lon: -0.481 },
  "04": { nombre: "Almería", lat: 36.8381, lon: -2.4597 },
  "05": { nombre: "Ávila", lat: 40.6565, lon: -4.6818 },
  "06": { nombre: "Badajoz", lat: 38.8794, lon: -6.9707 },
  "07": { nombre: "Islas Baleares", lat: 39.5696, lon: 2.6502 },
  "08": { nombre: "Barcelona", lat: 41.3874, lon: 2.1686 },
  "09": { nombre: "Burgos", lat: 42.3439, lon: -3.6969 },
  "10": { nombre: "Cáceres", lat: 39.4753, lon: -6.3724 },
  "11": { nombre: "Cádiz", lat: 36.5271, lon: -6.2886 },
  "12": { nombre: "Castellón", lat: 39.9864, lon: -0.0513 },
  "13": { nombre: "Ciudad Real", lat: 38.9848, lon: -3.9273 },
  "14": { nombre: "Córdoba", lat: 37.8882, lon: -4.7794 },
  "15": { nombre: "A Coruña", lat: 43.3623, lon: -8.4115 },
  "16": { nombre: "Cuenca", lat: 40.0704, lon: -2.1374 },
  "17": { nombre: "Girona", lat: 41.9794, lon: 2.8214 },
  "18": { nombre: "Granada", lat: 37.1773, lon: -3.5986 },
  "19": { nombre: "Guadalajara", lat: 40.6289, lon: -3.1613 },
  "20": { nombre: "Guipúzcoa", lat: 43.3183, lon: -1.9812 },
  "21": { nombre: "Huelva", lat: 37.2614, lon: -6.9447 },
  "22": { nombre: "Huesca", lat: 42.1401, lon: -0.4089 },
  "23": { nombre: "Jaén", lat: 37.7796, lon: -3.7849 },
  "24": { nombre: "León", lat: 42.5987, lon: -5.5671 },
  "25": { nombre: "Lleida", lat: 41.6176, lon: 0.6200 },
  "26": { nombre: "La Rioja", lat: 42.4627, lon: -2.4449 },
  "27": { nombre: "Lugo", lat: 43.0121, lon: -7.5559 },
  "28": { nombre: "Madrid", lat: 40.4168, lon: -3.7038 },
  "29": { nombre: "Málaga", lat: 36.7213, lon: -4.4214 },
  "30": { nombre: "Murcia", lat: 37.9922, lon: -1.1307 },
  "31": { nombre: "Navarra", lat: 42.8125, lon: -1.6458 },
  "32": { nombre: "Ourense", lat: 42.3358, lon: -7.8639 },
  "33": { nombre: "Asturias", lat: 43.3619, lon: -5.8494 },
  "34": { nombre: "Palencia", lat: 42.0096, lon: -4.5288 },
  "35": { nombre: "Las Palmas", lat: 28.1235, lon: -15.4363 },
  "36": { nombre: "Pontevedra", lat: 42.4310, lon: -8.6444 },
  "37": { nombre: "Salamanca", lat: 40.9701, lon: -5.6635 },
  "38": { nombre: "Santa Cruz de Tenerife", lat: 28.4636, lon: -16.2518 },
  "39": { nombre: "Cantabria", lat: 43.4623, lon: -3.8100 },
  "40": { nombre: "Segovia", lat: 40.9429, lon: -4.1088 },
  "41": { nombre: "Sevilla", lat: 37.3891, lon: -5.9845 },
  "42": { nombre: "Soria", lat: 41.7665, lon: -2.4790 },
  "43": { nombre: "Tarragona", lat: 41.1189, lon: 1.2445 },
  "44": { nombre: "Teruel", lat: 40.3456, lon: -1.1065 },
  "45": { nombre: "Toledo", lat: 39.8628, lon: -4.0273 },
  "46": { nombre: "Valencia", lat: 39.4699, lon: -0.3763 },
  "47": { nombre: "Valladolid", lat: 41.6523, lon: -4.7245 },
  "48": { nombre: "Vizcaya", lat: 43.2630, lon: -2.9350 },
  "49": { nombre: "Zamora", lat: 41.5033, lon: -5.7446 },
  "50": { nombre: "Zaragoza", lat: 41.6488, lon: -0.8891 },
  "51": { nombre: "Ceuta", lat: 35.8894, lon: -5.3213 },
  "52": { nombre: "Melilla", lat: 35.2923, lon: -2.9381 },
};

/** Resuelve un código postal al centro de su provincia. */
export function desdeCodigoPostal(cp: string): Ubicacion | null {
  const limpio = cp.trim();
  if (!/^\d{5}$/.test(limpio)) return null;

  const provincia = PROVINCIAS_CP[limpio.slice(0, 2)];
  if (!provincia) return null;

  return {
    latitud: provincia.lat,
    longitud: provincia.lon,
    etiqueta: `${provincia.nombre} (${limpio})`,
    aproximada: true,
  };
}

/**
 * Distancia en línea recta entre dos puntos, en kilómetros (haversine).
 *
 * En línea recta, no por carretera: calcular lo segundo necesitaría un servicio
 * de rutas externo, con su clave y su coste, y para ordenar una lista de sitios
 * por cercanía no aporta nada. Lo que sí importa es **decirlo**, porque por
 * carretera siempre es más.
 */
export function distanciaKm(
  a: { latitud: number; longitud: number },
  b: { latitud: number; longitud: number },
): number {
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;

  const dLat = rad(b.latitud - a.latitud);
  const dLon = rad(b.longitud - a.longitud);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Redondeo con el que se enseña: al entero por encima de 10 km, con decimal por debajo. */
export function formatearKm(km: number): string {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/**
 * Cuánto se tarda en coche, estimado.
 *
 * Lo que la gente pregunta no es «cuántos kilómetros hay» sino «cuánto tardo».
 * Un servicio de rutas de verdad —Google, OSRM— daría el minuto exacto, pero
 * trae clave, coste y una llamada externa por cada sitio de la lista.
 *
 * Así que se estima en dos pasos, y los dos se quedan cortos a propósito:
 *
 *  1. **De la línea recta a la carretera.** En España la carretera es de media
 *     un 25-30 % más larga que la línea recta. Se usa 1,3 porque los embalses
 *     están donde están: al final de una comarcal con curvas, no en la autovía.
 *  2. **De los kilómetros a los minutos.** A tramos, porque no se va igual en
 *     los primeros veinte kilómetros que en doscientos de autovía.
 *
 * El resultado se redondea a cuartos de hora arriba de una hora: dar «87 min»
 * finge una precisión que este cálculo no tiene. Y en la interfaz siempre va
 * con su «aprox.» delante, porque es una estimación, no una ruta.
 */
export function tiempoEnCocheAprox(kmEnLineaRecta: number): number {
  const porCarretera = kmEnLineaRecta * 1.3;

  // km/h medios de cada tramo, acumulando: los primeros kilómetros son de
  // travesía y rotondas; a partir de ahí ya se coge carretera abierta.
  const tramos: [limiteKm: number, velocidad: number][] = [
    [15, 40],
    [50, 70],
    [Infinity, 85],
  ];

  let restan = porCarretera;
  let horas = 0;
  let desde = 0;
  for (const [limite, velocidad] of tramos) {
    if (restan <= 0) break;
    const enEsteTramo = Math.min(restan, limite - desde);
    horas += enEsteTramo / velocidad;
    restan -= enEsteTramo;
    desde = limite;
  }

  const minutos = horas * 60;
  return minutos < 60 ? Math.round(minutos / 5) * 5 : Math.round(minutos / 15) * 15;
}

/** «45 min», «1 h 15 min», «2 h». */
export function formatearTiempo(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/** La cookie guarda «lat|lon|aproximada|etiqueta». Formato plano, sin JSON. */
export function serializar(u: Ubicacion): string {
  return [
    u.latitud.toFixed(5),
    u.longitud.toFixed(5),
    u.aproximada ? "1" : "0",
    u.etiqueta,
  ].join("|");
}

export function deserializar(valor: string | undefined): Ubicacion | null {
  if (!valor) return null;
  const [lat, lon, aprox, ...resto] = valor.split("|");
  const latitud = Number(lat);
  const longitud = Number(lon);

  // Coordenadas fuera de rango: cookie manipulada o corrupta. Se ignora.
  if (!Number.isFinite(latitud) || Math.abs(latitud) > 90) return null;
  if (!Number.isFinite(longitud) || Math.abs(longitud) > 180) return null;

  return {
    latitud,
    longitud,
    aproximada: aprox === "1",
    etiqueta: resto.join("|").slice(0, 60) || "Tu ubicación",
  };
}
