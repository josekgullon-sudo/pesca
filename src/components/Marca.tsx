/**
 * El distintivo de la marca: un anzuelo dentro de una gota, o un pez visto de
 * lado según a quién le preguntes.
 *
 * Va en SVG y no como fichero de imagen porque hereda el color del texto —así
 * funciona igual en la cabecera oscura que sobre fondo claro— y porque pesa
 * menos que la petición que haría falta para traerlo.
 */
export function Marca({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* La gota: la marca de un punto en el mapa, que es de lo que va la web */}
      <path d="M16 3c4.6 5.2 7 9.2 7 12.4A7 7 0 0 1 9 15.4C9 12.2 11.4 8.2 16 3Z" />
      {/* La lámina de agua dentro */}
      <path d="M11.2 16.4c1.2-1.1 2.4-1.1 3.6 0s2.4 1.1 3.6 0" />
      {/* El sedal cayendo */}
      <path d="M16 22.4V26" />
      <path d="M16 26a3 3 0 0 1-3 3" strokeWidth="2" />
    </svg>
  );
}
