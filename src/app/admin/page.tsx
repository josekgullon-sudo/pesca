import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PaginaAdmin() {
  const [articulos, borradores, provincias, publicadas, sitios, capturas, ejemplos] =
    await Promise.all([
      prisma.articulo.count(),
      prisma.articulo.count({ where: { publicada: false } }),
      prisma.provincia.count(),
      prisma.provincia.count({ where: { publicada: true } }),
      prisma.sitio.count(),
      prisma.captura.count({ where: { esEjemplo: false } }),
      prisma.captura.count({ where: { esEjemplo: true } }),
    ]);

  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Dato titulo="Artículos" valor={articulos} pie={`${borradores} sin publicar`} />
        <Dato titulo="Provincias" valor={`${publicadas} de ${provincias}`} pie="publicadas" />
        <Dato titulo="Sitios" valor={sitios} />
        <Dato
          titulo="Capturas"
          valor={capturas}
          pie={ejemplos > 0 ? `y ${ejemplos} de ejemplo` : undefined}
        />
      </dl>

      {ejemplos > 0 && capturas > 0 && (
        <div className="rounded-xl border-2 border-ambar-texto/30 bg-ambar-fondo p-4 text-ambar-texto">
          <p className="font-bold">Ya hay capturas de verdad</p>
          <p className="mt-1 max-w-prose leading-relaxed">
            Quedan {ejemplos} capturas de ejemplo. Cuando la gente vaya
            apuntando las suyas conviene retirarlas: en el servidor, poniendo{" "}
            <code className="rounded bg-ambar-texto/15 px-1.5 py-0.5 font-mono">
              SEMBRAR_DEMO=no
            </code>{" "}
            en el <code className="font-mono">.env</code> y volviendo a
            desplegar.
          </p>
        </div>
      )}

      <section>
        <h2 className="titulo-seccion font-bold">Qué se puede hacer aquí</h2>
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          <Tarjeta
            href="/admin/articulos"
            titulo="Escribir en el blog"
            texto="Crear artículos, editarlos y publicarlos o retirarlos. Es lo que trae visitas por preguntas que la guía no responde."
          />
          <Tarjeta
            href="/admin/provincias"
            titulo="Textos y normativa de las provincias"
            texto="La descripción de la landing y, sobre todo, el listado de áreas delimitadas para especies invasoras. Sin ese dato una provincia no se puede publicar."
          />
        </ul>
      </section>

      <section>
        <h2 className="titulo-seccion font-bold">Lo que todavía va por código</h2>
        <p className="mt-2 max-w-prose leading-relaxed text-texto-suave">
          Los sitios de pesca y las especies siguen cargándose desde el seed del
          repositorio: son muchos campos y un error ahí se propaga a toda la
          guía. Las fotos sí se cambian desde la web, en la ficha de cada
          especie y de cada sitio.
        </p>
      </section>
    </div>
  );
}

function Dato({
  titulo,
  valor,
  pie,
}: {
  titulo: string;
  valor: number | string;
  pie?: string;
}) {
  return (
    <div className="tarjeta p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-texto-suave">
        {titulo}
      </dt>
      <dd className="mt-1 text-3xl font-bold tabular-nums text-acento">{valor}</dd>
      {pie && <p className="mt-0.5 text-sm text-texto-suave">{pie}</p>}
    </div>
  );
}

function Tarjeta({
  href,
  titulo,
  texto,
}: {
  href: string;
  titulo: string;
  texto: string;
}) {
  return (
    <li>
      <Link href={href} className="tarjeta tarjeta-enlace flex h-full flex-col p-5">
        <h3 className="text-lg font-bold">{titulo}</h3>
        <p className="mt-2 leading-relaxed text-texto-suave">{texto}</p>
      </Link>
    </li>
  );
}
