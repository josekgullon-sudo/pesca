import Link from "next/link";
import {
  GRUPOS_FILTRO,
  hayFiltros,
  opcionActiva,
  urlConFiltro,
  type FiltrosSitios as Filtros,
} from "@/lib/filtros-sitios";

/**
 * Filtros del listado, pintados como botones grandes que son enlaces.
 *
 * Son enlaces y no un formulario con JavaScript a propósito: así el filtrado
 * ocurre entero en el servidor, funciona sin conexión al JS y cada combinación
 * tiene su URL.
 *
 * Van dentro de un <details> porque desplegados ocupan media pantalla de móvil
 * y lo que quieres ver al entrar son los sitios, no los filtros. Se abren solos
 * si ya hay alguno puesto, para que nunca filtres sin darte cuenta.
 */
function Chip({
  href,
  activo,
  children,
}: {
  href: string;
  activo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={activo ? "true" : undefined}
      className={`inline-flex min-h-[2.75rem] items-center rounded-xl border-2 px-4 font-semibold ${
        activo
          ? "border-acento bg-acento text-acento-texto"
          : "border-borde bg-fondo-elevado text-texto"
      }`}
    >
      {children}
    </Link>
  );
}

export function FiltrosSitios({
  base,
  filtros,
  especies,
  provincias,
}: {
  base: string;
  filtros: Filtros;
  especies: { slug: string; nombreComun: string }[];
  /**
   * Solo lo pasa el listado común de `/sitios`. Dentro de una provincia la
   * ruta ya la fija, y ofrecer ahí un filtro de provincia sería absurdo.
   */
  provincias?: { slug: string; nombre: string }[];
}) {
  const activos = [
    filtros.tipo,
    filtros.tiempo,
    filtros.dificultad,
    filtros.especie,
    provincias ? filtros.provincia : undefined,
  ].filter((v) => v !== undefined).length;

  return (
    <details
      open={activos > 0}
      // En escritorio hay sitio de sobra: la clase `filtros-panel` hace que se
      // muestren siempre desplegados y sin el botón de abrir/cerrar (ver
      // globals.css). En móvil sigue siendo un desplegable normal.
      className="filtros-panel tarjeta"
    >
      <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between px-4 font-bold">
        <span>Filtrar</span>
        <span className="text-texto-suave">
          {activos === 0
            ? "sin filtros"
            : activos === 1
              ? "1 filtro"
              : `${activos} filtros`}
        </span>
      </summary>

      <div className="space-y-4 border-t border-borde p-4 md:border-t-0">
      {GRUPOS_FILTRO.map((grupo) => (
        <fieldset key={grupo.titulo}>
          <legend className="mb-2 text-sm font-bold text-texto-suave uppercase tracking-wide">
            {grupo.titulo}
          </legend>
          <div className="flex flex-wrap gap-2">
            {grupo.opciones.map((o) => (
              <Chip
                key={`${o.clave}-${o.valor ?? "todos"}`}
                href={urlConFiltro(base, filtros, o.clave, o.valor)}
                activo={opcionActiva(filtros, o)}
              >
                {o.etiqueta}
              </Chip>
            ))}
          </div>
        </fieldset>
      ))}

      {provincias && provincias.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-texto-suave uppercase tracking-wide">
            Provincia
          </legend>
          <div className="flex flex-wrap gap-2">
            <Chip
              href={urlConFiltro(base, filtros, "provincia", undefined)}
              activo={!filtros.provincia}
            >
              Todas
            </Chip>
            {provincias.map((p) => (
              <Chip
                key={p.slug}
                href={urlConFiltro(base, filtros, "provincia", p.slug)}
                activo={filtros.provincia === p.slug}
              >
                {p.nombre}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-texto-suave uppercase tracking-wide">
          Que haya
        </legend>
        <div className="flex flex-wrap gap-2">
          <Chip
            href={urlConFiltro(base, filtros, "especie", undefined)}
            activo={!filtros.especie}
          >
            Lo que sea
          </Chip>
          {especies.map((e) => (
            <Chip
              key={e.slug}
              href={urlConFiltro(base, filtros, "especie", e.slug)}
              activo={filtros.especie === e.slug}
            >
              {e.nombreComun}
            </Chip>
          ))}
        </div>
      </fieldset>

      {hayFiltros(filtros) && (
        <Link
          href={base}
          className="inline-flex min-h-touch items-center font-semibold text-acento underline underline-offset-2"
        >
          Quitar todos los filtros
        </Link>
      )}
      </div>
    </details>
  );
}
