"use client";

import { useEffect } from "react";

/**
 * Qué se enseña cuando algo revienta en el navegador.
 *
 * Sin esto, Next pinta su pantalla por defecto: fondo en blanco y
 * «Application error: a client-side exception has occurred», en inglés y sin
 * ninguna salida. En una web pública en español eso es inaceptable: quien lo
 * ve no sabe si ha perdido lo que estaba haciendo ni qué hacer después.
 *
 * Y hay un caso concreto que se arregla solo, así que se arregla solo: cuando
 * desplegamos, los ficheros de JavaScript cambian de nombre. Quien tuviera la
 * página abierta de antes pide un fichero que ya no existe y se lleva justo
 * esta pantalla, sin haber hecho nada mal. La página se recarga sola una vez y
 * sigue como si nada.
 *
 * La marca en `sessionStorage` es la que evita el bucle: si tras recargar
 * vuelve a fallar, ya no es el despliegue y hay que enseñar el error.
 */

const MARCA = "recarga-por-version";

/** ¿Huele a fichero de JavaScript que ya no está en el servidor? */
function esDesfaseDeVersion(error: Error): boolean {
  const texto = `${error.name} ${error.message}`.toLowerCase();
  return (
    texto.includes("chunkloaderror") ||
    texto.includes("loading chunk") ||
    texto.includes("failed to fetch dynamically imported module") ||
    texto.includes("importing a module script failed") ||
    texto.includes("error loading dynamically imported module")
  );
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (!esDesfaseDeVersion(error)) return;
    if (sessionStorage.getItem(MARCA)) return;
    sessionStorage.setItem(MARCA, "1");
    // Recarga dura: hay que volver a pedir el HTML para que traiga los
    // nombres nuevos de los ficheros.
    window.location.reload();
  }, [error]);

  useEffect(() => {
    // Si la página ha cargado bien, la marca sobra: que la próxima vez pueda
    // volver a recargarse sola.
    const t = setTimeout(() => sessionStorage.removeItem(MARCA), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="contenedor py-16">
      <div className="mx-auto max-w-prose">
        <h1 className="titulo-pagina font-bold">Algo se ha roto</h1>
        <p className="mt-4 text-lg leading-relaxed text-texto-suave">
          No es culpa tuya. Si estabas registrando una captura,{" "}
          <strong className="text-texto">
            puede que se haya guardado igualmente
          </strong>
          : míralo en tus capturas antes de volver a escribirla.
        </p>
        <p className="mt-3 leading-relaxed text-texto-suave">
          Lo más habitual es que acabemos de actualizar la web mientras la
          tenías abierta. Recargando se arregla.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-touch items-center rounded-xl bg-acento px-6 font-bold text-acento-texto"
          >
            Recargar
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-touch items-center rounded-xl border-2 border-borde bg-fondo-elevado px-5 font-semibold"
          >
            Reintentar
          </button>
          {/* Un <a> de verdad y no un <Link>: si lo que ha fallado es el
              router del cliente, navegar con él vuelve a fallar. Esto fuerza
              una carga completa, que es justo lo que hace falta aquí. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/capturas"
            className="inline-flex min-h-touch items-center rounded-xl border-2 border-borde bg-fondo-elevado px-5 font-semibold"
          >
            Ver mis capturas
          </a>
        </div>

        {error.digest && (
          <p className="mt-8 text-sm text-texto-suave">
            Si vuelve a pasar, dinos este código: <code>{error.digest}</code>
          </p>
        )}
      </div>
    </div>
  );
}
