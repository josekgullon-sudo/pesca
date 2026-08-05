import { ImageResponse } from "next/og";
import { LEMA, NOMBRE } from "@/lib/marca";

/**
 * La tarjeta que sale al compartir un enlace de la web en WhatsApp, Twitter o
 * cualquier otro sitio.
 *
 * Hasta ahora el layout declaraba `twitter: summary_large_image` sin dar
 * ninguna imagen, que es peor que no declarar nada: se pide una tarjeta grande
 * y llega vacía. Las fichas de sitio, de especie y de artículo sí llevan su
 * foto; esto cubre todo lo demás —portada, provincias, ranking, blog, especies—
 * con una tarjeta de marca.
 *
 * Se dibuja con formas y texto, sin ninguna fuente ni imagen externa: la
 * generación pasa por el servidor y ahí no hay red a la que salir.
 */

export const alt = `${NOMBRE} — ${LEMA}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Imagen() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#12241c",
          padding: "70px 80px",
        }}
      >
        {/* Onda de agua, dibujada a mano con divs: dos franjas curvadas al
            fondo bastan para que la tarjeta no parezca un cuadro de texto. */}
        <div
          style={{
            position: "absolute",
            left: -200,
            bottom: -320,
            width: 1600,
            height: 620,
            borderRadius: "50%",
            background: "#1d3c2e",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -120,
            bottom: -420,
            width: 1600,
            height: 620,
            borderRadius: "50%",
            background: "#2b5a43",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#7fcf9f",
            }}
          />
          <div
            style={{
              fontSize: 34,
              color: "#7fcf9f",
              letterSpacing: 2,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            mapadepesca.es
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 92,
              color: "#ffffff",
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            {NOMBRE}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 42,
              color: "#cfe6d8",
              lineHeight: 1.25,
            }}
          >
            {LEMA}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
