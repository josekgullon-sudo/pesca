/**
 * Banda de color en la cabecera de una tarjeta de sitio.
 *
 * Cuando el sitio tenga foto propia se usa esa; mientras tanto, un degradado
 * según el tipo de agua, que ya distingue de un vistazo un embalse de un río
 * y evita que el listado sea un muro de texto.
 */
export function BandaSitio({
  tipo,
  imagenUrl,
  className = "h-24",
}: {
  tipo: string;
  imagenUrl: string | null;
  className?: string;
}) {
  if (imagenUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imagenUrl} alt="" className={`w-full object-cover ${className}`} />
    );
  }

  const degradado =
    tipo === "rio"
      ? "from-agua-400 to-agua-700"
      : tipo === "canal"
        ? "from-junco-400 to-junco-700"
        : "from-ribera-400 to-ribera-700";

  return (
    <div
      aria-hidden
      className={`w-full bg-gradient-to-br ${degradado} ${className}`}
    />
  );
}
