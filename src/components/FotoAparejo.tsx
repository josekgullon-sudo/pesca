import { ETIQUETA_TIPO_APAREJO, type TipoAparejo } from "@/lib/enums";

/**
 * La foto de un aparejo, o un hueco decente mientras no la haya.
 *
 * El hueco importa más de lo que parece. Estas fichas nacen sin foto: no vale
 * bajarlas de la web del fabricante —son suyas— y en Wikimedia Commons casi no
 * hay señuelos, así que la foto buena es la que se hace uno de su propia caja.
 * Mientras llega, el hueco tiene que quedar digno y decir qué es, no romper el
 * listado con un cuadro gris.
 *
 * El color va por tipo de aparejo, para que un listado de veinte se lea de un
 * vistazo: los vinilos de un color, los cebos naturales de otro.
 */

const FONDO: Record<TipoAparejo, string> = {
  vinilo: "bg-[#2f4f4f]",
  senuelo_duro: "bg-[#3d4f6b]",
  cebo_natural: "bg-[#5a4a33]",
  engodo: "bg-[#4a4636]",
  montaje: "bg-[#4a3a44]",
};

export function FotoAparejo({
  nombre,
  imagenUrl,
  tipo,
  className = "",
}: {
  nombre: string;
  imagenUrl: string | null;
  tipo: string;
  className?: string;
}) {
  if (imagenUrl) {
    // Con <img> y no con next/image, por lo mismo que las fotos de especies:
    // el optimizador sirve desde /_next/image, que queda fuera del middleware.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imagenUrl} alt={nombre} className={`object-cover ${className}`} />
    );
  }

  const t = tipo as TipoAparejo;
  return (
    <div
      className={`flex items-center justify-center p-3 text-center ${FONDO[t] ?? "bg-[#3f3f3f]"} ${className}`}
    >
      <span className="text-xs font-bold uppercase tracking-wide text-white/70">
        {ETIQUETA_TIPO_APAREJO[t] ?? "Aparejo"}
      </span>
    </div>
  );
}
