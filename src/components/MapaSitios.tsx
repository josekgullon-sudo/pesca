"use client";

import dynamic from "next/dynamic";
import type { SitioMapa } from "./MapaLeaflet";

/**
 * Leaflet toca `window` al importarse, así que el mapa no puede renderizarse en
 * el servidor. Este envoltorio existe solo para poder usar `ssr: false`, que en
 * un componente de servidor no está permitido.
 */
const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-borde bg-fondo-elevado">
      <p className="text-texto-suave">Cargando el mapa…</p>
    </div>
  ),
});

export function MapaSitios({ sitios }: { sitios: SitioMapa[] }) {
  return <MapaLeaflet sitios={sitios} />;
}
