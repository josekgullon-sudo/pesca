import { EditorArticulo } from "@/components/EditorArticulo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ArticuloNuevo() {
  const [provincias, especies] = await Promise.all([
    prisma.provincia.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.especie.findMany({
      orderBy: { nombreComun: "asc" },
      select: { id: true, nombreComun: true },
    }),
  ]);

  return <EditorArticulo provincias={provincias} especies={especies} />;
}
