import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvisoLegal } from "@/components/AvisoLegal";
import { BarraAbundancia } from "@/components/BarraAbundancia";
import { FotoEspecie } from "@/components/FotoEspecie";
import { SemaforoLegal } from "@/components/SemaforoLegal";
import { AVISO_ABUNDANCIAS_ESTIMADAS } from "@/lib/avisos";
import {
  ETIQUETA_COMESTIBILIDAD,
  ETIQUETA_PROBABILIDAD,
  ETIQUETA_TIPO_APAREJO,
  ETIQUETA_TIPO_SITIO,
  type Comestibilidad,
  type Probabilidad,
  type TipoAparejo,
  type TipoSitio,
} from "@/lib/enums";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function cargarEspecie(slug: string) {
  return prisma.especie.findUnique({
    where: { slug },
    include: {
      sitios: {
        include: { sitio: true },
        orderBy: { abundancia: "desc" },
      },
      aparejos: {
        include: { aparejo: true },
        orderBy: { efectividad: "desc" },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const especie = await prisma.especie.findUnique({
    where: { slug },
    select: { nombreComun: true },
  });
  return { title: especie?.nombreComun ?? "Especie" };
}

/** Con estas no se puede ni salir a buscarlas, así que no se recomiendan aparejos. */
const NO_SE_PUEDEN_BUSCAR = new Set(["prohibida", "invasora_no_pescable"]);

const CLASE_COMESTIBLE: Record<Comestibilidad, string> = {
  si: "bg-verde-fondo text-verde-texto",
  desaconsejado: "bg-ambar-fondo text-ambar-texto",
  no: "bg-rojo-fondo text-rojo-texto",
};

export default async function FichaEspecie({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const especie = await cargarEspecie(slug);
  if (!especie) notFound();

  const noSeBusca = NO_SE_PUEDEN_BUSCAR.has(especie.estadoLegal);
  const comestible = especie.comestible as Comestibilidad;

  return (
    <article>
      {/* Con foto, cabecera grande; sin ella, la silueta pequeña al lado del
          título, que ocupando media pantalla quedaría ridícula. */}
      {especie.imagenUrl && (
        <figure className="mb-6">
          <FotoEspecie
            nombre={especie.nombreComun}
            imagenUrl={especie.imagenUrl}
            estadoLegal={especie.estadoLegal}
            className="h-56 w-full rounded-xl sm:h-72"
          />
          {(especie.imagenAutor || especie.imagenLicencia) && (
            <figcaption className="mt-2 text-xs text-texto-suave">
              Foto: {especie.imagenAutor ?? "autor no indicado"}
              {especie.imagenLicencia && ` · ${especie.imagenLicencia}`}
              {especie.imagenFuente && (
                <>
                  {" · "}
                  <a
                    href={especie.imagenFuente}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    Wikimedia Commons ↗
                  </a>
                </>
              )}
            </figcaption>
          )}
        </figure>
      )}

      <header className="mb-6 flex items-center gap-4">
        {!especie.imagenUrl && (
          <FotoEspecie
            nombre={especie.nombreComun}
            imagenUrl={null}
            estadoLegal={especie.estadoLegal}
            className="h-24 w-24 shrink-0 rounded-xl"
          />
        )}
        <div className="min-w-0">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            {especie.nombreComun}
          </h1>
          <p className="mt-1 text-lg italic text-texto-suave">
            {especie.nombreCientifico}
          </p>
          <p className="mt-1 text-sm font-semibold text-texto-suave">
            {especie.esAutoctona ? "Especie autóctona" : "Especie introducida"}
          </p>
        </div>
      </header>

      {/* El semáforo va lo primero y a ancho completo: es el dato que decide
          qué haces con el pez que tienes en la mano. */}
      <div className="mb-8">
        <SemaforoLegal estado={especie.estadoLegal} />
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-10">
        <div className="space-y-8">
          <section>
            <h2 className="mb-2 text-xl font-bold">Cómo es</h2>
            <p className="max-w-prose leading-relaxed">{especie.descripcion}</p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold">
              {noSeBusca ? "Cómo suele caer" : "Cómo pescarla"}
            </h2>
            <p className="max-w-prose leading-relaxed">
              {especie.comoPescarla}
            </p>
          </section>

          <section>
            <h2 className="mb-1 text-xl font-bold">Dónde encontrarla</h2>
            {especie.sitios.length === 0 ? (
              <p className="text-texto-suave">
                No la tenemos anotada en ningún sitio de la guía.
              </p>
            ) : (
              <>
                <p className="mb-3 max-w-prose text-sm leading-relaxed text-texto-suave">
                  {AVISO_ABUNDANCIAS_ESTIMADAS}
                </p>
                <ul className="grid gap-3 xl:grid-cols-2">
                  {especie.sitios.map((se) => (
                    <li key={se.sitioId}>
                      <Link
                        href={`/sitios/${se.sitio.slug}`}
                        className="flex h-full flex-col tarjeta p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold leading-tight">
                              {se.sitio.nombre}
                            </h3>
                            <p className="text-sm text-texto-suave">
                              {ETIQUETA_TIPO_SITIO[se.sitio.tipo as TipoSitio]}{" "}
                              · a {se.sitio.tiempoCocheMin} min
                            </p>
                          </div>
                          <BarraAbundancia valor={se.abundancia} />
                        </div>

                        <p className="mt-2 text-sm font-semibold text-texto-suave">
                          {ETIQUETA_PROBABILIDAD[
                            se.probabilidadCaptura as Probabilidad
                          ] ?? se.probabilidadCaptura}
                          {se.mejorTecnica && ` · a ${se.mejorTecnica}`}
                        </p>

                        {se.notas && (
                          <p className="mt-2 text-[0.95rem] leading-relaxed">
                            {se.notas}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {!noSeBusca && especie.aparejos.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-bold">Con qué</h2>
              <ul className="space-y-2">
                {especie.aparejos.map((ae) => (
                  <li
                    key={ae.aparejoId}
                    className="tarjeta p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold leading-tight">
                          {ae.aparejo.nombre}
                        </p>
                        <p className="text-sm text-texto-suave">
                          {ETIQUETA_TIPO_APAREJO[
                            ae.aparejo.tipo as TipoAparejo
                          ] ?? ae.aparejo.tipo}
                          {ae.aparejo.precioAproxEur !== null &&
                            ` · unos ${ae.aparejo.precioAproxEur} €`}
                        </p>
                      </div>
                      <BarraAbundancia
                        valor={ae.efectividad}
                        etiqueta="Efectividad"
                      />
                    </div>
                    {ae.notas && (
                      <p className="mt-2 text-[0.95rem] leading-relaxed">
                        {ae.notas}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="mt-8 space-y-6 lg:mt-0 lg:sticky lg:top-6">
          <section>
            <h2 className="mb-2 text-xl font-bold">¿Se come?</h2>
            <div
              className={`rounded-xl p-4 ${CLASE_COMESTIBLE[comestible] ?? "bg-chip-fondo text-chip-texto"}`}
            >
              <p className="font-bold">
                {ETIQUETA_COMESTIBILIDAD[comestible] ?? especie.comestible}
              </p>
              {especie.notasComestibilidad && (
                <p className="mt-1 leading-relaxed">
                  {especie.notasComestibilidad}
                </p>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold">Qué dice la ley</h2>
            <div className="rounded-xl border-2 border-ambar-texto/25 bg-ambar-fondo p-4 text-ambar-texto">
              <p className="leading-relaxed">{especie.notasLegales}</p>
            </div>
          </section>

          {especie.tallaMinimaCm !== null && (
            <section>
              <h2 className="mb-2 text-xl font-bold">Talla mínima</h2>
              <p className="tarjeta p-4 text-2xl font-bold">
                {especie.tallaMinimaCm} cm
              </p>
            </section>
          )}

          <AvisoLegal variante="destacado" />
        </aside>
      </div>
    </article>
  );
}
