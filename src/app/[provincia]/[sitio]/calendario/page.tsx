import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendario } from "@/components/Calendario";
import { DatosEstructurados } from "@/components/DatosEstructurados";
import { diaLocalDe, medianocheLocal, mesLargo } from "@/lib/fechas-solunar";
import { metadatosDePagina } from "@/lib/marca";
import { climaDe } from "@/lib/clima";
import { prisma } from "@/lib/prisma";
import { cargarProvincia } from "@/lib/provincias";
import { schemaMigas } from "@/lib/schema";

export const dynamic = "force-dynamic";

async function cargar(provinciaSlug: string, slug: string, esAdmin: boolean) {
  return prisma.sitio.findFirst({
    where: {
      slug,
      provincia: { slug: provinciaSlug, ...(esAdmin ? {} : { publicada: true }) },
    },
    select: {
      slug: true,
      nombre: true,
      latitud: true,
      longitud: true,
      mejorEpoca: true,
      nivelPorcentaje: true,
      provincia: { select: { slug: true, nombre: true, publicada: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provincia: string; sitio: string }>;
}): Promise<Metadata> {
  const { provincia, sitio } = await params;
  const s = await prisma.sitio.findFirst({
    where: { slug: sitio, provincia: { slug: provincia } },
    select: { nombre: true, provincia: { select: { publicada: true } } },
  });
  if (!s) return { title: "Calendario" };

  // La canónica siempre a la ruta sin mes: el histórico se navega con
  // parámetros y no queremos doce copias de la misma página por año.
  const meta = metadatosDePagina({
    titulo: `Calendario solunar de ${s.nombre}: fases lunares y mejores horas`,
    descripcion:
      `Salida y puesta de sol y de luna, fase lunar y periodos solunares en ${s.nombre}. ` +
      "Los mejores días del mes y a qué hora salir.",
    ruta: `/${provincia}/${sitio}/calendario`,
  });

  return s.provincia.publicada
    ? meta
    : { ...meta, robots: { index: false, follow: false } };
}

export default async function CalendarioSitio({
  params,
  searchParams,
}: {
  params: Promise<{ provincia: string; sitio: string }>;
  searchParams: Promise<{ anio?: string; mes?: string }>;
}) {
  const { provincia: slugProvincia, sitio: slugSitio } = await params;
  const provincia = await cargarProvincia(slugProvincia);
  const sitio = await cargar(slugProvincia, slugSitio, !provincia.publicada);
  if (!sitio) notFound();

  const ahora = new Date();
  const local = diaLocalDe(ahora);
  const hoy = medianocheLocal(local.anio, local.mes, local.dia);

  const clima = await climaDe(sitio.latitud, sitio.longitud);

  const q = await searchParams;
  // Se acota a un rango razonable: sin esto, un ?anio=999999 pondría al
  // servidor a calcular posiciones lunares del año del catapum.
  const anio = Math.min(Math.max(Number(q.anio) || local.anio, local.anio - 2), local.anio + 3);
  const mes = Math.min(Math.max(Number(q.mes) || local.mes, 1), 12);

  return (
    <div className="contenedor space-y-8 py-10 md:py-14">
      <DatosEstructurados
        schema={schemaMigas([
          { nombre: "Inicio", ruta: "/" },
          { nombre: `Pescar en ${provincia.nombre}`, ruta: `/${provincia.slug}` },
          { nombre: sitio.nombre, ruta: `/${provincia.slug}/${sitio.slug}` },
          {
            nombre: "Calendario solunar",
            ruta: `/${provincia.slug}/${sitio.slug}/calendario`,
          },
        ])}
      />

      <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-x-2 text-sm">
        <Link href="/" className="text-texto-suave underline underline-offset-2">
          Inicio
        </Link>
        <span aria-hidden className="text-texto-suave">›</span>
        <Link href={`/${provincia.slug}`} className="text-texto-suave underline underline-offset-2">
          {provincia.nombre}
        </Link>
        <span aria-hidden className="text-texto-suave">›</span>
        <Link
          href={`/${provincia.slug}/${sitio.slug}`}
          className="font-semibold text-acento underline underline-offset-2"
        >
          {sitio.nombre}
        </Link>
      </nav>

      <div>
        <h1 className="titulo-pagina font-bold">
          Calendario solunar de {sitio.nombre}
        </h1>
        <p className="mt-2 max-w-prose text-lg leading-relaxed text-texto-suave">
          Sol, luna y periodos solunares calculados para las coordenadas del
          sitio. {mesLargo(medianocheLocal(anio, mes, 15))}.
        </p>
      </div>

      <Calendario
        punto={{ latitud: sitio.latitud, longitud: sitio.longitud }}
        mejorEpoca={sitio.mejorEpoca}
        nivelPorcentaje={sitio.nivelPorcentaje}
        anio={anio}
        mes={mes}
        hoy={hoy}
        baseUrl={`/${provincia.slug}/${sitio.slug}/calendario`}
        clima={clima}
        nombreSitio={sitio.nombre}
      />
    </div>
  );
}
