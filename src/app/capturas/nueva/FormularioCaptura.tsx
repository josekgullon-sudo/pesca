"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { crearCaptura, type EstadoCaptura } from "../acciones";
import {
  mensajeDemasiadoGrande,
  mensajeEnvioDemasiadoGrande,
  TAMANO_MAXIMO_BYTES,
  TAMANO_TOTAL_MAXIMO_BYTES,
} from "@/lib/imagenes-comun";

type Opcion = { id: string; nombre: string };
type EspecieOpcion = Opcion & { estadoLegal: string; slug: string };
type SitioOpcion = Opcion & { slug: string; especiesIds: string[] };

/** Coordenadas del móvil, con su estado mientras el GPS se decide. */
type Gps =
  | { estado: "buscando" }
  | { estado: "ok"; lat: number; lon: number; precision: number }
  | { estado: "no"; motivo: string };

function ahora() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    hora: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Estas no se pueden buscar, así que van al final de la lista. */
const NO_SE_PUEDEN_PESCAR = new Set(["prohibida", "invasora_no_pescable"]);

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-touch w-full rounded-xl bg-acento px-6 text-lg font-bold text-acento-texto disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar captura"}
    </button>
  );
}

export function FormularioCaptura({
  sitios,
  especies,
  aparejos,
  tecnicas,
  sitioInicial,
}: {
  sitios: SitioOpcion[];
  especies: EspecieOpcion[];
  aparejos: Opcion[];
  tecnicas: Opcion[];
  sitioInicial: string | null;
}) {
  const [estado, accion] = useActionState<EstadoCaptura, FormData>(
    crearCaptura,
    null,
  );

  const inicial = useMemo(ahora, []);
  const idBase = useId();

  const [sitioId, setSitioId] = useState(
    sitioInicial ?? sitios[0]?.id ?? "",
  );
  const [especieId, setEspecieId] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [previas, setPrevias] = useState<string[]>([]);
  const [gps, setGps] = useState<Gps>({ estado: "buscando" });
  const [verTodas, setVerTodas] = useState(false);

  // Un identificador por formulario: si se reenvía (mala cobertura, doble
  // toque), el servidor detecta que es la misma captura y no la duplica.
  const [clienteUuid] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  );

  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);

  // El GPS se pide solo al abrir: la idea es que llegues, saques el pez y solo
  // tengas que elegir especie y peso.
  const [intentoGps, setIntentoGps] = useState(0);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGps({ estado: "no", motivo: "Este navegador no da posición." });
      return;
    }

    setGps({ estado: "buscando" });
    let resuelto = false;

    // Tope nuestro además del de la API. El `timeout` de getCurrentPosition no
    // corre mientras el navegador tiene el diálogo de permiso abierto, así que
    // sin esto el aviso puede quedarse en "buscando" para siempre. A la orilla,
    // con mala cobertura, eso pasa de verdad.
    const seAcabo = setTimeout(() => {
      if (resuelto) return;
      resuelto = true;
      setGps({ estado: "no", motivo: "El GPS no responde." });
    }, 20000);

    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (resuelto) return;
        resuelto = true;
        clearTimeout(seAcabo);
        setGps({
          estado: "ok",
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          precision: Math.round(p.coords.accuracy),
        });
      },
      (e) => {
        if (resuelto) return;
        resuelto = true;
        clearTimeout(seAcabo);
        setGps({
          estado: "no",
          motivo:
            e.code === e.PERMISSION_DENIED
              ? "Sin permiso de ubicación."
              : "No hay señal de GPS ahora mismo.",
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );

    return () => {
      resuelto = true;
      clearTimeout(seAcabo);
    };
  }, [intentoGps]);

  // Las URLs de vista previa hay que liberarlas o se acumulan en memoria.
  useEffect(() => {
    const urls = fotos.map((f) => URL.createObjectURL(f));
    setPrevias(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [fotos]);

  const sitio = sitios.find((s) => s.id === sitioId);

  // Las del sitio, en el orden que manda el servidor (por abundancia) y con
  // las que no se pueden pescar al final. Por orden alfabético lo primero que
  // te ofrecía era la anguila, que está prohibida: mal sitio para el pulgar.
  const delSitio = (sitio?.especiesIds ?? [])
    .map((id) => especies.find((e) => e.id === id))
    .filter((e): e is EspecieOpcion => Boolean(e))
    .sort(
      (a, b) =>
        Number(NO_SE_PUEDEN_PESCAR.has(a.estadoLegal)) -
        Number(NO_SE_PUEDEN_PESCAR.has(b.estadoLegal)),
    );

  const resto = especies.filter((e) => !sitio?.especiesIds.includes(e.id));
  const mostradas = verTodas ? [...delSitio, ...resto] : delSitio;

  // Las fotos van en una acción de servidor, y Next limita el cuerpo de esas
  // peticiones. Si se pasa, la rechaza con un 413 en la capa de transporte:
  // el formulario nunca llega a ejecutarse y el usuario ve una pantalla de
  // error en blanco. Por eso se comprueba aquí antes de enviar nada.
  const [avisoFotos, setAvisoFotos] = useState<string | null>(null);

  function anadirFotos(lista: FileList | null) {
    if (!lista) return;
    const nuevas = Array.from(lista);

    const grande = nuevas.find((f) => f.size > TAMANO_MAXIMO_BYTES);
    if (grande) {
      setAvisoFotos(mensajeDemasiadoGrande(grande.name));
      return;
    }

    setFotos((previas) => {
      const juntas = [...previas, ...nuevas].slice(0, 6);
      const total = juntas.reduce((suma, f) => suma + f.size, 0);
      if (total > TAMANO_TOTAL_MAXIMO_BYTES) {
        setAvisoFotos(mensajeEnvioDemasiadoGrande());
        return previas;
      }
      setAvisoFotos(null);
      return juntas;
    });
  }

  return (
    <form action={accion} className="space-y-7">
      <input type="hidden" name="clienteUuid" value={clienteUuid} />
      <input type="hidden" name="fecha" defaultValue={inicial.fecha} />
      <input type="hidden" name="hora" defaultValue={inicial.hora} />
      {gps.estado === "ok" && (
        <>
          <input type="hidden" name="latitud" value={gps.lat} />
          <input type="hidden" name="longitud" value={gps.lon} />
        </>
      )}
      {fotos.map((f, i) => (
        <FotoAdjunta key={`${f.name}-${i}`} archivo={f} />
      ))}

      {/* --- Foto: lo primero, y a un toque de la cámara --- */}
      <section>
        <h2 className="mb-2 text-lg font-bold">Foto</h2>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => camara.current?.click()}
            className="flex min-h-touch flex-1 items-center justify-center gap-2 rounded-xl bg-acento px-4 text-lg font-bold text-acento-texto"
          >
            <IconoCamara /> Hacer foto
          </button>
          <button
            type="button"
            onClick={() => galeria.current?.click()}
            className="min-h-touch rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold"
          >
            Galería
          </button>
        </div>

        <input
          ref={camara}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => anadirFotos(e.target.files)}
        />
        <input
          ref={galeria}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => anadirFotos(e.target.files)}
        />

        {avisoFotos && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-rojo-fondo p-3 font-semibold text-rojo-texto"
          >
            {avisoFotos}
          </p>
        )}

        {previas.length > 0 && (
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {previas.map((url, i) => (
              <li key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  aria-label={`Quitar la foto ${i + 1}`}
                  onClick={() =>
                    setFotos((f) => f.filter((_, j) => j !== i))
                  }
                  className="absolute top-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-rojo-fondo text-lg font-bold text-rojo-texto"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- Sitio --- */}
      <section>
        <label
          htmlFor={`${idBase}-sitio`}
          className="mb-2 block text-lg font-bold"
        >
          Dónde
        </label>
        <select
          id={`${idBase}-sitio`}
          name="sitioId"
          value={sitioId}
          onChange={(e) => {
            setSitioId(e.target.value);
            setEspecieId("");
          }}
          className="min-h-touch w-full rounded-xl border-2 border-borde bg-fondo-elevado px-3 text-lg"
        >
          {sitios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </section>

      {/* --- Especie: botones grandes, las del sitio primero --- */}
      <section>
        <h2 className="mb-2 text-lg font-bold">Qué has pescado</h2>
        <input type="hidden" name="especieId" value={especieId} />

        <ul className="grid grid-cols-2 gap-2">
          {mostradas.map((e) => {
            const elegida = especieId === e.id;
            const noPescable = NO_SE_PUEDEN_PESCAR.has(e.estadoLegal);
            return (
              <li key={e.id}>
                <button
                  type="button"
                  aria-pressed={elegida}
                  onClick={() => setEspecieId(e.id)}
                  className={`min-h-touch w-full rounded-xl border-2 px-3 py-2 text-left font-semibold leading-tight ${
                    elegida
                      ? "border-acento bg-acento text-acento-texto"
                      : noPescable
                        ? "border-borde bg-rojo-fondo text-rojo-texto"
                        : "border-borde bg-fondo-elevado"
                  }`}
                >
                  {e.nombre}
                  {noPescable && (
                    <span className="mt-0.5 block text-xs font-bold">
                      No se puede pescar
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {!verTodas && resto.length > 0 && (
          <button
            type="button"
            onClick={() => setVerTodas(true)}
            className="mt-2 min-h-touch font-semibold text-acento underline underline-offset-2"
          >
            No está en la lista, ver las {especies.length}
          </button>
        )}
      </section>

      {/* --- Medidas --- */}
      <section className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`${idBase}-peso`}
            className="mb-2 block text-lg font-bold"
          >
            Peso (g)
          </label>
          <input
            id={`${idBase}-peso`}
            name="pesoGramos"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            placeholder="1200"
            className="min-h-touch w-full rounded-xl border-2 border-borde bg-fondo-elevado px-3 text-lg"
          />
        </div>
        <div>
          <label
            htmlFor={`${idBase}-largo`}
            className="mb-2 block text-lg font-bold"
          >
            Largo (cm)
          </label>
          <input
            id={`${idBase}-largo`}
            name="longitudCm"
            type="number"
            inputMode="decimal"
            min={1}
            step="0.5"
            placeholder="42"
            className="min-h-touch w-full rounded-xl border-2 border-borde bg-fondo-elevado px-3 text-lg"
          />
        </div>
      </section>

      {/* --- Estado del GPS: informativo, nunca bloquea el guardado --- */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-[0.95rem] font-semibold ${
          gps.estado === "ok"
            ? "bg-verde-fondo text-verde-texto"
            : gps.estado === "buscando"
              ? "bg-chip-fondo text-chip-texto"
              : "bg-ambar-fondo text-ambar-texto"
        }`}
      >
        <p>
          {gps.estado === "ok" &&
            `Punto guardado, con ${gps.precision} m de margen.`}
          {gps.estado === "buscando" && "Buscando el punto exacto…"}
          {gps.estado === "no" &&
            `${gps.motivo} La captura se guarda igual, sin el punto exacto.`}
        </p>

        {gps.estado === "no" && (
          <button
            type="button"
            onClick={() => setIntentoGps((n) => n + 1)}
            className="min-h-11 shrink-0 rounded-lg border-2 border-current px-3 font-bold"
          >
            Reintentar
          </button>
        )}
      </div>

      {/* --- Lo demás, plegado: a la orilla no se rellena --- */}
      <details className="rounded-xl border border-borde bg-fondo-elevado">
        <summary className="flex min-h-touch cursor-pointer list-none items-center px-4 font-bold">
          Más detalles
        </summary>

        <div className="space-y-5 border-t border-borde p-4">
          <div>
            <label
              htmlFor={`${idBase}-aparejo`}
              className="mb-2 block font-bold"
            >
              Con qué
            </label>
            <select
              id={`${idBase}-aparejo`}
              name="aparejoId"
              className="min-h-touch w-full rounded-xl border-2 border-borde bg-fondo px-3"
            >
              <option value="">Sin especificar</option>
              {aparejos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${idBase}-tecnica`}
              className="mb-2 block font-bold"
            >
              Técnica
            </label>
            <select
              id={`${idBase}-tecnica`}
              name="tecnicaId"
              className="min-h-touch w-full rounded-xl border-2 border-borde bg-fondo px-3"
            >
              <option value="">Sin especificar</option>
              {tecnicas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`${idBase}-meteo`}
              className="mb-2 block font-bold"
            >
              Tiempo que hacía
            </label>
            <input
              id={`${idBase}-meteo`}
              name="condicionesMeteo"
              type="text"
              placeholder="Nublado, poniente flojo"
              className="min-h-touch w-full rounded-xl border-2 border-borde bg-fondo px-3"
            />
          </div>

          <div>
            <label
              htmlFor={`${idBase}-notas`}
              className="mb-2 block font-bold"
            >
              Notas
            </label>
            <textarea
              id={`${idBase}-notas`}
              name="notas"
              rows={3}
              placeholder="Picó a media agua, junto a los troncos"
              className="w-full rounded-xl border-2 border-borde bg-fondo p-3"
            />
          </div>
        </div>
      </details>

      <label className="flex min-h-touch items-center gap-3 rounded-xl border-2 border-borde bg-fondo-elevado px-4 font-semibold">
        <input
          type="checkbox"
          name="liberado"
          defaultChecked
          className="h-6 w-6 accent-[var(--acento)]"
        />
        Lo he devuelto al agua
      </label>

      {estado?.error && (
        <p
          role="alert"
          className="rounded-xl bg-rojo-fondo px-4 py-3 font-semibold text-rojo-texto"
        >
          {estado.error}
        </p>
      )}

      {!especieId && (
        <p className="text-center text-texto-suave">
          Elige la especie para poder guardar.
        </p>
      )}

      <BotonGuardar />
    </form>
  );
}

/**
 * Los `File` elegidos no viven en ningún input del formulario (se guardan en
 * estado para poder quitarlos), así que se vuelcan a inputs ocultos usando
 * DataTransfer, que es la única forma de fijar `files` por código.
 */
function FotoAdjunta({ archivo }: { archivo: File }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const dt = new DataTransfer();
    dt.items.add(archivo);
    ref.current.files = dt.files;
  }, [archivo]);

  return <input ref={ref} type="file" name="fotos" className="sr-only" />;
}

function IconoCamara() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5h3.5L8 6h8l1.5 2.5H21V19H3Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}
