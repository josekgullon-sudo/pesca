"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENTIMIENTO,
  DIAS_CONSENTIMIENTO,
  type Consentimiento,
} from "@/lib/consentimiento-comun";

/**
 * Banner de cookies.
 *
 * Los dos botones son iguales a propósito: mismo tamaño, mismo peso, misma
 * prominencia. Poner un «Aceptar» grande y verde junto a un «Configurar» en
 * gris pequeño es el patrón que la AEPD sanciona, y es lo que hace media
 * internet española.
 *
 * Se recarga la página al decidir para que el servidor vuelva a montar la
 * respuesta con —o sin— el script de anuncios. Sin recargar, aceptar no
 * cargaría nada hasta la siguiente navegación.
 */
export function BannerCookies({ inicial }: { inicial: Consentimiento }) {
  const [decidido, setDecidido] = useState<boolean>(inicial !== null);
  // Se monta oculto y aparece tras hidratar: así no da un salto en la primera
  // pintura ni tapa el contenido antes de tiempo.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!decidido) setVisible(true);
  }, [decidido]);

  function decidir(valor: Exclude<Consentimiento, null>) {
    const caduca = new Date();
    caduca.setDate(caduca.getDate() + DIAS_CONSENTIMIENTO);
    document.cookie =
      `${COOKIE_CONSENTIMIENTO}=${valor}; path=/; expires=${caduca.toUTCString()}; SameSite=Lax`;
    setDecidido(true);
    setVisible(false);
    // Recarga para que el servidor decida de nuevo qué scripts envía.
    window.location.reload();
  }

  if (decidido || !visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookies"
      // Encima de la barra de navegación inferior, que en móvil es pegajosa.
      className="fixed inset-x-0 bottom-0 z-[900] border-t-2 border-borde bg-fondo-elevado p-4 shadow-elevada md:p-6"
    >
      <div className="contenedor flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-prose">
          <p className="font-bold">Cookies de publicidad</p>
          <p className="mt-1 leading-relaxed text-texto-suave">
            Esta web se paga con anuncios, y los anuncios usan cookies para
            medir. Puedes rechazarlas y la web funciona igual: no cambia nada de
            lo que puedes ver ni hacer.{" "}
            <Link
              href="/aviso-legal"
              className="font-semibold text-acento underline underline-offset-2"
            >
              Qué se guarda exactamente
            </Link>
            .
          </p>
        </div>

        {/* Mismo tamaño y mismo peso los dos. No es estética: rechazar tiene
            que costar lo mismo que aceptar. */}
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => decidir("rechazado")}
            className="inline-flex min-h-touch flex-1 items-center justify-center rounded-xl border-2 border-borde bg-fondo px-6 font-bold hover:border-acento lg:flex-none"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => decidir("aceptado")}
            className="inline-flex min-h-touch flex-1 items-center justify-center rounded-xl border-2 border-acento bg-acento px-6 font-bold text-acento-texto hover:brightness-110 lg:flex-none"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Enlace del pie para cambiar de opinión. Borra la cookie y recarga, con lo
 * que el banner vuelve a salir.
 */
export function CambiarCookies() {
  return (
    <button
      type="button"
      onClick={() => {
        document.cookie = `${COOKIE_CONSENTIMIENTO}=; path=/; max-age=0; SameSite=Lax`;
        window.location.reload();
      }}
      className="underline underline-offset-2 hover:text-acento"
    >
      Cambiar preferencias de cookies
    </button>
  );
}
