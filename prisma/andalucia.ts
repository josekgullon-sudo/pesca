/**
 * Las provincias andaluzas que todavía son un armazón.
 *
 * Cádiz salió de aquí: está trabajada al nivel de Sevilla y vive en
 * `cadiz.ts`. **Córdoba y Jaén también han salido, aunque sigan en este
 * fichero**: las dos tienen su listado de áreas delimitadas comprobado, ficha
 * de especies propia embalse por embalse, y se publican al sembrar. Lo que
 * dice este comentario vale para las otras CUATRO: Huelva, Málaga, Granada y
 * Almería.
 *
 * **Ninguna de esas cuatro se publica al sembrar.** Esto es un armazón,
 * no una guía terminada, y hay que saber qué fiabilidad tiene cada cosa antes
 * de tocarla:
 *
 *  - **Nombres, municipios y a qué río pertenece cada embalse**: sólido. Son
 *    datos estables que no dependen de ninguna temporada.
 *  - **Coordenadas**: aproximadas, como las de Sevilla. Sitúan la lámina de
 *    agua, no el punto donde se aparca. La web ya lo avisa en cada mapa.
 *  - **Capacidades**: van a null a propósito. Una cifra a ojo aquí no aporta
 *    nada y ensucia una ficha que por lo demás es honesta.
 *  - **Especies y abundancias**: composición típica de embalse andaluz de
 *    interior, como punto de partida. Es una estimación, y la web lo dice en
 *    todas las fichas.
 *  - **Áreas delimitadas para especies exóticas invasoras**: SIN COMPROBAR,
 *    todas. Por eso cada sitio lleva `eeiComprobado: false`.
 *
 * Ese último punto es el que manda. El listado de aguas donde sí se pueden
 * pescar black bass, lucio, carpa común y trucha arcoíris sale de la orden de
 * vedas y cambia de una provincia a otra; de él depende si un pez se devuelve
 * al agua o hay obligación de sacrificarlo. No se deduce, no se copia de
 * Sevilla y no se inventa: se lee del boletín. Mientras no se haga, cada ficha
 * dice que no lo sabemos y `guardarProvincia` no deja publicar.
 *
 * Para terminar una provincia, en /admin/provincias:
 *   1. Pegar su listado de áreas delimitadas, literal de la orden de vedas.
 *   2. Marcar sitio por sitio si aparece en él.
 *   3. Entonces, y solo entonces, se puede marcar «publicada».
 */

type Prob = "alta" | "media" | "baja";

export type SitioAndalucia = {
  slug: string;
  provincia: string;
  nombre: string;
  tipo: "embalse" | "rio" | "canal";
  municipio: string;
  latitud: number;
  longitud: number;
  descripcion: string;
  capacidadHm3: number | null;
  accesoDescripcion: string;
  dificultadAcceso: "facil" | "media" | "dificil";
  tieneSombra: boolean;
  navegable: boolean;
  esAreaDelimitadaEEI: boolean;
  eeiComprobado: boolean;
  notasLegales: string;
  avisosSanitarios: string;
  mejorEpoca: number[];
  urlNivelAgua: string | null;
  /**
   * Cómo se llama en el boletín hidrológico, si no se llama igual que aquí.
   *
   * Solo hace falta cuando el emparejamiento automático no acierta: nombres
   * que allí llevan un romano detrás, o complejos de presas comunicadas que
   * hay que sumar escribiendo «A + B». Lo normal es dejarlo sin poner.
   */
  nombreEnBoletin?: string;
};

const PRIMAVERA_Y_OTONO = [3, 4, 5, 6, 9, 10, 11];
const TEMPORADA_LARGA = [3, 4, 5, 6, 7, 8, 9, 10];

/** Lo que se le dice a la gente en un sitio del que aún no sabemos el estado EEI. */
const SIN_COMPROBAR = "";

/** Casi todos los de esta tanda son embalses de interior sin arbolado en orilla. */
const SOL_Y_AGUA =
  "Orillas abiertas y con poca sombra buena parte del año: gorra, crema y " +
  "agua de sobra de mayo a septiembre.";

const ORILLA_CON_PENDIENTE =
  "Bajadas a la orilla con pendiente y piedra suelta. Calzado con suela " +
  "agarrada, y mejor no ir solo si vas a bajar a la lámina.";

const NIVEL_VARIABLE =
  "Es un embalse de regulación: el nivel sube y baja mucho a lo largo del " +
  "año y los puestos cambian por completo. Comprueba el nivel antes de " +
  "hacer kilómetros.";

// ---------------------------------------------------------------------------
// Áreas delimitadas para especies exóticas invasoras · Córdoba
// ---------------------------------------------------------------------------
//
// En Córdoba la delimitación no coincide entre especies, y encima tres de los
// embalses llevan condición propia. Un solo «sí, es área delimitada» por sitio
// no sirve: diría que en Sierra Boyera un lucio se puede devolver al agua, y
// lo que hay es obligación de sacarlo y sacrificarlo.
//
// Black bass: Yeguas, Martín Gonzalo, Guadalmellato, Sierra Boyera, Puente
// Nuevo, La Breña II, Vadomojón, Arenoso, San Rafael de Navallana y Bembézar
// (los dos últimos fuera de su Refugio de Pesca) e Iznájar (con las medidas
// excepcionales que correspondan).
// Lucio: Puente Nuevo, La Breña II, Guadalmellato y San Rafael de Navallana.
// Trucha arcoíris: ninguna masa de agua de Córdoba. Solo cotos autorizados.
//
// Fuente: Resolución de 19 de diciembre de 2019 y Orden de 13 de enero de 2023.

/** La trucha arcoíris no tiene área en Córdoba, así que esto vale para los siete. */
const CO_TRUCHA =
  " La trucha arcoíris no tiene ninguna área en Córdoba: solo se devuelve en " +
  "cotos autorizados de trucha, y este no lo es.";

/** Los tres donde también está delimitado el lucio. */
const CO_BASS_Y_LUCIO =
  "Está dentro del área delimitada para black bass y para lucio: los dos se " +
  "pueden pescar y devolver al agua." + CO_TRUCHA;

/** Delimitado solo para black bass. Un lucio aquí hay que sacrificarlo. */
const CO_SOLO_BASS =
  "Está dentro del área delimitada para black bass: se puede pescar y " +
  "devolver al agua. El lucio no —en Córdoba solo está delimitado en Puente " +
  "Nuevo, La Breña II, Guadalmellato y San Rafael de Navallana—, así que si " +
  "cae uno hay que sacarlo del agua y sacrificarlo." + CO_TRUCHA;

/** Bembézar: el área del bass excluye la zona declarada Refugio de Pesca. */
const CO_BEMBEZAR =
  "Está dentro del área delimitada para black bass, PERO fuera de la zona " +
  "declarada Refugio de Pesca del embalse: dentro del refugio no vale. El " +
  "lucio no está delimitado aquí, así que si cae uno hay que sacarlo del agua " +
  "y sacrificarlo. En el refugio hay además limitaciones propias que afectan " +
  "también a la carpa: mira dónde estás antes de tirar." + CO_TRUCHA;

/** Iznájar: delimitado, pero la propia resolución lo deja condicionado. */
const CO_IZNAJAR =
  "Está dentro del área delimitada para black bass, sujeto a los " +
  "condicionantes y medidas excepcionales que correspondan, así que conviene " +
  "mirar la orden vigente antes de ir. El lucio no está delimitado aquí: si " +
  "cae uno hay que sacarlo del agua y sacrificarlo." + CO_TRUCHA;

/**
 * La Colada, que no sale en ninguna de las listas.
 *
 * Es el sitio donde más importa no callarse. En los otros seis la duda juega a
 * favor del pez; aquí la respuesta es la contraria y hay que decirla entera.
 */
const CO_FUERA_DE_AREA =
  "NO está dentro de ninguna de las áreas delimitadas de Córdoba. Si capturas " +
  "black bass, lucio o trucha arcoíris aquí, hay obligación de sacarlos del " +
  "agua y sacrificarlos: no se pueden devolver.";

/**
 * Lo que hay que saber antes de mojar el sedal en Córdoba. Va aparte de la
 * descripción porque no es geografía.
 */
export const NOTAS_LEGALES_CORDOBA =
  "Córdoba se rige por la orden de vedas de pesca continental de Andalucía. " +
  "Es obligatorio llevar licencia de pesca continental andaluza en vigor. " +
  "Varios embalses del norte están dentro de espacios protegidos de Sierra " +
  "Morena —Hornachuelos, Cardeña y Montoro— con normativa propia de acceso, " +
  "circulación y acampada además de la de pesca. Y hay refugios de pesca " +
  "declarados en Cordobilla, Malpasillo, Bembézar y una zona de San Rafael de " +
  "Navallana: dentro de un refugio no se pesca, y sus límites no coinciden " +
  "con los del embalse.";

export const AREAS_DELIMITADAS_EEI_CORDOBA =
  "Black bass: embalses de Yeguas, Martín Gonzalo, Guadalmellato, Sierra " +
  "Boyera, Puente Nuevo, La Breña II, Vadomojón, Arenoso, San Rafael de " +
  "Navallana y Bembézar —estos dos, fuera de su zona declarada Refugio de " +
  "Pesca— e Iznájar, con los condicionantes y medidas excepcionales que " +
  "correspondan. Lucio: solo Puente Nuevo, La Breña II, Guadalmellato y San " +
  "Rafael de Navallana, este último fuera del refugio. Carpa común: las masas " +
  "y cursos de agua continentales donde esté presente, siempre que no sean " +
  "aguas trucheras ni refugios de pesca; en Córdoba hay refugio en Cordobilla, " +
  "Malpasillo, Bembézar y una zona de San Rafael de Navallana. Trucha " +
  "arcoíris: ninguna masa de agua de la provincia, solo los cotos de trucha " +
  "arcoíris autorizados. Fuera de esas zonas, los ejemplares capturados no se " +
  "pueden devolver al agua: hay que extraerlos y sacrificarlos en el momento. " +
  "Según la Resolución de 19 de diciembre de 2019 y la Orden de 13 de enero " +
  "de 2023.";

// ---------------------------------------------------------------------------
// Áreas delimitadas para especies exóticas invasoras · Jaén
// ---------------------------------------------------------------------------
//
// Black bass: Tranco de Beas, Guadalén, El Dañador, Giribaile, Guadalmena,
// La Fernandina (Panzacola), Rumblar, Zocueca, Encinarejo, Jándula y Víboras.
// Lucio: Guadalmena, La Fernandina, Giribaile, Zocueca y Rumblar.
// Trucha arcoíris: ver el aviso de abajo. Es el caso delicado de esta
// provincia.
//
// De los seis embalses de esta guía, DOS no salen en ninguna lista: La Bolera
// y Quiebrajano. Ahí la respuesta es la contraria y hay que decirla entera.
//
// Fuente: Resolución de 19 de diciembre de 2019 y Orden de 13 de enero de 2023.

/**
 * La trucha arcoíris en Jaén, que es donde más fácil es equivocarse.
 *
 * La resolución de 2019 recoge una lista de aguas de Jaén donde hubo sueltas
 * de trucha arcoíris antes de 2007 —La Bolera, Peralta, La Toba, Cañamares y
 * más—. Esa lista sigue publicada, y leerla sin la orden al lado lleva a la
 * conclusión contraria a la correcta: que en esas aguas se puede pescar.
 *
 * La orden vigente solo permite pescarla en los cotos de trucha arcoíris de su
 * Anexo II, y **en Jaén no hay ninguno**. Así que en toda la provincia una
 * trucha arcoíris capturada hay que sacarla del agua y sacrificarla, salga
 * donde salga.
 */
const JA_TRUCHA =
  " Y con la trucha arcoíris, ojo: en Jaén NO hay ningún coto autorizado, así " +
  "que si cae una hay que sacarla del agua y sacrificarla. Hay listas antiguas " +
  "de aguas donde se soltó trucha arcoíris hace veinte años que siguen " +
  "publicadas y se leen al revés de lo que dicen: aquello era dónde se soltó, " +
  "no dónde se puede pescar.";

/** Giribaile y Rumblar: delimitados para las dos. */
const JA_BASS_Y_LUCIO =
  "Está dentro del área delimitada para black bass y para lucio: los dos se " +
  "pueden pescar y devolver al agua." + JA_TRUCHA;

/** Delimitado solo para black bass. Un lucio aquí hay que sacrificarlo. */
const JA_SOLO_BASS =
  "Está dentro del área delimitada para black bass: se puede pescar y " +
  "devolver al agua. El lucio no —en Jaén solo está delimitado en Giribaile, " +
  "Rumblar, Guadalmena, La Fernandina y Zocueca—, así que si cae uno hay que " +
  "sacarlo del agua y sacrificarlo." + JA_TRUCHA;

/** El Tranco, que además está metido en el parque natural. */
const JA_TRANCO =
  "Está dentro del área delimitada para black bass: se puede pescar y " +
  "devolver al agua. El lucio no está delimitado aquí: si cae uno hay que " +
  "sacarlo del agua y sacrificarlo. Y estás dentro del parque natural de " +
  "Cazorla, Segura y Las Villas, donde muchos tramos de río son aguas " +
  "trucheras o refugios de pesca con sus propias reglas: mira en qué agua " +
  "estás exactamente antes de tirar." + JA_TRUCHA;

/**
 * Los dos que no salen en ninguna lista.
 *
 * Es donde más importa no callarse: en los otros cuatro la duda juega a favor
 * del pez, y aquí la respuesta es la contraria.
 */
const JA_FUERA_DE_AREA =
  "NO está dentro de ninguna de las áreas delimitadas de Jaén. Si capturas " +
  "black bass, lucio o trucha arcoíris aquí, hay obligación de sacarlos del " +
  "agua y sacrificarlos: no se pueden devolver.";

/** La Bolera, que además sale en la lista vieja de sueltas de trucha. */
const JA_BOLERA =
  JA_FUERA_DE_AREA +
  " Cuidado con lo que se lee por ahí de este embalse: aparece en la lista de " +
  "aguas donde se soltó trucha arcoíris antes de 2007, y eso no es lo mismo " +
  "que estar autorizado. En Jaén no hay ningún coto de trucha arcoíris, así " +
  "que aquí tampoco se puede devolver. Estás además en el entorno del parque " +
  "natural de Cazorla, Segura y Las Villas, con tramos que son aguas trucheras " +
  "o refugios de pesca.";

/** Lo que hay que saber antes de mojar el sedal en Jaén. */
export const NOTAS_LEGALES_JAEN =
  "Jaén se rige por la orden de vedas de pesca continental de Andalucía. Es " +
  "obligatorio llevar licencia de pesca continental andaluza en vigor. Media " +
  "provincia está dentro o en el entorno del parque natural de Cazorla, Segura " +
  "y Las Villas, que tiene normativa propia de acceso, circulación y acampada. " +
  "Y es la provincia con más aguas trucheras y refugios de pesca de Andalucía: " +
  "hay tramos declarados en el Guadalquivir, el Guadalentín, el Segura, el " +
  "Zumeta y el Madera, entre otros. Dentro de un refugio no se pesca, y sus " +
  "límites no coinciden con los del embalse ni con los del pueblo.";

export const AREAS_DELIMITADAS_EEI_JAEN =
  "Black bass: embalses de El Tranco de Beas, Guadalén, El Dañador, Giribaile, " +
  "Guadalmena, La Fernandina (Panzacola), Rumblar, Zocueca, Encinarejo, " +
  "Jándula y Víboras. Lucio: solo Guadalmena, La Fernandina (Panzacola), " +
  "Giribaile, Zocueca y Rumblar. Carpa común: las masas y cursos de agua " +
  "continentales de Andalucía donde esté presente, siempre que no sean aguas " +
  "trucheras ni refugios de pesca; en Jaén eso excluye buena parte de la " +
  "sierra de Cazorla, Segura y Las Villas. Trucha arcoíris: NINGUNA. La orden " +
  "vigente solo la permite en los cotos de trucha arcoíris de su Anexo II y en " +
  "Jaén no hay ninguno, así que en toda la provincia hay que sacrificarla. " +
  "Circula una lista de la resolución de 2019 con aguas de Jaén donde se " +
  "soltó trucha arcoíris antes de 2007 —La Bolera, Peralta, La Toba, " +
  "Cañamares y otras—: eso es dónde se soltó, no dónde se puede pescar. Fuera " +
  "de las zonas delimitadas, los ejemplares capturados no se pueden devolver " +
  "al agua: hay que extraerlos y sacrificarlos en el momento. Según la " +
  "Resolución de 19 de diciembre de 2019 y la Orden de 13 de enero de 2023.";

export const SITIOS_ANDALUCIA: SitioAndalucia[] = [
  // -------------------------------------------------------------------------
  // Huelva
  // -------------------------------------------------------------------------
  {
    slug: "andevalo",
    provincia: "huelva",
    nombre: "Embalse del Andévalo",
    tipo: "embalse",
    municipio: "Puebla de Guzmán / El Almendro",
    latitud: 37.66,
    longitud: -7.3,
    descripcion:
      "El embalse más grande de la provincia, en pleno Andévalo onubense y a " +
      "un paso de la raya con Portugal. Lámina enorme, orillas peladas y muy " +
      "poca gente entre semana. Es sitio de jornada larga: las distancias " +
      "entre puestos se hacen a pie o en coche por pistas.",
    capacidadHm3: null,
    accesoDescripcion:
      "Se llega por las carreteras locales que salen de Puebla de Guzmán y " +
      "de El Almendro. Muchas entradas a orilla son pistas de tierra: con " +
      "coche bajo, ojo después de lluvias.",
    dificultadAcceso: "media",
    tieneSombra: false,
    navegable: true,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios: `${SOL_Y_AGUA} ${NIVEL_VARIABLE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "chanza",
    provincia: "huelva",
    nombre: "Embalse del Chanza",
    tipo: "embalse",
    municipio: "El Granado / Paymogo",
    latitud: 37.55,
    longitud: -7.42,
    descripcion:
      "Sobre el río Chanza, junto a la frontera portuguesa. Aguas amplias y " +
      "colas largas y estrechas que se meten entre lomas de monte bajo. " +
      "Zona despoblada: hay que ir con todo resuelto desde casa, incluida " +
      "el agua de beber.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde El Granado y Paymogo por carretera local hasta la presa, y " +
      "desde ahí pistas hacia las colas. Cobertura de móvil irregular.",
    dificultadAcceso: "media",
    tieneSombra: false,
    navegable: true,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios: `${SOL_Y_AGUA} ${NIVEL_VARIABLE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "aracena",
    provincia: "huelva",
    nombre: "Embalse de Aracena",
    tipo: "embalse",
    municipio: "Corteconcepción",
    latitud: 37.9,
    longitud: -6.53,
    descripcion:
      "En la sierra de Aracena, rodeado de dehesa y encinar. Agua más limpia " +
      "y fría que la de los embalses del sur de la provincia, y sombra de " +
      "verdad en varias orillas, que en Huelva no es poco. Es de " +
      "abastecimiento, así que conviene mirar si hay limitaciones de uso " +
      "antes de ir.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Corteconcepción y los caminos de la sierra. Algunas orillas " +
      "quedan dentro de fincas: respeta los cerramientos y busca los accesos " +
      "públicos.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios:
      "Al ser embalse de abastecimiento puede haber restricciones de acceso " +
      "y de navegación. Compruébalo antes de salir de casa.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "zufre",
    provincia: "huelva",
    nombre: "Embalse de Zufre",
    tipo: "embalse",
    municipio: "Zufre",
    latitud: 37.85,
    longitud: -6.34,
    descripcion:
      "Sobre el Rivera de Huelva, en el borde oriental de la sierra de " +
      "Aracena y ya casi tocando Sevilla. Encajonado, con paredones y mucha " +
      "profundidad cerca de la presa. Paisaje serrano y orillas de piedra.",
    capacidadHm3: null,
    accesoDescripcion:
      "Por la carretera que baja desde el pueblo de Zufre hacia la presa. " +
      "Las bajadas a la lámina son cortas pero empinadas.",
    dificultadAcceso: "dificil",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios: ORILLA_CON_PENDIENTE,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "piedras",
    provincia: "huelva",
    nombre: "Embalse del Piedras",
    tipo: "embalse",
    municipio: "Cartaya",
    latitud: 37.46,
    longitud: -7.13,
    descripcion:
      "El de costa, a media hora de las playas de Cartaya y Lepe. Es el más " +
      "cómodo de la provincia para una tarde suelta: se llega rápido, la " +
      "orilla es llana y no hay que hacer campo a través.",
    capacidadHm3: null,
    accesoDescripcion:
      "Salida directa desde Cartaya por carretera local. Aparcamiento fácil " +
      "cerca de varias entradas a orilla.",
    dificultadAcceso: "facil",
    tieneSombra: false,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios: SOL_Y_AGUA,
    mejorEpoca: TEMPORADA_LARGA,
    urlNivelAgua: null,
  },

  {
    slug: "jarrama",
    provincia: "huelva",
    nombre: "Embalse del Jarrama",
    tipo: "embalse",
    municipio: "Aroche / Cortegana",
    latitud: 37.9,
    longitud: -6.85,
    descripcion:
      "En el extremo occidental de la sierra de Aracena, entre Aroche y " +
      "Cortegana. Pequeño, apartado y rodeado de dehesa. No hay servicios " +
      "cerca y se pesca prácticamente solo.",
    capacidadHm3: null,
    accesoDescripcion:
      "Por los caminos que salen de la carretera entre Aroche y Cortegana. " +
      "Pistas de tierra hasta la lámina.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios:
      "Zona apartada y con cobertura de móvil irregular: avisa a alguien de " +
      "dónde vas.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },

  // -------------------------------------------------------------------------
  // Córdoba
  // -------------------------------------------------------------------------
  {
    slug: "iznajar",
    provincia: "cordoba",
    nombre: "Embalse de Iznájar",
    tipo: "embalse",
    municipio: "Iznájar",
    latitud: 37.27,
    longitud: -4.3,
    descripcion:
      "El embalse más grande de Andalucía, sobre el Genil, en el punto " +
      "donde se tocan Córdoba, Granada y Málaga. Le llaman el lago de " +
      "Andalucía y se le nota: la lámina es enorme, con brazos larguísimos " +
      "y kilómetros de orilla. Es sitio de embarcación tanto como de orilla, " +
      "y hace viento con facilidad.",
    capacidadHm3: null,
    accesoDescripcion:
      "Muchos accesos repartidos entre Iznájar, Rute y los pueblos de la " +
      "orilla granadina y malagueña. Hay zonas recreativas y embarcaderos.",
    dificultadAcceso: "facil",
    tieneSombra: false,
    navegable: true,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales: CO_IZNAJAR,
    avisosSanitarios:
      `${SOL_Y_AGUA} ${NIVEL_VARIABLE} Con viento se levanta oleaje de ` +
      "verdad: si sales en barca, mira el parte.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "la-brena-ii",
    provincia: "cordoba",
    nombre: "Embalse de La Breña II",
    tipo: "embalse",
    municipio: "Almodóvar del Río",
    latitud: 37.85,
    longitud: -5.02,
    descripcion:
      "A un paso de Córdoba capital, bajo el castillo de Almodóvar. Es de " +
      "los embalses grandes más nuevos de la cuenca del Guadalquivir y " +
      "tiene mucha profundidad. El sitio cómodo de la provincia: se llega " +
      "desde la capital en poco rato.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Almodóvar del Río por la carretera de la presa. Hay pistas " +
      "hacia varias orillas.",
    dificultadAcceso: "facil",
    tieneSombra: false,
    navegable: true,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales: CO_BASS_Y_LUCIO,
    avisosSanitarios: `${SOL_Y_AGUA} ${NIVEL_VARIABLE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "puente-nuevo",
    provincia: "cordoba",
    nombre: "Embalse de Puente Nuevo",
    tipo: "embalse",
    municipio: "Espiel / Villaviciosa de Córdoba",
    latitud: 38.13,
    longitud: -5.0,
    descripcion:
      "En pleno valle del Guadiato, en la sierra norte cordobesa. Entorno " +
      "de dehesa y monte mediterráneo, poca gente y orillas amplias. Es de " +
      "los que mejor se pescan en primavera, antes de que el nivel se venga " +
      "abajo.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde la carretera entre Espiel y Villaviciosa, con varias pistas " +
      "que bajan a la lámina.",
    dificultadAcceso: "media",
    tieneSombra: false,
    navegable: true,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales: CO_BASS_Y_LUCIO,
    avisosSanitarios: `${SOL_Y_AGUA} ${NIVEL_VARIABLE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "sierra-boyera",
    provincia: "cordoba",
    nombre: "Embalse de Sierra Boyera",
    tipo: "embalse",
    municipio: "Belmez / Peñarroya-Pueblonuevo",
    latitud: 38.3,
    longitud: -5.2,
    descripcion:
      "En el Alto Guadiato, junto a Belmez. Es de abastecimiento de la " +
      "comarca y ha pasado sequías muy duras, con la lámina reducida a " +
      "mínimos; el nivel manda aquí más que en ningún otro de la provincia.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Belmez por carretera local. Orillas llanas y fáciles cuando el " +
      "embalse está en cota; con el nivel bajo hay que caminar mucho.",
    dificultadAcceso: "facil",
    tieneSombra: false,
    navegable: false,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales: CO_SOLO_BASS,
    avisosSanitarios:
      `${SOL_Y_AGUA} ${NIVEL_VARIABLE} Con el nivel muy bajo el fondo que ` +
      "queda al descubierto es barro blando: no te fíes de la costra seca.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "guadalmellato",
    provincia: "cordoba",
    nombre: "Embalse del Guadalmellato",
    tipo: "embalse",
    municipio: "Adamuz / Villafranca de Córdoba",
    latitud: 37.98,
    longitud: -4.66,
    descripcion:
      "Al norte de Córdoba, sobre el río del mismo nombre. Lámina alargada " +
      "entre lomas de sierra, con colas estrechas y buena estructura de " +
      "piedra. Está cerca de la capital pero se pesca mucho menos que La " +
      "Breña.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Adamuz y desde la carretera de Villafranca. Pistas de tierra " +
      "hasta varias orillas.",
    dificultadAcceso: "media",
    tieneSombra: false,
    navegable: true,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales: CO_BASS_Y_LUCIO,
    avisosSanitarios: `${SOL_Y_AGUA} ${ORILLA_CON_PENDIENTE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "bembezar",
    provincia: "cordoba",
    nombre: "Embalse del Bembézar",
    tipo: "embalse",
    municipio: "Hornachuelos",
    latitud: 38.0,
    longitud: -5.28,
    descripcion:
      "En la sierra de Hornachuelos, dentro del entorno del parque natural " +
      "de la Sierra de Hornachuelos. Encajonado, con paredones y agua " +
      "limpia. De los sitios más bonitos de la provincia y de los más " +
      "incómodos de pescar desde orilla.",
    capacidadHm3: null,
    accesoDescripcion:
      "Por la carretera que sube desde Hornachuelos. Las bajadas a la " +
      "lámina son escasas y empinadas.",
    dificultadAcceso: "dificil",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales: CO_BEMBEZAR,
    avisosSanitarios:
      "Entorno de parque natural, con normativa propia de acceso. " +
      ORILLA_CON_PENDIENTE,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },

  {
    slug: "la-colada",
    provincia: "cordoba",
    nombre: "Embalse de La Colada",
    tipo: "embalse",
    municipio: "El Viso / Santa Eufemia",
    latitud: 38.42,
    longitud: -5.13,
    descripcion:
      "En Los Pedroches, al norte del todo de la provincia, sobre el río " +
      "Guadamatilla. Dehesa de encina hasta la orilla y kilómetros sin " +
      "nadie. Es de abastecimiento de la comarca y ha tenido problemas de " +
      "calidad del agua, así que conviene informarse antes de ir.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde El Viso por caminos de dehesa. Muchas fincas cerradas " +
      "alrededor: usa los accesos públicos.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: true,
    notasLegales: CO_FUERA_DE_AREA,
    avisosSanitarios:
      "Ha habido episodios de mala calidad del agua en este embalse. " +
      "Comprueba si hay avisos vigentes antes de ir, y en cualquier caso no " +
      "bebas ni te bañes.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },

  // -------------------------------------------------------------------------
  // Jaén
  // -------------------------------------------------------------------------
  {
    slug: "tranco-de-beas",
    provincia: "jaen",
    nombre: "Embalse del Tranco de Beas",
    tipo: "embalse",
    municipio: "Hornos / Santiago-Pontones",
    latitud: 38.15,
    longitud: -2.8,
    descripcion:
      "El embalse de Cazorla, en pleno parque natural de las Sierras de " +
      "Cazorla, Segura y Las Villas, sobre el Guadalquivir joven. Agua " +
      "limpia de sierra, pinar hasta la orilla y un entorno que no tiene " +
      "comparación en Andalucía. Es también uno de los más regulados: aquí " +
      "la normativa del parque pesa tanto como la de pesca.",
    capacidadHm3: null,
    accesoDescripcion:
      "Por la carretera que recorre el embalse entre Hornos y Tranco. " +
      "Varias zonas de uso público y miradores con bajada a la lámina.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: true,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales: JA_TRANCO,
    avisosSanitarios:
      "Parque natural: hay normativa propia de acceso, acampada, navegación " +
      "y fuego, aparte de la de pesca. Mírala antes de ir.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "giribaile",
    provincia: "jaen",
    nombre: "Embalse de Giribaile",
    tipo: "embalse",
    municipio: "Vilches / Úbeda",
    latitud: 38.15,
    longitud: -3.45,
    descripcion:
      "Sobre el Guadalimar, entre olivar y campiña alta. Es de los grandes " +
      "de la provincia y de los menos concurridos: mucha orilla, poca " +
      "sombra y jornadas de caminar. Tiene fama entre quien busca " +
      "depredador.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Vilches y desde los caminos de olivar de la zona. Pistas de " +
      "tierra que se ponen malas después de lluvias.",
    dificultadAcceso: "media",
    tieneSombra: false,
    navegable: true,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales: JA_BASS_Y_LUCIO,
    avisosSanitarios: `${SOL_Y_AGUA} ${NIVEL_VARIABLE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "guadalen",
    provincia: "jaen",
    nombre: "Embalse del Guadalén",
    tipo: "embalse",
    municipio: "Vilches / Santisteban del Puerto",
    latitud: 38.17,
    longitud: -3.38,
    descripcion:
      "Vecino de Giribaile, sobre el río Guadalén. Más recogido y con colas " +
      "estrechas donde se concentra el pescado cuando baja el nivel. " +
      "Campiña de olivar por todos lados.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde la carretera entre Vilches y Santisteban, con pistas hacia la " +
      "presa y las colas.",
    dificultadAcceso: "media",
    tieneSombra: false,
    navegable: false,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales: JA_SOLO_BASS,
    avisosSanitarios: `${SOL_Y_AGUA} ${NIVEL_VARIABLE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "rumblar",
    provincia: "jaen",
    nombre: "Embalse del Rumblar",
    tipo: "embalse",
    municipio: "Baños de la Encina",
    latitud: 38.15,
    longitud: -3.72,
    descripcion:
      "Bajo el castillo de Baños de la Encina, en el borde de Sierra " +
      "Morena. Es pequeño y muy accesible desde la autovía de Andalucía, " +
      "lo que lo convierte en el sitio de tarde de toda la comarca de " +
      "Linares y Bailén.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Baños de la Encina por carretera local hasta la presa. " +
      "Aparcamiento cerca de la lámina.",
    dificultadAcceso: "facil",
    tieneSombra: false,
    navegable: false,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales: JA_BASS_Y_LUCIO,
    avisosSanitarios: SOL_Y_AGUA,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "la-bolera",
    provincia: "jaen",
    nombre: "Embalse de La Bolera",
    tipo: "embalse",
    municipio: "Pozo Alcón",
    latitud: 37.75,
    longitud: -2.87,
    descripcion:
      "En la sierra de Castril, al sureste de la provincia y ya mirando a " +
      "Granada. Agua fría y clara de montaña, rodeado de pinar y con la " +
      "sierra encima. Está alto: en invierno se nota.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Pozo Alcón por la carretera de la sierra. Hay zona recreativa " +
      "junto al embalse.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: true,
    notasLegales: JA_BOLERA,
    avisosSanitarios:
      "Zona de montaña: en invierno hace frío de verdad y puede haber hielo " +
      "en la carretera a primera hora.",
    mejorEpoca: [4, 5, 6, 7, 8, 9, 10],
    urlNivelAgua: null,
  },
  {
    slug: "quiebrajano",
    provincia: "jaen",
    nombre: "Embalse del Quiebrajano",
    tipo: "embalse",
    municipio: "Jaén / Los Villares",
    latitud: 37.65,
    longitud: -3.72,
    descripcion:
      "El de la capital, metido en la sierra de Jaén por encima de Los " +
      "Villares. Encajonado entre paredes de roca, con carretera de curvas " +
      "para llegar y un paisaje de sierra sur que compensa el viaje.",
    capacidadHm3: null,
    accesoDescripcion:
      "Por la carretera de montaña que sube desde Los Villares. Curvas " +
      "cerradas y bajadas a la orilla escasas.",
    dificultadAcceso: "dificil",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: true,
    notasLegales: JA_FUERA_DE_AREA,
    avisosSanitarios: ORILLA_CON_PENDIENTE,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },

  // -------------------------------------------------------------------------
  // Granada
  // -------------------------------------------------------------------------
  {
    slug: "negratin",
    provincia: "granada",
    nombre: "Embalse del Negratín",
    tipo: "embalse",
    municipio: "Freila / Cuevas del Campo",
    latitud: 37.55,
    longitud: -2.9,
    descripcion:
      "El grande de Granada, sobre el Guadiana Menor, en pleno paisaje de " +
      "badlands del altiplano. Cárcavas de arcilla, agua muy azul y ni un " +
      "árbol: parece otro planeta. Es sitio de embarcación y de jornadas " +
      "largas, y el viento pega fuerte.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Freila y Cuevas del Campo, con embarcadero y zona de uso " +
      "público. Pistas hacia otras orillas.",
    dificultadAcceso: "media",
    tieneSombra: false,
    navegable: true,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios:
      `${SOL_Y_AGUA} Cero sombra natural: llévatela puesta. ${NIVEL_VARIABLE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "cubillas",
    provincia: "granada",
    nombre: "Embalse de Cubillas",
    tipo: "embalse",
    municipio: "Albolote / Pinos Puente",
    latitud: 37.28,
    longitud: -3.7,
    descripcion:
      "El de la capital: a menos de veinte minutos de Granada por la " +
      "autovía. Pequeño, cómodo y muy frecuentado, con zona recreativa y " +
      "orilla fácil. Es el sitio al que se va después de trabajar.",
    capacidadHm3: null,
    accesoDescripcion:
      "Salida directa desde la autovía a la altura de Albolote. " +
      "Aparcamiento y accesos señalizados.",
    dificultadAcceso: "facil",
    tieneSombra: false,
    navegable: true,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios:
      `${SOL_Y_AGUA} Mucha gente los fines de semana: si buscas tranquilidad, ` +
      "entre semana.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "canales",
    provincia: "granada",
    nombre: "Embalse de Canales",
    tipo: "embalse",
    municipio: "Güéjar Sierra",
    latitud: 37.14,
    longitud: -3.44,
    descripcion:
      "Sobre el Genil, a los pies de Sierra Nevada y con Güéjar Sierra " +
      "encima. Agua de deshielo, fría y muy clara, encajonada entre laderas " +
      "de montaña. Es de abastecimiento de Granada, así que hay que " +
      "comprobar qué está permitido.",
    capacidadHm3: null,
    accesoDescripcion:
      "Por la carretera que sube a Güéjar Sierra. Los accesos a la lámina " +
      "son pocos y con pendiente.",
    dificultadAcceso: "dificil",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios:
      "Embalse de abastecimiento en alta montaña: puede haber limitaciones " +
      `de acceso, baño y navegación. Agua muy fría todo el año. ${ORILLA_CON_PENDIENTE}`,
    mejorEpoca: [4, 5, 6, 7, 8, 9, 10],
    urlNivelAgua: null,
  },
  {
    slug: "beznar",
    provincia: "granada",
    nombre: "Embalse de Béznar",
    tipo: "embalse",
    municipio: "Lecrín / El Pinar",
    latitud: 36.9,
    longitud: -3.52,
    descripcion:
      "En el valle de Lecrín, camino de la costa, entre laderas de almendro " +
      "y naranjo. Se ve desde la autovía de Motril y se llega en un momento " +
      "desde Granada. Aguas encajonadas y bastante profundas.",
    capacidadHm3: null,
    accesoDescripcion:
      "Salida desde la autovía Granada-Motril a la altura del valle de " +
      "Lecrín. Caminos hasta varias orillas.",
    dificultadAcceso: "media",
    tieneSombra: false,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios: `${SOL_Y_AGUA} ${ORILLA_CON_PENDIENTE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "quentar",
    provincia: "granada",
    nombre: "Embalse de Quéntar",
    tipo: "embalse",
    municipio: "Quéntar",
    latitud: 37.2,
    longitud: -3.45,
    descripcion:
      "Pequeño y encajonado, sobre el río Aguas Blancas, a media hora de " +
      "Granada por la carretera de la sierra. Entorno de monte, poca gente " +
      "y agua clara.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde el pueblo de Quéntar por la carretera de la presa. Bajadas " +
      "cortas pero con pendiente.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios: ORILLA_CON_PENDIENTE,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "el-portillo",
    provincia: "granada",
    nombre: "Embalse de El Portillo",
    tipo: "embalse",
    municipio: "Castril",
    latitud: 37.83,
    longitud: -2.8,
    descripcion:
      "En la sierra de Castril, al norte de la provincia y pegado al parque " +
      "natural. Alto, frío y rodeado de pinar. Es de los sitios más " +
      "remotos de la guía y también de los más limpios.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Castril por la carretera de la sierra. Carretera de montaña, " +
      "con curvas y sin apenas servicios cerca.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios:
      "Entorno de parque natural y zona de montaña: normativa propia, frío " +
      "en invierno y cobertura de móvil irregular.",
    mejorEpoca: [4, 5, 6, 7, 8, 9, 10],
    urlNivelAgua: null,
  },

  {
    slug: "rules",
    provincia: "granada",
    nombre: "Embalse de Rules",
    tipo: "embalse",
    municipio: "Vélez de Benaudalla / Órgiva",
    latitud: 36.8,
    longitud: -3.5,
    descripcion:
      "Sobre el Guadalfeo, entre la Alpujarra y la costa de Motril. Se " +
      "cruza por encima yendo a la playa y casi nadie se para. Aguas " +
      "encajonadas entre laderas peladas, con la sierra de Lújar a un lado.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde la autovía Granada-Motril a la altura de Vélez de Benaudalla, " +
      "y por la carretera de Órgiva. Bajadas a la lámina escasas.",
    dificultadAcceso: "media",
    tieneSombra: false,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios: `${SOL_Y_AGUA} ${ORILLA_CON_PENDIENTE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },

  // -------------------------------------------------------------------------
  // Málaga
  // -------------------------------------------------------------------------
  {
    slug: "la-vinuela",
    provincia: "malaga",
    nombre: "Embalse de La Viñuela",
    tipo: "embalse",
    municipio: "La Viñuela / Periana",
    latitud: 36.87,
    longitud: -4.13,
    descripcion:
      "El más grande de Málaga, en la Axarquía, con la sierra de Tejeda al " +
      "fondo y olivar y almendro alrededor. Orillas amplias y llanas, buen " +
      "acceso y un paisaje muy abierto. Ha pasado sequías serias: el nivel " +
      "cambia mucho de un año a otro.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde la carretera de la Axarquía, con varias entradas cómodas y " +
      "zona recreativa junto a la lámina.",
    dificultadAcceso: "facil",
    tieneSombra: false,
    navegable: true,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios: `${SOL_Y_AGUA} ${NIVEL_VARIABLE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "guadalhorce-guadalteba",
    provincia: "malaga",
    nombre: "Embalses del Guadalhorce y Guadalteba",
    tipo: "embalse",
    municipio: "Ardales / Campillos / Teba",
    latitud: 36.93,
    longitud: -4.8,
    descripcion:
      "El complejo de El Chorro: Guadalhorce, Guadalteba y Conde de " +
      "Guadalhorce, comunicados entre sí junto al desfiladero de los " +
      "Gaitanes y el Caminito del Rey. Aguas de un turquesa muy " +
      "característico, kilómetros de orilla y zonas recreativas. Es el sitio " +
      "de referencia de la provincia, y también el más visitado: en " +
      "temporada alta hay mucha gente que no viene a pescar.",
    capacidadHm3: null,
    // El boletín ya da Guadalhorce y Guadalteba en una sola entrada, y deja
    // Conde de Guadalhorce aparte. La ficha habla de los tres, que están
    // comunicados entre sí, así que se suman: enseñar solo una parte sería
    // contar otra cosa distinta de la que se está mirando.
    nombreEnBoletin: "Guadalhorce-Guadalteba + Conde Guadalhorce",
    accesoDescripcion:
      "Desde Ardales y desde la carretera de El Chorro, con aparcamientos y " +
      "áreas recreativas. Los accesos se saturan los fines de semana.",
    dificultadAcceso: "facil",
    tieneSombra: true,
    navegable: true,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios:
      `${SOL_Y_AGUA} Zona de mucho uso recreativo: baño, kayak y ` +
      "senderismo. Cuidado al lanzar cerca de las áreas de baño.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "la-concepcion",
    provincia: "malaga",
    nombre: "Embalse de La Concepción",
    tipo: "embalse",
    municipio: "Istán / Marbella",
    latitud: 36.58,
    longitud: -4.96,
    descripcion:
      "Sobre el río Verde, entre Istán y Marbella, encajado en la sierra " +
      "Blanca con la costa a un paso. Es el abastecimiento de la Costa del " +
      "Sol occidental, así que hay que mirar bien qué está permitido antes " +
      "de plantarse allí.",
    capacidadHm3: null,
    accesoDescripcion:
      "Por la carretera que sube de Marbella a Istán. Las orillas son " +
      "abruptas y hay tramos sin acceso.",
    dificultadAcceso: "dificil",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios:
      "Embalse de abastecimiento: comprueba las limitaciones de acceso, " +
      `baño y navegación antes de ir. ${ORILLA_CON_PENDIENTE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "casasola",
    provincia: "malaga",
    nombre: "Embalse de Casasola",
    tipo: "embalse",
    municipio: "Almogía",
    latitud: 36.83,
    longitud: -4.5,
    descripcion:
      "Sobre el río Campanillas, al norte de Málaga capital. Pequeño y " +
      "discreto, entre lomas de olivar y almendro. Se llega rápido desde la " +
      "capital y suele haber poca gente.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Almogía y desde los caminos que salen de la carretera de " +
      "Villanueva de la Concepción.",
    dificultadAcceso: "media",
    tieneSombra: false,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios: `${SOL_Y_AGUA} ${NIVEL_VARIABLE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },

  // -------------------------------------------------------------------------
  // Almería
  // -------------------------------------------------------------------------
  {
    slug: "cuevas-de-almanzora",
    provincia: "almeria",
    nombre: "Embalse de Cuevas de Almanzora",
    tipo: "embalse",
    municipio: "Cuevas del Almanzora",
    latitud: 37.3,
    longitud: -1.93,
    descripcion:
      "El embalse de referencia del Levante almeriense, sobre el río " +
      "Almanzora. Paisaje árido de verdad: rambla, esparto y ni un árbol. " +
      "En una provincia donde el agua dulce escasea, es de los pocos sitios " +
      "con lámina estable.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Cuevas del Almanzora por carretera local hasta la presa, y " +
      "pistas de tierra hacia el resto de orillas.",
    dificultadAcceso: "media",
    tieneSombra: false,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios:
      `${SOL_Y_AGUA} Aquí no es un consejo: en verano no hay ni una sombra ` +
      `en kilómetros. ${NIVEL_VARIABLE}`,
    mejorEpoca: [3, 4, 5, 10, 11],
    urlNivelAgua: null,
  },
  {
    slug: "beninar",
    provincia: "almeria",
    nombre: "Embalse de Benínar",
    tipo: "embalse",
    municipio: "Berja / Darrical",
    latitud: 36.87,
    longitud: -2.98,
    descripcion:
      "En la Alpujarra almeriense, sobre el río Adra, entre la sierra de " +
      "Gádor y la de la Contraviesa. Encajonado y con el nivel muy variable. " +
      "Es de los pocos puntos de agua dulce del poniente almeriense.",
    capacidadHm3: null,
    accesoDescripcion:
      "Por la carretera que sube desde Berja hacia Darrical. Curvas y " +
      "accesos a la lámina escasos.",
    dificultadAcceso: "dificil",
    tieneSombra: false,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios: `${SOL_Y_AGUA} ${NIVEL_VARIABLE} ${ORILLA_CON_PENDIENTE}`,
    mejorEpoca: [3, 4, 5, 10, 11],
    urlNivelAgua: null,
  },
];

// ---------------------------------------------------------------------------
// Qué hay en cada uno
// ---------------------------------------------------------------------------

type FilaSitioEspecie = [
  especieSlug: string,
  abundancia: number,
  probabilidad: Prob,
  mejorTecnica: string,
  notas: string,
];

/**
 * Composición de partida, no un censo.
 *
 * En los embalses de interior andaluces se repite un fondo común —ciprínidos
 * más black bass, con el cangrejo rojo por todas partes— y de ahí sale esta
 * plantilla. Las notas dicen lo que se sabe del tipo de agua, no del sitio
 * concreto: eso lo afinan las capturas que se vayan registrando, que es
 * exactamente para lo que está el diario.
 */
const COMUN_EMBALSE_INTERIOR: FilaSitioEspecie[] = [
  ["carpa-comun", 4, "alta", "fondo", "La captura de partida en casi cualquier embalse andaluz."],
  ["black-bass", 3, "media", "spinning", "Busca estructura: piedra, troncos y los cambios de nivel."],
  ["barbo", 3, "media", "feeder", "Devolución obligatoria."],
  ["cangrejo-rojo-americano", 4, "alta", "", "No pescable. Te robará el cebo sin parar."],
  ["carpin", 2, "baja", "fondo", "Cae con cebo y anzuelo pequeños mientras buscas carpa."],
  ["alburno", 3, "media", "", "Bandos cerca de superficie. Donde saltan, hay depredador debajo."],
];

/** Los de sierra alta, con agua fría y clara. */
const COMUN_EMBALSE_SIERRA: FilaSitioEspecie[] = [
  ["barbo", 4, "alta", "feeder", "Domina en aguas limpias y con corriente. Devolución obligatoria."],
  ["carpa-comun", 3, "media", "fondo", "En las colas y en las zonas de menos profundidad."],
  ["black-bass", 2, "baja", "spinning", "Menos que en los embalses de campiña."],
  ["boga-de-rio", 3, "media", "", "Propia de aguas limpias. Devolución obligatoria."],
  ["cangrejo-rojo-americano", 3, "media", "", "No pescable."],
];

const SIERRA = new Set([
  "aracena",
  "zufre",
  "jarrama",
  "la-colada",
  "bembezar",
  "tranco-de-beas",
  "la-bolera",
  "quiebrajano",
  "canales",
  "quentar",
  "el-portillo",
  "la-concepcion",
]);

/**
 * Córdoba, ya con ficha propia embalse por embalse.
 *
 * Sale de la plantilla porque la provincia se publica, y publicar siete
 * páginas repitiendo las mismas seis frases no es una guía: es la misma
 * página siete veces. Lo que cambia de verdad entre ellos —la profundidad,
 * el tipo de orilla, el agua que llevan y el tamaño— es lo que decide con
 * qué se va uno de casa.
 *
 * El lucio va donde la resolución de 2019 lo delimita. No es una suposición:
 * esa resolución delimita justamente «las áreas ocupadas por» estas especies,
 * así que si el lucio está delimitado en un embalse es porque está allí.
 */
const ESPECIES_CORDOBA: Record<string, FilaSitioEspecie[]> = {
  iznajar: [
    ["carpa-comun", 5, "alta", "fondo", "El pez de Iznájar. Con tanta orilla, cebar y esperar compensa más que moverse."],
    ["black-bass", 4, "alta", "spinning", "Los brazos largos y las paredes de roca son el sitio. Con barca se cubre lo que desde orilla no se llega ni a ver."],
    ["barbo", 4, "alta", "feeder", "El Genil trae barbo en cantidad, sobre todo en las colas. Devolución obligatoria."],
    ["cangrejo-rojo-americano", 4, "alta", "", "No pescable. En las orillas de poca profundidad no te deja pescar a fondo."],
    ["alburno", 4, "alta", "", "Bandos enormes en una lámina así de grande. Donde saltan, hay bass debajo."],
    ["carpin", 2, "baja", "fondo", "Cae con anzuelo pequeño mientras buscas carpa."],
  ],
  "la-brena-ii": [
    ["black-bass", 4, "alta", "spinning", "El embalse de bass de la provincia. Agua clara y honda: cuenta con bajar la presentación y afinar el hilo."],
    ["lucio", 3, "media", "spinning", "Aquí sí está delimitado, así que se puede devolver. Busca los bordes de las colas y la vegetación sumergida."],
    ["carpa-comun", 4, "alta", "fondo", "Muy presente, pero con estas paredes tan verticales hay que buscar las pocas orillas tendidas."],
    ["barbo", 3, "media", "feeder", "Más en las colas que en la presa. Devolución obligatoria."],
    ["cangrejo-rojo-americano", 3, "media", "", "No pescable."],
    ["alburno", 3, "media", "", "Cerca de superficie, y detrás el bass."],
  ],
  "puente-nuevo": [
    ["black-bass", 4, "alta", "spinning", "Madera sumergida y piedra por todas partes: es lo que hay que buscar."],
    ["lucio", 3, "media", "spinning", "Delimitado aquí, se puede devolver. En las zonas de menos fondo y con vegetación."],
    ["carpa-comun", 4, "alta", "fondo", "Bien repartida por todo el embalse."],
    ["barbo", 3, "media", "feeder", "El Guadiato baja con barbo. Devolución obligatoria."],
    ["cangrejo-rojo-americano", 4, "alta", "", "No pescable. Te vacía el anzuelo si pescas a fondo."],
    ["alburno", 3, "media", "", "Bandos en superficie."],
  ],
  guadalmellato: [
    ["black-bass", 4, "alta", "spinning", "El más cómodo de la provincia si sales de Córdoba capital, y con bass de sobra."],
    ["lucio", 3, "media", "spinning", "Delimitado aquí, se puede devolver. En las colas y donde hay vegetación."],
    ["carpa-comun", 4, "alta", "fondo", "La captura segura cuando el bass no quiere."],
    ["barbo", 3, "media", "feeder", "Devolución obligatoria."],
    ["cangrejo-rojo-americano", 4, "alta", "", "No pescable."],
    ["alburno", 3, "media", "", "Bandos cerca de superficie."],
  ],
  "sierra-boyera": [
    ["carpa-comun", 4, "alta", "fondo", "Lo que más cae, y con diferencia."],
    ["black-bass", 3, "media", "spinning", "Hay, pero es un embalse pequeño y poco profundo: en cuanto baja el nivel se complica mucho."],
    ["barbo", 3, "media", "feeder", "Devolución obligatoria."],
    ["cangrejo-rojo-americano", 4, "alta", "", "No pescable. En fondo de fango, constante."],
    ["carpin", 3, "media", "fondo", "Frecuente en aguas someras y templadas como estas."],
  ],
  bembezar: [
    ["barbo", 4, "alta", "feeder", "Domina el embalse. Agua limpia de Sierra Morena y barbo por todas partes. Devolución obligatoria."],
    ["boga-de-rio", 3, "media", "", "Propia de estas aguas limpias. Devolución obligatoria."],
    ["carpa-comun", 3, "media", "fondo", "En las colas y donde el fondo se suaviza."],
    ["black-bass", 2, "baja", "spinning", "Menos que en los embalses del Guadiato, y el agua clara obliga a afinar."],
    ["cangrejo-rojo-americano", 3, "media", "", "No pescable."],
  ],
  "la-colada": [
    ["barbo", 4, "alta", "feeder", "Lo más abundante. Devolución obligatoria."],
    ["carpa-comun", 3, "media", "fondo", "Bien repartida por las orillas tendidas de la dehesa."],
    ["boga-de-rio", 3, "media", "", "Devolución obligatoria."],
    ["black-bass", 2, "baja", "spinning", "Lo hay, pero aquí NO está en área delimitada: si cae, hay que sacrificarlo. Léete la ficha antes de ir a por él."],
    ["cangrejo-rojo-americano", 3, "media", "", "No pescable."],
  ],
};

/**
 * Jaén, con ficha propia embalse por embalse. Mismo motivo que Córdoba: la
 * provincia se publica, y siete páginas repitiendo las mismas seis frases no
 * son una guía.
 *
 * Aquí los seis se parten claramente en dos mundos: los del Guadalquivir y sus
 * afluentes al oeste —Giribaile, Guadalén, Rumblar—, que son de bass y de
 * lucio y andan por el olivar; y los de sierra al este —Tranco, La Bolera,
 * Quiebrajano—, con agua fría y clara y barbo por todas partes.
 *
 * El lucio va donde la resolución lo delimita: esa resolución delimita «las
 * áreas ocupadas por» estas especies, así que si está delimitado es que está.
 */
const ESPECIES_JAEN: Record<string, FilaSitioEspecie[]> = {
  "tranco-de-beas": [
    ["black-bass", 4, "alta", "spinning", "El embalse de bass de la sierra, y de los conocidos de Andalucía. Agua clara entre pinares: cuenta con afinar el hilo y bajar el tamaño."],
    ["barbo", 4, "alta", "feeder", "El Guadalquivir joven baja con barbo. Devolución obligatoria."],
    ["carpa-comun", 3, "media", "fondo", "Sobre todo en las colas y en las zonas de menos fondo."],
    ["boga-de-rio", 3, "media", "", "Propia de estas aguas limpias. Devolución obligatoria."],
    ["cangrejo-rojo-americano", 3, "media", "", "No pescable."],
  ],
  giribaile: [
    ["black-bass", 4, "alta", "spinning", "Mucha orilla y mucha estructura. De los buenos de la provincia."],
    ["lucio", 3, "media", "spinning", "Delimitado aquí, se puede devolver. En las colas y donde hay vegetación."],
    ["carpa-comun", 4, "alta", "fondo", "La captura segura, bien repartida por todo el embalse."],
    ["barbo", 3, "media", "feeder", "El Guadalimar trae barbo. Devolución obligatoria."],
    ["cangrejo-rojo-americano", 4, "alta", "", "No pescable. Te vacía el anzuelo si pescas a fondo."],
    ["alburno", 3, "media", "", "Bandos en superficie, y detrás el bass."],
  ],
  guadalen: [
    ["black-bass", 4, "alta", "spinning", "Delimitado aquí. Busca los cambios de nivel que deja el riego y la madera sumergida."],
    ["carpa-comun", 4, "alta", "fondo", "Lo que más cae cuando el bass no quiere saber nada."],
    ["barbo", 3, "media", "feeder", "Devolución obligatoria."],
    ["cangrejo-rojo-americano", 4, "alta", "", "No pescable."],
    ["alburno", 3, "media", "", "Bandos cerca de superficie."],
  ],
  rumblar: [
    ["black-bass", 4, "alta", "spinning", "Entre olivares y con orillas de piedra: la estructura está a la vista."],
    ["lucio", 3, "media", "spinning", "Delimitado aquí, se puede devolver. En las zonas de menos fondo."],
    ["carpa-comun", 4, "alta", "fondo", "Bien repartida."],
    ["barbo", 3, "media", "feeder", "Devolución obligatoria."],
    ["cangrejo-rojo-americano", 4, "alta", "", "No pescable."],
    ["alburno", 3, "media", "", "Bandos en superficie."],
  ],
  "la-bolera": [
    ["barbo", 4, "alta", "feeder", "Domina el embalse: agua fría y limpia de la sierra de Cazorla. Devolución obligatoria."],
    ["boga-de-rio", 3, "media", "", "Propia de aguas limpias como esta. Devolución obligatoria."],
    ["carpa-comun", 3, "media", "fondo", "En las colas y donde el fondo se suaviza."],
    ["black-bass", 2, "baja", "spinning", "Aquí NO está en área delimitada: si cae, hay que sacrificarlo. Lee la ficha antes de ir a por él."],
    ["cangrejo-rojo-americano", 2, "baja", "", "No pescable. Menos que en los embalses de campiña."],
  ],
  quiebrajano: [
    ["barbo", 4, "alta", "feeder", "El pez de este embalse. Agua de sierra y poco más que buscar. Devolución obligatoria."],
    ["boga-de-rio", 3, "media", "", "Devolución obligatoria."],
    ["carpa-comun", 3, "media", "fondo", "En las orillas tendidas."],
    ["black-bass", 2, "baja", "spinning", "Aquí NO está en área delimitada: si cae, hay que sacrificarlo."],
    ["cangrejo-rojo-americano", 2, "baja", "", "No pescable."],
  ],
};

export const ESPECIES_POR_SITIO_ANDALUCIA: Record<string, FilaSitioEspecie[]> =
  Object.fromEntries(
    SITIOS_ANDALUCIA.map((s) => [
      s.slug,
      ESPECIES_CORDOBA[s.slug] ??
        ESPECIES_JAEN[s.slug] ??
        (SIERRA.has(s.slug) ? COMUN_EMBALSE_SIERRA : COMUN_EMBALSE_INTERIOR),
    ]),
  );

// ---------------------------------------------------------------------------
// Textos de provincia
// ---------------------------------------------------------------------------

/**
 * El párrafo que abre cada provincia. Es contenido propio —lo que hace que la
 * página valga algo en una búsqueda— y describe la geografía, que no caduca.
 * Nada de normativa: eso va en su campo y sale de la orden de vedas.
 */
export const DESCRIPCIONES_ANDALUCIA: Record<string, string> = {
  huelva:
    "Huelva reparte su agua dulce entre dos mundos. Al norte, la sierra de " +
    "Aracena, con embalses pequeños de agua limpia y sombra —Aracena, Zufre, " +
    "Jarrama— metidos entre dehesa y castañar. Al sur y al oeste, el " +
    "Andévalo: láminas enormes y peladas como el Andévalo o el Chanza, casi " +
    "en la raya con Portugal, donde se pesca solo y se camina mucho. Y en la " +
    "costa, el Piedras, a media hora de las playas. Aviso aparte para el río " +
    "Tinto: sus aguas son ácidas por la minería y no albergan pesca.",
  cordoba:
    "Córdoba tiene el embalse más grande de Andalucía, Iznájar, en el " +
    "extremo sur donde la provincia se junta con Granada y Málaga. El resto " +
    "se reparte entre la vega del Guadalquivir —La Breña II, junto a " +
    "Almodóvar, y el Guadalmellato— y la sierra norte, donde el valle del " +
    "Guadiato guarda Puente Nuevo, Sierra Boyera y La Colada, y la sierra de " +
    "Hornachuelos el Bembézar. Los del norte son de dehesa y monte, con poca " +
    "gente; los del sur, de mucha lámina y viento.",
  jaen:
    "Jaén es la provincia del olivar y de la cabecera del Guadalquivir, y se " +
    "le nota en el agua. Al este, el Tranco de Beas, dentro del parque " +
    "natural de Cazorla, Segura y Las Villas, con pinar hasta la orilla. En " +
    "el centro y el norte, los embalses de campiña alta sobre el Guadalimar " +
    "y sus afluentes —Giribaile, Guadalén, Rumblar—, rodeados de olivo hasta " +
    "donde alcanza la vista. Y al sur, encajonados en la sierra, el " +
    "Quiebrajano y La Bolera.",
  granada:
    "Granada va de la alta montaña al desierto sin apenas transición. Al pie " +
    "de Sierra Nevada, Canales y Quéntar recogen agua de deshielo, fría y " +
    "clarísima. En la vega, Cubillas queda a veinte minutos de la capital y " +
    "es el sitio de después de trabajar. Camino de la costa, Béznar y Rules, " +
    "en el valle de Lecrín. Y en el altiplano, el Negratín, entre cárcavas " +
    "de arcilla, que es el más grande de la provincia y no se parece a " +
    "ningún otro sitio de Andalucía.",
  malaga:
    "Málaga concentra su pesca continental en dos zonas. En el interior, el " +
    "complejo de El Chorro —Guadalhorce, Guadalteba y Conde de Guadalhorce—, " +
    "junto al desfiladero de los Gaitanes, con esas aguas turquesa que salen " +
    "en todas las fotos; es el sitio de referencia y también el más " +
    "concurrido. En la Axarquía, La Viñuela, el mayor de la provincia, de " +
    "orillas abiertas y buen acceso. Y en la costa occidental, La " +
    "Concepción, encajado en la sierra Blanca sobre Marbella.",
  almeria:
    "Almería es la provincia con menos agua dulce de Andalucía, y esta guía " +
    "no va a fingir lo contrario: aquí hay dos embalses con lámina estable y " +
    "poco más. Cuevas de Almanzora, sobre el río Almanzora, en el Levante, y " +
    "Benínar, sobre el Adra, en la Alpujarra almeriense. Ramblas secas la " +
    "mayor parte del año y un sol que no perdona: quien pesque aquí en " +
    "verano sabe a lo que va.",
};
