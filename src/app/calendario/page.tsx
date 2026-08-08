import type { Metadata } from "next";
import Link from "next/link";
import { Calendario } from "@/components/Calendario";
import { SelectorUbicacion } from "@/components/SelectorUbicacion";
import { diaLocalDe, medianocheLocal, mesLargo } from "@/lib/fechas-solunar";
import { metadatosDePagina } from "@/lib/marca";
import { climaDe } from "@/lib/clima";
import { prisma } from "@/lib/prisma";
import { diaSolunar, indiceDePesca } from "@/lib/solunar";
import { distanciaKm, formatearKm } from "@/lib/ubicacion";
import { ubicacionActual } from "@/lib/ubicacion-servidor";

export const dynamic = "force-dynamic";

/**
 * El calendario, como sección propia.
 *
 * Estaba solo colgando de cada embalse, y ahí no lo encontraba nadie. Es
 * además la página con más recorrido de la web para buscadores: «calendario de
 * pesca», «tabla solunar» o «fases lunares pesca» se buscan todos los meses y
 * la gente vuelve, que es tráfico que se acumula en vez de gastarse en una
 * visita.
 *
 * La canónica va siempre a /calendario aunque se navegue por meses con
 * parámetros: doce copias al año de la misma página no ayudan a nadie.
 */
export const metadata: Metadata = metadatosDePagina({
  titulo: "Calendario de pesca: fases lunares y mejores días",
  descripcion:
    "Fase lunar, salida y puesta de sol y de luna y periodos solunares, " +
    "calculados para cada embalse. Los mejores días del mes y a qué hora salir.",
  ruta: "/calendario",
});

export default async function PaginaCalendario({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string; sitio?: string }>;
}) {
  const q = await searchParams;
  const ubicacion = await ubicacionActual();

  const [sitios, provinciaPorDefecto] = await Promise.all([
    prisma.sitio.findMany({
      where: { provincia: { publicada: true } },
      orderBy: { nombre: "asc" },
      select: {
        slug: true,
        nombre: true,
        municipio: true,
        latitud: true,
        longitud: true,
        mejorEpoca: true,
        provincia: { select: { slug: true, nombre: true } },
      },
    }),
    prisma.provincia.findFirst({
      where: { publicada: true },
      orderBy: { nombre: "asc" },
      select: { latitud: true, longitud: true, nombre: true },
    }),
  ]);

  const local = diaLocalDe(new Date());
  const hoy = medianocheLocal(local.anio, local.mes, local.dia);
  const anio = Math.min(Math.max(Number(q.anio) || local.anio, local.anio - 2), local.anio + 3);
  const mes = Math.min(Math.max(Number(q.mes) || local.mes, 1), 12);

  // El punto de referencia del calendario grande: el embalse elegido, o la
  // ubicación que haya dado el visitante, o la primera provincia publicada.
  const elegido = q.sitio ? sitios.find((s) => s.slug === q.sitio) : undefined;
  const punto = elegido
    ? { latitud: elegido.latitud, longitud: elegido.longitud }
    : ubicacion
      ? { latitud: ubicacion.latitud, longitud: ubicacion.longitud }
      : { latitud: provinciaPorDefecto?.latitud ?? 37.5, longitud: provinciaPorDefecto?.longitud ?? -5.8 };

  const referencia = elegido
    ? elegido.nombre
    : ubicacion
      ? ubicacion.etiqueta
      : (provinciaPorDefecto?.nombre ?? "España");

  // Solo del punto de referencia, no de los 55: una llamada por embalse y por
  // visita sería abusar de un servicio gratuito, y encima para un dato que en
  // la rejilla no se enseña.
  const clima = await climaDe(punto.latitud, punto.longitud);

  // La nota de hoy de cada embalse de la guía. Es un cálculo por sitio, no una
  // consulta: son milisegundos y no hace falta guardarlo en ninguna parte.
  const mesDeHoy = new Date(hoy.getTime() + 43200000).getUTCMonth() + 1;
  const conNota = sitios
    .map((s) => {
      const d = diaSolunar(hoy, s.latitud, s.longitud);
      let meses: number[] = [];
      try {
        const v: unknown = JSON.parse(s.mejorEpoca);
        if (Array.isArray(v)) meses = v as number[];
      } catch {
        meses = [];
      }
      return {
        ...s,
        nota: indiceDePesca(d, { enTemporada: meses.includes(mesDeHoy) }).total,
        distanciaKm: ubicacion ? distanciaKm(ubicacion, s) : null,
      };
    })
    .sort((a, b) => b.nota - a.nota || a.nombre.localeCompare(b.nombre, "es"));

  return (
    <div className="contenedor space-y-8 py-10 md:py-14">
      <div>
        <h1 className="titulo-pagina font-bold">
          Calendario de pesca · {mesLargo(medianocheLocal(anio, mes, 15))}
        </h1>
        <p className="mt-2 max-w-prose text-lg leading-relaxed text-texto-suave">
          Fase lunar, horas de sol y de luna y periodos solunares. Todo
          calculado para las coordenadas de cada sitio, no aproximado a la
          capital. {elegido || ubicacion ? (
            <>
              Ahora mismo, para <strong>{referencia}</strong>.
            </>
          ) : (
            <>
              Pon tu código postal o elige un embalse abajo para que las horas
              y la nota sean las tuyas.
            </>
          )}
        </p>
      </div>

      <SelectorUbicacion actual={ubicacion} variante="barra" />

      {/* --- Qué embalse tiene mejor pinta hoy. Esto es lo que de verdad
          diferencia esta página: la guía sabe qué hay en cada sitio y en qué
          época, así que la nota no es solo la luna. --- */}
      {conNota.length > 0 && (
        <section>
          <h2 className="titulo-seccion mb-1 font-bold">Los embalses hoy</h2>
          <p className="mb-4 text-texto-suave">
            De mejor a peor nota para hoy
            {ubicacion && ", con lo que te pilla cada uno"}.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {conNota.map((s) => (
              <li key={`${s.provincia.slug}/${s.slug}`}>
                <Link
                  href={`/${s.provincia.slug}/${s.slug}/calendario`}
                  className="tarjeta tarjeta-enlace flex items-center justify-between gap-3 p-4"
                >
                  <span className="min-w-0">
                    <span className="block font-bold leading-tight">
                      {s.nombre}
                    </span>
                    <span className="block text-sm text-texto-suave">
                      {s.municipio}
                      {s.distanciaKm !== null && ` · a ${formatearKm(s.distanciaKm)}`}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-2xl font-bold tabular-nums ${
                      s.nota >= 65
                        ? "text-verde-texto"
                        : s.nota >= 45
                          ? "text-ambar-texto"
                          : "text-texto-suave"
                    }`}
                  >
                    {s.nota}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Calendario
        punto={punto}
        mejorEpoca={elegido?.mejorEpoca ?? ""}
        anio={anio}
        mes={mes}
        hoy={hoy}
        baseUrl="/calendario"
        paramsExtra={q.sitio ? { sitio: q.sitio } : undefined}
        clima={clima}
        nombreSitio={referencia}
      />
    </div>
  );
}
