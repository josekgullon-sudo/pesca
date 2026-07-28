/**
 * Barra visual de abundancia (1 a 5).
 *
 * No es solo color: el número va escrito al lado. A pleno sol, y con daltonismo
 * de por medio, cinco barritas verdes no se distinguen de tres.
 */
export function BarraAbundancia({
  valor,
  etiqueta = "Abundancia",
}: {
  valor: number;
  etiqueta?: string;
}) {
  const nivel = Math.max(1, Math.min(5, Math.round(valor)));

  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={`${etiqueta}: ${nivel} de 5`}
    >
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`h-4 w-1.5 rounded-full ${
              i <= nivel ? "bg-acento" : "bg-borde"
            }`}
          />
        ))}
      </span>
      <span className="sr-only">
        {etiqueta}: {nivel} de 5
      </span>
      <span aria-hidden className="text-sm font-bold tabular-nums">
        {nivel}
      </span>
    </span>
  );
}
