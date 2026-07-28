import type { MetadataRoute } from "next";
import { urlAbsoluta } from "@/lib/marca";

// Dinámico para que el dominio se lea al arrancar y no al compilar: si no, la
// imagen de Docker se construye sin URL_BASE y el robots.txt saldría con el
// dominio de reserva pase lo que pase en el .env del servidor.
export const dynamic = "force-dynamic";

/**
 * Lo que se deja rastrear.
 *
 * Fuera quedan las zonas privadas y las que no aportan nada en una búsqueda:
 * formularios, cuenta y la API.
 *
 * Con las fotos hay que hilar más fino. Las de embalses y especies son las que
 * salen al compartir un enlace y las que pueden traer visitas desde Google
 * Imágenes, así que se dejan rastrear. Las de `uploads/` son las que sube la
 * gente con sus capturas: se ven en la web, pero no tienen por qué acabar
 * buscables sueltas en Google Imágenes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/media/sitios/", "/media/especies/"],
      disallow: [
        "/cuenta",
        "/entrar",
        "/registro",
        "/capturas/nueva",
        "/media/uploads/",
        "/api/",
      ],
    },
    sitemap: urlAbsoluta("/sitemap.xml"),
    host: urlAbsoluta("/"),
  };
}
