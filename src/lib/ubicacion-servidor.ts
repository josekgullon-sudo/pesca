import { cookies } from "next/headers";
import { COOKIE_UBICACION, deserializar, type Ubicacion } from "./ubicacion";

/**
 * La ubicación elegida, leída de la cookie.
 *
 * Va aparte de `ubicacion.ts` porque importa `next/headers`, que solo existe en
 * el servidor: si el selector —que es de cliente— importara de aquí, el build
 * falla.
 */
export async function ubicacionActual(): Promise<Ubicacion | null> {
  const bruto = (await cookies()).get(COOKIE_UBICACION)?.value;
  return deserializar(bruto ? decodeURIComponent(bruto) : undefined);
}
