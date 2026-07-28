/**
 * Ilustración de cabecera: un embalse de la Sierra Norte al amanecer.
 *
 * Es un SVG dibujado a mano con los colores de la paleta, no una foto de
 * relleno. Motivos: pesa dos kilobytes, se ve al instante y sin conexión —que
 * es medio sentido de esta app—, y no depende de que nadie ejecute un script
 * ni de fotos con dueño. Cuando haya fotos propias de los sitios, la portada
 * puede pasar a usarlas.
 */
/** Cada tipo de agua tiene su tono, para distinguirlos de un vistazo. */
const TONOS = {
  embalse: { agua: ["--color-agua-400", "--color-agua-700"], monte: "--color-ribera-800" },
  rio: { agua: ["--color-agua-300", "--color-agua-600"], monte: "--color-ribera-700" },
  canal: { agua: ["--color-junco-400", "--color-junco-700"], monte: "--color-junco-800" },
} as const;

export function Portada({
  className = "",
  variante = "embalse",
  id = "portada",
}: {
  className?: string;
  variante?: keyof typeof TONOS;
  /** Los degradados de un SVG son globales: sin id propio, dos en la misma
   *  página comparten el primero y salen todos del mismo color. */
  id?: string;
}) {
  const tono = TONOS[variante];

  return (
    <svg
      aria-hidden
      viewBox="0 0 800 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <linearGradient id={`cielo-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-agua-800)" />
          <stop offset="55%" stopColor="var(--color-agua-500)" />
          <stop offset="100%" stopColor="var(--color-junco-300)" />
        </linearGradient>
        <linearGradient id={`agua-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`var(${tono.agua[0]})`} />
          <stop offset="100%" stopColor={`var(${tono.agua[1]})`} />
        </linearGradient>
      </defs>

      <rect width="800" height="300" fill={`url(#cielo-${id})`} />

      {/* Sol bajo, recién salido */}
      <circle cx="605" cy="150" r="34" fill="#f6efd8" opacity="0.95" />

      {/* Sierra al fondo, en tres planos que se van aclarando */}
      <path
        d="M0 170 L90 128 L150 152 L232 104 L300 148 L360 126 L430 160 L500 138 L570 164 L650 132 L720 158 L800 136 L800 300 L0 300 Z"
        fill="var(--color-ribera-900)"
        opacity="0.45"
      />
      <path
        d="M0 196 L70 168 L140 190 L215 156 L290 186 L370 164 L450 192 L530 170 L610 194 L700 172 L800 190 L800 300 L0 300 Z"
        fill={`var(${tono.monte})`}
        opacity="0.7"
      />

      {/* Lámina de agua */}
      <rect y="196" width="800" height="104" fill={`url(#agua-${id})`} />

      {/* Reflejo del sol, temblando */}
      <g fill="#f6efd8" opacity="0.4">
        <rect x="588" y="206" width="34" height="3" rx="1.5" />
        <rect x="578" y="216" width="54" height="3" rx="1.5" />
        <rect x="592" y="226" width="26" height="3" rx="1.5" />
        <rect x="584" y="238" width="42" height="3" rx="1.5" />
      </g>

      {/* Rizos del agua */}
      <g stroke="var(--color-agua-300)" strokeWidth="2" opacity="0.25" fill="none">
        <path d="M40 214 q18 -5 36 0 t36 0" />
        <path d="M180 232 q22 -6 44 0 t44 0" />
        <path d="M330 252 q20 -6 40 0 t40 0" />
        <path d="M90 268 q24 -6 48 0 t48 0" />
        <path d="M470 222 q20 -5 40 0 t40 0" />
      </g>

      {/* Juncos y espadañas en la orilla, en primer plano */}
      <g fill="var(--color-ribera-950)">
        <path d="M0 300 L0 250 q26 22 34 50 Z" />
        <path d="M742 300 q10 -46 30 -62 q-6 34 4 62 Z" />
        {[26, 44, 62, 700, 724, 762].map((x, i) => (
          <g key={x}>
            <rect
              x={x}
              y={300 - (58 + (i % 3) * 12)}
              width="2.5"
              height={58 + (i % 3) * 12}
              rx="1.25"
            />
            <ellipse
              cx={x + 1.2}
              cy={300 - (58 + (i % 3) * 12)}
              rx="4"
              ry="11"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
