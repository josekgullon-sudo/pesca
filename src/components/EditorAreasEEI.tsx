"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { marcarAreaEEI, type EstadoEEI } from "@/app/admin/acciones";

/**
 * Sitio por sitio: ¿sale este embalse en el listado de áreas delimitadas?
 *
 * Es la única parte de la guía que no se puede rellenar razonando. Hay que
 * abrir la orden de vedas de la provincia, leer su lista de aguas donde SÍ se
 * pueden pescar las especies exóticas invasoras, y buscar en ella este nombre.
 * Lo que salga de aquí es lo que la web le va a decir a alguien con un black
 * bass en la mano: devolverlo o sacrificarlo.
 *
 * Por eso hay tres botones y no dos. Un sitio recién cargado no está «fuera»:
 * está sin mirar, y son cosas distintas.
 */

type SitioEEI = {
  slug: string;
  nombre: string;
  municipio: string;
  esAreaDelimitadaEEI: boolean;
  eeiComprobado: boolean;
};

export function EditorAreasEEI({ sitios }: { sitios: SitioEEI[] }) {
  const [estado, accion] = useActionState<EstadoEEI, FormData>(
    marcarAreaEEI,
    null,
  );

  if (sitios.length === 0) return null;

  const pendientes = sitios.filter((s) => !s.eeiComprobado).length;

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-xl font-bold">
          Áreas delimitadas, sitio por sitio
        </h3>
        <p className="mt-1 max-w-prose leading-relaxed text-texto-suave">
          Con el listado de la provincia delante, marca de cada sitio si aparece
          en él. Mientras quede alguno sin marcar, su ficha dice que no lo
          sabemos y la provincia no se puede publicar.
        </p>
        {pendientes > 0 && (
          <p className="mt-2 font-bold text-ambar-texto">
            {pendientes === 1
              ? "Queda 1 sitio sin comprobar."
              : `Quedan ${pendientes} sitios sin comprobar.`}
          </p>
        )}
      </div>

      {estado && "error" in estado && (
        <p role="alert" className="rounded-xl bg-rojo-fondo p-3 font-semibold text-rojo-texto">
          {estado.error}
        </p>
      )}
      {estado && "ok" in estado && (
        <p className="rounded-xl bg-verde-fondo p-3 font-semibold text-verde-texto">
          {estado.ok}
        </p>
      )}

      <ul className="space-y-2">
        {sitios.map((s) => {
          const actual = !s.eeiComprobado
            ? "no-lo-se"
            : s.esAreaDelimitadaEEI
              ? "dentro"
              : "fuera";

          return (
            <li
              key={s.slug}
              className="tarjeta flex flex-wrap items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <p className="font-semibold">{s.nombre}</p>
                <p className="text-sm text-texto-suave">{s.municipio}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Boton
                  accion={accion}
                  sitio={s.slug}
                  valor="dentro"
                  activo={actual === "dentro"}
                  clase="border-verde-texto bg-verde-fondo text-verde-texto"
                >
                  Está en el listado
                </Boton>
                <Boton
                  accion={accion}
                  sitio={s.slug}
                  valor="fuera"
                  activo={actual === "fuera"}
                  clase="border-ambar-texto bg-ambar-fondo text-ambar-texto"
                >
                  No está
                </Boton>
                <Boton
                  accion={accion}
                  sitio={s.slug}
                  valor="no-lo-se"
                  activo={actual === "no-lo-se"}
                  clase="border-borde bg-chip-fondo text-chip-texto"
                >
                  Sin comprobar
                </Boton>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Boton({
  accion,
  sitio,
  valor,
  activo,
  clase,
  children,
}: {
  accion: (fd: FormData) => void;
  sitio: string;
  valor: string;
  activo: boolean;
  clase: string;
  children: React.ReactNode;
}) {
  return (
    <form action={accion}>
      <input type="hidden" name="sitio" value={sitio} />
      <input type="hidden" name="valor" value={valor} />
      <Enviar activo={activo} clase={clase}>
        {children}
      </Enviar>
    </form>
  );
}

function Enviar({
  activo,
  clase,
  children,
}: {
  activo: boolean;
  clase: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || activo}
      aria-pressed={activo}
      className={`inline-flex min-h-touch items-center rounded-xl border-2 px-4 text-sm font-semibold disabled:cursor-default ${
        activo ? clase : "border-borde bg-fondo-elevado hover:border-acento"
      } ${pending ? "opacity-60" : ""}`}
    >
      {children}
    </button>
  );
}
