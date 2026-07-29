/**
 * Límites de las imágenes, en un módulo que puede importar el cliente.
 *
 * `imagenes.ts` usa sharp y el sistema de ficheros, así que no se puede
 * importar desde un componente de cliente. Y el cliente necesita el número
 * para avisar ANTES de enviar: si el fichero se manda y se pasa del cuerpo
 * máximo, Next lo rechaza con un 413 en la capa de transporte y el usuario ve
 * una pantalla de error sin explicación. Comprobar antes es la única forma de
 * dar un mensaje que se entienda.
 */

export const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024;

export const TAMANO_MAXIMO_MB = Math.round(TAMANO_MAXIMO_BYTES / 1024 / 1024);

/**
 * Tope del envío completo. Una captura admite varias fotos y lo que Next
 * limita es el cuerpo entero de la petición, no cada fichero.
 *
 * Va por debajo del `bodySizeLimit` de next.config.ts (24 MB) para dejar sitio
 * al resto del formulario. Si se toca uno hay que tocar el otro, o vuelve el
 * 413 sin mensaje.
 */
export const TAMANO_TOTAL_MAXIMO_BYTES = 22 * 1024 * 1024;

export const TAMANO_TOTAL_MAXIMO_MB = Math.round(
  TAMANO_TOTAL_MAXIMO_BYTES / 1024 / 1024,
);

/** Mensaje único, para que diga lo mismo en el cliente y en el servidor. */
export function mensajeDemasiadoGrande(nombre?: string): string {
  return `${nombre ? `«${nombre}» pesa` : "La imagen pesa"} más de ${TAMANO_MAXIMO_MB} MB. Reduce el tamaño o elige otra.`;
}

/** Aviso cuando la suma de todas las fotos se pasa. */
export function mensajeEnvioDemasiadoGrande(): string {
  return `Entre todas las fotos suman más de ${TAMANO_TOTAL_MAXIMO_MB} MB. Quita alguna y vuelve a intentarlo.`;
}
