import { Portada } from "./Portada";

/**
 * Banda de cabecera de una tarjeta de sitio.
 *
 * Cuando el sitio tenga foto propia se usa esa; mientras tanto, la misma
 * ilustración de la portada con el tono del tipo de agua. Antes era un
 * degradado plano y las tarjetas parecían fichas sin terminar.
 */
export function BandaSitio({
  tipo,
  imagenUrl,
  slug,
  className = "h-24",
}: {
  tipo: string;
  imagenUrl: string | null;
  /** Hace únicos los degradados del SVG cuando hay varias tarjetas a la vez. */
  slug: string;
  className?: string;
}) {
  if (imagenUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imagenUrl} alt="" className={`w-full object-cover ${className}`} />
    );
  }

  const variante = tipo === "rio" || tipo === "canal" ? tipo : "embalse";
  return <Portada className={`w-full ${className}`} variante={variante} id={slug} />;
}
