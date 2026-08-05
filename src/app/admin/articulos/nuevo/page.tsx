import { EditorArticulo } from "@/components/EditorArticulo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ArticuloNuevo() {
  const provincias = await prisma.provincia.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });

  return <EditorArticulo provincias={provincias} />;
}
