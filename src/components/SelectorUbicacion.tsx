"use client";

import { useState } from "react";
import {
  COOKIE_UBICACION,
  DIAS_UBICACION,
  desdeCodigoPostal,
  serializar,
  type Ubicacion,
} from "@/lib/ubicacion";

/**
 * Elegir desde dónde se miden las distancias.
 *
 * Dos vías a propósito. El GPS es preciso pero pide permiso, y mucha gente lo
 * deniega —con razón—; el código postal no pide nada y es lo que se teclea sin
 * pensar. Ofrecer solo la primera deja fuera a media web.
 *
 * La elección se guarda en una cookie porque quien ordena la lista por
 * cercanía es el servidor: con localStorage habría que reordenar en el cliente
 * después de pintar, y se vería el salto.
 */
export function SelectorUbicacion({ actual }: { actual: Ubicacion | null }) {
  const [abierto, setAbierto] = useState(false);
  const [cp, setCp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  function guardar(u: Ubicacion) {
    const caduca = new Date();
    caduca.setDate(caduca.getDate() + DIAS_UBICACION);
    document.cookie = `${COOKIE_UBICACION}=${encodeURIComponent(
      serializar(u),
    )}; path=/; expires=${caduca.toUTCString()}; SameSite=Lax`;
    window.location.reload();
  }

  function usarGps() {
    if (!navigator.geolocation) {
      setError("Este navegador no sabe darme la ubicación. Usa el código postal.");
      return;
    }
    setBuscando(true);
    setError(null);

    // El `timeout` de getCurrentPosition no corre mientras el navegador tiene
    // abierto el diálogo de permiso, así que sin este aviso propio la pantalla
    // se queda en «Buscando…» para siempre si alguien lo deja sin contestar.
    const aviso = setTimeout(() => {
      setBuscando(false);
      setError("No ha contestado a tiempo. Acepta el permiso o usa el código postal.");
    }, 20000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(aviso);
        guardar({
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          etiqueta: "Tu ubicación",
          aproximada: false,
        });
      },
      () => {
        clearTimeout(aviso);
        setBuscando(false);
        setError("No me has dado permiso. Puedes poner el código postal.");
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
    );
  }

  function usarCp(e: React.FormEvent) {
    e.preventDefault();
    const u = desdeCodigoPostal(cp);
    if (!u) {
      setError("Eso no parece un código postal español. Son cinco cifras.");
      return;
    }
    guardar(u);
  }

  function borrar() {
    document.cookie = `${COOKIE_UBICACION}=; path=/; max-age=0; SameSite=Lax`;
    window.location.reload();
  }

  if (!abierto) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {actual ? (
          <>
            <span className="text-texto-suave">
              Distancias desde <strong className="text-texto">{actual.etiqueta}</strong>
              {actual.aproximada && " (aproximadas)"}
            </span>
            <button
              type="button"
              onClick={() => setAbierto(true)}
              className="font-semibold text-acento underline underline-offset-2"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={borrar}
              className="text-texto-suave underline underline-offset-2"
            >
              Quitar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="font-semibold text-acento underline underline-offset-2"
          >
            Ordenar por lo que me pilla más cerca
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="tarjeta max-w-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-bold">¿Desde dónde sales a pescar?</p>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar"
          className="text-texto-suave hover:text-texto"
        >
          ✕
        </button>
      </div>

      <p className="mt-1 text-sm leading-relaxed text-texto-suave">
        Sirve para ordenar los sitios por cercanía. No se envía a ninguna parte:
        se guarda en tu navegador.
      </p>

      <button
        type="button"
        onClick={usarGps}
        disabled={buscando}
        className="mt-4 inline-flex min-h-touch w-full items-center justify-center rounded-xl bg-acento px-5 font-bold text-acento-texto disabled:opacity-60"
      >
        {buscando ? "Buscando el punto…" : "Usar mi ubicación"}
      </button>

      <form onSubmit={usarCp} className="mt-4">
        <label htmlFor="cp" className="block text-sm font-semibold">
          O tu código postal
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="cp"
            value={cp}
            onChange={(e) => {
              setCp(e.target.value);
              setError(null);
            }}
            inputMode="numeric"
            maxLength={5}
            placeholder="41700"
            className="min-h-touch w-32 rounded-xl border-2 border-borde bg-fondo-elevado px-3 text-lg tabular-nums"
          />
          <button
            type="submit"
            className="inline-flex min-h-touch items-center rounded-xl border-2 border-borde bg-fondo-elevado px-5 font-semibold hover:border-acento"
          >
            Usarlo
          </button>
        </div>
        <p className="mt-1 text-sm text-texto-suave">
          Con el código postal la distancia sale desde el centro de tu
          provincia, así que es orientativa.
        </p>
      </form>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-ambar-fondo p-3 text-ambar-texto">
          {error}
        </p>
      )}
    </div>
  );
}
