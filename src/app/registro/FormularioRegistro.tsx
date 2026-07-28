"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LONGITUD_MINIMA_CONTRASENA } from "@/lib/validaciones";
import { registrarse, type EstadoRegistro } from "./actions";

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-touch w-full rounded-xl bg-acento px-6 text-lg font-bold text-acento-texto disabled:opacity-60"
    >
      {pending ? "Creando la cuenta…" : "Crear cuenta"}
    </button>
  );
}

const CLASE_CAMPO =
  "min-h-touch w-full rounded-xl border-2 border-borde bg-fondo-elevado px-4 text-lg text-texto";

export function FormularioRegistro() {
  const [estado, accion] = useActionState<EstadoRegistro, FormData>(
    registrarse,
    null,
  );

  // Nombre y email van controlados: React resetea el formulario al terminar la
  // acción y, si no, un fallo de contraseña obligaba a reescribirlo todo.
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");

  return (
    <form action={accion} className="space-y-5">
      <div>
        <label htmlFor="nombre" className="mb-2 block font-semibold">
          Cómo te llamas
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoComplete="nickname"
          maxLength={40}
          required
          className={CLASE_CAMPO}
        />
        <p className="mt-1 text-sm text-texto-suave">
          Es el nombre que se verá en tus capturas y en el ranking.
        </p>
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block font-semibold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          required
          className={CLASE_CAMPO}
        />
        <p className="mt-1 text-sm text-texto-suave">
          Solo se usa para entrar. No se muestra a nadie.
        </p>
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block font-semibold">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={LONGITUD_MINIMA_CONTRASENA}
          required
          className={CLASE_CAMPO}
        />
        <p className="mt-1 text-sm text-texto-suave">
          Al menos {LONGITUD_MINIMA_CONTRASENA} caracteres. Mejor tres o cuatro
          palabras sueltas que una palabra con símbolos raros.
        </p>
      </div>

      <div>
        <label htmlFor="password2" className="mb-2 block font-semibold">
          Repite la contraseña
        </label>
        <input
          id="password2"
          name="password2"
          type="password"
          autoComplete="new-password"
          required
          className={CLASE_CAMPO}
        />
      </div>

      {estado?.error && (
        <p
          role="alert"
          className="rounded-xl bg-rojo-fondo px-4 py-3 font-semibold text-rojo-texto"
        >
          {estado.error}
        </p>
      )}

      <Boton />
    </form>
  );
}
