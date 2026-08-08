/**
 * Emparejar nuestros embalses con los del boletín hidrológico.
 *
 * Vive aquí y no dentro del script por un motivo que salió probándolo:
 * importar un script para poder testear sus funciones lo **ejecuta**, y este
 * en concreto se conecta a la base de datos y sale a internet. Las funciones
 * puras se sacan, el script se queda con lo que es suyo, y así esto se puede
 * probar sin efectos.
 */

/**
 * Deja un nombre listo para comparar: sin tildes, sin artículos y sin la
 * palabra «embalse».
 *
 * El boletín no usa nuestros nombres. «Embalse José Torán» allí puede ser
 * «JOSE TORAN». Emparejar mal no es un detalle: enseñar el porcentaje de otro
 * pantano manda a alguien a conducir dos horas para encontrarse el agua a
 * trescientos metros de donde aparcó.
 */
export function normalizar(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(embalse|pantano|de|del|la|el|los|las)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** «09/08/2026» o «2026-08-09». Nunca devuelve una fecha inválida. */
export function interpretarFecha(bruto: string): Date {
  const conBarras = bruto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (conBarras) {
    const [, d, m, a] = conBarras;
    return new Date(Date.UTC(+a, +m - 1, +d));
  }
  const iso = new Date(bruto);
  return Number.isNaN(iso.getTime()) ? new Date() : iso;
}
