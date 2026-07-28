"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LONGITUD_MINIMA_CONTRASENA } from "@/lib/validaciones";
import {
  borrarCuenta,
  cambiarContrasena,
  type EstadoCuenta,
} from "./acciones";

const CAMPO =
  "min-h-touch w-full rounded-xl border-2 border-borde bg-fondo-elevado px-4 text-lg text-texto";

function Aviso({ estado }: { estado: EstadoCuenta }) {
  if (!estado) return null;
  const esError = "error" in estado;
  return (
    <p
      role={esError ? "alert" : "status"}
      className={`rounded-xl px-4 py-3 font-semibold ${
        esError
          ? "bg-rojo-fondo text-rojo-texto"
          : "bg-verde-fondo text-verde-texto"
      }`}
    >
      {esError ? estado.error : estado.ok}
    </p>
  );
}

function Boton({
  texto,
  cargando,
  peligro = false,
}: {
  texto: string;
  cargando: string;
  peligro?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`min-h-touch w-full rounded-xl px-6 font-bold disabled:opacity-60 ${
        peligro
          ? "border-2 border-rojo-texto/40 bg-rojo-fondo text-rojo-texto"
          : "bg-acento text-acento-texto"
      }`}
    >
      {pending ? cargando : texto}
    </button>
  );
}

export function CambiarContrasena() {
  const [estado, accion] = useActionState<EstadoCuenta, FormData>(
    cambiarContrasena,
    null,
  );

  return (
    <form action={accion} className="space-y-4">
      <div>
        <label htmlFor="actual" className="mb-2 block font-semibold">
          Contraseña actual
        </label>
        <input
          id="actual"
          name="actual"
          type="password"
          autoComplete="current-password"
          required
          className={CAMPO}
        />
      </div>
      <div>
        <label htmlFor="nueva" className="mb-2 block font-semibold">
          Contraseña nueva
        </label>
        <input
          id="nueva"
          name="nueva"
          type="password"
          autoComplete="new-password"
          minLength={LONGITUD_MINIMA_CONTRASENA}
          required
          className={CAMPO}
        />
      </div>
      <div>
        <label htmlFor="nueva2" className="mb-2 block font-semibold">
          Repite la nueva
        </label>
        <input
          id="nueva2"
          name="nueva2"
          type="password"
          autoComplete="new-password"
          required
          className={CAMPO}
        />
      </div>

      <Aviso estado={estado} />
      <Boton texto="Cambiar contraseña" cargando="Cambiando…" />
    </form>
  );
}

export function BorrarCuenta() {
  const [estado, accion] = useActionState<EstadoCuenta, FormData>(
    borrarCuenta,
    null,
  );
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="min-h-touch rounded-xl border-2 border-rojo-texto/40 bg-rojo-fondo px-5 font-bold text-rojo-texto"
      >
        Quiero borrar mi cuenta
      </button>
    );
  }

  return (
    <form action={accion} className="space-y-4">
      <p className="rounded-xl bg-rojo-fondo px-4 py-3 leading-relaxed text-rojo-texto">
        Se borra la cuenta, todas tus capturas y todas tus fotos. No se puede
        deshacer y no guardamos ninguna copia.
      </p>

      <div>
        <label htmlFor="password" className="mb-2 block font-semibold">
          Tu contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={CAMPO}
        />
      </div>

      <div>
        <label htmlFor="confirmacion" className="mb-2 block font-semibold">
          Escribe BORRAR para confirmar
        </label>
        <input
          id="confirmacion"
          name="confirmacion"
          type="text"
          autoCapitalize="characters"
          autoComplete="off"
          required
          className={CAMPO}
        />
      </div>

      <Aviso estado={estado} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Boton texto="Borrar mi cuenta" cargando="Borrando…" peligro />
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="min-h-touch rounded-xl border-2 border-borde bg-fondo-elevado px-5 font-bold"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
