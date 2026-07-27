import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [sitios, especies, aparejos, capturas] = await Promise.all([
    prisma.sitio.count(),
    prisma.especie.count(),
    prisma.aparejo.count(),
    prisma.captura.count(),
  ]);

  const resumen = [
    { etiqueta: "Sitios", valor: sitios },
    { etiqueta: "Especies", valor: especies },
    { etiqueta: "Aparejos", valor: aparejos },
    { etiqueta: "Capturas", valor: capturas },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">
          Dónde pescar en Sevilla
        </h1>
        <p className="mt-2 text-lg leading-relaxed text-texto-suave">
          Nuestra guía de embalses y ríos de la provincia, con las especies de
          cada sitio, qué llevar para pescarlas y qué dice la ley. Y el diario
          de lo que vamos sacando.
        </p>
      </section>

      <section>
        <h2 className="sr-only">Contenido de la guía</h2>
        <ul className="grid grid-cols-2 gap-3">
          {resumen.map((r) => (
            <li
              key={r.etiqueta}
              className="rounded-xl border border-borde bg-fondo-elevado p-4"
            >
              <p className="text-3xl font-bold tabular-nums text-acento">
                {r.valor}
              </p>
              <p className="text-sm font-medium text-texto-suave">
                {r.etiqueta}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-borde bg-fondo-elevado p-4">
        <h2 className="text-lg font-bold">En construcción</h2>
        <p className="mt-2 leading-relaxed text-texto-suave">
          De momento están montados la base de datos y los datos semilla. Las
          pantallas de guía, diario y recomendador llegan en los siguientes
          bloques.
        </p>
      </section>
    </div>
  );
}
