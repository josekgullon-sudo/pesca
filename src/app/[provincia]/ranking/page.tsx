import type { Metadata } from "next";
import { Ranking } from "@/components/Ranking";
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

  return {
    title: `Ranking de pesca de ${nombre}: las capturas más grandes`,
    description: `Las piezas más grandes pescadas en ${nombre}, el récord de cada especie y quién va ganando.`,
  };
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
      titulo={`Ranking de ${provincia.nombre}`}
      entradilla={`Lo que se ha pescado en la provincia de ${provincia.nombre}.`}
    />
  );
}
