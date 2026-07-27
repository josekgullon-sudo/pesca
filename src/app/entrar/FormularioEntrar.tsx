"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { entrar, type EstadoLogin } from "./actions";

function BotonEntrar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-touch w-full rounded-xl bg-acento px-6 text-lg font-bold text-acento-texto disabled:opacity-60"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export function FormularioEntrar() {
  const [estado, accion] = useActionState<EstadoLogin, FormData>(entrar, null);

  // El email va controlado a propósito. React resetea el formulario cuando
  // termina una acción, así que con un input normal se borraría también el
  // email cada vez que fallas la contraseña, y reescribirlo en el móvil con
  // el sol de frente es justo lo que no queremos.
  const [email, setEmail] = useState("");

  return (
    <form action={accion} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-base font-semibold text-texto"
        >
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
          className="min-h-touch w-full rounded-xl border-2 border-borde bg-fondo-elevado px-4 text-lg text-texto"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-base font-semibold text-texto"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          // Tras un fallo, el cursor vuelve solo a la contraseña.
          autoFocus={Boolean(estado?.error)}
          required
          className="min-h-touch w-full rounded-xl border-2 border-borde bg-fondo-elevado px-4 text-lg text-texto"
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

      <BotonEntrar />
    </form>
  );
}
