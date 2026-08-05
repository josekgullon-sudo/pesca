import { notFound } from "next/navigation";
import { EditorProvincia } from "@/components/EditorProvincia";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditarProvincia({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const provincia = await prisma.provincia.findUnique({
    where: { slug },
    select: {
      slug: true,
      nombre: true,
      descripcion: true,
      areasDelimitadasEEI: true,
      notasLegales: true,
      urlOrdenDeVedas: true,
      publicada: true,
      _count: { select: { sitios: true } },
    },
  });
  if (!provincia) notFound();

  return <EditorProvincia provincia={provincia} sitios={provincia._count.sitios} />;
}
