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
 * El mapa tiene pestaña propia: buscar sitio de pesca es una pregunta
 * geográfica —«qué tengo cerca»— y tenerlo escondido dentro del listado
 * obligaba a dar dos pasos para lo primero que mucha gente quiere hacer. En
 * móvil, para que quepan sin tocarse, «Inicio» sale de la barra de abajo: al
 * inicio se vuelve con la marca de la cabecera, que es donde lo busca todo el
 * mundo.
 */

/** Rutas que tienen su propia pestaña. Lo demás cuelga de una provincia. */
const RUTAS_PROPIAS = ["/calendario", "/especies", "/aparejos", "/capturas", "/ranking", "/blog", "/entrar", "/registro", "/cuenta", "/normas", "/aviso-legal"];

/** El destino del mapa lo decide el servidor, igual que el de los sitios. */
const MARCA_MAPA = "__mapa__";

type Enlace = {
  href: string;
  etiqueta: string;
  icono: (p: { activo: boolean }) => React.ReactElement;
  activo: (ruta: string) => boolean;
  /** Fuera de la barra inferior: en móvil no caben las seis. */
  soloEscritorio?: boolean;
};

const ENLACES: Enlace[] = [
  {
    href: "/",
    etiqueta: "Inicio",
    icono: IconoCasa,
    activo: (r) => r === "/",
    soloEscritorio: true,
  },
  {
    // El destino lo decide el servidor: con una sola provincia publicada va
    // directo a ella, porque su página ya es el listado; con varias, al
    // listado común de /donde-pescar.
    href: "__sitios__",
    etiqueta: "Sitios",
    icono: IconoLista,
    // Cualquier ruta de provincia, y /sitios. Los mapas se excluyen para que
    // no se enciendan las dos pestañas a la vez.
    activo: (r) =>
      r !== "/" &&
      !r.endsWith("/mapa") &&
      RUTAS_PROPIAS.every((x) => !r.startsWith(x)),
  },
  {
    href: MARCA_MAPA,
    etiqueta: "Mapa",
    icono: IconoMapa,
    activo: (r) => r.endsWith("/mapa"),
  },
  {
    // Se consulta antes de cada salida, así que va en la barra de móvil. La
    // que sale para hacerle sitio es Ranking, que se mira de vez en cuando y
    // no antes de coger el coche.
    href: "/calendario",
    etiqueta: "Calendario",
    icono: IconoLuna,
    activo: (r) => r.startsWith("/calendario") || r.endsWith("/calendario"),
  },
  {
    href: "/especies",
    etiqueta: "Especies",
    icono: IconoPez,
    activo: (r) => r.startsWith("/especies"),
  },
  {
    href: "/aparejos",
    etiqueta: "Señuelos",
    icono: IconoAnzuelo,
    activo: (r) => r.startsWith("/aparejos"),
    // En la barra de móvil no caben más: se llega desde la ficha de especie,
    // desde la del embalse y desde el pie.
    soloEscritorio: true,
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
    soloEscritorio: true,
  },
  {
    href: "/blog",
    etiqueta: "Blog",
    // No se pinta nunca: en la barra de móvil no entra. Se pone uno cualquiera
    // porque el tipo lo exige.
    icono: IconoLista,
    activo: (r) => r.startsWith("/blog"),
    // En la barra de móvil no cabe una séptima: se llega desde la portada y
    // desde el pie.
    soloEscritorio: true,
  },
];

function destinoDe(href: string, rutaSitios: string) {
  if (href === "__sitios__") return rutaSitios;
  // Con una sola provincia publicada, rutaSitios es "/sevilla" y su mapa está
  // en "/sevilla/mapa". Con varias es "/donde-pescar" y el mapa de todas, en "/mapa".
  // Y sin ninguna publicada es "/", donde no hay mapa que enseñar.
  if (href === MARCA_MAPA) {
    if (rutaSitios === "/") return "/#provincias";
    return rutaSitios === "/donde-pescar" ? "/mapa" : `${rutaSitios}/mapa`;
  }
  return href;
}

export function NavegacionCabecera({ rutaSitios }: { rutaSitios: string }) {
  const ruta = usePathname();
  if (ruta.startsWith("/entrar")) return null;

  return (
    <nav aria-label="Secciones" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {ENLACES.map(({ href, etiqueta, activo: esActivo }) => {
          const activo = esActivo(ruta);
          const destino = destinoDe(href, rutaSitios);
          return (
            <li key={href}>
              <Link
                href={destino}
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

export function NavegacionInferior({ rutaSitios }: { rutaSitios: string }) {
  const ruta = usePathname();
  if (ruta.startsWith("/entrar")) return null;

  return (
    <nav
      aria-label="Secciones"
      className="sticky bottom-0 z-[500] border-t border-borde bg-fondo-elevado pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-3xl">
        {ENLACES.filter((e) => !e.soloEscritorio).map(
          ({ href, etiqueta, icono: Icono, activo: esActivo }) => {
            const activo = esActivo(ruta);
            const destino = destinoDe(href, rutaSitios);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={destino}
                  aria-current={activo ? "page" : undefined}
                  className={`flex min-h-touch flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[0.7rem] font-semibold ${
                    activo ? "text-acento" : "text-texto-suave"
                  }`}
                >
                  <Icono activo={activo} />
                  {etiqueta}
                </Link>
              </li>
            );
          },
        )}
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

function IconoMapa({ activo }: PropsIcono) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3.5 3.5 6v14.5L9 18l6 2.5 5.5-2.5V3.5L15 6Z" />
      <path d="M9 3.5V18M15 6v14.5" />
      <circle cx="12" cy="10" r="1.4" fill={activo ? "currentColor" : "none"} />
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

/** Un anzuelo. Para la sección de señuelos y cebos. */
function IconoAnzuelo({ activo }: PropsIcono) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3v10a5 5 0 0 1-10 0v-1" />
      <path d="M12 3h6" />
      <circle cx="5" cy="10" r="1.6" fill={activo ? "currentColor" : "none"} />
    </svg>
  );
}

function IconoLuna({ activo }: PropsIcono) {
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
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
    </svg>
  );
}
