import Script from "next/script";
import { ANALITICA } from "@/lib/analitica";

/**
 * El contador de visitas.
 *
 * Es Umami, corriendo en el propio servidor y servido desde un subdominio
 * nuestro. Se eligió así por tres motivos encadenados:
 *
 *  1. **No pone cookies.** Por eso esta web sigue sin enseñar banner de
 *     consentimiento, que hoy no enseña ninguno.
 *  2. **Y sin banner se mide a todo el mundo**, no solo a quien pulsa
 *     «aceptar». Con analítica que exige consentimiento se pierde la mitad de
 *     las visitas, y una analítica que miente a la mitad no sirve para decidir.
 *  3. **Los datos no salen del servidor.** Nadie más se entera de quién entra.
 *
 * Aun así procesa la IP para saber si dos visitas son la misma persona —la
 * guarda no, la usa para calcular un identificador que se recicla cada día—,
 * y eso es un dato personal. Va contado en el aviso legal, que es donde toca.
 *
 * Sin `UMAMI_URL` y `UMAMI_WEBSITE_ID` configurados no se envía absolutamente
 * nada al navegador. Es lo que hace que esto se pueda tener en el repositorio
 * sin que un desarrollo local le meta visitas falsas a las estadísticas.
 */
export function Analitica() {
  if (!ANALITICA) return null;

  return (
    <Script
      // `defer` y no `afterInteractive`: contar una visita nunca puede
      // retrasar que se vea la página. Si el script no llega, no pasa nada.
      defer
      src={`${ANALITICA.url}/script.js`}
      data-website-id={ANALITICA.idWeb}
      // Sin esto, Umami cuenta también lo que se navega desde el panel de
      // administración, que es tráfico nuestro y ensucia el recuento.
      data-exclude-search="true"
    />
  );
}
