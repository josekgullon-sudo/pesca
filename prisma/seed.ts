/**
 * Datos semilla de la app.
 *
 * Qué hay aquí y con qué fiabilidad:
 *
 *  - Estado legal de las especies y áreas delimitadas para especies exóticas
 *    invasoras: contrastado a julio de 2026. Aun así la app avisa en todas
 *    partes de que hay que verificarlo en el Portal de Caza y Pesca de la
 *    Junta de Andalucía antes de cada salida.
 *  - Coordenadas: aproximadas. Sitúan la lámina de agua o el centro del tramo,
 *    no el punto de aparcamiento.
 *  - Distancias y tiempos desde Dos Hermanas: estimados en coche.
 *  - Abundancias, probabilidades de captura y efectividad de aparejos:
 *    estimación de partida, NO un censo. Están para tener un punto de
 *    referencia el primer día y afinarlos con nuestras propias capturas.
 *
 * El seed es idempotente: se puede ejecutar tantas veces como haga falta.
 * Solo crea los usuarios si no existen (no pisa contraseñas ya cambiadas).
 */

import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import {
  AVISO_FUERA_DE_AREA_DELIMITADA,
  TEXTO_AREAS_DELIMITADAS_EEI,
  URL_PORTAL_CAZA_Y_PESCA,
} from "../src/lib/avisos";
import { prisma } from "../src/lib/prisma";
import { ARTICULOS } from "./articulos";
import {
  DESCRIPCIONES_ANDALUCIA,
  ESPECIES_POR_SITIO_ANDALUCIA,
  SITIOS_ANDALUCIA,
} from "./andalucia";
import {
  CADIZ_AGUA_CLARA,
  CADIZ_AGUA_TURBIA,
  CADIZ_SPINNING,
  DESCRIPCION_CADIZ,
  ESPECIES_POR_SITIO_CADIZ,
  NOTAS_LEGALES_CADIZ,
  SITIOS_CADIZ,
} from "./cadiz";
import { distanciaKm, tiempoEnCocheAprox } from "../src/lib/ubicacion";

const PRIMAVERA_Y_OTONO = [3, 4, 5, 6, 9, 10, 11];
const TEMPORADA_LARGA = [3, 4, 5, 6, 7, 8, 9, 10];

const EN_AREA_DELIMITADA =
  "Dentro del área delimitada para especies exóticas invasoras: aquí SÍ se " +
  "pueden pescar black bass, lucio, carpa común y trucha arcoíris. " +
  `Listado completo de aguas: ${TEXTO_AREAS_DELIMITADAS_EEI}`;

// ---------------------------------------------------------------------------
// Provincias
// ---------------------------------------------------------------------------

/**
 * Las ocho provincias andaluzas. Solo Sevilla sale publicada: es la única con
 * los sitios cargados y la normativa contrastada.
 *
 * Para publicar otra hacen falta dos cosas, y en este orden:
 *   1. Sus sitios, con especies y aparejos, en el array SITIOS de abajo.
 *   2. Su lista de áreas delimitadas para especies exóticas invasoras, sacada
 *      de la orden de vedas vigente. Cambia de una provincia a otra, y de ella
 *      depende si un black bass se devuelve al agua o hay que sacrificarlo.
 *
 * Publicar una provincia a medias es peor que no publicarla: Google penaliza
 * las páginas sin contenido propio, y una normativa equivocada le puede costar
 * una multa a quien se fíe.
 */
type ProvinciaSeed = {
  slug: string;
  nombre: string;
  comunidad: string;
  latitud: number;
  longitud: number;
  publicada: boolean;
  descripcion?: string;
  areasDelimitadasEEI?: string;
  notasLegales?: string;
  urlOrdenDeVedas?: string;
};

const PROVINCIAS: ProvinciaSeed[] = [
  {
    slug: "sevilla",
    nombre: "Sevilla",
    comunidad: "Andalucía",
    latitud: 37.5,
    longitud: -5.8,
    publicada: true,
    descripcion:
      "La provincia de Sevilla tiene once embalses grandes y tres tramos de río " +
      "abiertos a la pesca, repartidos entre la Sierra Norte y la campiña. Los " +
      "de la sierra —El Pintado, José Torán, Huesna, Cala— llevan agua limpia y " +
      "fría, con mucho barbo y el mejor black bass de la provincia. Los de la " +
      "campiña —Torre del Águila, Puebla de Cazalla— son de riego, con el nivel " +
      "muy variable y carpa por todas partes. Y luego está el Guadaíra, a veinte " +
      "minutos de la capital, que es donde se va cuando no hay tiempo para más.",
    areasDelimitadasEEI: TEXTO_AREAS_DELIMITADAS_EEI,
    notasLegales:
      "Sevilla se rige por la orden de vedas de pesca continental de Andalucía. " +
      "Es obligatorio llevar licencia de pesca continental andaluza en vigor y " +
      "seguro de responsabilidad civil.",
    urlOrdenDeVedas: URL_PORTAL_CAZA_Y_PESCA,
  },
  // --- Cádiz va publicada con aviso; el resto, pendientes. ---
  //
  // Sitios y descripción sí llevan: lo que falta es el listado de áreas
  // delimitadas para especies exóticas invasoras de cada provincia, que sale
  // del boletín y no se deduce. Ver el comentario de cabecera de andalucia.ts.
  { slug: "huelva", nombre: "Huelva", comunidad: "Andalucía", latitud: 37.6, longitud: -6.9, publicada: false, descripcion: DESCRIPCIONES_ANDALUCIA.huelva },
  // Publicada sin su listado de áreas delimitadas, a propósito y con el aviso
  // en rojo que sale arriba de /cadiz mientras `areasDelimitadasEEI` esté
  // vacío. Los nueve sitios siguen con `eeiComprobado: false`: la web dice que
  // no lo sabe, que es distinto de decir que no están en el área.
  { slug: "cadiz", nombre: "Cádiz", comunidad: "Andalucía", latitud: 36.5, longitud: -5.8, publicada: true, descripcion: DESCRIPCION_CADIZ, notasLegales: NOTAS_LEGALES_CADIZ, urlOrdenDeVedas: URL_PORTAL_CAZA_Y_PESCA },
  { slug: "malaga", nombre: "Málaga", comunidad: "Andalucía", latitud: 36.8, longitud: -4.6, publicada: false, descripcion: DESCRIPCIONES_ANDALUCIA.malaga },
  { slug: "cordoba", nombre: "Córdoba", comunidad: "Andalucía", latitud: 38.0, longitud: -4.8, publicada: false, descripcion: DESCRIPCIONES_ANDALUCIA.cordoba },
  { slug: "jaen", nombre: "Jaén", comunidad: "Andalucía", latitud: 38.0, longitud: -3.4, publicada: false, descripcion: DESCRIPCIONES_ANDALUCIA.jaen },
  { slug: "granada", nombre: "Granada", comunidad: "Andalucía", latitud: 37.3, longitud: -3.4, publicada: false, descripcion: DESCRIPCIONES_ANDALUCIA.granada },
  { slug: "almeria", nombre: "Almería", comunidad: "Andalucía", latitud: 37.2, longitud: -2.4, publicada: false, descripcion: DESCRIPCIONES_ANDALUCIA.almeria },
];

/**
 * Dos Hermanas, que es desde donde están medidas las distancias de referencia
 * de la guía. Para los sitios de las otras provincias no tiene sentido
 * teclearlas a mano una a una: se calculan desde aquí con el mismo estimador
 * que usa la web. Son orientativas, como todo lo que sale de esa cuenta.
 */
const DOS_HERMANAS = { latitud: 37.2827, longitud: -5.9219 };

// ---------------------------------------------------------------------------
// Sitios
// ---------------------------------------------------------------------------

type SitioSeed = {
  slug: string;
  /** Slug de la provincia a la que pertenece. */
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
  distanciaDesdeDosHermanasKm: number;
  tiempoCocheMin: number;
  esAreaDelimitadaEEI: boolean;
  /**
   * Si alguien ha buscado de verdad este sitio en el listado de la orden de
   * vedas. Obligatorio a propósito: sin él, un sitio nuevo entraría como
   * «fuera del área», que es la respuesta que manda sacrificar el pez.
   */
  eeiComprobado: boolean;
  notasLegales: string;
  avisosSanitarios: string;
  mejorEpoca: number[];
  urlNivelAgua: string | null;
};

const SITIOS: SitioSeed[] = [
  {
    slug: "torre-del-aguila",
    provincia: "sevilla",
    nombre: "Embalse de Torre del Águila",
    tipo: "embalse",
    municipio: "Utrera / El Palmar de Troya",
    latitud: 37.0736,
    longitud: -5.8747,
    descripcion:
      "El embalse grande más cercano a Dos Hermanas y, por distancia, el sitio " +
      "de diario. Es un embalse de riego, así que el nivel del agua sube y baja " +
      "muchísimo a lo largo del año: en verano puede dejar al descubierto " +
      "orillas enteras y cambiar por completo los puestos. Hay black bass y " +
      "mucha carpa. Terreno abierto, sin apenas arbolado.",
    capacidadHm3: 72,
    accesoDescripcion:
      "Acceso libre desde la carretera de El Palmar de Troya. Pistas de tierra " +
      "hasta varias orillas; con el coche bajo, cuidado después de lluvias.",
    dificultadAcceso: "facil",
    tieneSombra: false,
    navegable: true,
    distanciaDesdeDosHermanasKm: 40,
    tiempoCocheMin: 35,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales: EN_AREA_DELIMITADA,
    avisosSanitarios:
      "Sin apenas sombra: gorra, crema y agua de sobra, sobre todo de mayo a " +
      "septiembre. En verano hay motos acuáticas y embarcaciones de recreo; " +
      "ojo al pescar desde orilla en las zonas de paso.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: "https://www.embalses.net/pantano-1002-torre-del-aguila.html",
  },
  {
    slug: "jose-toran",
    provincia: "sevilla",
    nombre: "Embalse José Torán",
    tipo: "embalse",
    municipio: "La Puebla de los Infantes",
    latitud: 37.7936,
    longitud: -5.4283,
    descripcion:
      "El mejor embalse de la provincia para black bass y escenario habitual de " +
      "las competiciones de la federación sevillana. Aguas limpias sobre el río " +
      "Retortillo, con mucha estructura sumergida: piedra, troncos y ramas " +
      "donde se esconde el bass. Merece el viaje.",
    capacidadHm3: 113,
    accesoDescripcion:
      "Desde La Puebla de los Infantes por carretera local hasta la presa. " +
      "Varias entradas a orilla por pistas; algunas bajadas son empinadas.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: true,
    distanciaDesdeDosHermanasKm: 110,
    tiempoCocheMin: 75,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales:
      EN_AREA_DELIMITADA +
      " Al ser escenario de competición, comprueba el calendario federativo " +
      "antes de ir: puede haber jornadas con la orilla ocupada.",
    avisosSanitarios:
      "Bajadas a la orilla con pendiente y piedra suelta. Calzado con suela " +
      "agarrada.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: "https://www.embalses.net/pantano-1005-jose-toran.html",
  },
  {
    slug: "el-pintado",
    provincia: "sevilla",
    nombre: "Embalse de El Pintado",
    tipo: "embalse",
    municipio: "Cazalla de la Sierra",
    latitud: 37.9639,
    longitud: -5.9333,
    descripcion:
      "Dentro del Parque Natural Sierra Norte, sobre el río Viar. Unos 40 km de " +
      "perímetro, así que hay orilla para elegir y casi nunca está lleno de " +
      "gente. Predominan la carpa y el barbo; hay black bass, pero de tamaño " +
      "medio, no de récord. Buena infraestructura y entorno inmejorable.",
    capacidadHm3: 213,
    accesoDescripcion:
      "Por la A-432 y la carretera de El Pintado desde Cazalla de la Sierra. " +
      "Zona recreativa junto a la presa y varias pistas al resto del perímetro.",
    dificultadAcceso: "facil",
    tieneSombra: true,
    navegable: true,
    distanciaDesdeDosHermanasKm: 120,
    tiempoCocheMin: 90,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales:
      EN_AREA_DELIMITADA +
      " Está dentro del Parque Natural Sierra Norte de Sevilla: respeta la " +
      "normativa del parque, no se puede acampar ni hacer fuego fuera de las " +
      "zonas habilitadas.",
    avisosSanitarios:
      "Entorno de monte: en primavera y verano hay garrapatas y culebras. " +
      "Cobertura móvil irregular en buena parte del perímetro.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: "https://www.embalses.net/pantano-1004-el-pintado.html",
  },
  {
    slug: "la-minilla",
    provincia: "sevilla",
    nombre: "Embalse de La Minilla",
    tipo: "embalse",
    municipio: "El Ronquillo / Castilblanco de los Arroyos",
    latitud: 37.7167,
    longitud: -6.15,
    descripcion:
      "Embalse de abastecimiento sobre la Rivera de Huelva, con agua muy limpia. " +
      "Orillas de monte bajo y encinar. Buen sitio para carpa y barbo, con bass " +
      "en las entradas y en la estructura de piedra.",
    capacidadHm3: 58,
    accesoDescripcion:
      "Desde la A-433 (El Ronquillo) o desde Castilblanco. Pistas forestales " +
      "hasta las orillas; algunas con cadena o cortadas.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: false,
    distanciaDesdeDosHermanasKm: 70,
    tiempoCocheMin: 60,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales:
      EN_AREA_DELIMITADA +
      " Es embalse de abastecimiento de agua potable: el baño y la navegación " +
      "están prohibidos y hay tramos de orilla vallados. Respeta las señales.",
    avisosSanitarios:
      "Al ser agua de abastecimiento, no dejes ni un resto de sedal, plomo ni " +
      "engodo. Terreno con monte bajo, atención a las garrapatas.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: "https://www.embalses.net/pantano-1000-la-minilla.html",
  },
  {
    slug: "cala",
    provincia: "sevilla",
    nombre: "Embalse de Cala",
    tipo: "embalse",
    municipio: "Sierra Norte (Real de la Jara / Santa Olalla del Cala)",
    latitud: 37.9333,
    longitud: -6.2333,
    descripcion:
      "Embalse de abastecimiento en el extremo noroeste de la provincia, sobre " +
      "la Rivera de Cala. Aguas limpias, entorno de dehesa. El más lejano de los " +
      "de abastecimiento, pero muy tranquilo.",
    capacidadHm3: 58,
    accesoDescripcion:
      "Desde la N-630 / A-66 por Santa Olalla del Cala o El Real de la Jara. " +
      "Últimos kilómetros por pista.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: false,
    distanciaDesdeDosHermanasKm: 105,
    tiempoCocheMin: 80,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales:
      EN_AREA_DELIMITADA +
      " Embalse de abastecimiento: prohibido el baño y la navegación.",
    avisosSanitarios:
      "Zona de dehesa con ganado suelto: cierra las cancelas que abras. " +
      "Cobertura móvil pobre.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: "https://www.embalses.net/pantano-1006-cala.html",
  },
  {
    slug: "gergal",
    provincia: "sevilla",
    nombre: "Embalse del Gergal",
    tipo: "embalse",
    municipio: "Guillena",
    latitud: 37.6167,
    longitud: -6.1,
    descripcion:
      "El más cercano a Sevilla de los embalses de abastecimiento de la Rivera " +
      "de Huelva. Pequeño y muy accesible, buena opción para una mañana corta " +
      "sin hacer muchos kilómetros.",
    capacidadHm3: 35,
    accesoDescripcion:
      "Desde Guillena por la carretera de la Rivera de Huelva. Acceso rodado " +
      "cerca de la presa.",
    dificultadAcceso: "facil",
    tieneSombra: false,
    navegable: false,
    distanciaDesdeDosHermanasKm: 55,
    tiempoCocheMin: 50,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales:
      EN_AREA_DELIMITADA +
      " Embalse de abastecimiento: prohibido el baño y la navegación, y hay " +
      "zonas de protección junto a las instalaciones de captación.",
    avisosSanitarios: "Poca sombra en la orilla sur. Protección solar.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: "https://www.embalses.net/pantano-1001-el-gergal.html",
  },
  {
    slug: "huesna",
    provincia: "sevilla",
    nombre: "Embalse del Huesna",
    tipo: "embalse",
    municipio: "San Nicolás del Puerto",
    latitud: 37.95,
    longitud: -5.65,
    descripcion:
      "Embalse de abastecimiento en plena Sierra Norte, sobre el río Huéznar. " +
      "Aguas frías y limpias, con mucho barbo. Entorno de ribera con vegetación " +
      "espesa; la orilla no siempre es cómoda.",
    capacidadHm3: 135,
    accesoDescripcion:
      "Desde San Nicolás del Puerto o Constantina. Pistas hasta la presa y " +
      "algunas colas; el resto del vaso es de acceso complicado.",
    dificultadAcceso: "dificil",
    tieneSombra: true,
    navegable: false,
    distanciaDesdeDosHermanasKm: 110,
    tiempoCocheMin: 85,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales:
      EN_AREA_DELIMITADA +
      " Embalse de abastecimiento: prohibido el baño y la navegación. Parte del " +
      "entorno está dentro del Parque Natural Sierra Norte.",
    avisosSanitarios:
      "Orillas con pendiente, vegetación densa y piedra resbaladiza. Cobertura " +
      "móvil muy mala: descarga las fichas antes de salir de casa.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: "https://www.embalses.net/pantano-1007-huesna.html",
  },
  {
    slug: "cazalla-de-la-sierra",
    provincia: "sevilla",
    nombre: "Embalse de Cazalla de la Sierra",
    tipo: "embalse",
    municipio: "Cazalla de la Sierra",
    latitud: 37.9333,
    longitud: -5.7667,
    descripcion:
      "Embalse pequeño junto a Cazalla. Poca lámina de agua, pero está en el " +
      "listado de áreas delimitadas y se llega rápido desde el pueblo. Sirve " +
      "para combinar con una visita a la sierra más que como destino de día " +
      "entero.",
    capacidadHm3: 1.7,
    accesoDescripcion:
      "A pocos kilómetros del casco de Cazalla de la Sierra por carretera " +
      "local. Orilla accesible a pie.",
    dificultadAcceso: "facil",
    tieneSombra: true,
    navegable: false,
    distanciaDesdeDosHermanasKm: 100,
    tiempoCocheMin: 80,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales: EN_AREA_DELIMITADA,
    avisosSanitarios:
      "Lámina pequeña: en veranos secos puede quedar en muy poca agua y con la " +
      "orilla embarrada.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "los-molinos",
    provincia: "sevilla",
    nombre: "Embalse de Los Molinos",
    tipo: "embalse",
    municipio: "Castilblanco de los Arroyos",
    latitud: 37.6833,
    longitud: -6.0333,
    descripcion:
      "Embalse pequeño junto a Castilblanco de los Arroyos. Está en el listado " +
      "de áreas delimitadas y queda razonablemente cerca. Buen sitio de " +
      "iniciación: orilla cómoda y sin mucha gente entre semana.",
    capacidadHm3: 2,
    accesoDescripcion:
      "Desde Castilblanco de los Arroyos por camino asfaltado. Se aparca cerca " +
      "de la orilla.",
    dificultadAcceso: "facil",
    tieneSombra: true,
    navegable: false,
    distanciaDesdeDosHermanasKm: 65,
    tiempoCocheMin: 60,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales: EN_AREA_DELIMITADA,
    avisosSanitarios: "Sin avisos específicos. Orilla con vegetación baja.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "puebla-de-cazalla",
    provincia: "sevilla",
    nombre: "Embalse de la Puebla de Cazalla",
    tipo: "embalse",
    municipio: "La Puebla de Cazalla",
    latitud: 37.1833,
    longitud: -5.3167,
    descripcion:
      "Sobre el río Corbones, en la campiña. Aguas más turbias y cálidas que " +
      "las de la sierra, con mucha carpa. Alternativa a Torre del Águila cuando " +
      "aquel está muy bajo o muy concurrido.",
    capacidadHm3: 72,
    accesoDescripcion:
      "Desde La Puebla de Cazalla por la carretera de la presa. Caminos de " +
      "tierra hasta varias orillas.",
    dificultadAcceso: "facil",
    tieneSombra: false,
    navegable: true,
    distanciaDesdeDosHermanasKm: 65,
    tiempoCocheMin: 50,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales: EN_AREA_DELIMITADA,
    avisosSanitarios:
      "Campiña abierta, sin sombra y con mucho calor de junio a septiembre. " +
      "En agua caliente y quieta pueden aparecer floraciones de algas: si el " +
      "agua está verde y con espuma, no toques el pescado ni metas las manos.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: "https://www.embalses.net/pantano-1003-la-puebla-de-cazalla.html",
  },
  {
    slug: "agrio",
    provincia: "sevilla",
    nombre: "Embalse del Agrio",
    tipo: "embalse",
    municipio: "Aznalcóllar",
    latitud: 37.5167,
    longitud: -6.2833,
    descripcion:
      "Embalse en la zona afectada por el vertido de la mina de Boliden de 1998. " +
      "Está en el listado de áreas delimitadas para invasoras, pero el problema " +
      "aquí no es legal sino sanitario. Solo captura y suelta.",
    capacidadHm3: 35,
    accesoDescripcion:
      "Desde Aznalcóllar por la carretera de la mina. Parte del entorno tiene " +
      "accesos restringidos por los trabajos de restauración.",
    dificultadAcceso: "media",
    tieneSombra: false,
    navegable: false,
    distanciaDesdeDosHermanasKm: 60,
    tiempoCocheMin: 55,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales:
      EN_AREA_DELIMITADA +
      " Comprueba antes de ir qué accesos están abiertos: hay zonas del entorno " +
      "minero con restricciones.",
    avisosSanitarios:
      "AVISO SANITARIO GRAVE. Zona del vertido minero de Boliden (Aznalcóllar, " +
      "1998). Se ha documentado drenaje de aguas ácidas de mina con metales " +
      "pesados en la cuenca del Agrio. NO CONSUMIR NADA de lo que se pesque " +
      "aquí, bajo ningún concepto, ni pescado ni cangrejo. Solo captura y " +
      "suelta. Evita el contacto prolongado con el agua y lávate las manos " +
      "antes de comer o beber.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
  {
    slug: "guadaira-oromana",
    provincia: "sevilla",
    nombre: "Río Guadaíra — Oromana",
    tipo: "rio",
    municipio: "Alcalá de Guadaíra",
    latitud: 37.3333,
    longitud: -5.85,
    descripcion:
      "El agua más cercana a casa: veinte minutos de coche. Está dentro del " +
      "Monumento Natural Riberas del Guadaíra, un tramo de ribera precioso con " +
      "los molinos históricos. Ojo: no todo el tramo se puede pescar y NO está " +
      "en las áreas delimitadas para invasoras, así que el black bass y la carpa " +
      "tienen aquí un tratamiento distinto al de los embalses.",
    capacidadHm3: null,
    accesoDescripcion:
      "A pie desde Oromana o desde el parque de Riberas del Guadaíra en Alcalá " +
      "de Guadaíra. Sendas llanas junto al cauce, muy cómodas.",
    dificultadAcceso: "facil",
    tieneSombra: true,
    navegable: false,
    distanciaDesdeDosHermanasKm: 18,
    tiempoCocheMin: 20,
    esAreaDelimitadaEEI: false,
    eeiComprobado: true,
    notasLegales:
      "VERIFICAR CON EL AYUNTAMIENTO ANTES DE IR. La zona municipal habilitada " +
      "para la pesca es el tramo Molino de la Aceña – Molino del Realaje. " +
      "Oromana queda en zona restringida de protección del cauce, dentro del " +
      "Monumento Natural Riberas del Guadaíra. " +
      AVISO_FUERA_DE_AREA_DELIMITADA,
    avisosSanitarios:
      "El Guadaíra recibe vertidos urbanos y agrícolas aguas arriba y su " +
      "calidad del agua es variable. No es un tramo para llevarse pescado a " +
      "casa. Lávate las manos antes de comer.",
    mejorEpoca: [3, 4, 5, 10, 11],
    urlNivelAgua: null,
  },
  {
    slug: "guadalquivir-cantillana-alcala-del-rio",
    provincia: "sevilla",
    nombre: "Río Guadalquivir — de Cantillana a Alcalá del Río",
    tipo: "rio",
    municipio: "Cantillana / Villaverde del Río / Alcalá del Río",
    latitud: 37.5833,
    longitud: -5.9333,
    descripcion:
      "Tramo del Guadalquivir entre las presas de Cantillana y Alcalá del Río, " +
      "incluido en las áreas delimitadas para especies exóticas invasoras. Río " +
      "grande y ancho, con mucha vida: barbo, carpa, alburno y los grandes " +
      "depredadores invasores. Buen sitio para pesca de fondo.",
    capacidadHm3: null,
    accesoDescripcion:
      "Varios accesos desde Cantillana, Villaverde del Río y Alcalá del Río. " +
      "Caminos de servicio junto al río y algunos malecones.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: true,
    distanciaDesdeDosHermanasKm: 45,
    tiempoCocheMin: 40,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales:
      EN_AREA_DELIMITADA +
      " El área delimitada es exactamente el tramo entre las presas de " +
      "Cantillana y Alcalá del Río: fuera de esas dos presas ya no aplica.",
    avisosSanitarios:
      "Río de gran caudal, con corriente y sueltas de las presas que pueden " +
      "subir el nivel de golpe. No te metas al agua y mantente en orillas " +
      "firmes. Calidad del agua variable por vertidos y agricultura.",
    mejorEpoca: TEMPORADA_LARGA,
    urlNivelAgua: null,
  },
  {
    slug: "viar-melonares-cantillana",
    provincia: "sevilla",
    nombre: "Río Viar — de Melonares a Cantillana",
    tipo: "rio",
    municipio: "Castilblanco de los Arroyos / Villaverde del Río / Cantillana",
    latitud: 37.75,
    longitud: -5.85,
    descripcion:
      "Tramo del Viar desde la presa de Melonares hasta su desembocadura en " +
      "Cantillana, dentro de las áreas delimitadas para invasoras. Río de " +
      "sierra que se va abriendo: pozas, tablas y correderas. Mucho barbo y " +
      "boga, y bass en las pozas más profundas.",
    capacidadHm3: null,
    accesoDescripcion:
      "Accesos desde Castilblanco de los Arroyos, Villaverde del Río y " +
      "Cantillana. Muchos tramos solo se alcanzan andando por la ribera.",
    dificultadAcceso: "media",
    tieneSombra: true,
    navegable: false,
    distanciaDesdeDosHermanasKm: 60,
    tiempoCocheMin: 50,
    esAreaDelimitadaEEI: true,
    eeiComprobado: true,
    notasLegales:
      EN_AREA_DELIMITADA +
      " El área delimitada llega desde la presa de Melonares hasta Cantillana: " +
      "aguas arriba de Melonares ya no aplica.",
    avisosSanitarios:
      "Sueltas desde la presa de Melonares: el nivel puede subir sin aviso. No " +
      "vadees. Buena parte de la ribera es finca privada, respeta los cierres.",
    mejorEpoca: PRIMAVERA_Y_OTONO,
    urlNivelAgua: null,
  },
];

/**
 * Los sitios de las otras siete provincias andaluzas. Llegan sin las
 * distancias desde Dos Hermanas, que se calculan aquí, y todos con
 * `eeiComprobado: false`: nadie ha mirado todavía si salen en el listado de
 * áreas delimitadas de su provincia.
 */
for (const s of [...SITIOS_CADIZ, ...SITIOS_ANDALUCIA]) {
  const km = Math.round(distanciaKm(DOS_HERMANAS, s) * 1.3);
  SITIOS.push({
    ...s,
    distanciaDesdeDosHermanasKm: km,
    tiempoCocheMin: tiempoEnCocheAprox(distanciaKm(DOS_HERMANAS, s)),
  });
}

// ---------------------------------------------------------------------------
// Especies
// ---------------------------------------------------------------------------

type EspecieSeed = {
  slug: string;
  nombreComun: string;
  nombreCientifico: string;
  esAutoctona: boolean;
  estadoLegal:
    | "pescable"
    | "devolucion_obligatoria"
    | "prohibida"
    | "invasora_area_delimitada"
    | "invasora_no_pescable";
  tallaMinimaCm: number | null;
  comestible: "si" | "no" | "desaconsejado";
  notasComestibilidad: string;
  notasLegales: string;
  descripcion: string;
  comoPescarla: string;
};

const SOLO_EN_AREA =
  "Especie exótica invasora catalogada. Solo se puede pescar dentro de las " +
  "áreas delimitadas de la provincia. Fuera de ellas, si se captura, hay " +
  "obligación de sacrificarla y no devolverla al agua. Áreas delimitadas en " +
  `Sevilla: ${TEXTO_AREAS_DELIMITADAS_EEI}`;

const ESPECIES: EspecieSeed[] = [
  {
    slug: "black-bass",
    nombreComun: "Black bass",
    nombreCientifico: "Micropterus salmoides",
    esAutoctona: false,
    estadoLegal: "invasora_area_delimitada",
    tallaMinimaCm: null,
    comestible: "si",
    notasComestibilidad:
      "La mejor carne de todas las que se pescan aquí: blanca, firme y con " +
      "pocas espinas. Si lo capturas en un sitio donde es legal quedárselo, es " +
      "el que mejor va a la sartén.",
    notasLegales:
      SOLO_EN_AREA +
      " Es la especie estrella de los embalses sevillanos precisamente porque " +
      "casi todos están dentro del área delimitada.",
    descripcion:
      "Depredador de emboscada de origen norteamericano, verde oliva con una " +
      "banda oscura irregular en el costado y una boca enorme. Vive pegado a " +
      "la estructura: piedra, troncos, vegetación sumergida y cambios de " +
      "profundidad. Pelea fuerte y salta fuera del agua.",
    comoPescarla:
      "Spinning con vinilos y señuelos duros. En primavera y otoño, a poca " +
      "profundidad y pegado a la estructura. Amanecer y atardecer son las " +
      "mejores horas, y es cuando entran los señuelos de superficie. Con calor " +
      "y sol alto se va al fondo y hay que buscarlo con texas rig o vinilo a " +
      "cabeza plomada, muy despacio.",
  },
  {
    slug: "carpa-comun",
    nombreComun: "Carpa común",
    nombreCientifico: "Cyprinus carpio",
    esAutoctona: false,
    estadoLegal: "invasora_area_delimitada",
    tallaMinimaCm: null,
    comestible: "desaconsejado",
    notasComestibilidad:
      "Muy espinosa y con sabor a fango, sobre todo la pescada en agua caliente " +
      "y quieta, que es casi toda la de aquí en verano. Se puede comer, pero no " +
      "compensa el trabajo.",
    notasLegales: SOLO_EN_AREA,
    descripcion:
      "El pez más abundante de la provincia. Robusta, de escamas grandes y con " +
      "dos pares de barbillones en la boca. Come del fondo, hozando en el " +
      "légamo. Aguanta agua caliente, turbia y de mala calidad mejor que " +
      "ninguna otra, por eso está en todas partes.",
    comoPescarla:
      "Pesca de fondo con montaje corredizo y maíz dulce, masilla o lombriz. " +
      "Cebar el puesto con antelación cambia el resultado por completo. Es la " +
      "captura más segura para no volver de vacío y la mejor para empezar.",
  },
  {
    slug: "lucio",
    nombreComun: "Lucio",
    nombreCientifico: "Esox lucius",
    esAutoctona: false,
    estadoLegal: "invasora_area_delimitada",
    tallaMinimaCm: null,
    comestible: "si",
    notasComestibilidad:
      "Carne blanca y sabrosa, pero muy espinosa: tiene espinas en Y difíciles " +
      "de quitar. Se aprovecha mejor en quenelles o picado que en filete.",
    notasLegales: SOLO_EN_AREA,
    descripcion:
      "Depredador alargado, verdoso con manchas claras, hocico de pato y una " +
      "dentadura impresionante. Caza al acecho entre la vegetación de las colas " +
      "y las zonas someras. Menos frecuente que el bass en Sevilla, pero cae.",
    comoPescarla:
      "Spinning con vinilos grandes y spinnerbait, cerca de la vegetación. " +
      "Usa siempre un bajo de acero o de fluorocarbono grueso: sus dientes " +
      "cortan el nailon normal en un segundo. Mucho cuidado al desanzuelar.",
  },
  {
    slug: "trucha-arcoiris",
    nombreComun: "Trucha arcoíris",
    nombreCientifico: "Oncorhynchus mykiss",
    esAutoctona: false,
    estadoLegal: "invasora_area_delimitada",
    tallaMinimaCm: null,
    comestible: "si",
    notasComestibilidad:
      "Buena carne, la de siempre. Poco frecuente en aguas libres de Sevilla: " +
      "los ejemplares que aparecen suelen venir de sueltas o escapes.",
    notasLegales: SOLO_EN_AREA,
    descripcion:
      "Trucha de origen norteamericano, con la banda rosada característica en " +
      "el costado y el cuerpo cubierto de puntos negros. Necesita agua fría y " +
      "bien oxigenada, así que en Sevilla es rara fuera de los tramos altos de " +
      "la sierra.",
    comoPescarla:
      "Cucharilla, pequeños señuelos y mosca en agua fría. No es una especie a " +
      "la que se pueda salir a buscar con expectativas en esta provincia.",
  },
  {
    slug: "barbo",
    nombreComun: "Barbo",
    nombreCientifico: "Luciobarbus sclateri",
    esAutoctona: true,
    estadoLegal: "devolucion_obligatoria",
    tallaMinimaCm: null,
    comestible: "no",
    notasComestibilidad:
      "SUS HUEVAS SON TÓXICAS. La ingesta de huevas de barbo produce un cuadro " +
      "digestivo agudo. Además su devolución es obligatoria, así que no debe " +
      "consumirse en ningún caso.",
    notasLegales:
      "Especie autóctona de la cuenca del Guadalquivir con devolución " +
      "obligatoria. Devuélvelo al agua con el menor daño posible: mójate las " +
      "manos antes de tocarlo, no lo dejes en la tierra ni en la piedra " +
      "caliente y sujétalo en el agua hasta que se vaya solo. Anzuelos sin " +
      "muerte o con la muerte aplastada facilitan mucho las cosas.",
    descripcion:
      "El gran pez autóctono de nuestros ríos. Cuerpo alargado y musculoso, " +
      "dorado oscuro, con cuatro barbillones y la boca ventral para comer del " +
      "fondo. Vive en corrientes y tablas de los ríos y en las colas de los " +
      "embalses. Pelea de forma tremenda, a tirones largos.",
    comoPescarla:
      "Pesca de fondo o feeder con lombriz, maíz o masilla, cebando con engodo " +
      "de barbo, pellets o cáñamo. Busca las tablas con algo de corriente y los " +
      "cambios de fondo. De las mejores peleas que vas a tener, y encima se " +
      "devuelve, así que no hay culpa.",
  },
  {
    slug: "boga-de-rio",
    nombreComun: "Boga de río",
    nombreCientifico: "Pseudochondrostoma willkommii",
    esAutoctona: true,
    estadoLegal: "devolucion_obligatoria",
    tallaMinimaCm: null,
    comestible: "no",
    notasComestibilidad:
      "No se consume. Su devolución al agua es obligatoria.",
    notasLegales:
      "Especie autóctona con devolución obligatoria. Manéjala con las manos " +
      "mojadas y devuélvela de inmediato: es un pez delicado que se estresa " +
      "rápido.",
    descripcion:
      "Ciprínido esbelto y plateado, de boca ínfera con el labio inferior " +
      "recto y córneo, que usa para raspar las algas de las piedras. Vive en " +
      "bancos en aguas corrientes y limpias. Muy sensible a la contaminación, " +
      "así que su presencia es buena señal.",
    comoPescarla:
      "Cae de forma incidental pescando barbo con cebos pequeños de fondo. No " +
      "se busca dirigidamente.",
  },
  {
    slug: "trucha-comun",
    nombreComun: "Trucha común",
    nombreCientifico: "Salmo trutta",
    esAutoctona: true,
    estadoLegal: "devolucion_obligatoria",
    tallaMinimaCm: null,
    comestible: "no",
    notasComestibilidad:
      "No se consume: su devolución al agua es obligatoria.",
    notasLegales:
      "Especie autóctona con devolución obligatoria. Las poblaciones del sur " +
      "peninsular están en retroceso. Devuélvela sin sacarla del agua si " +
      "puedes, y nunca con las manos secas.",
    descripcion:
      "La trucha de toda la vida: cuerpo fusiforme con puntos negros y rojos " +
      "rodeados de un halo claro. Necesita agua fría, limpia y bien oxigenada. " +
      "En Sevilla solo queda en cabeceras de la Sierra Norte, y es rara.",
    comoPescarla:
      "No es una especie a la que salir a buscar aquí. Si aparece pescando " +
      "otra cosa en un tramo alto de sierra, devuélvela de inmediato.",
  },
  {
    slug: "cacho",
    nombreComun: "Cacho",
    nombreCientifico: "Squalius pyrenaicus",
    esAutoctona: true,
    estadoLegal: "prohibida",
    tallaMinimaCm: null,
    comestible: "no",
    notasComestibilidad: "No se consume. Su pesca está prohibida.",
    notasLegales:
      "PESCA PROHIBIDA. Especie autóctona amenazada. Si cae por accidente, " +
      "devuélvela al agua de inmediato y con el mayor cuidado.",
    descripcion:
      "Ciprínido autóctono de tamaño medio, gris verdoso por el lomo y " +
      "plateado por los costados, con escamas grandes y bien marcadas. Vive en " +
      "pozas y remansos de los ríos de la sierra. Sus poblaciones están en " +
      "declive por la pérdida de hábitat y las especies invasoras.",
    comoPescarla:
      "No se pesca. Si pica con cebo pequeño mientras buscas barbo, suéltalo " +
      "sin sacarlo del agua.",
  },
  {
    slug: "tenca",
    nombreComun: "Tenca",
    nombreCientifico: "Tinca tinca",
    esAutoctona: true,
    estadoLegal: "prohibida",
    tallaMinimaCm: null,
    comestible: "no",
    notasComestibilidad: "No se consume. Su pesca está prohibida.",
    notasLegales:
      "PESCA PROHIBIDA. Devuélvela al agua de inmediato si cae por accidente.",
    descripcion:
      "Pez de fondo, verde oliva oscuro, casi bronce, de piel muy resbaladiza " +
      "por la capa de mucosidad y con la aleta caudal recta. Vive en aguas " +
      "quietas, someras y con mucha vegetación, y en fondos de fango.",
    comoPescarla:
      "No se pesca. Puede caer de forma incidental en pesca de fondo con maíz o " +
      "lombriz en zonas de vegetación.",
  },
  {
    slug: "anguila-europea",
    nombreComun: "Anguila europea",
    nombreCientifico: "Anguilla anguilla",
    esAutoctona: true,
    estadoLegal: "prohibida",
    tallaMinimaCm: null,
    comestible: "no",
    notasComestibilidad:
      "No se consume. Su pesca está prohibida y la especie está en peligro " +
      "crítico de extinción.",
    notasLegales:
      "PESCA PROHIBIDA. Especie en peligro crítico. Si se engancha, DEVUÉLVELA " +
      "SIN SACARLA DEL AGUA: corta el bajo de línea lo más cerca posible del " +
      "anzuelo y déjala marchar. Sacarla, manipularla y quitarle la mucosidad " +
      "de la piel le hace más daño que dejarle el anzuelo puesto.",
    descripcion:
      "Pez serpentiforme, de piel muy resbaladiza, sin aletas pélvicas. Hace " +
      "un ciclo vital extraordinario: nace en el mar de los Sargazos, cruza el " +
      "Atlántico, crece años en nuestros ríos y vuelve al Atlántico a " +
      "reproducirse. Las presas le cortan el paso, y por eso está como está.",
    comoPescarla:
      "No se pesca. Es una captura incidental en pesca nocturna de fondo con " +
      "lombriz en tramos bajos del río.",
  },
  {
    slug: "carpin",
    nombreComun: "Carpín",
    nombreCientifico: "Carassius auratus",
    esAutoctona: false,
    estadoLegal: "pescable",
    tallaMinimaCm: null,
    comestible: "desaconsejado",
    notasComestibilidad:
      "Muy espinoso, pequeño y con sabor a fango. Técnicamente comestible, en " +
      "la práctica no compensa.",
    notasLegales:
      "Especie exótica no catalogada como invasora: se puede pescar. Al no ser " +
      "autóctona, no hay obligación de devolverla, pero tampoco de sacrificarla.",
    descripcion:
      "Pariente pequeño de la carpa, sin barbillones y de color que va del " +
      "bronce al dorado. Es el pez rojo de acuario asilvestrado. Aguanta " +
      "condiciones malísimas de agua y se reproduce muy rápido, así que aparece " +
      "en aguas quietas y turbias por todas partes.",
    comoPescarla:
      "Cae solo pescando carpa a fondo con maíz o masilla, normalmente cuando " +
      "usas cebos y anzuelos pequeños.",
  },
  {
    slug: "alburno",
    nombreComun: "Alburno",
    nombreCientifico: "Alburnus alburnus",
    esAutoctona: false,
    estadoLegal: "invasora_no_pescable",
    tallaMinimaCm: null,
    comestible: "no",
    notasComestibilidad:
      "Demasiado pequeño y espinoso para tener interés gastronómico.",
    notasLegales:
      "Especie exótica invasora catalogada. No aparece en el listado de " +
      "especies que sí pueden pescarse en las áreas delimitadas de Sevilla " +
      "(black bass, lucio, carpa común y trucha arcoíris), así que no debe " +
      "buscarse dirigidamente y no debe devolverse al agua si se captura. " +
      "VERIFICA este punto en la orden de vedas vigente antes de salir.",
    descripcion:
      "Pececillo plateado y muy delgado, de 10 a 15 cm, que va en bandos " +
      "enormes cerca de la superficie. Introducido como cebo vivo, se ha " +
      "comido literalmente los ríos: compite con los alevines de las especies " +
      "autóctonas y ha desplazado a la boga y al cacho en tramos enteros.",
    comoPescarla:
      "No se busca. Se engancha solo, sin parar, cuando cebas para barbo o " +
      "carpa: si notas picadas rapidísimas que no llegan a nada, son ellos.",
  },
  {
    slug: "lucioperca",
    nombreComun: "Lucioperca",
    nombreCientifico: "Sander lucioperca",
    esAutoctona: false,
    estadoLegal: "invasora_no_pescable",
    tallaMinimaCm: null,
    comestible: "desaconsejado",
    notasComestibilidad:
      "No procede planteárselo: no es una especie que se pueda pescar " +
      "dirigidamente en esta provincia.",
    notasLegales:
      "Especie exótica invasora catalogada NO incluida entre las pescables en " +
      "las áreas delimitadas de Sevilla. No se puede salir a buscarla. Si cae " +
      "por accidente, NO debe devolverse al agua.",
    descripcion:
      "Depredador de la familia de las percas, alargado, gris verdoso con " +
      "bandas verticales oscuras, dos aletas dorsales y unos ojos grandes y " +
      "opacos adaptados a cazar con poca luz. Caza al amanecer, al atardecer y " +
      "de noche, en fondos profundos.",
    comoPescarla:
      "No se pesca dirigidamente. Puede caer con vinilo a cabeza plomada cerca " +
      "del fondo cuando se busca black bass en el Guadalquivir.",
  },
  {
    slug: "siluro",
    nombreComun: "Siluro",
    nombreCientifico: "Silurus glanis",
    esAutoctona: false,
    estadoLegal: "invasora_no_pescable",
    tallaMinimaCm: null,
    comestible: "desaconsejado",
    notasComestibilidad:
      "No procede planteárselo: no es una especie que se pueda pescar " +
      "dirigidamente en esta provincia. Además acumula contaminantes por su " +
      "tamaño y su longevidad.",
    notasLegales:
      "Especie exótica invasora catalogada NO incluida entre las pescables en " +
      "las áreas delimitadas de Sevilla. No se puede salir a buscarlo. Si cae " +
      "por accidente, NO debe devolverse al agua.",
    descripcion:
      "El pez de agua dulce más grande de Europa: puede superar los dos metros. " +
      "Sin escamas, de piel oscura y viscosa, boca enorme y seis barbillones. " +
      "Come literalmente de todo, y donde se asienta arrasa con el resto de la " +
      "fauna del río.",
    comoPescarla:
      "No se pesca dirigidamente. Si engancha uno grande en pesca de fondo, no " +
      "fuerces el equipo: no merece la pena partir una caña por un pez que " +
      "además no puedes devolver.",
  },
  {
    slug: "cangrejo-rojo-americano",
    nombreComun: "Cangrejo rojo americano",
    nombreCientifico: "Procambarus clarkii",
    esAutoctona: false,
    estadoLegal: "invasora_no_pescable",
    tallaMinimaCm: null,
    comestible: "desaconsejado",
    notasComestibilidad:
      "No procede: su captura no está autorizada. Además acumula metales " +
      "pesados del sedimento, y en un sitio como el embalse del Agrio eso es un " +
      "problema serio.",
    notasLegales:
      "NO PESCABLE desde la Orden de 13 de enero de 2023. Su captura solo está " +
      "permitida a controladores autorizados en las Marismas del Guadalquivir. " +
      "OJO: hay muchísima información desactualizada en internet y en foros que " +
      "dice lo contrario, porque su captura SÍ estuvo autorizada en Torre del " +
      "Águila y José Torán hasta 2023. No te fíes de guías antiguas.",
    descripcion:
      "El cangrejo rojo de las marismas, introducido en los años setenta y hoy " +
      "presente en toda la cuenca. Rojo oscuro, con pinzas granulosas. Está " +
      "detrás de la desaparición del cangrejo de río autóctono, al que " +
      "transmite la afanomicosis, y remueve el fondo enturbiando el agua.",
    comoPescarla:
      "No se pesca. Si te roba el cebo de fondo una y otra vez, mueve el puesto " +
      "o sube el cebo del fondo.",
  },
];

// ---------------------------------------------------------------------------
// Técnicas
// ---------------------------------------------------------------------------

const TECNICAS = [
  {
    slug: "spinning",
    nombre: "spinning",
    descripcion:
      "Lanzar y recoger un señuelo artificial con caña ligera. Es pesca activa: " +
      "se anda la orilla buscando al pez en vez de esperarlo. La técnica para " +
      "black bass y lucio.",
  },
  {
    slug: "fondo",
    nombre: "fondo",
    descripcion:
      "Cebo natural posado en el fondo con un plomo, esperando la picada. La " +
      "más sencilla para empezar y la que mejor funciona con carpa y barbo. " +
      "Permite tener dos cañas puestas y estar tranquilo.",
  },
  {
    slug: "superficie",
    nombre: "superficie",
    descripcion:
      "Señuelos que trabajan sobre la lámina de agua: popper, paseante. Solo " +
      "funcionan al amanecer, al atardecer y con poca luz, pero la picada se ve " +
      "y es lo más espectacular que hay.",
  },
  {
    slug: "feeder",
    nombre: "feeder",
    descripcion:
      "Pesca de fondo con un cestillo de engodo junto al anzuelo, de modo que " +
      "cada lance ceba el puesto. Muy eficaz para barbo y carpa en río, y " +
      "bastante más fina que el fondo clásico.",
  },
];

// ---------------------------------------------------------------------------
// Aparejos
// ---------------------------------------------------------------------------

type AparejoSeed = {
  slug: string;
  nombre: string;
  tipo: "vinilo" | "senuelo_duro" | "cebo_natural" | "engodo" | "montaje";
  descripcion: string;
  precioAproxEur: number | null;
};

const APAREJOS: AparejoSeed[] = [
  // --- Vinilos ---
  {
    slug: "vinilo-shad-verde-sandia",
    nombre: "Vinilo shad 7-8 cm — verde sandía",
    tipo: "vinilo",
    descripcion:
      "El vinilo comodín. Imita a un pececillo y el color verde sandía funciona " +
      "en casi cualquier condición, sobre todo con agua clara y sol. Se monta a " +
      "cabeza plomada o en texas rig. Si solo puedes llevar uno, lleva este.",
    precioAproxEur: 5,
  },
  {
    slug: "vinilo-shad-blanco",
    nombre: "Vinilo shad 7-8 cm — blanco",
    tipo: "vinilo",
    descripcion:
      "Para agua con algo de turbidez o días nublados. El blanco se ve desde " +
      "lejos e imita bien al alburno, que es de lo que come el bass aquí.",
    precioAproxEur: 5,
  },
  {
    slug: "vinilo-shad-chartreuse",
    nombre: "Vinilo shad 7-8 cm — chartreuse",
    tipo: "vinilo",
    descripcion:
      "Amarillo verdoso fluorescente. Para agua turbia, después de lluvias o " +
      "en embalses de campiña. Cuando el agua está sucia, este color es de los " +
      "pocos que se ven.",
    precioAproxEur: 5,
  },
  {
    slug: "vinilo-senko-negro",
    nombre: "Vinilo gusano / senko 9-10 cm — negro",
    tipo: "vinilo",
    descripcion:
      "Gusano de caída lenta. No hay que animarlo casi nada: se lanza, se deja " +
      "caer y el propio vinilo se contonea. El negro recorta muy bien contra la " +
      "luz. Mano de santo cuando el bass no quiere nada.",
    precioAproxEur: 6,
  },
  {
    slug: "vinilo-senko-sandia-purpurina",
    nombre: "Vinilo gusano / senko 9-10 cm — sandía con purpurina",
    tipo: "vinilo",
    descripcion:
      "El mismo gusano, en el color más natural del catálogo. La purpurina " +
      "manda destellos discretos. Para agua clara y peces desconfiados, montado " +
      "en texas rig y trabajado muy despacio.",
    precioAproxEur: 6,
  },
  // --- Señuelos duros ---
  {
    slug: "popper-superficie",
    nombre: "Popper de superficie 6-7 cm",
    tipo: "senuelo_duro",
    descripcion:
      "Señuelo de superficie con la boca cóncava: al tirar de él hace un 'plop' " +
      "y salpica. Se trabaja a tirones cortos con pausas largas. Al amanecer, " +
      "sobre vegetación o piedra, es lo más divertido que se puede hacer con " +
      "una caña.",
    precioAproxEur: 9,
  },
  {
    slug: "paseante-superficie",
    nombre: "Paseante (walker) de superficie 6-7 cm",
    tipo: "senuelo_duro",
    descripcion:
      "Señuelo de superficie sin labio que zigzaguea de lado a lado al " +
      "recogerlo a tirones rítmicos. Cubre más agua que el popper y es mejor " +
      "para buscar peces activos en zonas amplias y con algo de rizo.",
    precioAproxEur: 10,
  },
  {
    slug: "crankbait-pequeno",
    nombre: "Crankbait pequeño",
    tipo: "senuelo_duro",
    descripcion:
      "Señuelo con labio que se hunde al recogerlo y vibra mucho. Sirve para " +
      "peinar rápido una orilla y localizar peces. Va bien rozando la piedra: " +
      "los golpes contra el fondo provocan picadas.",
    precioAproxEur: 8,
  },
  {
    slug: "spinnerbait-blanco",
    nombre: "Spinnerbait blanco",
    tipo: "senuelo_duro",
    descripcion:
      "Alambre en V con palas giratorias y una falda de silicona. Casi no se " +
      "engancha, así que se puede pasar por encima de ramas y vegetación donde " +
      "no entra otra cosa. Muy bueno con agua turbia y para lucio.",
    precioAproxEur: 8,
  },
  // --- Montajes ---
  {
    slug: "texas-rig",
    nombre: "Texas rig (plomo bala + anzuelo offset)",
    tipo: "montaje",
    descripcion:
      "Plomo de bala corredizo sobre la línea y anzuelo offset con la punta " +
      "escondida dentro del vinilo. Al quedar la punta oculta, pasa por ramas y " +
      "vegetación sin engancharse. El montaje básico para pescar bass en la " +
      "estructura.",
    precioAproxEur: 4,
  },
  {
    slug: "cabeza-plomada",
    nombre: "Cabeza plomada (jig head)",
    tipo: "montaje",
    descripcion:
      "Anzuelo con el plomo fundido en la cabeza, para ensartar el vinilo. " +
      "Sencillo, barato y directo. Cambiando el peso se controla a qué " +
      "profundidad trabaja: ligera para agua somera, pesada para el fondo en " +
      "verano.",
    precioAproxEur: 3,
  },
  {
    slug: "montaje-fondo-corredizo",
    nombre: "Montaje de fondo corredizo",
    tipo: "montaje",
    descripcion:
      "Plomo de oliva corredizo, perla de goma para proteger el nudo, " +
      "emerillón, bajo de fluorocarbono de 40-60 cm y anzuelo. Al ser corredizo, " +
      "el pez se lleva el cebo sin notar el peso del plomo. El montaje de toda " +
      "la vida para carpa y barbo.",
    precioAproxEur: 4,
  },
  // --- Cebos naturales ---
  {
    slug: "maiz-dulce",
    nombre: "Maíz dulce",
    tipo: "cebo_natural",
    descripcion:
      "Una lata de maíz del supermercado. Barato, visible, dulce y aguanta bien " +
      "en el anzuelo. El cebo número uno para carpa, y también entra el barbo. " +
      "Dos o tres granos en el anzuelo y unos puñados al agua para cebar.",
    precioAproxEur: 1,
  },
  {
    slug: "lombriz-de-tierra",
    nombre: "Lombriz de tierra",
    tipo: "cebo_natural",
    descripcion:
      "El cebo universal: se mueve, huele y se lo come todo el mundo. " +
      "Imbatible para barbo. Se puede coger del propio jardín o comprar en la " +
      "tienda. Guárdala en tierra húmeda y a la sombra.",
    precioAproxEur: 3,
  },
  {
    slug: "masilla-pan-matalahuva",
    nombre: "Masilla de pan con matalahúva",
    tipo: "cebo_natural",
    descripcion:
      "Miga de pan amasada con unas gotas de agua y matalahúva (anís) hasta " +
      "hacer una pasta. Cebo clásico andaluz para carpa y barbo. Se hace en " +
      "casa por céntimos y el olor a anís llega lejos en el agua.",
    precioAproxEur: 1,
  },
  {
    slug: "pan",
    nombre: "Pan",
    tipo: "cebo_natural",
    descripcion:
      "Miga o corteza directamente en el anzuelo. La corteza flota, así que " +
      "sirve para pescar carpas en superficie en verano, que es una pesca muy " +
      "visual. Lo más barato que existe.",
    precioAproxEur: 1,
  },
  // --- Engodos ---
  {
    slug: "engodo-de-barbo",
    nombre: "Engodo de barbo",
    tipo: "engodo",
    descripcion:
      "Mezcla comercial de harinas y semillas específica para barbo. Se amasa " +
      "con agua del propio río hasta que se puedan hacer bolas que aguanten el " +
      "lance y se deshagan en el fondo. Cebar el puesto media hora antes cambia " +
      "la jornada.",
    precioAproxEur: 5,
  },
  {
    slug: "pellets-halibut",
    nombre: "Pellets de halibut 4-6 mm",
    tipo: "engodo",
    descripcion:
      "Pellets muy grasos y olorosos que se disuelven despacio, así que " +
      "mantienen el puesto cebado mucho tiempo sin llenar al pez. Muy buenos " +
      "para carpa grande y barbo. Se pueden usar también como cebo con banda " +
      "de goma.",
    precioAproxEur: 6,
  },
  {
    slug: "canamo-tostado",
    nombre: "Cáñamo tostado",
    tipo: "engodo",
    descripcion:
      "Semilla pequeña, tostada y cocida, con un olor que vuelve loca a la " +
      "carpa. Mantiene al pez hozando en el puesto mucho rato porque los granos " +
      "son diminutos y no lo sacian. Se echa a puñados, mezclado con el engodo.",
    precioAproxEur: 4,
  },
];

// ---------------------------------------------------------------------------
// Relaciones sitio <-> especie
// ---------------------------------------------------------------------------

type Prob = "alta" | "media" | "baja";
type FilaSitioEspecie = [
  especieSlug: string,
  abundancia: number,
  probabilidad: Prob,
  mejorTecnica: string,
  notas: string,
];

const ESPECIES_POR_SITIO: Record<string, FilaSitioEspecie[]> = {
  "torre-del-aguila": [
    ["carpa-comun", 5, "alta", "fondo", "Por todas partes. Es la captura segura del sitio."],
    ["black-bass", 4, "alta", "spinning", "Busca los restos de vegetación y los cambios de nivel que deja el riego."],
    ["cangrejo-rojo-americano", 5, "alta", "", "No pescable desde 2023, aunque muchas guías antiguas digan lo contrario. Te robará el cebo sin parar."],
    ["alburno", 3, "media", "", "Bandos grandes cerca de superficie. Se enganchan solos al cebar."],
    ["carpin", 3, "media", "fondo", "Cae con cebo y anzuelo pequeños mientras buscas carpa."],
    ["barbo", 2, "baja", "fondo", "Menos que en río. Devolución obligatoria."],
    ["lucio", 2, "baja", "spinning", "Poco frecuente, pero está. Bajo de acero por si acaso."],
  ],
  "jose-toran": [
    ["black-bass", 5, "alta", "spinning", "El mejor sitio de la provincia para bass. Piedra, troncos y ramas: ahí está."],
    ["carpa-comun", 4, "alta", "fondo", "Abundante en las colas y en las zonas de menos profundidad."],
    ["barbo", 3, "media", "feeder", "En la entrada del Retortillo. Devolución obligatoria."],
    ["alburno", 3, "media", "", "Es la comida del bass: si ves bandos saltando, hay depredador debajo."],
  ],
  "el-pintado": [
    ["carpa-comun", 5, "alta", "fondo", "Dominante junto con el barbo."],
    ["barbo", 5, "alta", "feeder", "Muy abundante. La mejor pesca del embalse. Devolución obligatoria."],
    ["black-bass", 3, "media", "spinning", "Los hay, pero de tamaño medio. No vengas buscando el récord."],
    ["boga-de-rio", 3, "media", "", "En las colas del Viar, con agua limpia. Devolución obligatoria."],
  ],
  "la-minilla": [
    ["carpa-comun", 4, "alta", "fondo", "Bien repartida por todo el vaso."],
    ["barbo", 3, "media", "feeder", "En las colas de la Rivera de Huelva. Devolución obligatoria."],
    ["black-bass", 3, "media", "spinning", "Agua muy clara: vinilos naturales y bajos finos de fluorocarbono."],
  ],
  cala: [
    ["carpa-comun", 4, "alta", "fondo", "La captura habitual."],
    ["barbo", 3, "media", "feeder", "En la entrada de la rivera. Devolución obligatoria."],
    ["black-bass", 3, "media", "spinning", "Agua limpia y poca presión de pesca."],
  ],
  gergal: [
    ["carpa-comun", 4, "alta", "fondo", "Muy accesible desde la orilla."],
    ["black-bass", 3, "media", "spinning", "En la estructura de piedra cerca de la presa."],
    ["barbo", 3, "media", "feeder", "Devolución obligatoria."],
  ],
  huesna: [
    ["barbo", 4, "alta", "feeder", "Agua fría y limpia, buenos ejemplares. Devolución obligatoria."],
    ["boga-de-rio", 3, "media", "", "Indicador de que el agua está bien. Devolución obligatoria."],
    ["carpa-comun", 3, "media", "fondo", "Menos que en los embalses de campiña."],
    ["black-bass", 3, "media", "spinning", "En las zonas de menos profundidad y en las colas."],
  ],
  "cazalla-de-la-sierra": [
    ["carpa-comun", 3, "media", "fondo", "Lo más probable en una lámina tan pequeña."],
    ["black-bass", 2, "baja", "spinning", "Poca agua y poca población."],
    ["barbo", 2, "baja", "fondo", "Devolución obligatoria."],
  ],
  "los-molinos": [
    ["carpa-comun", 3, "media", "fondo", "Buen sitio para una tarde tranquila."],
    ["black-bass", 3, "media", "spinning", "Embalse pequeño: se peina entero en una mañana."],
    ["barbo", 2, "baja", "fondo", "Devolución obligatoria."],
  ],
  "puebla-de-cazalla": [
    ["carpa-comun", 4, "alta", "fondo", "Agua turbia y cálida del Corbones: su hábitat ideal."],
    ["black-bass", 3, "media", "spinning", "Vinilos chartreuse o blancos por la turbidez."],
    ["barbo", 3, "media", "feeder", "En la cola del Corbones. Devolución obligatoria."],
    ["alburno", 3, "media", "", "Bandos numerosos."],
  ],
  agrio: [
    ["black-bass", 3, "media", "spinning", "SOLO CAPTURA Y SUELTA. No consumir nada de este embalse."],
    ["carpa-comun", 3, "media", "fondo", "SOLO CAPTURA Y SUELTA. Zona del vertido minero de Boliden."],
    ["cangrejo-rojo-americano", 4, "alta", "", "No pescable. Y aquí, además, acumula metales pesados del sedimento."],
  ],
  "guadaira-oromana": [
    ["carpa-comun", 4, "alta", "fondo", "Lo más abundante del tramo. OJO: fuera de área delimitada, hay obligación de sacrificarla."],
    ["cangrejo-rojo-americano", 5, "alta", "", "Por todas partes. No pescable."],
    ["barbo", 3, "media", "feeder", "En las tablas con corriente junto a los molinos. Devolución obligatoria."],
    ["carpin", 3, "media", "fondo", "Frecuente en los remansos."],
    ["black-bass", 2, "baja", "spinning", "FUERA DE ÁREA DELIMITADA: si lo capturas aquí, no puedes devolverlo al agua."],
    ["anguila-europea", 1, "baja", "", "Rara, pero el Guadaíra es tramo bajo. Pesca prohibida: devolver sin sacarla del agua."],
  ],
  "guadalquivir-cantillana-alcala-del-rio": [
    ["barbo", 4, "alta", "feeder", "Ejemplares grandes en las tablas. Devolución obligatoria."],
    ["carpa-comun", 4, "alta", "fondo", "Abundante en los remansos y junto a los malecones."],
    ["alburno", 4, "alta", "", "Bandos enormes. Han desplazado a la boga en buena parte del tramo."],
    ["black-bass", 3, "media", "spinning", "En las orillas con estructura y en las contras de corriente."],
    ["siluro", 3, "media", "", "Presente en las zonas profundas. No pescable dirigidamente: si cae, no devolver."],
    ["lucioperca", 2, "baja", "", "Al amanecer y al atardecer, cerca del fondo. No pescable dirigidamente."],
    ["boga-de-rio", 2, "baja", "", "En retroceso frente al alburno. Devolución obligatoria."],
    ["anguila-europea", 1, "baja", "", "Tramo bajo del río. Pesca prohibida: devolver sin sacarla del agua."],
  ],
  "viar-melonares-cantillana": [
    ["barbo", 4, "alta", "feeder", "El pez del tramo. Busca las tablas por debajo de las correderas. Devolución obligatoria."],
    ["boga-de-rio", 3, "media", "", "Bandos en las zonas de agua limpia y corriente. Devolución obligatoria."],
    ["black-bass", 3, "media", "spinning", "En las pozas más profundas y remansadas."],
    ["carpa-comun", 3, "media", "fondo", "En los tramos bajos, más cerca de Cantillana."],
  ],
};

// ---------------------------------------------------------------------------
// Relaciones aparejo <-> especie
// ---------------------------------------------------------------------------

type FilaAparejoEspecie = [
  aparejoSlug: string,
  especieSlug: string,
  efectividad: number,
  notas: string,
];

const APAREJO_ESPECIE: FilaAparejoEspecie[] = [
  // Black bass
  ["vinilo-shad-verde-sandia", "black-bass", 5, "El comodín. Agua clara y sol."],
  ["vinilo-shad-blanco", "black-bass", 4, "Días nublados o agua con algo de turbidez."],
  ["vinilo-shad-chartreuse", "black-bass", 3, "Solo cuando el agua está sucia de verdad."],
  ["vinilo-senko-negro", "black-bass", 5, "Para peces apáticos: caída lenta y mucha paciencia."],
  ["vinilo-senko-sandia-purpurina", "black-bass", 5, "Agua clara y peces desconfiados, en texas rig."],
  ["popper-superficie", "black-bass", 4, "Solo al amanecer y al atardecer, pero cuando entra, entra fuerte."],
  ["paseante-superficie", "black-bass", 4, "Para cubrir mucha agua con poca luz."],
  ["crankbait-pequeno", "black-bass", 3, "Para localizar peces rápido peinando la orilla."],
  ["spinnerbait-blanco", "black-bass", 4, "Entre ramas y vegetación, donde no entra otra cosa."],
  ["texas-rig", "black-bass", 5, "El montaje básico para pescarlo en la estructura."],
  ["cabeza-plomada", "black-bass", 4, "Para trabajar el vinilo cerca del fondo en verano."],
  // Lucio
  ["spinnerbait-blanco", "lucio", 5, "Su señuelo. Siempre con bajo de acero o fluorocarbono grueso."],
  ["vinilo-shad-blanco", "lucio", 4, "Vinilos grandes cerca de la vegetación."],
  ["vinilo-shad-chartreuse", "lucio", 3, "Con agua turbia."],
  ["cabeza-plomada", "lucio", 4, "Montaje sencillo para vinilos grandes."],
  ["paseante-superficie", "lucio", 3, "Sobre praderas de vegetación sumergida."],
  // Trucha arcoíris
  ["crankbait-pequeno", "trucha-arcoiris", 3, "En agua fría y corriente."],
  ["vinilo-shad-verde-sandia", "trucha-arcoiris", 2, "Poco habitual en esta provincia."],
  // Carpa
  ["maiz-dulce", "carpa-comun", 5, "El cebo por excelencia. Dos o tres granos en el anzuelo."],
  ["masilla-pan-matalahuva", "carpa-comun", 5, "Clásico andaluz. El anís llega muy lejos en el agua."],
  ["pan", "carpa-comun", 4, "Corteza flotante para pescarlas en superficie en verano."],
  ["lombriz-de-tierra", "carpa-comun", 3, "Funciona, aunque atrae más a otras especies."],
  ["montaje-fondo-corredizo", "carpa-comun", 5, "El montaje de toda la vida para carpa."],
  ["canamo-tostado", "carpa-comun", 5, "Las mantiene hozando en el puesto sin saciarlas."],
  ["pellets-halibut", "carpa-comun", 4, "Para carpa grande, mantiene el puesto cebado mucho rato."],
  ["engodo-de-barbo", "carpa-comun", 3, "Sirve también para carpa, aunque no sea lo suyo."],
  // Barbo
  ["lombriz-de-tierra", "barbo", 5, "El mejor cebo para barbo, sin discusión."],
  ["maiz-dulce", "barbo", 4, "Muy visible en el fondo y aguanta el lance."],
  ["masilla-pan-matalahuva", "barbo", 4, "Bien prensada en el anzuelo para que aguante la corriente."],
  ["engodo-de-barbo", "barbo", 5, "Cebar el puesto media hora antes cambia la jornada."],
  ["pellets-halibut", "barbo", 4, "Mantienen el puesto sin llenar al pez."],
  ["canamo-tostado", "barbo", 4, "Mezclado con el engodo."],
  ["montaje-fondo-corredizo", "barbo", 5, "Para que se lleve el cebo sin notar el plomo."],
  ["pan", "barbo", 2, "Se deshace rápido con corriente."],
  // Boga
  ["masilla-pan-matalahuva", "boga-de-rio", 3, "Cebo pequeño. Cae de forma incidental."],
  ["maiz-dulce", "boga-de-rio", 2, "Un solo grano y anzuelo pequeño."],
  // Carpín
  ["maiz-dulce", "carpin", 4, "Con anzuelo pequeño."],
  ["masilla-pan-matalahuva", "carpin", 4, "Bolitas diminutas."],
  ["pan", "carpin", 3, "Miga en el anzuelo."],
  ["lombriz-de-tierra", "carpin", 3, "Trozos pequeños de lombriz."],
];

// ---------------------------------------------------------------------------
// Relaciones aparejo <-> sitio
// ---------------------------------------------------------------------------

const SITIOS_SPINNING = [
  "torre-del-aguila",
  "jose-toran",
  "el-pintado",
  "la-minilla",
  "cala",
  "gergal",
  "huesna",
  "los-molinos",
  "puebla-de-cazalla",
  "agrio",
  "guadalquivir-cantillana-alcala-del-rio",
  "viar-melonares-cantillana",
  // Cádiz, que ya está trabajada al nivel de Sevilla.
  ...CADIZ_SPINNING,
];

const SITIOS_FONDO = SITIOS.map((s) => s.slug);

const SITIOS_AGUA_CLARA = ["jose-toran", "la-minilla", "cala", "huesna", "el-pintado", ...CADIZ_AGUA_CLARA];
const SITIOS_AGUA_TURBIA = [
  "torre-del-aguila",
  "puebla-de-cazalla",
  "guadalquivir-cantillana-alcala-del-rio",
  "guadaira-oromana",
  ...CADIZ_AGUA_TURBIA,
];
const SITIOS_CON_CORRIENTE = [
  "guadalquivir-cantillana-alcala-del-rio",
  "viar-melonares-cantillana",
  "guadaira-oromana",
];

type FilaAparejoSitio = [aparejoSlug: string, sitioSlug: string, recomendado: boolean, notas: string];

const APAREJO_SITIO: FilaAparejoSitio[] = [
  ...SITIOS_SPINNING.flatMap((sitio): FilaAparejoSitio[] => [
    ["vinilo-shad-verde-sandia", sitio, true, "Vinilo de partida para el bass de este sitio."],
    ["texas-rig", sitio, true, "Para pescar entre la estructura sin engancharse."],
    ["cabeza-plomada", sitio, true, "Para trabajar el vinilo cerca del fondo."],
  ]),
  ...SITIOS_FONDO.flatMap((sitio): FilaAparejoSitio[] => [
    ["montaje-fondo-corredizo", sitio, true, "El montaje base para carpa y barbo aquí."],
    ["maiz-dulce", sitio, true, "Cebo seguro para no volver de vacío."],
    ["lombriz-de-tierra", sitio, true, "Universal: entra todo."],
    ["masilla-pan-matalahuva", sitio, true, "Se prepara en casa por céntimos."],
  ]),
  ...SITIOS_AGUA_CLARA.flatMap((sitio): FilaAparejoSitio[] => [
    ["vinilo-senko-sandia-purpurina", sitio, true, "Agua clara: colores naturales y trabajo lento."],
    ["popper-superficie", sitio, true, "Al amanecer, sobre la piedra y la vegetación."],
    ["paseante-superficie", sitio, true, "Para peinar mucha agua con poca luz."],
  ]),
  ...SITIOS_AGUA_TURBIA.flatMap((sitio): FilaAparejoSitio[] => [
    ["vinilo-shad-chartreuse", sitio, true, "Agua con turbidez: hace falta color que se vea."],
    ["spinnerbait-blanco", sitio, true, "Vibración y destello para que lo localicen sin verlo."],
  ]),
  ...SITIOS_CON_CORRIENTE.flatMap((sitio): FilaAparejoSitio[] => [
    ["engodo-de-barbo", sitio, true, "Cebar el puesto antes de empezar es la mitad del trabajo."],
    ["pellets-halibut", sitio, true, "Aguantan la corriente sin deshacerse enseguida."],
    ["canamo-tostado", sitio, true, "Mezclado con el engodo, mantiene al barbo en el puesto."],
  ]),
  ["vinilo-senko-negro", "jose-toran", true, "Para los días en que el bass no quiere nada."],
  ["vinilo-shad-blanco", "guadalquivir-cantillana-alcala-del-rio", true, "Imita al alburno, que es lo que comen aquí."],
  ["crankbait-pequeno", "jose-toran", true, "Para localizar peces rápido en un embalse tan grande."],
  ["canamo-tostado", "el-pintado", true, "Con tanto barbo y carpa, cebar bien compensa."],
  ["engodo-de-barbo", "el-pintado", true, "El embalse de barbo por excelencia de la provincia."],
  ["pellets-halibut", "huesna", true, "Barbos grandes: pellet grande."],
];

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------

// Las dos cuentas iniciales son administradoras: con el registro abierto hace
// falta que alguien pueda retirar lo que no debería estar.
const USUARIOS = [
  { nombre: "José", email: "jose@pesca.local", rol: "admin" },
  { nombre: "Pareja", email: "pareja@pesca.local", rol: "admin" },
];

/**
 * Contraseña inicial de los dos usuarios. Se puede cambiar con la variable de
 * entorno SEED_PASSWORD. Cámbiala antes de desplegar en el VPS.
 */
const PASSWORD_INICIAL = process.env.SEED_PASSWORD ?? "pesca2026";

// ---------------------------------------------------------------------------
// Capturas de ejemplo
// ---------------------------------------------------------------------------

/**
 * Capturas de muestra para que el diario y el ranking no se vean vacíos el día
 * que alguien entra por primera vez.
 *
 * Van marcadas como ejemplo en la base de datos y en toda la interfaz: no se
 * hacen pasar por reales. Eso importa por dos razones. La primera es legal —
 * inventar actividad de usuarios para captar registros es publicidad engañosa,
 * y más con anuncios en la web—. La segunda es que la guía dice que las
 * abundancias se irán corrigiendo con lo que se pesque de verdad; si estas
 * capturas contaran para eso, la corrección se haría con datos falsos.
 *
 * Los pesos son verosímiles para cada especie en la provincia, no récords.
 * Desaparecen todas con SEMBRAR_DEMO=no.
 */
const CUENTA_DEMO = {
  nombre: "Mapa de Pesca",
  email: "ejemplo@mapadepesca.es",
  rol: "usuario",
};

/** [especie, sitio, díasAtrás, hora, gramos, cm, técnica, liberado, notas] */
const CAPTURAS_DEMO: [
  string, string, number, string, number, number | null, string | null, boolean, string,
][] = [
  ["black-bass", "jose-toran", 3, "08:20", 2450, 51, "spinning", true, "A vinilo sobre la piedra, primera hora."],
  ["black-bass", "torre-del-aguila", 9, "19:40", 1180, 41, "superficie", true, "Popper al atardecer, en la cola."],
  ["black-bass", "el-pintado", 16, "07:50", 1750, 46, "spinning", true, "Entre los troncos de la orilla norte."],
  ["carpa-comun", "torre-del-aguila", 1, "10:15", 5300, 68, "fondo", true, "Maíz a fondo, media hora de pelea."],
  ["carpa-comun", "guadaira-oromana", 6, "09:00", 2900, 55, "fondo", true, "Masilla de pan, a veinte metros."],
  ["carpa-comun", "puebla-de-cazalla", 12, "11:30", 4100, 62, "fondo", true, ""],
  ["barbo", "huesna", 4, "08:45", 1650, 48, "feeder", true, "Devuelto al agua, como manda la norma."],
  ["barbo", "guadalquivir-cantillana-alcala-del-rio", 11, "17:20", 2200, 54, "feeder", true, "En la corriente, con lombriz."],
  ["barbo", "viar-melonares-cantillana", 20, "18:00", 980, 39, "feeder", true, ""],
  ["carpin", "guadaira-oromana", 2, "16:40", 420, 24, "fondo", true, "Pequeño pero da guerra."],
  ["boga-de-rio", "viar-melonares-cantillana", 8, "09:30", 310, 26, "feeder", true, "Devolución obligatoria."],
  ["lucio", "torre-del-aguila", 14, "07:30", 3200, 74, "spinning", true, "En el área delimitada, comprobado antes."],
  ["carpa-comun", "gergal", 18, "12:10", 3600, 59, "fondo", true, ""],
  ["black-bass", "la-minilla", 22, "08:10", 890, 36, "spinning", true, "Día flojo, solo picó este."],
];

async function sembrarDemo(
  sitios: Map<string, string>,
  especies: Map<string, string>,
  tecnicas: Map<string, string>,
) {
  const activo = (process.env.SEMBRAR_DEMO ?? "si") === "si";

  // Se borran siempre antes de volver a crearlas: así el seed es idempotente y
  // apagar SEMBRAR_DEMO las quita de verdad, sin dejar restos.
  const borradas = await prisma.captura.deleteMany({ where: { esEjemplo: true } });
  if (borradas.count > 0) console.log(`  ${borradas.count} capturas de ejemplo retiradas`);

  if (!activo) {
    await prisma.usuario.deleteMany({ where: { email: CUENTA_DEMO.email } });
    console.log("  SEMBRAR_DEMO=no: sin capturas de ejemplo");
    return;
  }

  // La cuenta de ejemplo no tiene contraseña utilizable: no es de nadie y no se
  // puede entrar con ella. Solo existe para firmar estas capturas.
  const passwordHash = await hash(randomBytes(32).toString("hex"), 12);
  const usuario = await prisma.usuario.upsert({
    where: { email: CUENTA_DEMO.email },
    create: { ...CUENTA_DEMO, passwordHash },
    update: { nombre: CUENTA_DEMO.nombre },
  });

  const hoy = new Date();
  let creadas = 0;
  for (const [esp, sit, dias, hora, gramos, cm, tec, liberado, notas] of CAPTURAS_DEMO) {
    const especieId = especies.get(esp);
    const sitioId = sitios.get(sit);
    if (!especieId || !sitioId) continue;

    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() - dias);
    fecha.setHours(12, 0, 0, 0);

    await prisma.captura.create({
      data: {
        usuarioId: usuario.id,
        sitioId,
        especieId,
        fecha,
        hora,
        pesoGramos: gramos,
        longitudCm: cm,
        tecnicaId: tec ? (tecnicas.get(tec) ?? null) : null,
        liberado,
        notas,
        esEjemplo: true,
      },
    });
    creadas++;
  }
  console.log(`  ${creadas} capturas de ejemplo`);
}

// ---------------------------------------------------------------------------
// Ejecución
// ---------------------------------------------------------------------------

async function main() {
  console.log("Sembrando datos...\n");

  // --- Usuarios (no se pisan si ya existen: puede haberse cambiado la clave) --
  const passwordHash = await hash(PASSWORD_INICIAL, 12);
  for (const u of USUARIOS) {
    const existente = await prisma.usuario.findUnique({ where: { email: u.email } });
    if (existente) {
      // La contraseña no se toca, pero el rol sí: si el seed dice que es
      // admin, que lo sea aunque la cuenta ya existiera.
      if (existente.rol !== u.rol) {
        await prisma.usuario.update({ where: { id: existente.id }, data: { rol: u.rol } });
        console.log(`  usuario ${u.email} ya existe, ahora es ${u.rol}`);
      } else {
        console.log(`  usuario ${u.email} ya existe, no se toca`);
      }
      continue;
    }
    await prisma.usuario.create({ data: { ...u, passwordHash } });
    console.log(`  usuario ${u.email} creado`);
  }

  // --- Provincias ----------------------------------------------------------
  for (const p of PROVINCIAS) {
    const data = {
      nombre: p.nombre,
      comunidad: p.comunidad,
      latitud: p.latitud,
      longitud: p.longitud,
      publicada: p.publicada,
      descripcion: p.descripcion ?? "",
      areasDelimitadasEEI: p.areasDelimitadasEEI ?? "",
      notasLegales: p.notasLegales ?? "",
      urlOrdenDeVedas: p.urlOrdenDeVedas ?? null,
    };
    await prisma.provincia.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...data },
      update: data,
    });
  }
  const nPublicadas = PROVINCIAS.filter((p) => p.publicada).length;
  console.log(
    `  ${PROVINCIAS.length} provincias, ${nPublicadas} publicada${nPublicadas === 1 ? "" : "s"}`,
  );

  const provincias = new Map(
    (await prisma.provincia.findMany({ select: { id: true, slug: true } })).map(
      (p) => [p.slug, p.id],
    ),
  );

  // --- Sitios --------------------------------------------------------------
  for (const s of SITIOS) {
    const { mejorEpoca, provincia, ...resto } = s;
    const provinciaId = provincias.get(provincia);
    if (!provinciaId) throw new Error(`No existe la provincia "${provincia}"`);

    const data = {
      ...resto,
      provinciaId,
      mejorEpoca: JSON.stringify(mejorEpoca),
    };
    await prisma.sitio.upsert({
      where: { slug: s.slug },
      create: data,
      update: data,
    });
  }
  console.log(`  ${SITIOS.length} sitios`);

  // --- Especies ------------------------------------------------------------
  for (const e of ESPECIES) {
    await prisma.especie.upsert({
      where: { slug: e.slug },
      create: e,
      update: e,
    });
  }
  console.log(`  ${ESPECIES.length} especies`);

  // --- Técnicas ------------------------------------------------------------
  for (const t of TECNICAS) {
    await prisma.tecnica.upsert({ where: { slug: t.slug }, create: t, update: t });
  }
  console.log(`  ${TECNICAS.length} técnicas`);

  // --- Aparejos ------------------------------------------------------------
  for (const a of APAREJOS) {
    await prisma.aparejo.upsert({ where: { slug: a.slug }, create: a, update: a });
  }
  console.log(`  ${APAREJOS.length} aparejos`);

  // --- Índices por slug para resolver relaciones ---------------------------
  const sitios = new Map(
    (await prisma.sitio.findMany({ select: { id: true, slug: true } })).map((s) => [s.slug, s.id]),
  );
  const especies = new Map(
    (await prisma.especie.findMany({ select: { id: true, slug: true } })).map((e) => [e.slug, e.id]),
  );
  const aparejos = new Map(
    (await prisma.aparejo.findMany({ select: { id: true, slug: true } })).map((a) => [a.slug, a.id]),
  );
  const tecnicas = new Map(
    (await prisma.tecnica.findMany({ select: { id: true, slug: true } })).map((x) => [x.slug, x.id]),
  );

  const exigir = (mapa: Map<string, string>, slug: string, que: string) => {
    const id = mapa.get(slug);
    if (!id) throw new Error(`No existe ${que} con slug "${slug}"`);
    return id;
  };

  // --- Sitio <-> Especie ---------------------------------------------------
  // Las de Sevilla salen de pescar allí; las de las otras provincias son la
  // composición típica de embalse andaluz como punto de partida, y la web lo
  // dice en cada ficha. Se afinan solas con las capturas que se registren.
  let nSitioEspecie = 0;
  const TODAS_ESPECIES_POR_SITIO = {
    ...ESPECIES_POR_SITIO_ANDALUCIA,
    ...ESPECIES_POR_SITIO_CADIZ,
    ...ESPECIES_POR_SITIO,
  };
  for (const [sitioSlug, filas] of Object.entries(TODAS_ESPECIES_POR_SITIO)) {
    const sitioId = exigir(sitios, sitioSlug, "sitio");
    for (const [especieSlug, abundancia, probabilidadCaptura, mejorTecnica, notas] of filas) {
      const especieId = exigir(especies, especieSlug, "especie");
      const data = { abundancia, probabilidadCaptura, mejorTecnica, notas };
      await prisma.sitioEspecie.upsert({
        where: { sitioId_especieId: { sitioId, especieId } },
        create: { sitioId, especieId, ...data },
        update: data,
      });
      nSitioEspecie++;
    }
  }
  console.log(`  ${nSitioEspecie} relaciones sitio-especie`);

  // --- Aparejo <-> Especie -------------------------------------------------
  for (const [aparejoSlug, especieSlug, efectividad, notas] of APAREJO_ESPECIE) {
    const aparejoId = exigir(aparejos, aparejoSlug, "aparejo");
    const especieId = exigir(especies, especieSlug, "especie");
    await prisma.aparejoEspecie.upsert({
      where: { aparejoId_especieId: { aparejoId, especieId } },
      create: { aparejoId, especieId, efectividad, notas },
      update: { efectividad, notas },
    });
  }
  console.log(`  ${APAREJO_ESPECIE.length} relaciones aparejo-especie`);

  // --- Aparejo <-> Sitio ---------------------------------------------------
  // Puede haber duplicados por cómo se generan las listas; el upsert los absorbe.
  const vistos = new Set<string>();
  for (const [aparejoSlug, sitioSlug, recomendado, notas] of APAREJO_SITIO) {
    const clave = `${aparejoSlug}|${sitioSlug}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    const aparejoId = exigir(aparejos, aparejoSlug, "aparejo");
    const sitioId = exigir(sitios, sitioSlug, "sitio");
    await prisma.aparejoSitio.upsert({
      where: { aparejoId_sitioId: { aparejoId, sitioId } },
      create: { aparejoId, sitioId, recomendado, notas },
      update: { recomendado, notas },
    });
  }
  console.log(`  ${vistos.size} relaciones aparejo-sitio`);

  // --- Capturas de ejemplo -------------------------------------------------
  await sembrarDemo(sitios, especies, tecnicas);

  // --- Artículos del blog --------------------------------------------------
  // Se actualizan siempre: el texto vive en el repositorio, así que la versión
  // buena es la del código y no la que quedó en la base de datos.
  const provinciasPorSlug = new Map(
    (await prisma.provincia.findMany({ select: { id: true, slug: true } })).map(
      (x) => [x.slug, x.id],
    ),
  );
  const hoy = new Date();
  const provinciasPublicadasPorSlug = new Set(
    (
      await prisma.provincia.findMany({
        where: { publicada: true },
        select: { slug: true },
      })
    ).map((p) => p.slug),
  );

  for (const a of ARTICULOS) {
    const publicadaEl = new Date(hoy);
    publicadaEl.setDate(publicadaEl.getDate() - a.diasAtras);
    publicadaEl.setHours(9, 0, 0, 0);

    // Un artículo de provincia enlaza a las fichas de esa provincia. Si la
    // provincia no está publicada, esos enlaces son 404: el artículo espera
    // con ella y sale solo el día que se publique.
    const suProvincia = a.provincia ? provinciasPublicadasPorSlug.has(a.provincia) : true;

    const datos = {
      titulo: a.titulo,
      entradilla: a.entradilla,
      contenido: a.contenido,
      publicada: suProvincia,
      publicadaEl,
      provinciaId: a.provincia ? (provinciasPorSlug.get(a.provincia) ?? null) : null,
    };
    await prisma.articulo.upsert({
      where: { slug: a.slug },
      create: { slug: a.slug, ...datos },
      // La fecha de publicación no se pisa si ya existía: si no, cada
      // despliegue movería los artículos al día de hoy.
      update: { ...datos, publicadaEl: undefined },
    });
  }
  console.log(`  ${ARTICULOS.length} artículos del blog`);

  console.log("\nListo.");
  console.log(
    `Usuarios: ${USUARIOS.map((u) => u.email).join(", ")} — contraseña inicial: "${PASSWORD_INICIAL}"`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
