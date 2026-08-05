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
  const [articulo, provincias] = await Promise.all([
    prisma.articulo.findUnique({ where: { slug } }),
    prisma.provincia.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);
  if (!articulo) notFound();

  return <EditorArticulo articulo={articulo} provincias={provincias} />;
}
