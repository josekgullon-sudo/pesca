import { notFound } from "next/navigation";
import { EditorAreasEEI } from "@/components/EditorAreasEEI";
import { EditorProvincia } from "@/components/EditorProvincia";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditarProvincia({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [provincia, sitios] = await Promise.all([
    prisma.provincia.findUnique({
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
    }),
    prisma.sitio.findMany({
      where: { provincia: { slug } },
      orderBy: [{ eeiComprobado: "asc" }, { nombre: "asc" }],
      select: {
        slug: true,
        nombre: true,
        municipio: true,
        esAreaDelimitadaEEI: true,
        eeiComprobado: true,
      },
    }),
  ]);
  if (!provincia) notFound();

  return (
    <div className="space-y-10">
      <EditorProvincia
        provincia={provincia}
        sitios={provincia._count.sitios}
      />
      <EditorAreasEEI sitios={sitios} />
    </div>
  );
}
