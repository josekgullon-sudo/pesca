/**
 * Cádiz, la segunda provincia de la guía.
 *
 * Va en su propio fichero, y no en el montón de `andalucia.ts`, porque está
 * trabajada al nivel de Sevilla: cada sitio con su descripción propia, sus
 * especies con abundancias diferenciadas y sus aparejos, en vez de la
 * plantilla común que llevan las provincias que todavía son un armazón.
 *
 * **Sigue sin publicarse, y por una sola razón.** Falta el listado de áreas
 * delimitadas para especies exóticas invasoras de la provincia, que sale de la
 * orden de vedas y no se deduce de la de Sevilla: es lo que decide si un black
 * bass se devuelve al agua o hay obligación de sacrificarlo. Todos los sitios
 * llevan `eeiComprobado: false` y la web dice abiertamente que no lo sabe.
 *
 * Fiabilidad de lo que hay, para que nadie se confunda:
 *
 *  - Nombres, municipios y a qué río pertenece cada embalse: sólido.
 *  - Coordenadas: aproximadas, como las de Sevilla. Sitúan la lámina, no el
 *    sitio donde se aparca.
 *  - Capacidades: a null. Antes eso que una cifra a ojo.
 *  - Especies y abundancias: estimación de partida a partir de cómo funcionan
 *    las cuencas del Guadalete y del Barbate, no un censo. La web lo dice en
 *    todas las fichas y se afinan con las capturas que se registren.
 */

type Prob = "alta" | "media" | "baja";

export type SitioCadiz = {
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
};

const PRIMAVERA_Y_OTONO = [3, 4, 5, 6, 9, 10, 11];

/** Vacío a propósito: el estado EEI de estos sitios no lo ha comprobado nadie. */
const SIN_COMPROBAR = "";

const SOL_Y_AGUA =
  "Orillas abiertas y con poca sombra: gorra, crema y agua de sobra de mayo a " +
  "septiembre.";

const ORILLA_CON_PENDIENTE =
  "Bajadas a la orilla con pendiente y piedra suelta. Calzado con suela " +
  "agarrada.";

const RIEGO =
  "Embalse de regulación para riego: el nivel sube y baja mucho a lo largo " +
  "del año y los puestos cambian por completo. Mira el nivel antes de hacer " +
  "kilómetros.";

const LEVANTE =
  "Aquí el levante manda. Con viento fuerte del este la orilla oeste se hace " +
  "impescable y el lance se va a paseo; si sopla, cámbiate de lado antes de " +
  "montar.";

export const SITIOS_CADIZ: SitioCadiz[] = [
  {
    slug: "bornos",
    provincia: "cadiz",
    nombre: "Embalse de Bornos",
    tipo: "embalse",
    municipio: "Bornos / Villamartín",
    latitud: 36.82,
    longitud: -5.72,
    descripcion:
      "El embalse de diario de la sierra de Cádiz. Está sobre el Guadalete, " +
      "entre Bornos y Villamartín, y es de los más pescados de la provincia " +
      "por una razón muy sencilla: se llega en coche hasta casi la orilla y " +
      "hay kilómetros de ribera donde ponerse. Agua turbia casi todo el año, " +
      "fondo de fango y limo, y carpa por todas partes. La cola, hacia " +
      "Villamartín, es la parte menos profunda y la que primero se calienta " +
      "en primavera.",
    capacidadHm3: null,
    accesoDescripcion:
      "Varias entradas desde la carretera entre Bornos y Villamartín, con " +
      "sitio para dejar el coche cerca del agua. La zona de la presa y el " +
      "área recreativa de Bornos son las más cómodas; las orillas de la cola " +
      "se hacen por caminos de tierra.",
    dificultadAcceso: "facil",
    tieneSombra: false,
    navegable: true,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios: `${SOL_Y_AGUA} ${RIEGO} Con el nivel bajo queda fango blando al descubierto: no te fíes de la costra seca de la orilla, que debajo sigue blanda.`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "arcos-de-la-frontera",
    provincia: "cadiz",
    nombre: "Embalse de Arcos de la Frontera",
    tipo: "embalse",
    municipio: "Arcos de la Frontera",
    latitud: 36.75,
    longitud: -5.75,
    descripcion:
      "El siguiente escalón del Guadalete después de Bornos, pegado al pueblo " +
      "de Arcos y con el casco antiguo asomado desde el tajo. Es pequeño " +
      "comparado con sus vecinos y eso es su gracia: se recorre entero en una " +
      "jornada y se llega andando desde el pueblo, que en esta provincia no " +
      "lo dice ningún otro. Al recibir el agua que suelta Bornos, tiene más " +
      "movimiento que un embalse cerrado, y eso se nota en las tomas.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde el propio Arcos, por los caminos que bordean la lámina y por la " +
      "zona del club náutico. Orilla llana en la mayor parte del perímetro.",
    dificultadAcceso: "facil",
    tieneSombra: false,
    navegable: true,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios: `${SOL_Y_AGUA} Hay actividad náutica y de remo: no lances hacia la zona de embarcaciones.`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "guadalcacin",
    provincia: "cadiz",
    nombre: "Embalse de Guadalcacín",
    tipo: "embalse",
    municipio: "Jerez de la Frontera / San José del Valle",
    latitud: 36.7,
    longitud: -5.65,
    descripcion:
      "El grande de la provincia, sobre el Majaceite, en pleno término de " +
      "Jerez. La lámina es enorme y las colas se alargan hacia la sierra, con " +
      "brazos donde no llega nadie a pie. Es el sitio de referencia de Cádiz " +
      "para pescar desde embarcación, y desde orilla premia al que camina: " +
      "las entradas cómodas se pescan todos los fines de semana y las de más " +
      "allá, casi nunca.",
    capacidadHm3: null,
    accesoDescripcion:
      "Por la carretera de San José del Valle y por los caminos que salen " +
      "hacia la presa. Varias orillas solo son practicables desde barca; a " +
      "pie, cuenta con andar un buen rato desde donde dejes el coche.",
    dificultadAcceso: "media",
    tieneSombra: false,
    navegable: true,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios: `${SOL_Y_AGUA} ${RIEGO} ${LEVANTE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "zahara-el-gastor",
    provincia: "cadiz",
    nombre: "Embalse de Zahara-El Gastor",
    tipo: "embalse",
    municipio: "Zahara de la Sierra / El Gastor",
    latitud: 36.85,
    longitud: -5.4,
    descripcion:
      "El más bonito de la provincia, sin discusión: Zahara de la Sierra y su " +
      "castillo colgados encima y la sierra de Grazalema al fondo. Agua " +
      "limpia de montaña, mucho más clara que la de los embalses de la " +
      "campiña, y orillas de piedra en vez de fango. Que se vea el fondo " +
      "cambia la forma de pescarlo: aquí el pez te ve venir, y hay que " +
      "afinar el bajo y trabajar los señuelos despacio.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Zahara de la Sierra y desde la carretera hacia El Gastor, con " +
      "zonas de uso público junto a la lámina. Algunas bajadas a la orilla " +
      "son de piedra y con pendiente.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios:
      "Entorno del parque natural Sierra de Grazalema: además de la normativa " +
      "de pesca hay reglas propias de acceso, baño y navegación, y zonas de " +
      "acceso restringido. Compruébalo antes de ir. " +
      ORILLA_CON_PENDIENTE,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "los-hurones",
    provincia: "cadiz",
    nombre: "Embalse de Los Hurones",
    tipo: "embalse",
    municipio: "Algar",
    latitud: 36.71,
    longitud: -5.55,
    descripcion:
      "Encajonado entre laderas de monte por encima de Algar, sobre el " +
      "Majaceite. Agua limpia y mucha profundidad cerca de la presa, con " +
      "paredones que caen a plomo. Es de abastecimiento y está bastante " +
      "resguardado, así que se pesca poco: el que va, va a por el sitio tanto " +
      "como a por el pez.",
    capacidadHm3: null,
    accesoDescripcion:
      "Por la carretera que sube desde Algar hacia la presa. Bajar a la " +
      "orilla cuesta y hay tramos enteros sin bajada practicable: mira dónde " +
      "vas a pescar antes de bajar el material.",
    dificultadAcceso: "dificil",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios:
      "Embalse de abastecimiento: puede haber limitaciones de acceso, baño y " +
      `navegación. ${ORILLA_CON_PENDIENTE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "barbate",
    provincia: "cadiz",
    nombre: "Embalse del Barbate",
    tipo: "embalse",
    municipio: "Alcalá de los Gazules",
    latitud: 36.44,
    longitud: -5.68,
    descripcion:
      "En el corazón del parque natural de Los Alcornocales, sobre el río " +
      "Barbate. Alcornocal cerrado alrededor y una lámina larga que se " +
      "estrecha hacia las colas, con troncos y ramas metidos en el agua allí " +
      "donde el monte llega a la orilla. Es de los pocos sitios de la " +
      "provincia con sombra de verdad en verano, y esa estructura sumergida " +
      "es justo lo que busca el black bass.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Alcalá de los Gazules por los caminos del parque. Buena parte " +
      "del entorno es parque natural y no todo el monte es transitable ni " +
      "todos los caminos son públicos: respeta los cerramientos.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios:
      "Parque natural de Los Alcornocales: normativa propia de acceso, " +
      "acampada y circulación, aparte de la de pesca. En verano el riesgo de " +
      "incendio es alto; nada de fuego, y ojo con aparcar sobre hierba seca.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "celemin",
    provincia: "cadiz",
    nombre: "Embalse del Celemín",
    tipo: "embalse",
    municipio: "Benalup-Casas Viejas",
    latitud: 36.37,
    longitud: -5.75,
    descripcion:
      "Vecino del Barbate y bastante más pequeño, entre Benalup y la sierra " +
      "del Aljibe. Está también dentro del entorno de Los Alcornocales, con " +
      "monte bajo y alcornoque en las laderas. Al ser corto se recorre en una " +
      "mañana, y es buena primera parada para quien no conoce la zona antes " +
      "de meterse en el Barbate.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Benalup-Casas Viejas por la carretera que sube hacia la presa. " +
      "Orillas cortas y accesibles en la parte baja.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios:
      "Entorno de parque natural, con normativa propia de acceso y de fuego. " +
      SOL_Y_AGUA,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "guadarranque",
    provincia: "cadiz",
    nombre: "Embalse del Guadarranque",
    tipo: "embalse",
    municipio: "Castellar de la Frontera / San Roque",
    latitud: 36.25,
    longitud: -5.42,
    descripcion:
      "El del Campo de Gibraltar, sobre el río Guadarranque, entre Castellar " +
      "y San Roque y con el Peñón asomando al fondo en los días claros. " +
      "Abastece a la comarca y a su industria, así que el nivel depende de " +
      "más cosas que de la lluvia. Está en cuenca costera, a pocos " +
      "kilómetros del mar, y aquí el levante no es una molestia: es el que " +
      "decide si se pesca o no.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde la carretera de Castellar de la Frontera y por los caminos que " +
      "salen hacia la presa. Hay tramos de orilla con vegetación cerrada.",
    dificultadAcceso: "media",
    tieneSombra: false,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios: `${SOL_Y_AGUA} ${LEVANTE}`,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "charco-redondo",
    provincia: "cadiz",
    nombre: "Embalse de Charco Redondo",
    tipo: "embalse",
    municipio: "Los Barrios",
    latitud: 36.24,
    longitud: -5.52,
    descripcion:
      "Sobre el río Palmones, en Los Barrios, en el borde de Los " +
      "Alcornocales y muy cerca de la bahía de Algeciras. Monte cerrado " +
      "alrededor y agua bastante limpia. Es el sitio de casa de todo el Campo " +
      "de Gibraltar y aun así no está masificado, porque llegar al agua " +
      "obliga a andar por el alcornocal.",
    capacidadHm3: null,
    accesoDescripcion:
      "Desde Los Barrios por la carretera que sube hacia la presa, y de ahí " +
      "a pie. La vegetación llega hasta el agua en buena parte del perímetro.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: false,
    esAreaDelimitadaEEI: false,
    eeiComprobado: false,
    notasLegales: SIN_COMPROBAR,
    avisosSanitarios:
      "Entorno de parque natural. Monte cerrado: manga larga contra las " +
      "zarzas y cuidado con el fuego en verano. " +
      LEVANTE,
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
];

// ---------------------------------------------------------------------------
// Qué hay en cada sitio
// ---------------------------------------------------------------------------

type FilaSitioEspecie = [
  especieSlug: string,
  abundancia: number,
  probabilidad: Prob,
  mejorTecnica: string,
  notas: string,
];

/**
 * Estimación de partida, no un censo, igual que la de Sevilla cuando se
 * escribió. Lo que se afina aquí frente a la plantilla común es el reparto:
 * en la campiña del Guadalete manda la carpa en agua turbia, en la sierra
 * manda el barbo en agua limpia, y en las cuencas costeras del sur aparece la
 * anguila, que no se pesca pero conviene que esté en la ficha para que quien
 * la enganche sepa qué hacer.
 */
export const ESPECIES_POR_SITIO_CADIZ: Record<string, FilaSitioEspecie[]> = {
  bornos: [
    ["carpa-comun", 5, "alta", "fondo", "El pez del embalse. Con maíz en el fondo no se vuelve de vacío."],
    ["barbo", 4, "alta", "feeder", "Muy presente en toda la cuenca del Guadalete. Devolución obligatoria."],
    ["black-bass", 3, "media", "spinning", "Busca los restos de vegetación y los cambios de nivel que deja el riego."],
    ["cangrejo-rojo-americano", 5, "alta", "", "No pescable. En fondo de fango te robará el cebo sin parar."],
    ["carpin", 3, "media", "fondo", "Cae con anzuelo y cebo pequeños mientras buscas carpa."],
    ["alburno", 3, "media", "", "Bandos grandes cerca de superficie; donde saltan hay depredador debajo."],
    ["tenca", 2, "baja", "", "Pesca prohibida. Puede caer en zonas de vegetación y fondo blando."],
  ],
  "arcos-de-la-frontera": [
    ["carpa-comun", 5, "alta", "fondo", "Igual que en Bornos: es la captura segura."],
    ["barbo", 4, "alta", "feeder", "Se nota el agua en movimiento que suelta Bornos. Devolución obligatoria."],
    ["black-bass", 3, "media", "spinning", "En los bordes con estructura y cerca de los pantalanes."],
    ["cangrejo-rojo-americano", 4, "alta", "", "No pescable."],
    ["alburno", 4, "alta", "", "Muy abundante. Es la despensa del bass."],
    ["carpin", 3, "media", "fondo", "Constante con cebo pequeño."],
  ],
  guadalcacin: [
    ["carpa-comun", 5, "alta", "fondo", "Por todo el embalse, y de buen tamaño en las colas."],
    ["black-bass", 4, "alta", "spinning", "El sitio de la provincia para buscarlo con embarcación."],
    ["barbo", 4, "alta", "feeder", "Abundante en la entrada del Majaceite. Devolución obligatoria."],
    ["cangrejo-rojo-americano", 4, "alta", "", "No pescable."],
    ["alburno", 4, "alta", "", "Bandos por toda la lámina."],
    ["carpin", 2, "baja", "fondo", "Menos que en los embalses pequeños."],
  ],
  "zahara-el-gastor": [
    ["barbo", 5, "alta", "feeder", "Domina en agua limpia y con algo de corriente. Devolución obligatoria."],
    ["boga-de-rio", 4, "alta", "", "Propia de aguas limpias de sierra. Devolución obligatoria."],
    ["carpa-comun", 3, "media", "fondo", "En las colas y en la zona menos profunda."],
    ["black-bass", 2, "baja", "spinning", "Los hay, pero en agua tan clara hay que afinar mucho más que en la campiña."],
    ["cangrejo-rojo-americano", 3, "media", "", "No pescable."],
  ],
  "los-hurones": [
    ["barbo", 4, "alta", "feeder", "El pez del sitio, en agua limpia y profunda. Devolución obligatoria."],
    ["boga-de-rio", 3, "media", "", "Devolución obligatoria."],
    ["carpa-comun", 3, "media", "fondo", "Sobre todo en la cola, donde entra el Majaceite."],
    ["black-bass", 2, "baja", "spinning", "Poco frecuente y difícil desde orilla por lo abrupto del vaso."],
    ["cangrejo-rojo-americano", 2, "baja", "", "No pescable."],
  ],
  barbate: [
    ["black-bass", 4, "alta", "spinning", "Los troncos y ramas que mete el alcornocal en el agua son su sitio."],
    ["carpa-comun", 4, "alta", "fondo", "Abundante, sobre todo en las zonas más someras."],
    ["barbo", 3, "media", "feeder", "Devolución obligatoria."],
    ["cangrejo-rojo-americano", 4, "alta", "", "No pescable."],
    ["anguila-europea", 2, "baja", "", "PESCA PROHIBIDA y especie en peligro crítico. Si se engancha, corta el bajo cerca del anzuelo y déjala marchar sin sacarla del agua."],
    ["alburno", 3, "media", "", "En las zonas abiertas de la lámina."],
  ],
  celemin: [
    ["carpa-comun", 4, "alta", "fondo", "La captura de partida, como en casi todo el sur de la provincia."],
    ["black-bass", 3, "media", "spinning", "En los bordes con monte metido en el agua."],
    ["barbo", 3, "media", "feeder", "Devolución obligatoria."],
    ["cangrejo-rojo-americano", 4, "alta", "", "No pescable."],
    ["anguila-europea", 2, "baja", "", "PESCA PROHIBIDA. Cuenca del Barbate. Si cae, corta el bajo y suéltala sin sacarla del agua."],
  ],
  guadarranque: [
    ["carpa-comun", 4, "alta", "fondo", "Bien repartida por toda la lámina."],
    ["black-bass", 3, "media", "spinning", "En los bordes con vegetación y en las entradas de agua."],
    ["barbo", 3, "media", "feeder", "Devolución obligatoria."],
    ["cangrejo-rojo-americano", 4, "alta", "", "No pescable."],
    ["anguila-europea", 2, "baja", "", "PESCA PROHIBIDA y especie en peligro crítico. Cuenca costera. Corta el bajo y suéltala sin sacarla del agua."],
    ["alburno", 3, "media", "", "Bandos en superficie con buen tiempo."],
  ],
  "charco-redondo": [
    ["black-bass", 3, "media", "spinning", "El monte llega al agua: pesca los bordes, no el centro."],
    ["carpa-comun", 4, "alta", "fondo", "Abundante y accesible desde los pocos claros de orilla."],
    ["barbo", 3, "media", "feeder", "Devolución obligatoria."],
    ["cangrejo-rojo-americano", 4, "alta", "", "No pescable."],
    ["anguila-europea", 2, "baja", "", "PESCA PROHIBIDA. Cuenca del Palmones. Corta el bajo y suéltala sin sacarla del agua."],
  ],
};

// ---------------------------------------------------------------------------
// Aparejos: qué se lleva a cada tipo de agua
// ---------------------------------------------------------------------------

/** Los que merecen la pena trabajar a señuelo desde orilla o barca. */
export const CADIZ_SPINNING = [
  "bornos",
  "arcos-de-la-frontera",
  "guadalcacin",
  "barbate",
  "celemin",
  "guadarranque",
  "charco-redondo",
];

/** Sierra y cuencas altas: se ve el fondo, el pez te ve a ti. */
export const CADIZ_AGUA_CLARA = [
  "zahara-el-gastor",
  "los-hurones",
  "barbate",
  "charco-redondo",
];

/** Campiña del Guadalete: fango, limo y poca visibilidad. */
export const CADIZ_AGUA_TURBIA = [
  "bornos",
  "arcos-de-la-frontera",
  "guadalcacin",
  "guadarranque",
];

// ---------------------------------------------------------------------------
// Texto de la provincia
// ---------------------------------------------------------------------------

export const DESCRIPCION_CADIZ =
  "La pesca continental de Cádiz se entiende con dos ríos. El Guadalete baja " +
  "de Grazalema y va dejando embalses por el camino: Zahara-El Gastor arriba, " +
  "con agua clara de sierra; Bornos y Arcos abajo, ya en la campiña, turbios " +
  "y llenos de carpa, y los dos con acceso cómodo desde Villamartín y Jerez. " +
  "Por su afluente el Majaceite cuelgan Guadalcacín, el más grande de la " +
  "provincia, y Los Hurones, el más escondido. Al sur cambia el paisaje: el " +
  "Barbate y el Celemín están metidos en el alcornocal de Los Alcornocales, " +
  "con sombra de verdad y mucha madera sumergida. Y en el Campo de " +
  "Gibraltar, Guadarranque y Charco Redondo, en cuencas costeras a un paso " +
  "del mar, donde el levante decide la jornada más que la hora a la que " +
  "salgas de casa.";

/**
 * Lo que se le dice a quien entra a la provincia. Va aparte de la descripción
 * porque no es geografía: es lo que hay que saber antes de mojar el sedal.
 */
export const NOTAS_LEGALES_CADIZ =
  "Cádiz se rige por la orden de vedas de pesca continental de Andalucía. Es " +
  "obligatorio llevar licencia de pesca continental andaluza en vigor. Buena " +
  "parte de los embalses del sur de la provincia están dentro o en el entorno " +
  "de los parques naturales de Los Alcornocales y Sierra de Grazalema, que " +
  "tienen normativa propia de acceso, circulación y acampada además de la de " +
  "pesca.";
