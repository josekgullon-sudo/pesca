"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { guardarArticulo, type EstadoArticulo } from "@/app/admin/acciones";
import { Markdown } from "@/lib/markdown";

/**
 * Escribir y editar un artículo.
 *
 * Lleva vista previa porque el cuerpo va en Markdown reducido y sin verlo
 * pintado es fácil equivocarse con las listas o los enlaces. La vista previa
 * usa el mismo componente que la web pública, así que lo que se ve aquí es
 * exactamente lo que se va a publicar.
 */

type Articulo = {
  slug: string;
  titulo: string;
  entradilla: string;
  contenido: string;
  publicada: boolean;
  provinciaId: string | null;
};

export function EditorArticulo({
  articulo,
  provincias,
}: {
  articulo?: Articulo;
  provincias: { id: string; nombre: string }[];
}) {
  const [estado, accion] = useActionState<EstadoArticulo, FormData>(
    guardarArticulo,
    null,
  );
  const [contenido, setContenido] = useState(articulo?.contenido ?? "");
  const [previa, setPrevia] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="titulo-seccion font-bold">
          {articulo ? "Editar artículo" : "Artículo nuevo"}
        </h2>
        <Link
          href="/admin/articulos"
          className="font-semibold text-acento underline underline-offset-4"
        >
          Volver a la lista
        </Link>
      </div>

      <form action={accion} className="space-y-5">
        {articulo && <input type="hidden" name="slug" value={articulo.slug} />}

        <Campo etiqueta="Título" ayuda="Es el titular en Google. Que responda a lo que la gente busca.">
          <input
            name="titulo"
            defaultValue={articulo?.titulo}
            required
            maxLength={120}
            className="w-full rounded-xl border-2 border-borde bg-fondo-elevado px-4 py-3 text-lg"
          />
        </Campo>

        <Campo
          etiqueta="Entradilla"
          ayuda="Una o dos frases. Sale en el listado y debajo del titular en Google."
        >
          <textarea
            name="entradilla"
            defaultValue={articulo?.entradilla}
            required
            rows={2}
            maxLength={300}
            className="w-full rounded-xl border-2 border-borde bg-fondo-elevado px-4 py-3"
          />
        </Campo>

        <Campo etiqueta="Provincia" ayuda="Déjalo en blanco si el artículo vale para toda España.">
          <select
            name="provinciaId"
            defaultValue={articulo?.provinciaId ?? ""}
            className="min-h-touch w-full rounded-xl border-2 border-borde bg-fondo-elevado px-4"
          >
            <option value="">Toda España</option>
            {provincias.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="contenido" className="font-semibold">
              El artículo
            </label>
            <button
              type="button"
              onClick={() => setPrevia((v) => !v)}
              className="font-semibold text-acento underline underline-offset-4"
            >
              {previa ? "Volver a escribir" : "Ver cómo queda"}
            </button>
          </div>

          {previa ? (
            <div className="mt-2 rounded-xl border-2 border-borde bg-fondo-elevado p-6">
              {contenido.trim() ? (
                <Markdown>{contenido}</Markdown>
              ) : (
                <p className="text-texto-suave">Todavía no has escrito nada.</p>
              )}
            </div>
          ) : (
            <textarea
              id="contenido"
              name="contenido"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              required
              rows={22}
              className="mt-2 w-full rounded-xl border-2 border-borde bg-fondo-elevado px-4 py-3 font-mono text-sm leading-relaxed"
            />
          )}

          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-semibold text-texto-suave">
              Cómo se da formato
            </summary>
            <ul className="mt-2 space-y-1 text-sm text-texto-suave">
              <li><code className="font-mono">## Título de sección</code></li>
              <li><code className="font-mono">### Subtítulo</code></li>
              <li><code className="font-mono">- Punto de una lista</code></li>
              <li><code className="font-mono">1. Punto numerado</code></li>
              <li><code className="font-mono">**negrita**</code></li>
              <li><code className="font-mono">[texto del enlace](/especies)</code></li>
              <li><code className="font-mono">&gt; Cita destacada</code></li>
            </ul>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-texto-suave">
              Si escribes sobre normativa, no pongas importes ni fechas de veda:
              cambian cada temporada y un dato viejo aquí puede costarle una
              sanción a quien se fíe. Enlaza al portal oficial y que el número
              lo mire allí.
            </p>
          </details>
        </div>

        <label className="flex items-center gap-3 tarjeta p-4">
          <input
            type="checkbox"
            name="publicada"
            value="si"
            defaultChecked={articulo?.publicada}
            className="h-5 w-5"
          />
          <span>
            <span className="font-semibold">Publicado</span>
            <span className="block text-sm text-texto-suave">
              Sin marcar queda como borrador: no se ve en la web ni entra en el
              sitemap.
            </span>
          </span>
        </label>

        {estado && "error" in estado && (
          <p role="alert" className="rounded-xl bg-rojo-fondo p-4 font-semibold text-rojo-texto">
            {estado.error}
          </p>
        )}
        {estado && "ok" in estado && (
          <p className="rounded-xl bg-verde-fondo p-4 font-semibold text-verde-texto">
            {estado.ok}{" "}
            <Link href={`/blog/${estado.slug}`} className="underline underline-offset-2">
              Ver el artículo
            </Link>
          </p>
        )}

        <Guardar />
      </form>
    </div>
  );
}

function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-semibold">{etiqueta}</label>
      <p className="mb-2 text-sm text-texto-suave">{ayuda}</p>
      {children}
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
