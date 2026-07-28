import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SemaforoLegal } from "@/components/SemaforoLegal";
import { usuarioOpcional } from "@/lib/auth";
import { formatearFecha, formatearPeso } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { borrarCaptura } from "../acciones";

export const dynamic = "force-dynamic";

async function cargar(id: string) {
  return prisma.captura.findUnique({
    where: { id },
    include: {
      usuario: { select: { nombre: true } },
      especie: true,
      sitio: { select: { nombre: true, slug: true } },
      aparejo: { select: { nombre: true } },
      tecnica: { select: { nombre: true } },
      fotos: { orderBy: { esPrincipal: "desc" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = await prisma.captura.findUnique({
    where: { id },
    select: { especie: { select: { nombreComun: true } } },
  });
  return { title: c ? `${c.especie.nombreComun}` : "Captura" };
}

export default async function FichaCaptura({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [captura, usuario] = await Promise.all([cargar(id), usuarioOpcional()]);
  if (!captura) notFound();

  const esMia = usuario !== null && captura.usuarioId === usuario.id;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      {captura.fotos.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {captura.fotos.map((f, i) => (
            <li
              key={f.id}
              className={captura.fotos.length === 1 ? "sm:col-span-2" : ""}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt={`${captura.especie.nombreComun}, foto ${i + 1}`}
                className="w-full rounded-xl object-cover"
              />
            </li>
          ))}
        </ul>
      )}

      <header>
        <h1 className="text-3xl font-bold leading-tight tracking-tight">
          {captura.especie.nombreComun}
        </h1>
        <p className="mt-1 text-lg text-texto-suave">
          {captura.usuario.nombre} · {formatearFecha(captura.fecha)} a las{" "}
          {captura.hora}
        </p>
      </header>

      {(captura.pesoGramos !== null || captura.longitudCm !== null) && (
        <dl className="grid grid-cols-2 gap-3">
          {captura.pesoGramos !== null && (
            <div className="rounded-xl border border-borde bg-fondo-elevado p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-texto-suave">
                Peso
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-acento">
                {formatearPeso(captura.pesoGramos)}
              </dd>
            </div>
          )}
          {captura.longitudCm !== null && (
            <div className="rounded-xl border border-borde bg-fondo-elevado p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-texto-suave">
                Longitud
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-acento">
                {captura.longitudCm} cm
              </dd>
            </div>
          )}
        </dl>
      )}

      <SemaforoLegal estado={captura.especie.estadoLegal} />

      <dl className="divide-y divide-borde rounded-xl border border-borde bg-fondo-elevado">
        <Fila titulo="Sitio">
          <Link
            href={`/sitios/${captura.sitio.slug}`}
            className="font-semibold text-acento underline underline-offset-2"
          >
            {captura.sitio.nombre}
          </Link>
        </Fila>
        <Fila titulo="Especie">
          <Link
            href={`/especies/${captura.especie.slug}`}
            className="font-semibold text-acento underline underline-offset-2"
          >
            {captura.especie.nombreComun}
          </Link>
        </Fila>
        <Fila titulo="¿Devuelta?">
          {captura.liberado ? "Sí, al agua" : "No"}
        </Fila>
        {captura.aparejo && (
          <Fila titulo="Con qué">{captura.aparejo.nombre}</Fila>
        )}
        {captura.tecnica && (
          <Fila titulo="Técnica">{captura.tecnica.nombre}</Fila>
        )}
        {captura.condicionesMeteo && (
          <Fila titulo="Tiempo">{captura.condicionesMeteo}</Fila>
        )}
        {/* El punto exacto solo se enseña a quien ha entrado. La web es
            pública, y publicar las coordenadas al metro de cada captura es
            regalar los puestos y, de paso, dejar un rastro de por dónde
            andamos. El sitio (el embalse) sí sale para todo el mundo. */}
        {captura.latitud !== null &&
          captura.longitud !== null &&
          (usuario ? (
            <Fila titulo="Punto exacto">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${captura.latitud},${captura.longitud}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-acento underline underline-offset-2"
              >
                {captura.latitud.toFixed(5)}, {captura.longitud.toFixed(5)} ↗
              </a>
            </Fila>
          ) : (
            <Fila titulo="Punto exacto">
              <Link
                href="/entrar"
                className="font-semibold text-acento underline underline-offset-2"
              >
                Entra para verlo
              </Link>
            </Fila>
          ))}
      </dl>

      {captura.notas && (
        <section>
          <h2 className="mb-2 text-xl font-bold">Notas</h2>
          <p className="max-w-prose leading-relaxed">{captura.notas}</p>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/capturas"
          className="inline-flex min-h-touch items-center rounded-xl border-2 border-borde bg-fondo-elevado px-5 font-semibold"
        >
          Volver al diario
        </Link>

        {esMia && (
          <form action={borrarCaptura}>
            <input type="hidden" name="id" value={captura.id} />
            <button
              type="submit"
              className="inline-flex min-h-touch items-center rounded-xl border-2 border-rojo-texto/30 bg-rojo-fondo px-5 font-semibold text-rojo-texto"
            >
              Borrar
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

function Fila({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="font-semibold text-texto-suave">{titulo}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
