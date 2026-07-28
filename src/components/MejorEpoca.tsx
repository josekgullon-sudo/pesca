import { MESES, MESES_CORTOS, parseMeses } from "@/lib/enums";

/** Tira de doce meses con los buenos resaltados. Se lee de un vistazo. */
export function MejorEpoca({ json }: { json: string }) {
  const meses = new Set(parseMeses(json));
  if (meses.size === 0) return null;

  const nombres = [...meses].sort((a, b) => a - b).map((m) => MESES[m - 1]);

  return (
    <div>
      <ol className="flex gap-1" aria-hidden>
        {MESES_CORTOS.map((corto, i) => {
          const bueno = meses.has(i + 1);
          return (
            <li
              key={corto}
              className={`flex-1 rounded py-1.5 text-center text-[0.7rem] font-bold uppercase ${
                bueno
                  ? "bg-acento text-acento-texto"
                  : "bg-chip-fondo text-texto-suave"
              }`}
            >
              {corto.charAt(0)}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-[0.95rem] leading-relaxed">
        <span className="sr-only">Mejor época: </span>
        {nombres.join(", ")}.
      </p>
    </div>
  );
}
