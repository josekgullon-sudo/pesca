"use client";

import { useEffect } from "react";

/**
 * El último cortafuegos: si lo que revienta es el propio layout, `error.tsx`
 * no llega a montarse porque vive dentro de él.
 *
 * Por eso este trae su propio `<html>` y sus estilos en línea: no puede contar
 * con nada de la web, ni con las hojas de estilo, porque justamente lo que ha
 * fallado puede ser eso.
 */

const MARCA = "recarga-por-version";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    const texto = `${error.name} ${error.message}`.toLowerCase();
    const desfase =
      texto.includes("chunkloaderror") ||
      texto.includes("loading chunk") ||
      texto.includes("dynamically imported module");

    if (desfase && !sessionStorage.getItem(MARCA)) {
      sessionStorage.setItem(MARCA, "1");
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#12241c",
          color: "#f3f7f4",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "34rem" }}>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Algo se ha roto</h1>
          <p style={{ lineHeight: 1.6, color: "#cfe6d8" }}>
            No es culpa tuya. Suele pasar cuando acabamos de actualizar la web
            mientras la tenías abierta. Recargando se arregla.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              minHeight: "2.75rem",
              padding: "0 1.5rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#7fcf9f",
              color: "#12241c",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}
