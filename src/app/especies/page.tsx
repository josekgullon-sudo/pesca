import type { Metadata } from "next";
import Link from "next/link";
import { FotoEspecie } from "@/components/FotoEspecie";
import { EtiquetaLegal } from "@/components/SemaforoLegal";
import {
  ETIQUETA_COMESTIBILIDAD,
  type Comestibilidad,
  type EstadoLegal,
} from "@/lib/enums";
import { usuarioOpcional } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { metadatosDePagina } from "@/lib/marca";

export const metadata: Metadata = metadatosDePagina({
  titulo: "Peces de agua dulce de España: qué se puede pescar y qué no",
  descripcion:
    "Todas las especies de la guía con su situación legal: cuáles se pueden " +
    "pescar, cuáles hay que devolver y cuáles no se pueden devolver al agua.",
  ruta: "/especies",
});
export const dynamic = "force-dynamic";

/**
 * Los grupos del listado. El orden es deliberado: primero lo que se puede
 * pescar y llevarse, luego lo que hay que soltar, y al final lo que ni se toca.
 * Así el listado se lee como un semáforo de arriba abajo.
 */
const GRUPOS: {
  titulo: string;
  explicacion: string;
  estados: EstadoLegal[];
}[] = [
  {
    titulo: "Se pueden pescar",
    explicacion:
      "Dentro de las áreas delimitadas en el caso de las invasoras. Comprueba " +
      "en la ficha del sitio si estás en una.",
    estados: ["pescable", "invasora_area_delimitada"],
  },
  {
    titulo: "Devolución obligatoria",
    explicacion:
      "Se pescan, pero vuelven al agua. Manos mojadas y el menor tiempo " +
      "posible fuera.",
    estados: ["devolucion_obligatoria"],
  },
  {
    titulo: "No se pueden pescar",
    explicacion:
      "No se buscan. Están aquí para saber identificarlas y qué hacer si caen " +
      "por accidente, que no es lo mismo en todas.",
    estados: ["prohibida", "invasora_no_pescable"],
  },
];

export default async function PaginaEspecies() {
  const usuario = await usuarioOpcional();
  const especies = await prisma.especie.findMany({
    orderBy: { nombreComun: "asc" },
    select: {
      slug: true,
      nombreComun: true,
      nombreCientifico: true,
      estadoLegal: true,
      comestible: true,
      esAutoctona: true,
      imagenUrl: true,
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Especies</h1>
        <p className="mt-1 max-w-prose text-texto-suave">
          Qué se puede pescar en la provincia, qué hay que devolver al agua y
          qué no se toca. El color de cada ficha es su semáforo legal.
        </p>
      </div>

      {/* Recordatorio solo para administradores: las fotos de las especies no
          vienen en el repositorio, hay que bajarlas una vez. Sin esto es fácil
          pensar que la web está rota cuando solo falta ejecutar un comando. */}
      {usuario?.esAdmin && especies.every((e) => !e.imagenUrl) && (
        <div className="rounded-xl border-2 border-ambar-texto/30 bg-ambar-fondo p-4 text-ambar-texto">
          <p className="font-bold">Faltan las fotos de las especies</p>
          <p className="mt-1 leading-relaxed">
            No vienen en el repositorio: se descargan de Wikimedia Commons con
            su autor y su licencia. Ejecuta{" "}
            <code className="rounded bg-ambar-texto/15 px-1.5 py-0.5 font-mono">
              npm run fotos
            </code>{" "}
            una vez. Mientras tanto se ve la silueta con el color del semáforo.
          </p>
        </div>
      )}

      {GRUPOS.map((grupo) => {
        const delGrupo = especies.filter((e) =>
          grupo.estados.includes(e.estadoLegal as EstadoLegal),
        );
        if (delGrupo.length === 0) return null;

        return (
          <section key={grupo.titulo}>
            <h2 className="text-xl font-bold">{grupo.titulo}</h2>
            <p className="mt-1 mb-3 max-w-prose text-[0.95rem] leading-relaxed text-texto-suave">
              {grupo.explicacion}
            </p>

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {delGrupo.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/especies/${e.slug}`}
                    className="flex h-full gap-3 tarjeta overflow-hidden"
                  >
                    <FotoEspecie
                      nombre={e.nombreComun}
                      imagenUrl={e.imagenUrl}
                      estadoLegal={e.estadoLegal}
                      className="w-24 shrink-0 self-stretch"
                    />

                    <div className="min-w-0 flex-1 py-3 pr-3">
                      <h3 className="text-lg font-bold leading-tight">
                        {e.nombreComun}
                      </h3>
                      <p className="text-sm italic text-texto-suave">
                        {e.nombreCientifico}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <EtiquetaLegal estado={e.estadoLegal} />
                        <span className="rounded-lg bg-chip-fondo px-2 py-1 text-xs font-bold text-chip-texto">
                          {ETIQUETA_COMESTIBILIDAD[
                            e.comestible as Comestibilidad
                          ] ?? e.comestible}
                        </span>
                        {e.esAutoctona && (
                          <span className="rounded-lg bg-chip-fondo px-2 py-1 text-xs font-bold text-chip-texto">
                            Autóctona
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
