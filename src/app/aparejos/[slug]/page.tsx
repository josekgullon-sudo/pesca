import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DatosEstructurados } from "@/components/DatosEstructurados";
import { FotoAparejo } from "@/components/FotoAparejo";
import { SubirFoto } from "@/components/SubirFoto";
import { usuarioOpcional } from "@/lib/auth";
import { Markdown } from "@/lib/markdown";
import { ETIQUETA_TIPO_APAREJO, type TipoAparejo } from "@/lib/enums";
import { metadatosDePagina } from "@/lib/marca";
import { prisma } from "@/lib/prisma";
import { schemaMigas } from "@/lib/schema";

/**
 * La ficha de un señuelo o cebo.
 *
 * Lo que la justifica es el «cómo se monta»: es la primera pregunta que se
 * hace de cualquier señuelo y hasta ahora no estaba escrita en ninguna parte
 * de la web. Va arriba, antes que la lista de especies, porque quien llega
 * buscando «cómo montar un texas rig» no viene a leer para qué sirve.
 */

async function cargar(slug: string) {
  return prisma.aparejo.findUnique({
    where: { slug },
    select: {
      slug: true,
      nombre: true,
      tipo: true,
      descripcion: true,
      comoMontar: true,
      precioAproxEur: true,
      imagenUrl: true,
      imagenAutor: true,
      imagenLicencia: true,
      imagenFuente: true,
      especies: {
        orderBy: { efectividad: "desc" },
        select: {
          efectividad: true,
          notas: true,
          especie: {
            select: { slug: true, nombreComun: true, estadoLegal: true },
          },
        },
      },
      sitios: {
        where: { recomendado: true, sitio: { provincia: { publicada: true } } },
        select: {
          notas: true,
          sitio: {
            select: {
              slug: true,
              nombre: true,
              provincia: { select: { slug: true, nombre: true } },
            },
          },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await cargar(slug);
  if (!a) return { title: "Aparejo" };

  return metadatosDePagina({
    // El «cómo se monta» va en el título porque es la búsqueda: nadie escribe
    // «vinilo shad verde sandía», escriben «cómo montar un vinilo».
    titulo: a.comoMontar
      ? `${a.nombre}: para qué sirve y cómo se monta`
      : `${a.nombre}: para qué sirve`,
    descripcion: a.descripcion.slice(0, 155),
    ruta: `/aparejos/${a.slug}`,
  });
}

/** Cinco puntitos. Un número del 1 al 5 no dice nada; cinco puntos, sí. */
function Efectividad({ valor }: { valor: number }) {
  return (
    <span
      className="inline-flex gap-0.5"
      aria-label={`Efectividad ${valor} de 5`}
      title={`Efectividad ${valor} de 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden
          className={`h-2 w-2 rounded-full ${i <= valor ? "bg-verde-texto" : "bg-chip-fondo"}`}
        />
      ))}
    </span>
  );
}

export default async function PaginaAparejo({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [a, usuario] = await Promise.all([cargar(slug), usuarioOpcional()]);
  if (!a) notFound();

  return (
    <article className="contenedor max-w-prose space-y-6 py-10 md:py-14">
      <DatosEstructurados
        schema={schemaMigas([
          { nombre: "Inicio", ruta: "/" },
          { nombre: "Señuelos y cebos", ruta: "/aparejos" },
          { nombre: a.nombre, ruta: `/aparejos/${a.slug}` },
        ])}
      />

      <nav aria-label="Migas de pan" className="text-sm">
        <Link href="/" className="text-texto-suave underline underline-offset-2">
          Inicio
        </Link>
        {" · "}
        <Link
          href="/aparejos"
          className="text-texto-suave underline underline-offset-2"
        >
          Señuelos y cebos
        </Link>
      </nav>

      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-texto-suave">
          {ETIQUETA_TIPO_APAREJO[a.tipo as TipoAparejo]}
        </p>
        <h1 className="titulo-pagina mt-1 font-bold">{a.nombre}</h1>
        {a.precioAproxEur !== null && (
          <p className="mt-1 text-texto-suave">
            Unos <strong className="text-texto">{a.precioAproxEur} €</strong> la
            unidad, de orientación. Aquí no se vende nada.
          </p>
        )}
      </div>

      <FotoAparejo
        nombre={a.nombre}
        imagenUrl={a.imagenUrl}
        tipo={a.tipo}
        className="aspect-[16/10] w-full rounded-xl"
      />
      {a.imagenAutor && (
        <p className="text-xs text-texto-suave">
          Foto: {a.imagenAutor}
          {a.imagenLicencia && ` · ${a.imagenLicencia}`}
        </p>
      )}

      {/* Justo debajo de la foto, como en las fichas de especie y de sitio: la
          foto de un señuelo la hace uno de su propia caja, y se sube estando
          delante de ella. */}
      {usuario?.esAdmin && (
        <SubirFoto
          tipo="aparejo"
          slug={a.slug}
          nombre={a.nombre}
          tieneFoto={Boolean(a.imagenUrl)}
        />
      )}

      <p className="text-lg leading-relaxed">{a.descripcion}</p>

      {a.comoMontar && (
        <section className="tarjeta p-5">
          <h2 className="mb-3 text-xl font-bold">Cómo se monta</h2>
          <Markdown>{a.comoMontar}</Markdown>
        </section>
      )}

      {a.especies.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Para qué especies</h2>
          <ul className="space-y-3">
            {a.especies.map((e) => (
              <li key={e.especie.slug} className="tarjeta p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/especies/${e.especie.slug}`}
                    className="font-bold text-acento underline underline-offset-2"
                  >
                    {e.especie.nombreComun}
                  </Link>
                  <Efectividad valor={e.efectividad} />
                </div>
                {e.notas && (
                  <p className="mt-2 leading-relaxed text-texto-suave">
                    {e.notas}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {a.sitios.length > 0 && (
        <section>
          <h2 className="mb-2 text-xl font-bold">Dónde va bien</h2>
          <p className="mb-3 leading-relaxed text-texto-suave">
            Embalses y tramos de la guía donde esto es de lo primero que
            probaría.
          </p>
          <ul className="flex flex-wrap gap-2">
            {a.sitios.slice(0, 24).map((s) => (
              <li key={`${s.sitio.provincia.slug}-${s.sitio.slug}`}>
                <Link
                  href={`/${s.sitio.provincia.slug}/${s.sitio.slug}`}
                  className="inline-flex min-h-touch items-center rounded-xl border-2 border-borde bg-fondo-elevado px-4 text-sm font-semibold hover:border-acento"
                >
                  {s.sitio.nombre}
                </Link>
              </li>
            ))}
          </ul>
          {a.sitios.length > 24 && (
            <p className="mt-2 text-sm text-texto-suave">
              Y en {a.sitios.length - 24} sitios más. Vale prácticamente en
              cualquier embalse de la guía.
            </p>
          )}
        </section>
      )}

      <p className="text-sm leading-relaxed text-texto-suave">
        Vuelve a{" "}
        <Link href="/aparejos" className="text-acento underline underline-offset-2">
          todos los señuelos y cebos
        </Link>
        , o mira{" "}
        <Link href="/donde-pescar" className="text-acento underline underline-offset-2">
          dónde pescar
        </Link>
        .
      </p>
    </article>
  );
}
