import { color } from "./SemaforoLegal";

/**
 * Imagen de la especie.
 *
 * Todavía no tenemos fotos propias de ninguna, así que en vez de tirar de
 * imágenes de internet (que además tienen dueño) se dibuja una silueta con la
 * inicial y el color del semáforo legal. Cuando haya foto, `imagenUrl` la pisa.
 *
 * Que el marcador de posición ya lleve el color del semáforo hace que el
 * listado se lea de un vistazo aunque no haya ni una sola foto.
 */

const FONDO = {
  verde: "bg-verde-fondo text-verde-texto",
  ambar: "bg-ambar-fondo text-ambar-texto",
  rojo: "bg-rojo-fondo text-rojo-texto",
} as const;

export function FotoEspecie({
  nombre,
  imagenUrl,
  estadoLegal,
  className = "",
}: {
  nombre: string;
  imagenUrl: string | null;
  estadoLegal: string;
  className?: string;
}) {
  if (imagenUrl) {
    // Va con <img> y no con next/image a propósito. El optimizador de Next
    // sirve las imágenes desde /_next/image, que está fuera del middleware, y
    // eso dejaría las fotos accesibles sin sesión. Además son ficheros locales
    // que ya se guardan redimensionados, así que no hay nada que optimizar.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imagenUrl}
        alt={nombre}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`flex items-center justify-center ${FONDO[color(estadoLegal)]} ${className}`}
    >
      <svg viewBox="0 0 64 32" className="h-1/2 w-1/2" fill="currentColor">
        <path
          opacity="0.35"
          d="M2 16c8-9 18-13 27-13s17 4 22 13c-5 9-13 13-22 13S10 25 2 16Z"
        />
        <path opacity="0.35" d="M53 16c2-3 6-6 9-7-1 5-1 9 0 14-3-1-7-4-9-7Z" />
        <circle cx="17" cy="13" r="2.5" />
      </svg>
    </div>
  );
}
