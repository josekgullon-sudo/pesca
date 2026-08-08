/**
 * El tiempo que hace en un punto, de Open-Meteo.
 *
 * Es el único dato de toda la web que viene de fuera. Eso cambia las reglas y
 * conviene tenerlo presente:
 *
 *  - **No puede tumbar la página.** Si Open-Meteo tarda o no contesta, esto
 *    devuelve `null` y el calendario se pinta igual, sin el bloque del tiempo.
 *    Un servicio de terceros no puede llevarse por delante una página que
 *    funcionaba perfectamente sin él.
 *  - **No entra en la nota.** El índice sigue saliendo solo de astronomía y de
 *    la guía, que son deterministas y se pueden probar. Meter el tiempo dentro
 *    haría que la misma fecha diera notas distintas según cuándo se mire y que
 *    los tests dependieran de la red. Se enseña al lado, que es donde sirve.
 *  - **Se cachea.** Media hora por punto. Sin esto, cada visita a la portada
 *    dispararía una llamada por embalse, que además de lento sería abusar de un
 *    servicio gratuito.
 *
 * Open-Meteo es gratuito, no pide clave y permite uso comercial. A cambio hay
 * que atribuirlo, y por eso `ATRIBUCION` viaja con el dato hasta la pantalla.
 */

export const ATRIBUCION = {
  nombre: "Open-Meteo",
  url: "https://open-meteo.com/",
  licencia: "CC BY 4.0",
};

export type Clima = {
  temperaturaC: number;
  vientoKmH: number;
  /** Cardinal en español: N, NE, E, SE, S, SO, O, NO. */
  vientoDireccion: string;
  presionHPa: number;
  /** Cómo va la presión en las últimas horas. Es lo que de verdad se mira. */
  tendencia: "subiendo" | "bajando" | "estable";
  cambioPresionHPa: number;
};

const ROSA = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];

function cardinal(grados: number): string {
  return ROSA[Math.round(grados / 45) % 8];
}

/** Cuánto esperamos como mucho. Pasado esto, la página sale sin tiempo. */
const ESPERA_MS = 3500;

/**
 * El tiempo ahora mismo, o `null` si no se ha podido.
 *
 * Nunca lanza: quien lo llama no tiene que envolverlo en try/catch para que su
 * página no se caiga, que es justo el descuido que convierte una dependencia
 * externa en una caída propia.
 */
export async function climaDe(
  latitud: number,
  longitud: number,
): Promise<Clima | null> {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitud.toFixed(3)}&longitude=${longitud.toFixed(3)}` +
    "&current=temperature_2m,wind_speed_10m,wind_direction_10m,surface_pressure" +
    "&hourly=surface_pressure&past_hours=3&forecast_hours=1" +
    "&wind_speed_unit=kmh&timezone=Europe%2FMadrid";

  try {
    const respuesta = await fetch(url, {
      // El cacheado lo lleva Next: media hora por punto, compartida entre
      // todas las visitas. Las coordenadas van redondeadas a tres decimales
      // —unos cien metros— para que dos sitios cercanos compartan entrada.
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    if (!respuesta.ok) return null;

    const datos = (await respuesta.json()) as {
      current?: {
        temperature_2m?: number;
        wind_speed_10m?: number;
        wind_direction_10m?: number;
        surface_pressure?: number;
      };
      hourly?: { surface_pressure?: (number | null)[] };
    };

    const ahora = datos.current;
    if (
      !ahora ||
      typeof ahora.temperature_2m !== "number" ||
      typeof ahora.surface_pressure !== "number"
    ) {
      return null;
    }

    // La tendencia sale de comparar la presión de hace unas horas con la de
    // ahora. El valor absoluto dice poco; lo que se mira es si sube o baja.
    const serie = (datos.hourly?.surface_pressure ?? []).filter(
      (p): p is number => typeof p === "number",
    );
    const cambio =
      serie.length >= 2 ? serie[serie.length - 1] - serie[0] : 0;

    return {
      temperaturaC: Math.round(ahora.temperature_2m),
      vientoKmH: Math.round(ahora.wind_speed_10m ?? 0),
      vientoDireccion: cardinal(ahora.wind_direction_10m ?? 0),
      presionHPa: Math.round(ahora.surface_pressure),
      tendencia: cambio > 1 ? "subiendo" : cambio < -1 ? "bajando" : "estable",
      cambioPresionHPa: Math.round(cambio * 10) / 10,
    };
  } catch {
    // Tiempo agotado, sin red, JSON raro: da igual cuál. La página se pinta
    // sin el bloque del tiempo y ya está.
    return null;
  }
}
