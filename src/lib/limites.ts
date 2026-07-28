import { headers } from "next/headers";

/**
 * Límites de uso, para que el registro abierto no se convierta en un problema.
 *
 * Es una ventana deslizante en memoria. Con un único proceso de Node en un VPS
 * —que es como se despliega esto— funciona bien y no añade dependencias. Si
 * algún día se arranca en varios procesos habrá que moverlo a la base de datos
 * o a Redis, porque cada proceso llevaría su propia cuenta.
 */

type Registro = { marcas: number[] };

const contadores = new Map<string, Registro>();

/** Cada cuánto se barren las entradas viejas, para que el mapa no crezca. */
const LIMPIEZA_MS = 10 * 60 * 1000;
let ultimaLimpieza = 0;

function limpiar(ahora: number) {
  if (ahora - ultimaLimpieza < LIMPIEZA_MS) return;
  ultimaLimpieza = ahora;

  for (const [clave, registro] of contadores) {
    const vivas = registro.marcas.filter((m) => ahora - m < 24 * 60 * 60 * 1000);
    if (vivas.length === 0) contadores.delete(clave);
    else registro.marcas = vivas;
  }
}

/**
 * Anota un intento y dice si se ha pasado del límite.
 * Devuelve los segundos que faltan para poder reintentar, o 0 si hay vía libre.
 */
export function comprobarLimite(
  clave: string,
  maximo: number,
  ventanaMs: number,
): number {
  const ahora = Date.now();
  limpiar(ahora);

  const registro = contadores.get(clave) ?? { marcas: [] };
  registro.marcas = registro.marcas.filter((m) => ahora - m < ventanaMs);

  if (registro.marcas.length >= maximo) {
    const masAntigua = Math.min(...registro.marcas);
    contadores.set(clave, registro);
    return Math.ceil((ventanaMs - (ahora - masAntigua)) / 1000);
  }

  registro.marcas.push(ahora);
  contadores.set(clave, registro);
  return 0;
}

/**
 * IP de quien pide, mirando las cabeceras que pone el proxy inverso.
 * Si no hay ninguna se usa una clave común: prefiero un límite compartido a no
 * tener límite.
 */
export async function ipDelCliente(): Promise<string> {
  const h = await headers();
  const reenviada = h.get("x-forwarded-for");
  if (reenviada) return reenviada.split(",")[0].trim();
  return h.get("x-real-ip") ?? "sin-ip";
}

export function textoEspera(segundos: number): string {
  if (segundos < 60) return `${segundos} segundos`;
  const minutos = Math.ceil(segundos / 60);
  if (minutos < 60) return `${minutos} minuto${minutos === 1 ? "" : "s"}`;
  const horas = Math.ceil(minutos / 60);
  return `${horas} hora${horas === 1 ? "" : "s"}`;
}

// --- Límites concretos -----------------------------------------------------

export const LIMITE_REGISTRO = { maximo: 3, ventanaMs: 60 * 60 * 1000 };
export const LIMITE_LOGIN = { maximo: 10, ventanaMs: 15 * 60 * 1000 };
export const LIMITE_CAPTURAS = { maximo: 40, ventanaMs: 60 * 60 * 1000 };
