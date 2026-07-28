"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Barra de navegación fija abajo. Abajo y no arriba porque la app se usa con
 * una mano, de pie y con la caña en la otra: el pulgar no llega a la parte de
 * arriba de la pantalla.
 *
 * Los enlaces se van añadiendo según van estando las secciones.
 */
const ENLACES = [
  { href: "/", etiqueta: "Inicio", icono: IconoCasa, activo: (r: string) => r === "/" },
  {
    href: "/sitios",
    etiqueta: "Sitios",
    icono: IconoLista,
    // Las fichas de sitio cuelgan de aquí, pero el mapa tiene pestaña propia.
    activo: (r: string) => r.startsWith("/sitios") && r !== "/sitios/mapa",
  },
  {
    href: "/sitios/mapa",
    etiqueta: "Mapa",
    icono: IconoMapa,
    activo: (r: string) => r === "/sitios/mapa",
  },
];

export function NavegacionInferior() {
  const ruta = usePathname();

  // En la pantalla de acceso no pinta nada.
  if (ruta.startsWith("/entrar")) return null;

  return (
    <nav
      aria-label="Secciones"
      className="sticky bottom-0 z-[500] border-t border-borde bg-fondo-elevado pb-[env(safe-area-inset-bottom)]"
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

function IconoMapa({ activo }: PropsIcono) {
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
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" fill={activo ? "var(--fondo)" : "none"} />
    </svg>
  );
}
