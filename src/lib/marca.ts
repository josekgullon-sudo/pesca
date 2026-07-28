/**
 * Identidad de la web en un solo sitio: nombre, dominio y textos de marca.
 *
 * El dominio se lee de una variable de entorno porque hace falta al construir
 * URLs absolutas —sitemap, canónicas, Open Graph— y en desarrollo apunta a
 * localhost. Si falta, se usa el de producción: es mejor eso que generar un
 * sitemap con enlaces a localhost.
 *
 * La variable NO lleva prefijo NEXT_PUBLIC_ a propósito. Next sustituye esas
 * por su valor al compilar, así que cambiar el dominio obligaría a reconstruir
 * la imagen entera; así basta con reiniciar el contenedor. Solo se usa en el
 * servidor (metadatos, sitemap, robots, datos estructurados), que es donde se
 * generan las URLs absolutas.
 */

export const NOMBRE = "Mapa de Pesca";

export const LEMA = "Dónde pescar en España, provincia a provincia";

export const DESCRIPCION =
  "Embalses y ríos de España con las especies de cada sitio, qué llevar para " +
  "pescarlas y qué dice la ley de cada una. Con el diario de capturas y el " +
  "ranking de la comunidad.";

/** Dominio con esquema y sin barra final. */
export const URL_BASE = (
  process.env.URL_BASE ?? "https://mapadepesca.es"
).replace(/\/$/, "");

/** URL absoluta de una ruta interna. Para el sitemap y las canónicas. */
export function urlAbsoluta(ruta: string): string {
  return `${URL_BASE}${ruta.startsWith("/") ? ruta : `/${ruta}`}`;
}

/**
 * Metadatos de una página: canónica y tarjeta de Open Graph.
 *
 * Existe porque Next **no fusiona** el bloque `openGraph` con el del layout: en
 * cuanto una página declara el suyo, pierde el `siteName` y el `locale` y la
 * tarjeta que se ve al compartir el enlace sale a medias. Pasando por aquí eso
 * no puede olvidarse en una página suelta.
 */
export function metadatosDePagina({
  titulo,
  descripcion,
  ruta,
  tipo = "website",
  imagen,
}: {
  titulo: string;
  descripcion: string;
  ruta: string;
  tipo?: "website" | "article";
  imagen?: string | null;
}) {
  return {
    title: titulo,
    description: descripcion,
    // Sin canónica, cada variante de la URL —filtros, parámetros de campaña—
    // se indexa como una página distinta con el mismo contenido.
    alternates: { canonical: ruta },
    openGraph: {
      type: tipo,
      url: ruta,
      siteName: NOMBRE,
      locale: "es_ES",
      title: titulo,
      description: descripcion,
      ...(imagen ? { images: [{ url: imagen }] } : {}),
    },
  } as const;
}
