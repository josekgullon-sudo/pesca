import type { Metadata } from "next";
import { Ranking } from "@/components/Ranking";
import { metadatosDePagina } from "@/lib/marca";
import { prisma } from "@/lib/prisma";
import { cargarProvincia } from "@/lib/provincias";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provincia: string }>;
}): Promise<Metadata> {
  const { provincia } = await params;
  const p = await prisma.provincia.findUnique({
    where: { slug: provincia },
    select: { nombre: true },
  });
  const nombre = p?.nombre ?? "la provincia";

  return metadatosDePagina({
    titulo: `Ranking de pesca de ${nombre}: dónde ir a por cada especie`,
    descripcion: `Los sitios de ${nombre} con más black bass, carpa o barbo, los que están en su mejor época y las capturas más grandes registradas.`,
    ruta: `/${provincia}/ranking`,
  });
}

export default async function RankingProvincia({
  params,
}: {
  params: Promise<{ provincia: string }>;
}) {
  const { provincia: slug } = await params;
  const provincia = await cargarProvincia(slug);

  return (
    <Ranking
      ambito={{ provinciaId: provincia.id }}
      titulo={`Ranking de pesca de ${provincia.nombre}`}
      entradilla={`Dónde ir a por cada especie en ${provincia.nombre}, qué sitios están en su mejor época y qué ha pescado la gente. Lo primero sale de la guía; lo último, del diario.`}
    />
  );
}
