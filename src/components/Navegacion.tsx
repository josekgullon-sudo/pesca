"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navegación de la app, en dos formas según el tamaño de pantalla.
 *
 * En móvil va abajo, porque se usa con una mano, de pie y con la caña en la
 * otra: el pulgar no llega arriba del todo. En escritorio va en la cabecera,
 * que es donde la busca todo el mundo, y la de abajo desaparece.
 *
 * Son cinco pestañas y no seis a propósito: con seis, a 390 px de ancho, las
 * etiquetas se tocaban unas con otras. El mapa se abre desde el listado de
 * sitios, que es de donde se entra a él de todas formas.
 */

type Enlace = {
  href: string;
  etiqueta: string;
  icono: (p: { activo: boolean }) => React.ReactElement;
  activo: (ruta: string) => boolean;
};

const ENLACES: Enlace[] = [
  { href: "/", etiqueta: "Inicio", icono: IconoCasa, activo: (r) => r === "/" },
  {
    href: "/sitios",
    etiqueta: "Sitios",
    icono: IconoLista,
    activo: (r) => r.startsWith("/sitios"),
  },
  {
    href: "/especies",
    etiqueta: "Especies",
    icono: IconoPez,
    activo: (r) => r.startsWith("/especies"),
  },
  {
    href: "/capturas",
    etiqueta: "Capturas",
    icono: IconoDiario,
    activo: (r) => r.startsWith("/capturas"),
  },
  {
    href: "/ranking",
    etiqueta: "Ranking",
    icono: IconoRanking,
    activo: (r) => r.startsWith("/ranking"),
  },
];

export function NavegacionCabecera() {
  const ruta = usePathname();
  if (ruta.startsWith("/entrar")) return null;

  return (
    <nav aria-label="Secciones" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {ENLACES.map(({ href, etiqueta, activo: esActivo }) => {
          const activo = esActivo(ruta);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={activo ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-lg px-3 font-semibold ${
                  activo
                    ? "bg-cabecera-texto/15 text-cabecera-texto"
                    : "text-cabecera-texto-suave hover:text-cabecera-texto"
                }`}
              >
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function NavegacionInferior() {
  const ruta = usePathname();
  if (ruta.startsWith("/entrar")) return null;

  return (
    <nav
      aria-label="Secciones"
      className="sticky bottom-0 z-[500] border-t border-borde bg-fondo-elevado pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-3xl">
        {ENLACES.map(({ href, etiqueta, icono: Icono, activo: esActivo }) => {
          const activo = esActivo(ruta);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={activo ? "page" : undefined}
                className={`flex min-h-touch flex-col items-center justify-center gap-0.5 py-2 text-xs font-semibold ${
                  activo ? "text-acento" : "text-texto-suave"
                }`}
              >
                <Icono activo={activo} />
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type PropsIcono = { activo: boolean };

function IconoCasa({ activo }: PropsIcono) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill={activo ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function IconoLista({ activo }: PropsIcono) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={activo ? 2.75 : 2}
      strokeLinecap="round"
    >
      <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  );
}

function IconoRanking({ activo }: PropsIcono) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill={activo ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="12" width="5" height="8" rx="1" />
      <rect x="9.5" y="7" width="5" height="13" rx="1" />
      <rect x="16" y="14" width="5" height="6" rx="1" />
    </svg>
  );
}

function IconoDiario({ activo }: PropsIcono) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill={activo ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17" stroke={activo ? "var(--fondo)" : "currentColor"} />
      <path d="M8 3v3M16 3v3" />
    </svg>
  );
}

function IconoPez({ activo }: PropsIcono) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill={activo ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 12c3-4.5 6.8-6.5 10.5-6.5S19.5 8 21.5 12c-2 4-5.3 6.5-8.5 6.5S5.5 16.5 2.5 12Z" />
      <path d="M21.5 12s.5-2.5.5-4c-1.5.5-3 2-3 2" />
      <circle cx="8" cy="10.5" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}
