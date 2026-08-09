/**
 * La configuración del contador de visitas, en un solo sitio.
 *
 * Se lee del entorno al arrancar, no al compilar, igual que `URL_BASE`: así
 * cambiar el subdominio de la analítica no obliga a reconstruir la imagen.
 *
 * Devuelve `null` mientras falte cualquiera de las dos variables. Eso NO es un
 * caso raro que haya que arreglar: es el estado normal en desarrollo, y es lo
 * que evita que trastear en local le meta visitas inventadas a las
 * estadísticas de verdad.
 */

export type ConfigAnalitica = { url: string; idWeb: string } | null;

/**
 * Va aparte del `const` para poder probarla: leer del entorno en el momento de
 * importar el módulo hace que un test no pueda cambiar nada.
 *
 * La barra final se quita porque el script se pide como `${url}/script.js`, y
 * un `https://analitica.midominio.es/` copiado del navegador dejaría una
 * dirección con doble barra. No revienta, pero deja de coincidir con el origen
 * que Umami espera y las visitas se dejan de contar sin decir nada.
 */
export function configurarAnalitica(entorno: {
  UMAMI_URL?: string;
  UMAMI_WEBSITE_ID?: string;
}): ConfigAnalitica {
  const limpiar = (v: string | undefined) => (v ?? "").trim().replace(/\/+$/, "");
  const url = limpiar(entorno.UMAMI_URL);
  const idWeb = limpiar(entorno.UMAMI_WEBSITE_ID);
  if (!url || !idWeb) return null;
  return { url, idWeb };
}

export const ANALITICA: ConfigAnalitica = configurarAnalitica({
  UMAMI_URL: process.env.UMAMI_URL,
  UMAMI_WEBSITE_ID: process.env.UMAMI_WEBSITE_ID,
});

/**
 * Si hay analítica, hay que contarlo en el aviso legal. Lo usa esa página para
 * no prometer que no se mide nada cuando sí se mide, ni al revés.
 */
export const HAY_ANALITICA = ANALITICA !== null;
