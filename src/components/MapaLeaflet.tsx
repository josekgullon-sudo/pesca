"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import { ETIQUETA_TIPO_SITIO, type TipoSitio } from "@/lib/enums";
import { formatearTiempo } from "@/lib/ubicacion";

export type SitioMapa = {
  slug: string;
  nombre: string;
  tipo: string;
  municipio: string;
  tiempoCocheMin: number;
  /** Minutos estimados desde donde esté el visitante, si lo ha dicho. */
  tiempoUsuarioMin?: number;
  latitud: number;
  longitud: number;
  avisoGrave: boolean;
  provincia: string;
};

const COLOR_POR_TIPO: Record<string, string> = {
  embalse: "#33633d",
  rio: "#416f87",
  canal: "#857659",
};

/**
 * Marcador dibujado con HTML en vez de con las imágenes por defecto de Leaflet.
 * Así no hay que pelearse con las rutas de los iconos al empaquetar, y de paso
 * podemos colorear por tipo y marcar en rojo los sitios con aviso sanitario.
 */
function icono(sitio: SitioMapa) {
  const color = sitio.avisoGrave
    ? "#b3261e"
    : (COLOR_POR_TIPO[sitio.tipo] ?? "#33633d");

  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);background:${color};
      border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20],
  });
}

/** Encuadra el mapa para que quepan todos los sitios que se están mostrando. */
function Encuadrar({ sitios }: { sitios: SitioMapa[] }) {
  const mapa = useMap();

  useEffect(() => {
    if (sitios.length === 0) return;
    const limites = L.latLngBounds(
      sitios.map((s) => [s.latitud, s.longitud] as [number, number]),
    );
    mapa.fitBounds(limites, { padding: [40, 40], maxZoom: 12 });
  }, [mapa, sitios]);

  return null;
}

export default function MapaLeaflet({ sitios }: { sitios: SitioMapa[] }) {
  return (
    <MapContainer
      // Centro aproximado de la provincia. `Encuadrar` lo ajusta enseguida.
      center={[37.6, -5.8]}
      zoom={9}
      scrollWheelZoom
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Encuadrar sitios={sitios} />

      {sitios.map((s) => (
        <Marker
          key={s.slug}
          position={[s.latitud, s.longitud]}
          icon={icono(s)}
          title={s.nombre}
        >
          <Popup>
            <span className="block text-base font-bold leading-tight">
              {s.nombre}
            </span>
            <span className="block text-sm">
              {ETIQUETA_TIPO_SITIO[s.tipo as TipoSitio]} · {s.municipio}
            </span>
            <span className="block text-sm">
              {s.tiempoUsuarioMin !== undefined
                ? `A aprox. ${formatearTiempo(s.tiempoUsuarioMin)} en coche`
                : `A ${s.tiempoCocheMin} min en coche`}
            </span>
            {s.avisoGrave && (
              <span className="mt-1 block text-sm font-bold text-[#b3261e]">
                ⚠ Aviso sanitario grave
              </span>
            )}
            <a
              href={`/${s.provincia}/${s.slug}`}
              className="mt-2 inline-block font-bold underline"
            >
              Ver la ficha
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
