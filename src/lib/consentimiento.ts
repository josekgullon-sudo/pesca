import { cookies } from "next/headers";
import { COOKIE_CONSENTIMIENTO, type Consentimiento } from "./consentimiento-comun";

export * from "./consentimiento-comun";

/**
 * Consentimiento de cookies.
 *
 * Hace falta antes de poner AdSense o cualquier otra cosa que rastree. La
 * norma en España (LSSI y RGPD, con el criterio de la AEPD) exige tres cosas
 * que aquí no son opcionales:
 *
 *  1. **Nada se carga antes de aceptar.** No basta con avisar: mientras no haya
 *     consentimiento, el script de anuncios no se envía siquiera al navegador.
 *     Por eso la decisión se guarda en una cookie que lee el servidor y no en
 *     localStorage, que solo ve el cliente cuando la página ya se ha cargado.
 *  2. **Rechazar tiene que costar lo mismo que aceptar.** Un botón grande de
 *     «Aceptar» y un enlace pequeño de «Configurar» es justo lo que la AEPD
 *     sanciona. Aquí los dos botones son iguales.
 *  3. **Se puede cambiar de opinión.** De ahí el enlace del pie.
 *
 * La cookie de sesión no entra en esto: es técnica e imprescindible para que
 * funcione el login, y esas están exentas de consentimiento.
 */


export async function consentimientoActual(): Promise<Consentimiento> {
  const valor = (await cookies()).get(COOKIE_CONSENTIMIENTO)?.value;
  return valor === "aceptado" || valor === "rechazado" ? valor : null;
}

/**
 * Identificador de AdSense. Sin él no se pinta nada, así que la web funciona
 * igual mientras no haya cuenta de anuncios. No lleva prefijo NEXT_PUBLIC_
 * porque solo se usa en el servidor y así cambiarlo no obliga a reconstruir.
 */
export const ID_ADSENSE = process.env.ADSENSE_ID ?? "";

/** Si no hay anuncios configurados, no hay nada que consentir y no se pregunta. */
export function hayQuePreguntar(): boolean {
  return ID_ADSENSE !== "";
}
