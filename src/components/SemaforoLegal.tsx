import {
  ETIQUETA_ESTADO_LEGAL,
  RESUMEN_SEMAFORO,
  SEMAFORO_POR_ESTADO,
  type ColorSemaforo,
  type EstadoLegal,
} from "@/lib/enums";

const CLASES: Record<ColorSemaforo, string> = {
  verde: "bg-verde-fondo text-verde-texto",
  ambar: "bg-ambar-fondo text-ambar-texto",
  rojo: "bg-rojo-fondo text-rojo-texto",
};

// Además del color, un símbolo. Con sol de frente el color se lava, y hay
// gente que no distingue el verde del rojo.
const SIMBOLO: Record<ColorSemaforo, string> = {
  verde: "✓",
  ambar: "!",
  rojo: "✕",
};

export function color(estado: string): ColorSemaforo {
  return SEMAFORO_POR_ESTADO[estado as EstadoLegal] ?? "ambar";
}

/** Etiqueta compacta, para tablas y listados. */
export function EtiquetaLegal({ estado }: { estado: string }) {
  const c = color(estado);
  const texto =
    ETIQUETA_ESTADO_LEGAL[estado as EstadoLegal] ?? "Consultar normativa";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold ${CLASES[c]}`}
    >
      <span aria-hidden>{SIMBOLO[c]}</span>
      {texto}
    </span>
  );
}

/** Bloque grande con el resumen de qué hacer con el pez. Para la ficha. */
export function SemaforoLegal({ estado }: { estado: string }) {
  const c = color(estado);
  const titulo =
    ETIQUETA_ESTADO_LEGAL[estado as EstadoLegal] ?? "Consultar normativa";
  const resumen =
    RESUMEN_SEMAFORO[estado as EstadoLegal] ??
    "Consulta la orden de vedas vigente antes de decidir qué hacer con la captura.";

  return (
    <div className={`rounded-xl p-4 ${CLASES[c]}`}>
      <p className="flex items-center gap-2 text-lg font-bold">
        <span aria-hidden className="text-xl">
          {SIMBOLO[c]}
        </span>
        {titulo}
      </p>
      <p className="mt-1 leading-relaxed">{resumen}</p>
    </div>
  );
}
