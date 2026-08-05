import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ListaProvincias() {
  const provincias = await prisma.provincia.findMany({
    orderBy: [{ publicada: "desc" }, { nombre: "asc" }],
    select: {
      slug: true,
      nombre: true,
      comunidad: true,
      publicada: true,
      areasDelimitadasEEI: true,
      _count: { select: { sitios: true } },
      // Los que todavía nadie ha buscado en el listado de áreas delimitadas.
      sitios: { where: { eeiComprobado: false }, select: { id: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="titulo-seccion font-bold">Provincias</h2>
        <p className="mt-2 max-w-prose leading-relaxed text-texto-suave">
          Para publicar una provincia hacen falta dos cosas: sus sitios cargados
          y su listado de áreas delimitadas para especies invasoras. Ese listado
          es el que decide si un black bass se devuelve al agua o hay obligación
          de sacrificarlo, así que el formulario no deja publicar sin él.
        </p>
      </div>

      <ul className="grid gap-4 lg:grid-cols-2">
        {provincias.map((p) => {
          const sinComprobar = p.sitios.length;
          const listo =
            p._count.sitios > 0 &&
            p.areasDelimitadasEEI.length > 30 &&
            sinComprobar === 0;
          return (
            <li key={p.slug}>
              <Link
                href={`/admin/provincias/${p.slug}`}
                className="tarjeta tarjeta-enlace flex h-full flex-col p-5"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{p.nombre}</h3>
                  {p.publicada ? (
                    <span className="rounded-lg bg-verde-fondo px-2 py-0.5 text-xs font-bold text-verde-texto">
                      Publicada
                    </span>
                  ) : (
                    <span className="rounded-lg bg-chip-fondo px-2 py-0.5 text-xs font-bold text-chip-texto">
                      Sin publicar
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-texto-suave">{p.comunidad}</p>

                <ul className="mt-3 space-y-1 text-sm">
                  <li className={p._count.sitios > 0 ? "text-verde-texto" : "text-texto-suave"}>
                    {p._count.sitios > 0
                      ? `✓ ${p._count.sitios} sitios cargados`
                      : "· Sin sitios cargados"}
                  </li>
                  <li
                    className={
                      p.areasDelimitadasEEI.length > 30
                        ? "text-verde-texto"
                        : "text-texto-suave"
                    }
                  >
                    {p.areasDelimitadasEEI.length > 30
                      ? "✓ Áreas delimitadas EEI"
                      : "· Faltan las áreas delimitadas EEI"}
                  </li>
                  {p._count.sitios > 0 && (
                    <li
                      className={
                        sinComprobar === 0 ? "text-verde-texto" : "text-texto-suave"
                      }
                    >
                      {sinComprobar === 0
                        ? "✓ Cada sitio comprobado contra el listado"
                        : `· ${sinComprobar} sitios sin comprobar contra el listado`}
                    </li>
                  )}
                </ul>

                {!p.publicada && listo && (
                  <p className="mt-3 font-semibold text-acento">
                    Lista para publicar
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
