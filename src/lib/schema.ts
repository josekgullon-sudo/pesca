import { DESCRIPCION, LEMA, NOMBRE, urlAbsoluta } from "@/lib/marca";

/**
 * Datos estructurados (JSON-LD, schema.org).
 *
 * Es lo que lee Google para entender que una página no es texto suelto sino un
 * sitio con coordenadas, un pez o un tramo de navegación. Con esto salen las
 * migas de pan en los resultados y las fichas de sitio pueden aparecer en
 * búsquedas de mapa.
 *
 * Regla que no conviene saltarse: aquí solo va información que también está
 * visible en la página. Marcar datos que el visitante no ve es motivo de
 * penalización, y además el día que cambie uno se quedaría desincronizado.
 */

/** Un objeto JSON-LD listo para meter en un <script>. */
export type Schema = Record<string, unknown>;

const CONTEXTO = "https://schema.org";

/** La web en sí. Va una sola vez, en el layout. */
export function schemaWebSite(): Schema {
  return {
    "@context": CONTEXTO,
    "@type": "WebSite",
    "@id": urlAbsoluta("/#website"),
    name: NOMBRE,
    alternateName: LEMA,
    description: DESCRIPCION,
    url: urlAbsoluta("/"),
    inLanguage: "es-ES",
  };
}

/**
 * Migas de pan. Se le pasan las mismas que se pintan en la página, en orden y
 * sin incluirse a sí misma la última… salvo que sí: Google quiere la página
 * actual como último elemento, aunque no sea un enlace.
 */
export function schemaMigas(
  migas: Array<{ nombre: string; ruta: string }>,
): Schema {
  return {
    "@context": CONTEXTO,
    "@type": "BreadcrumbList",
    itemListElement: migas.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.nombre,
      item: urlAbsoluta(m.ruta),
    })),
  };
}

/**
 * Un embalse, un río o un tramo. `Place` con coordenadas es lo que permite que
 * Google lo entienda como un punto del mapa y no como un artículo cualquiera.
 */
export function schemaSitio(sitio: {
  nombre: string;
  descripcion: string;
  municipio: string;
  latitud: number;
  longitud: number;
  imagenUrl: string | null;
  ruta: string;
  provincia: string;
}): Schema {
  return {
    "@context": CONTEXTO,
    "@type": "Place",
    name: sitio.nombre,
    description: sitio.descripcion,
    url: urlAbsoluta(sitio.ruta),
    ...(sitio.imagenUrl ? { image: urlAbsoluta(sitio.imagenUrl) } : {}),
    geo: {
      "@type": "GeoCoordinates",
      latitude: sitio.latitud,
      longitude: sitio.longitud,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: sitio.municipio,
      addressRegion: sitio.provincia,
      addressCountry: "ES",
    },
  };
}

/**
 * Una especie. El tipo correcto es `Taxon`, que Google no usa para resultados
 * enriquecidos pero sí para entender de qué habla la página; el nombre
 * científico es lo que la ancla a un ser vivo concreto y no a una palabra.
 */
export function schemaEspecie(especie: {
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  imagenUrl: string | null;
  ruta: string;
}): Schema {
  return {
    "@context": CONTEXTO,
    "@type": "Taxon",
    name: especie.nombreCientifico,
    alternateName: especie.nombreComun,
    taxonRank: "species",
    description: especie.descripcion,
    url: urlAbsoluta(especie.ruta),
    ...(especie.imagenUrl ? { image: urlAbsoluta(especie.imagenUrl) } : {}),
  };
}
