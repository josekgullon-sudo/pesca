"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { subirFoto, type EstadoSubida } from "@/app/admin/acciones";
import {
  mensajeDemasiadoGrande,
  TAMANO_MAXIMO_BYTES,
  TAMANO_MAXIMO_MB,
} from "@/lib/imagenes-comun";

/**
 * Formulario para cambiar la foto de una especie o de un sitio.
 *
 * Solo se pinta si quien mira es administrador; la comprobación de verdad está
 * en la acción de servidor, no aquí. Va plegado dentro de un <details> para no
 * meter ruido en una página que sobre todo se lee.
 */
export function SubirFoto({
  tipo,
  slug,
  nombre,
  tieneFoto,
}: {
  tipo: "especie" | "sitio";
  slug: string;
  nombre: string;
  tieneFoto: boolean;
}) {
  const [estado, accion] = useActionState<EstadoSubida, FormData>(subirFoto, null);
  const formulario = useRef<HTMLFormElement>(null);
  // Se comprueba aquí y no solo en el servidor: si el fichero se envía y se
  // pasa del tamaño máximo, Next lo rechaza en la capa de transporte con un
  // 413 y el usuario ve una pantalla de error en blanco, sin mensaje.
  const [demasiadoGrande, setDemasiadoGrande] = useState<string | null>(null);

  return (
    <details className="mt-6 rounded-xl border-2 border-dashed border-borde p-4">
      <summary className="cursor-pointer font-semibold text-texto-suave">
        {tieneFoto ? "Cambiar la foto" : "Poner una foto"} · solo administradores
      </summary>

      <form
        ref={formulario}
        action={accion}
        className="mt-4 space-y-3"
        // El formulario no se limpia solo tras una acción de servidor y el
        // fichero anterior se queda seleccionado, que despista.
        onSubmit={() => setTimeout(() => formulario.current?.reset(), 0)}
      >
        <input type="hidden" name="tipo" value={tipo} />
        <input type="hidden" name="slug" value={slug} />

        <div>
          <label htmlFor={`foto-${slug}`} className="block font-semibold">
            Imagen de {nombre}
          </label>
          <input
            id={`foto-${slug}`}
            type="file"
            name="foto"
            accept="image/*"
            required
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              setDemasiadoGrande(
                f && f.size > TAMANO_MAXIMO_BYTES
                  ? mensajeDemasiadoGrande(f.name)
                  : null,
              );
            }}
            className="mt-1 block w-full rounded-lg border-2 border-borde bg-fondo-elevado p-2"
          />
          <p className="mt-1 text-sm text-texto-suave">
            Se redimensiona a 1600 px y se guarda en WebP. Máximo{" "}
            {TAMANO_MAXIMO_MB} MB por fichero.
          </p>
          {demasiadoGrande && (
            <p
              role="alert"
              className="mt-2 rounded-lg bg-rojo-fondo p-3 font-semibold text-rojo-texto"
            >
              {demasiadoGrande}
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Campo nombre="autor" etiqueta="Autor" ejemplo="Quién la hizo" />
          <Campo nombre="licencia" etiqueta="Licencia" ejemplo="CC BY-SA 4.0" />
          <Campo nombre="fuente" etiqueta="Enlace de origen" ejemplo="https://…" />
        </div>
        <p className="text-sm leading-relaxed text-texto-suave">
          La atribución es opcional, pero si la imagen tiene dueño hay que
          ponerla: sin ella no se puede publicar una foto ajena, y en un mes ya
          nadie se acuerda de dónde salió.
        </p>

        {estado && "error" in estado && (
          <p role="alert" className="rounded-lg bg-rojo-fondo p-3 font-semibold text-rojo-texto">
            {estado.error}
          </p>
        )}
        {estado && "ok" in estado && (
          <p className="rounded-lg bg-verde-fondo p-3 font-semibold text-verde-texto">
            {estado.ok} Recarga para verla.
          </p>
        )}

        <Boton bloqueado={demasiadoGrande !== null} />
      </form>
    </details>
  );
}

function Campo({
  nombre,
  etiqueta,
  ejemplo,
}: {
  nombre: string;
  etiqueta: string;
  ejemplo: string;
}) {
  return (
    <div>
      <label htmlFor={nombre} className="block text-sm font-semibold">
        {etiqueta}
      </label>
      <input
        id={nombre}
        name={nombre}
        type="text"
        placeholder={ejemplo}
        className="mt-1 block w-full rounded-lg border-2 border-borde bg-fondo-elevado px-3 py-2"
      />
    </div>
  );
}

function Boton({ bloqueado }: { bloqueado: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || bloqueado}
      className="inline-flex min-h-touch items-center rounded-xl bg-acento px-5 font-bold text-acento-texto disabled:opacity-60"
    >
      {pending ? "Subiendo…" : "Guardar la foto"}
    </button>
  );
}
