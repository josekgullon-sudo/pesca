import {
  AVISO_LEGAL_PERMANENTE,
  URL_PORTAL_CAZA_Y_PESCA,
} from "@/lib/avisos";

/**
 * Aviso legal obligatorio. Va en el pie de página y, con `variante="destacado"`,
 * dentro de cada ficha de sitio.
 */
export function AvisoLegal({
  variante = "pie",
}: {
  variante?: "pie" | "destacado";
}) {
  if (variante === "destacado") {
    return (
      <aside
        role="note"
        className="rounded-xl border-2 border-ambar-texto/30 bg-ambar-fondo p-4 text-ambar-texto"
      >
        <p className="mb-2 flex items-center gap-2 text-base font-bold">
          <span aria-hidden>⚠️</span> Antes de salir
        </p>
        <p className="text-[0.95rem] leading-relaxed">{AVISO_LEGAL_PERMANENTE}</p>
        <a
          href={URL_PORTAL_CAZA_Y_PESCA}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-touch items-center rounded-lg bg-ambar-texto px-4 py-2 font-semibold text-ambar-fondo underline-offset-2 hover:underline"
        >
          Portal de Caza y Pesca de la Junta ↗
        </a>
      </aside>
    );
  }

  return (
    <p className="text-sm leading-relaxed text-texto-suave">
      {AVISO_LEGAL_PERMANENTE}{" "}
      <a
        href={URL_PORTAL_CAZA_Y_PESCA}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-acento underline underline-offset-2"
      >
        Abrir el Portal de Caza y Pesca ↗
      </a>
    </p>
  );
}
