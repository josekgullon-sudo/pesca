import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { FormularioCaptura } from "./FormularioCaptura";

export const metadata: Metadata = { title: "Registrar captura" };
export const dynamic = "force-dynamic";

export default async function NuevaCaptura({
  searchParams,
}: {
  searchParams: Promise<{ sitio?: string }>;
}) {
  const { sitio } = await searchParams;

  const [sitios, especies, aparejos, tecnicas] = await Promise.all([
    prisma.sitio.findMany({
      orderBy: { tiempoCocheMin: "asc" },
      select: {
        id: true,
        slug: true,
        nombre: true,
        especies: {
          select: { especieId: true },
          orderBy: { abundancia: "desc" },
        },
      },
    }),
    prisma.especie.findMany({
      orderBy: { nombreComun: "asc" },
      select: { id: true, slug: true, nombreComun: true, estadoLegal: true },
    }),
    prisma.aparejo.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.tecnica.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);

  const sitioInicial = sitio
    ? (sitios.find((s) => s.slug === sitio)?.id ?? null)
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        Registrar captura
      </h1>

      <FormularioCaptura
        sitioInicial={sitioInicial}
        sitios={sitios.map((s) => ({
          id: s.id,
          slug: s.slug,
          nombre: s.nombre,
          especiesIds: s.especies.map((e) => e.especieId),
        }))}
        especies={especies.map((e) => ({
          id: e.id,
          slug: e.slug,
          nombre: e.nombreComun,
          estadoLegal: e.estadoLegal,
        }))}
        aparejos={aparejos}
        tecnicas={tecnicas}
      />
    </div>
  );
}
