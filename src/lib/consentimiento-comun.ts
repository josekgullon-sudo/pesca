/**
 * Constantes del consentimiento que necesitan los dos lados.
 *
 * Van aparte de `consentimiento.ts` porque aquel importa `next/headers`, que
 * solo existe en el servidor: si el banner —que es un componente de cliente—
 * importara de allí, el build falla. Aquí no hay nada que dependa del entorno.
 */

export const COOKIE_CONSENTIMIENTO = "consentimiento";

export type Consentimiento = "aceptado" | "rechazado" | null;

/** Seis meses. Pasado ese tiempo se vuelve a preguntar, como recomienda la AEPD. */
export const DIAS_CONSENTIMIENTO = 180;
