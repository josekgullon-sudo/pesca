import Script from "next/script";
import { consentimientoActual, hayQuePreguntar, ID_ADSENSE } from "@/lib/consentimiento";

/**
 * El script de AdSense.
 *
 * No se envía al navegador hasta que hay consentimiento explícito. Esa es la
 * parte que importa: la ley no se cumple avisando de que usas cookies, sino no
 * poniéndolas hasta que te dicen que sí. Como la decisión viaja en una cookie
 * que lee el servidor, sin ella este componente no pinta absolutamente nada y
 * el navegador nunca llega a pedirle nada a Google.
 *
 * Sin ADSENSE_ID configurado tampoco se pinta, así que la web funciona igual
 * mientras no haya cuenta de anuncios.
 */
export async function Anuncios() {
  if (!hayQuePreguntar()) return null;
  if ((await consentimientoActual()) !== "aceptado") return null;

  return (
    <Script
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ID_ADSENSE}`}
      crossOrigin="anonymous"
    />
  );
}
