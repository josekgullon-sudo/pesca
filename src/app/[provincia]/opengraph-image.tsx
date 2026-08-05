import { ImageResponse } from "next/og";
import { NOMBRE } from "@/lib/marca";
import { prisma } from "@/lib/prisma";

/**
 * Tarjeta al compartir la página de una provincia.
 *
 * Es la página que más se va a compartir por WhatsApp —«mira, aquí sale dónde
 * pescar en Sevilla»— así que merece decir de qué provincia habla y cuántos
 * sitios hay, en vez de la tarjeta genérica de la marca.
 *
 * Sin fuentes ni imágenes externas: se genera en el servidor y ahí no hay red.
 */

export const alt = `Dónde pescar, provincia a provincia · ${NOMBRE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Imagen({
  params,
}: {
  params: { provincia: string };
}) {
  const provincia = await prisma.provincia.findUnique({
    where: { slug: params.provincia, publicada: true },
    select: { nombre: true, _count: { select: { sitios: true } } },
  });

  const titulo = provincia
    ? `Dónde pescar en ${provincia.nombre}`
    : "Dónde pescar en España";
  const pie = provincia
    ? `${provincia._count.sitios} embalses y tramos de río, con sus especies y su normativa`
    : "Provincia a provincia";

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
              fontSize: titulo.length > 26 ? 74 : 92,
              color: "#ffffff",
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            {titulo}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 36,
              color: "#cfe6d8",
              lineHeight: 1.25,
            }}
          >
            {pie}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
