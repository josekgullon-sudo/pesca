"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { guardarProvincia, type EstadoProvincia } from "@/app/admin/acciones";

/**
 * Textos de una provincia, incluida su normativa.
 *
 * El campo que importa es el de áreas delimitadas para especies exóticas
 * invasoras. De ahí sale lo que la web le dice a la gente que haga con un black
 * bass o un lucio en la mano: devolverlo o sacrificarlo. Por eso el formulario
 * insiste en que se copie del boletín y no se resuma, y por eso el servidor no
 * deja publicar sin él.
 */
export function EditorProvincia({
  provincia,
  sitios,
}: {
  provincia: {
    slug: string;
    nombre: string;
    descripcion: string;
    areasDelimitadasEEI: string;
    notasLegales: string;
    urlOrdenDeVedas: string | null;
    publicada: boolean;
  };
  sitios: number;
}) {
  const [estado, accion] = useActionState<EstadoProvincia, FormData>(
    guardarProvincia,
    null,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="titulo-seccion font-bold">{provincia.nombre}</h2>
        <div className="flex flex-wrap items-center gap-4">
          {/* Sin publicar la página responde 404 a todo el mundo menos a ti:
              es la única forma de leer los textos antes de publicarlos. */}
          <Link
            href={`/${provincia.slug}`}
            className="font-semibold text-acento underline underline-offset-4"
          >
            {provincia.publicada ? "Ver la página" : "Ver la vista previa"}
          </Link>
          <Link
            href="/admin/provincias"
            className="font-semibold text-acento underline underline-offset-4"
          >
            Volver a la lista
          </Link>
        </div>
      </div>

      {sitios === 0 && (
        <div className="rounded-xl border-2 border-ambar-texto/30 bg-ambar-fondo p-4 text-ambar-texto">
          <p className="font-bold">Esta provincia no tiene sitios cargados</p>
          <p className="mt-1 max-w-prose leading-relaxed">
            Los embalses y tramos de río van en el seed del repositorio, no
            aquí: son muchos campos por sitio y un error se propaga a toda la
            guía. Puedes ir dejando escritos los textos y la normativa, pero no
            se podrá publicar hasta que estén cargados.
          </p>
        </div>
      )}

      <form action={accion} className="space-y-5">
        <input type="hidden" name="slug" value={provincia.slug} />

        <div>
          <label htmlFor="descripcion" className="block font-semibold">
            Descripción de la provincia
          </label>
          <p className="mb-2 text-sm text-texto-suave">
            El párrafo que abre la página. Es el contenido propio que hace que
            valga para Google: cuántos embalses hay, cómo se reparten, qué se
            pesca en cada zona.
          </p>
          <textarea
            id="descripcion"
            name="descripcion"
            defaultValue={provincia.descripcion}
            rows={6}
            className="w-full rounded-xl border-2 border-borde bg-fondo-elevado px-4 py-3 leading-relaxed"
          />
        </div>

        <div className="rounded-xl border-2 border-ambar-texto/30 bg-ambar-fondo p-4">
          <label htmlFor="eei" className="block font-bold text-ambar-texto">
            Áreas delimitadas para especies exóticas invasoras
          </label>
          <p className="mb-2 max-w-prose text-sm leading-relaxed text-ambar-texto">
            <strong>Cópialo literal de la orden de vedas.</strong> No lo
            resumas ni lo reescribas. De esta lista depende que alguien devuelva
            al agua un pez que la ley obliga a sacrificar, o al revés. Sin este
            campo la provincia no se puede publicar.
          </p>
          <textarea
            id="eei"
            name="areasDelimitadasEEI"
            defaultValue={provincia.areasDelimitadasEEI}
            rows={8}
            className="w-full rounded-xl border-2 border-ambar-texto/30 bg-fondo-elevado px-4 py-3 leading-relaxed"
          />
        </div>

        <div>
          <label htmlFor="notas" className="block font-semibold">
            Otras notas legales
          </label>
          <p className="mb-2 text-sm text-texto-suave">
            Lo que sea propio de esta provincia y no quepa arriba.
          </p>
          <textarea
            id="notas"
            name="notasLegales"
            defaultValue={provincia.notasLegales}
            rows={4}
            className="w-full rounded-xl border-2 border-borde bg-fondo-elevado px-4 py-3 leading-relaxed"
          />
        </div>

        <div>
          <label htmlFor="url" className="block font-semibold">
            Enlace a la orden de vedas
          </label>
          <p className="mb-2 text-sm text-texto-suave">
            Sale como botón en la página, para que cualquiera pueda comprobar la
            versión vigente.
          </p>
          <input
            id="url"
            name="urlOrdenDeVedas"
            type="url"
            defaultValue={provincia.urlOrdenDeVedas ?? ""}
            placeholder="https://www.juntadeandalucia.es/..."
            className="w-full rounded-xl border-2 border-borde bg-fondo-elevado px-4 py-3"
          />
        </div>

        <label className="flex items-center gap-3 tarjeta p-4">
          <input
            type="checkbox"
            name="publicada"
            value="si"
            defaultChecked={provincia.publicada}
            className="h-5 w-5"
          />
          <span>
            <span className="font-semibold">Publicada</span>
            <span className="block text-sm text-texto-suave">
              Sin marcar, /{provincia.slug} devuelve 404 y no entra en el
              sitemap.
            </span>
          </span>
        </label>

        {estado && "error" in estado && (
          <p role="alert" className="rounded-xl bg-rojo-fondo p-4 font-semibold leading-relaxed text-rojo-texto">
            {estado.error}
          </p>
        )}
        {estado && "ok" in estado && (
          <p className="rounded-xl bg-verde-fondo p-4 font-semibold text-verde-texto">
            {estado.ok}{" "}
            {provincia.publicada && (
              <Link href={`/${provincia.slug}`} className="underline underline-offset-2">
                Ver la página
              </Link>
            )}
          </p>
        )}

        <Guardar />
      </form>
    </div>
  );
}

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-touch items-center rounded-xl bg-acento px-6 text-lg font-bold text-acento-texto disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar"}
    </button>
  );
}
