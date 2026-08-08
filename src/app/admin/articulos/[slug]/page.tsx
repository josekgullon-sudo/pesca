import { notFound } from "next/navigation";
import { EditorArticulo } from "@/components/EditorArticulo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditarArticulo({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [articulo, provincias, especies] = await Promise.all([
    prisma.articulo.findUnique({ where: { slug } }),
    prisma.provincia.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.especie.findMany({
      orderBy: { nombreComun: "asc" },
      select: { id: true, nombreComun: true },
    }),
  ]);
  if (!articulo) notFound();

  return <EditorArticulo articulo={articulo} provincias={provincias} especies={especies} />;
}
