/** Textos legales y sanitarios que se repiten por toda la app. */

/**
 * Aviso obligatorio: va en el pie de página y en cada ficha de sitio.
 * No lo edites sin querer: es el único descargo de responsabilidad de la app.
 */
export const AVISO_LEGAL_PERMANENTE =
  "La información legal de esta aplicación es orientativa y puede quedar " +
  "desactualizada. Consulta siempre la orden de vedas vigente en el Portal de " +
  "Caza y Pesca de la Junta de Andalucía antes de salir a pescar. Es " +
  "obligatorio llevar licencia de pesca continental en vigor y seguro de " +
  "responsabilidad civil.";

export const URL_PORTAL_CAZA_Y_PESCA =
  "https://www.juntadeandalucia.es/organismos/sostenibilidadmedioambienteyeconomiaazul/areas/flora-fauna-silvestres/caza-pesca.html";

/** Fecha a la que están contrastados los datos legales del seed. */
export const FECHA_DATOS_LEGALES = "julio de 2026";

/**
 * Aguas de la provincia de Sevilla donde SÍ se pueden pescar las especies
 * exóticas invasoras catalogadas (black bass, lucio, carpa común y trucha
 * arcoíris). Fuera de ellas es obligatorio sacrificar la captura.
 */
export const TEXTO_AREAS_DELIMITADAS_EEI =
  "Embalses de Cazalla de la Sierra, Huesna, El Pintado, José Torán, Los " +
  "Molinos de Castilblanco de los Arroyos, La Minilla, Cala, Gergal, Puebla " +
  "de Cazalla, Torre del Águila, y embalse y contraembalse del Agrio. Tramo " +
  "del río Viar desde la presa de Melonares hasta Cantillana. Tramo del " +
  "Guadalquivir entre las presas de Cantillana y Alcalá del Río. Canal de " +
  "Alfonso XIII.";

export const AVISO_FUERA_DE_AREA_DELIMITADA =
  "Este sitio NO está dentro de las áreas delimitadas para especies exóticas " +
  "invasoras. Si capturas black bass, lucio, carpa común o trucha arcoíris " +
  "aquí, hay obligación de sacrificarlos y no devolverlos al agua.";

/**
 * Lo que se dice de un sitio cuyo estado EEI no ha comprobado nadie todavía.
 *
 * No es lo mismo «no está en el listado» que «no lo hemos mirado», aunque en
 * la base de datos las dos cosas empiecen siendo un false. La primera manda
 * sacrificar el pez; la segunda no manda nada. Confundirlas es la forma más
 * fácil que tiene esta web de hacer daño de verdad.
 */
/**
 * Lo que se dice en una provincia publicada de la que todavía no tenemos el
 * listado de áreas delimitadas.
 *
 * Publicar así es una decisión legítima —las fichas valen igual para saber
 * dónde están los embalses, cómo se llega y qué hay— pero con una condición
 * innegociable: que la web lo diga. Si se calla, el visitante lee el silencio
 * como «no está en área delimitada», y esa es justo la respuesta que obliga a
 * sacrificar el pez. Por eso este aviso va arriba del todo y no en el pie.
 */
export const TITULO_EEI_PROVINCIA_SIN_LISTADO =
  "Ojo: no tenemos el listado de áreas para especies invasoras de esta provincia";

export const AVISO_EEI_PROVINCIA_SIN_LISTADO =
  "En Andalucía, el black bass, el lucio, la carpa común y la trucha arcoíris " +
  "solo se pueden devolver al agua dentro de unas aguas concretas —las áreas " +
  "delimitadas—. Fuera de ellas hay obligación de sacrificarlos. Ese listado " +
  "va por provincia, sale de la orden de vedas y todavía no lo hemos " +
  "contrastado para esta: no sabemos cuáles de estos embalses están dentro y " +
  "cuáles no, y no vamos a suponerlo. Todo lo demás de la guía sirve igual, " +
  "pero antes de decidir qué haces con uno de esos cuatro peces, míralo en el " +
  "boletín oficial.";

export const AVISO_EEI_SIN_COMPROBAR =
  "Todavía no hemos comprobado si este sitio está dentro de las áreas " +
  "delimitadas para especies exóticas invasoras. Míralo en la orden de vedas " +
  "antes de decidir qué hacer con un black bass, un lucio, una carpa común o " +
  "una trucha arcoíris: de eso depende si se devuelve al agua o hay " +
  "obligación de sacrificarlo.";

/**
 * Las abundancias y probabilidades de captura del seed son una estimación de
 * partida, no un dato oficial. Se afinan solas a medida que registramos capturas.
 */
export const AVISO_ABUNDANCIAS_ESTIMADAS =
  "Las abundancias y probabilidades son una estimación inicial nuestra, no un " +
  "censo oficial. Se irán ajustando con lo que registremos en el diario.";

/** Las coordenadas del seed son aproximadas (centro de la lámina de agua o del tramo). */
export const AVISO_COORDENADAS_APROXIMADAS =
  "Coordenadas aproximadas: sitúan la lámina de agua o el tramo, no el punto " +
  "exacto de aparcamiento. Comprueba el acceso antes de ir.";
