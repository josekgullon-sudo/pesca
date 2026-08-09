/**
 * Artículos del blog.
 *
 * Criterio de qué se escribe aquí: preguntas que la gente hace y que una ficha
 * de embalse no responde. Cada uno entra por su búsqueda y lleva a la guía.
 *
 * Sobre la normativa: en el blog se explica **cómo funciona** y **dónde se
 * comprueba**, nunca cifras concretas que caducan —importes, fechas de veda,
 * tallas—. Esos datos cambian cada temporada y un artículo desactualizado en
 * una web de pesca puede costarle una sanción a quien se fíe. La cifra vive en
 * la orden de vedas; aquí va el enlace.
 */

export type ArticuloSemilla = {
  slug: string;
  titulo: string;
  entradilla: string;
  /** Slug de provincia, o null si vale para toda España. */
  provincia: string | null;
  /**
   * Slug de especie, si el artículo va de una. Sirve para que la ficha de la
   * especie enlace de vuelta: hasta que existió esto, los enlaces iban en un
   * solo sentido y la ficha era un callejón sin salida.
   */
  especie?: string;
  /** Días atrás desde hoy, para escalonar las fechas de publicación. */
  diasAtras: number;
  contenido: string;
};

export const ARTICULOS: ArticuloSemilla[] = [
  {
    slug: "licencia-de-pesca-andalucia",
    titulo: "Licencia de pesca en Andalucía: qué necesitas y qué multa hay",
    entradilla:
      "Sí hace falta, y también seguro de responsabilidad civil. Qué llevar encima, cómo se saca, y cómo se calcula la sanción si te pillan sin ella.",
    provincia: "sevilla",
    diasAtras: 21,
    contenido: `Sí. Para pescar en aguas continentales de Andalucía —embalses, ríos, canales— hace falta la **licencia de pesca continental** en vigor, y hay que llevarla encima. No vale con haberla sacado: si no la puedes enseñar, es como no tenerla.

Y hace falta una segunda cosa que mucha gente no sabe: **seguro de responsabilidad civil** del pescador. Se pide junto con la licencia y sin él tampoco puedes pescar.

## Qué necesitas llevar cuando sales

- La licencia de pesca continental de Andalucía, en vigor.
- El seguro de responsabilidad civil.
- Tu DNI o documento identificativo.

Si vas a un coto o a un tramo con régimen especial, además el permiso correspondiente de ese tramo. Eso va aparte de la licencia.

## Dónde se saca

La licencia la expide la Junta de Andalucía y se tramita por internet o en las oficinas de la Delegación Territorial. En el [Portal de Caza y Pesca de la Junta de Andalucía](https://www.juntadeandalucia.es/organismos/sostenibilidadmedioambienteyeconomiaazul/areas/flora-fauna-silvestres/caza-pesca.html) están el trámite, la vigencia y lo que cuesta.

No pongo aquí ni el precio ni la duración a propósito: son datos que cambian y un artículo desactualizado sobre esto no ayuda, confunde. En el portal está siempre lo vigente.

## Si vienes de otra comunidad

La licencia es autonómica. Hay comunidades con acuerdos de reciprocidad entre ellas, pero **no lo des por hecho**: comprueba antes de coger el coche si la tuya vale en Andalucía, porque la mayoría de las veces no.

## ¿Cuánto es la multa por pescar sin licencia?

No te voy a dar una cifra, y te explico por qué: los importes de las sanciones se actualizan, y un número desactualizado en una web de pesca es peor que ningún número. Lo que sí se puede explicar es **cómo se calcula**, que es lo que de verdad te dice a qué te expones.

Pescar sin licencia es una infracción administrativa, y en la normativa andaluza de flora y fauna las infracciones van **por grados**: leves, graves y muy graves. Cada grado tiene su horquilla de importe, y dentro de la horquilla la cuantía concreta se gradúa según las circunstancias.

Lo que agrava una denuncia, y esto es lo importante:

- **La reincidencia.** No es lo mismo la primera vez que la tercera.
- **El daño causado.** Llevarse capturas, y cuántas.
- **La especie.** Que haya de por medio una especie protegida o amenazada cambia el grado de la infracción, no solo el importe.
- **Dónde estabas.** En espacio natural protegido pesa más.
- **Si hubo intención o solo descuido.**

Por eso una misma frase —«pescar sin licencia»— puede acabar en una cosa o en otra muy distinta. Y por eso lo que sale al buscar «cuánto es la multa» suele ser una cifra suelta, de una comunidad que no es la tuya y de un año que ya pasó.

**Dónde está el importe vigente**: en la normativa andaluza de flora y fauna silvestres y en la orden de vedas de la temporada, las dos accesibles desde el [Portal de Caza y Pesca de la Junta](https://www.juntadeandalucia.es/organismos/sostenibilidadmedioambienteyeconomiaazul/areas/flora-fauna-silvestres/caza-pesca.html). Si ya tienes una denuncia encima, el importe y el grado vienen escritos en el propio boletín de denuncia.

## Lo que de verdad se sanciona

Pescar sin licencia es lo primero que se mira, pero en la práctica lo que más denuncias genera son tres cosas que se hacen sin querer:

1. **Llevarse una especie de devolución obligatoria.** El barbo, la boga y la trucha común van al agua siempre.
2. **Devolver al agua una especie exótica invasora.** Con el black bass, el lucio, la carpa y la trucha arcoíris pasa justo lo contrario: fuera de las aguas donde están permitidos, la ley obliga a sacrificarlos.
3. **Pescar en veda o en un tramo cerrado.** Las fechas cambian cada temporada.

Las tres se evitan mirando dos cosas antes de salir: qué especie tienes delante y en qué agua estás. Para lo primero está la [guía de especies](/especies), con el semáforo legal de cada una. Para lo segundo, la ficha de cada sitio dice si está dentro de un área delimitada.

> La información de esta web es orientativa. Antes de cada salida, comprueba la orden de vedas vigente en el portal oficial: es la única fuente que manda.`,
  },

  {
    slug: "especies-invasoras-que-hacer",
    titulo: "Has pescado un black bass: ¿lo devuelves o no?",
    entradilla:
      "Depende del agua en la que estés, y la respuesta correcta en un embalse es delito en el de al lado. Cómo funcionan las áreas delimitadas.",
    provincia: "sevilla",
    especie: "black-bass",
    diasAtras: 15,
    contenido: `Es la pregunta que más se hace y la que peor se responde en los foros, porque la respuesta correcta en un embalse es una infracción en el de al lado.

El black bass, el lucio, la carpa común y la trucha arcoíris están catalogados en España como **especies exóticas invasoras**. La norma general es que no se pueden liberar en el medio natural. Pero como llevan décadas asentados y mueven mucha pesca deportiva, la ley define **áreas delimitadas**: masas de agua concretas donde sí se pueden pescar con normalidad.

## Las dos situaciones

**Dentro de un área delimitada**, se pescan como cualquier otra especie. Puedes devolverlas al agua.

**Fuera de un área delimitada**, no se pueden devolver. Si cae una, hay obligación de sacrificarla. Devolverla al agua es precisamente lo que la ley busca impedir, porque perpetúa la población.

Esto choca de frente con la cultura de captura y suelta que tiene casi todo el que pesca a spinning, y por eso se incumple tanto sin mala intención.

## Cómo saber en cuál estás

El listado de aguas delimitadas **lo fija cada comunidad autónoma** y puede cambiar de una temporada a otra. En Andalucía va en la orden de vedas de pesca continental.

En esta web, cada [ficha de sitio](/sevilla) lo dice arriba del todo: si el embalse está en el listado, sale marcado; si no, aparece la etiqueta «Fuera de área EEI». Y en la página de la provincia está el listado completo tal cual figura en la orden.

Aun así, **compruébalo en el boletín antes de salir**. Nosotros lo repasamos, pero el que responde delante de un agente eres tú.

## Por qué existe esta norma

No es capricho administrativo. El black bass y el lucio son depredadores de emboscada que en un río español no tienen competencia: se comen los alevines de barbo, boga y cacho, que son especies autóctonas y varias de ellas están en declive. La carpa hace otro daño distinto: remueve el fondo buscando comida, enturbia el agua y arranca la vegetación donde desovan las demás.

De ahí la asimetría que descoloca a todo el mundo: al barbo hay que devolverlo **siempre**, y al black bass fuera de su área **nunca**.

## Lo que no debes hacer en ningún caso

- Mover peces vivos de un agua a otra. Es delito, y es como se han creado casi todas las poblaciones invasoras que hay.
- Vaciar el cubo del cebo vivo en el agua.
- Soltar peces de acuario.

Consulta el [semáforo legal de cada especie](/especies) para ver de un vistazo qué se puede pescar, qué se devuelve y qué no se puede devolver.`,
  },

  {
    slug: "empezar-a-pescar-equipo-basico",
    titulo: "Empezar a pescar: qué comprar sin gastarte una fortuna",
    entradilla:
      "Un equipo con el que se pesca de verdad sale por menos de lo que cuesta una cena. Qué hace falta, qué no, y con qué empezar según lo que quieras pescar.",
    provincia: null,
    diasAtras: 10,
    contenido: `La trampa del principiante es entrar en una tienda y salir con trescientos euros de cosas que no va a usar. Se pesca perfectamente con muy poco, y lo que de verdad marca la diferencia el primer año no es el equipo: es ir al sitio correcto en el momento correcto.

## Lo mínimo para empezar

- **Una caña de 2,40 a 3 m** y su carrete, con hilo ya montado. Un conjunto de iniciación vale.
- **Hilo de 0,20-0,25 mm** para empezar.
- **Anzuelos** de varios números, plomos y unos flotadores.
- **Alicate o quitanzuelos.** Esto no es opcional: es lo que te permite devolver un pez sin destrozarlo, y sin él vas a hacer daño.
- **Trapo o guantes mojados**, por lo mismo.

Y las dos cosas que no son material pero sin las que no puedes pescar: **licencia y seguro**.

## Según lo que quieras pescar

**Carpa y barbo, a fondo.** Es lo más agradecido para empezar: se pesca sentado, el equipo es barato y en la provincia hay mucho. Plomo corredizo, anzuelo del 6 al 10 y maíz dulce o masilla de pan. Poco más.

**Black bass, a spinning.** Más caña que carrete, más movimiento y más frustración al principio. Un vinilo de 9-10 cm montado en cabeza plomada y a peinar estructura: piedra, troncos, vegetación.

**Peces pequeños con flotador.** Si vas con niños, esto es lo que engancha: mucha picada, nada de espera. Anzuelo pequeño y lombriz.

## En qué NO gastar el primer año

- Cañas de gama alta. La diferencia no la vas a notar hasta que lleves un par de temporadas.
- Cajas enormes de señuelos. Vas a usar tres.
- Sonda. Cuando la necesites, lo sabrás.
- Ropa técnica. Una gorra, gafas de sol y calzado que agarre.

## Lo que sí importa desde el primer día

**El sitio y la hora.** Un equipo de treinta euros a primera hora en un buen puesto pesca más que uno de mil a mediodía en un sitio malo. Mira [dónde ir](/sevilla) y fíjate en la mejor época de cada sitio: la mayoría tiene dos o tres meses buenos y el resto flojos.

**Saber qué tienes delante.** Antes de la primera salida, échale diez minutos a la [guía de especies](/especies). Saber distinguir un barbo de una boga te evita el error que más multas cuesta.

**Cómo devolver un pez.** Manos mojadas, el menor tiempo posible fuera del agua y el anzuelo fuera con el alicate. Si vas a soltarlo, suéltalo bien.`,
  },

  {
    slug: "devolver-un-pez-al-agua",
    titulo: "Cómo devolver un pez al agua sin matarlo",
    entradilla:
      "Un pez devuelto de mala manera se muere igual, solo que río abajo y sin que te enteres. Lo que hay que hacer y los cuatro errores que más se ven.",
    provincia: null,
    diasAtras: 6,
    contenido: `Devolver un pez al agua no es tirarlo. Con varias especies —barbo, boga, trucha común— la devolución es **obligatoria**, y hacerla mal significa que el pez se muere igual, solo que un poco más lejos y sin que tú lo veas.

## Cómo se hace

1. **No lo saques del agua más de lo necesario.** Cada segundo fuera cuenta. Si vas a hacer la foto, tenla preparada antes de levantarlo.
2. **Mójate las manos antes de tocarlo.** Un pez tiene una capa de mucosa que lo protege de hongos e infecciones; una mano seca se la arranca.
3. **Sujétalo en horizontal**, sosteniendo el peso del cuerpo. Colgarlo de la boca en vertical le descoloca los órganos, y en peces grandes es lo que más daño hace.
4. **Quita el anzuelo con el alicate.** Sin prisa y sin tirones.
5. **Devuélvelo mirando a la corriente** y sostenlo hasta que se vaya solo. Si lo sueltas de lado y se queda flotando, no está listo.

## Los cuatro errores que más se ven

**Dejarlo en la orilla mientras se busca la cámara.** Sobre la piedra o la arena, y se lleva la mucosa por delante.

**Meterle los dedos en las agallas.** Es la parte más delicada que tiene. Se sujeta por el labio o por debajo del cuerpo, nunca por ahí.

**Tirar del anzuelo cuando está tragado.** Si está profundo, **corta el bajo de línea** y déjalo. El anzuelo se oxida y el pez sobrevive; sacarlo a la fuerza le rompe algo que no se arregla.

**Pesarlo colgado del anzuelo o de la boca.** Si quieres pesarlo, usa una sacadera o una bolsa de pesaje.

## Con calor, todavía más cuidado

En verano el agua tiene menos oxígeno y el pez llega mucho más agotado de la pelea. En esos meses conviene acortar la lucha, no sacarlo del agua para la foto y darle más tiempo antes de soltarlo.

## Y con las especies que no se pueden devolver

Con las exóticas invasoras fuera de área delimitada pasa lo contrario: la ley obliga a sacrificarlas. Hazlo de forma rápida y directa. Dejarlas agonizando en la orilla no es solo desagradable: es innecesario.

Cuál es cuál lo tienes en la [guía de especies](/especies), con el semáforo de cada una.`,
  },

  {
    slug: "cuando-pescar-sevilla",
    titulo: "Cuándo pescar en Sevilla: mes a mes, especie por especie",
    entradilla:
      "En agosto a mediodía no pica nada, y no es mala suerte. Cómo se reparte el año en la provincia y qué buscar en cada momento.",
    provincia: "sevilla",
    diasAtras: 2,
    contenido: `En Sevilla el calendario de pesca lo manda la temperatura, y el verano es tan duro que parte el año en dos. Saber esto ahorra muchas salidas en balde.

## La regla que lo explica casi todo

Los peces son de sangre fría: su actividad sigue a la temperatura del agua. Con agua muy fría se mueven poco; con agua muy caliente hay poco oxígeno y se van al fondo o a la sombra y dejan de comer. Entre medias está lo bueno.

En la provincia eso significa: **primavera y otoño son la temporada**, el invierno va a menos y **el verano solo funciona a primera hora del día y al atardecer**.

## Marzo a junio

Lo mejor del año. El agua se calienta, los peces vuelven a comer y muchos están en freza o saliendo de ella.

- **Black bass**: la mejor época, sobre todo abril y mayo. Se pescan cerca de la orilla y a superficie al amanecer.
- **Carpa**: activa y comiendo con ganas. Se ven en las colas de los embalses.
- **Barbo**: mayo y junio, en la corriente de los ríos.

## Julio y agosto

Los dos meses difíciles. A mediodía no pica nada, y no es cuestión de suerte: no están comiendo.

- Sal **antes de que amanezca** o **a última hora de la tarde**.
- Busca sombra, zonas profundas y entradas de agua.
- Es cuando mejor funciona la pesca a superficie, en los primeros veinte minutos de luz.
- Y bebe agua. En la campiña sevillana en agosto, el problema serio no es no pescar.

## Septiembre a noviembre

La segunda temporada, y para mucha gente mejor que la primavera porque hay menos gente en la orilla.

- **Black bass**: octubre es excelente, comen con ganas antes del frío.
- **Carpa**: septiembre y octubre muy buenos.
- **Barbo**: van bajando, pero todavía salen.

## Diciembre a febrero

Los meses flojos. El agua fría los ralentiza, aunque en Sevilla nunca llega a lo que sería un invierno de verdad.

- Sal **a mediodía**, justo al revés que en verano: es cuando el agua está más templada.
- Trabaja despacio, muy despacio.
- La carpa sigue siendo la especie más fiable.

## Mira también el nivel del agua

En los embalses de riego —Torre del Águila, Puebla de Cazalla— el nivel cambia mucho a lo largo del año y eso cambia la pesca más que el mes del calendario. Cuando sueltan agua, los peces se descolocan durante días.

En la [ficha de cada sitio](/sevilla) tienes marcados los meses buenos, y en los embalses hay enlace para consultar el nivel antes de ir.`,
  },

  {
    slug: "que-cebo-para-carpa",
    titulo: "Qué cebo usar para la carpa (y por qué el maíz nunca falla)",
    entradilla:
      "Maíz, masilla, boilies o lombriz: cuándo funciona cada uno, qué cuesta y con cuál empezar si no has pescado carpa nunca.",
    provincia: null,
    especie: "carpa-comun",
    diasAtras: 30,
    contenido: `La carpa come casi de todo, y esa es la buena noticia: es la especie con la que más barato se empieza y la que más veces salva un día. La mala es que en un embalse con mucha presión se vuelve desconfiada y ahí sí empieza a importar lo que le pongas.

## Maíz dulce

El de bote, del supermercado. Es el cebo con el que más carpas se han pescado en este país y sigue siendo el primero que recomendaría a cualquiera.

- **Cuesta menos de un euro** el bote y da para una tarde.
- Se ve desde lejos: el amarillo destaca en el fondo.
- Va bien en el anzuelo directamente, dos o tres granos.

Si vas a llevar un solo cebo, lleva este.

## Masilla de pan

Miga de pan amasada con un poco de agua hasta que queda pegajosa. Gratis, y en aguas donde se pesca mucho con maíz a veces funciona mejor justo por eso.

Se le puede añadir matalahúva (anís en grano), que es el truco de toda la vida en Andalucía. Aguanta menos en el anzuelo que el maíz, así que hay que recogerlo y volver a montar más a menudo.

## Lombriz

Universal: entra la carpa, el barbo, el carpín y casi todo lo demás. Si no sabes qué hay en el sitio, empieza por aquí.

El inconveniente es que atrae también a lo que no buscas —cangrejo rojo sobre todo—, y en aguas con mucho cangrejo te quedas sin cebo cada dos minutos.

## Boilies

Las bolas de las marcas de carpfishing. Están pensadas justo para eso: **son demasiado grandes para que se las coman los peces pequeños**, así que filtran. En un sitio donde el alburno o el carpín te vacían el anzuelo, resuelven el problema.

Cuestan bastante más y necesitan montaje aparte (pelo). No son para el primer día.

## Cebar o no cebar

Echar un puñado de maíz cada pocos minutos en el mismo punto concentra los peces. Funciona, sobre todo en sesiones largas.

Dos avisos: comprueba que el engodo está permitido donde estés, porque hay tramos donde no lo está, y no te pases. Una carpa que se llena con lo que echas ya no tiene motivo para coger tu anzuelo.

## Dónde probar

En la [guía de sitios](/sevilla) tienes marcado en qué embalses hay más carpa y con qué probabilidad. Los de riego —Torre del Águila, Puebla de Cazalla— van llenos.`,
  },

  {
    slug: "como-leer-un-embalse",
    titulo: "Cómo leer un embalse: dónde están los peces",
    entradilla:
      "Un embalse no es agua uniforme. Estos son los sitios donde de verdad hay pesca, y por qué llegar a la orilla y tirar al medio casi nunca funciona.",
    provincia: null,
    diasAtras: 26,
    contenido: `El error que más veces separa un buen día de uno malo no es el cebo ni la caña: es tirar donde no hay nada. Un embalse tiene mucha agua vacía y unos pocos puntos donde se concentra todo.

## Los peces están en los bordes de algo

No en el centro del agua. Buscan un **cambio**: donde el fondo pasa de piedra a arena, donde termina la vegetación, donde se hunde un árbol, donde una loma sumergida corta la profundidad. Ahí hay refugio y hay comida.

Si desde la orilla ves agua uniforme sin nada, muévete.

## Las colas

Donde el río entra en el embalse. Es lo primero que miraría en cualquier sitio nuevo:

- Entra agua más fresca y con más oxígeno.
- Trae comida arrastrada.
- Es más somera, y en primavera es donde primero se calienta.

En primavera y otoño, las colas concentran una barbaridad.

## La estructura sumergida

Piedra, troncos, ramas, muros viejos. El black bass **vive ahí**: es un depredador de emboscada y necesita algo detrás de lo que esconderse.

Cuando el embalse baja se ve dónde está esa estructura. Merece la pena fijarse y acordarse, porque cuando vuelva a subir seguirá ahí.

## Las orillas con viento de cara

Cuesta pescar, pero el viento empuja el plancton contra esa orilla, detrás van los peces pequeños y detrás los grandes. Una orilla batida suele tener más vida que la abrigada.

## Las sombras

En verano y en Andalucía, decisivo. Bajo un árbol que da al agua, junto a un muro, en la parte que el sol da más tarde. Con calor los peces se meten donde el agua está unos grados más fresca.

## El nivel del agua manda sobre todo lo demás

En los embalses de riego el nivel se mueve mucho. Cuando sueltan agua, los peces se descolocan y pasan días desorientados; cuando sube y cubre vegetación que estaba seca, se pegan un festín y pican como locos.

Consultar el nivel antes de ir cambia más el resultado que cambiar de cebo. En la [ficha de cada embalse](/sevilla) hay enlace para mirarlo.

## Y lo más importante

Si en cuarenta minutos no ha pasado nada, cambia de sitio. Insistir donde no hay nada es lo que hace que la gente vuelva a casa diciendo que no picaba.`,
  },

  {
    slug: "pesca-sin-muerte",
    titulo: "Pesca sin muerte: qué es exactamente y cómo se hace bien",
    entradilla:
      "No es solo devolver el pez. Tiene reglas concretas de anzuelo y manejo, y en algunos tramos es obligatoria.",
    provincia: null,
    diasAtras: 20,
    contenido: `«Pesca sin muerte» o «captura y suelta» significa devolver vivo todo lo que se pesca. Suena obvio, pero es un régimen con reglas concretas, y en bastantes tramos **no es una elección: es obligatorio**.

## Qué exige normalmente

Donde está establecida como régimen, lo habitual es:

- **Anzuelo sin arponcillo** (sin muerte), o con el arponcillo aplastado con unos alicates.
- Devolución **inmediata** de todo lo capturado.
- A menudo, prohibición de usar sacadera de nudos o de tener el pez fuera del agua más de lo justo.

Los detalles y los tramos concretos van en la orden de vedas de cada comunidad, y cambian de una temporada a otra. Compruébalo antes de salir.

## Por qué sin arponcillo

El arponcillo es la lengüeta que impide que el anzuelo salga. Ayuda a no perder el pez, pero para sacarlo hay que desgarrar, y en un pez que vas a devolver eso es exactamente lo que no quieres.

Sin arponcillo el anzuelo sale casi solo. Se pierden algunas capturas —hay que mantener la línea tensa— y a cambio el pez se va entero.

Aplastarlo con unos alicates cuesta cinco segundos y vale para cualquier anzuelo que ya tengas.

## Cómo se hace bien

Está explicado en detalle en [cómo devolver un pez al agua sin matarlo](/blog/devolver-un-pez-al-agua), pero en corto: manos mojadas, el menor tiempo fuera posible, sujetar en horizontal y esperar a que se vaya solo.

## Ojo: no vale para todo

Aquí está el matiz que más se incumple. **Con las especies exóticas invasoras fuera de sus áreas delimitadas, devolverlas al agua es justo lo contrario de lo que dice la ley**: hay obligación de sacrificarlas.

Black bass, lucio, carpa común y trucha arcoíris. La mentalidad de captura y suelta, que en un barbo es lo correcto, en un lucio fuera de su área es una infracción. Está contado entero en [qué hacer con un black bass](/blog/especies-invasoras-que-hacer).

## Y con las de devolución obligatoria

Al revés: barbo, boga y trucha común vuelven al agua **siempre**, estés en el régimen que estés. Ahí no hay elección.

Cuál es cuál, en la [guía de especies](/especies).`,
  },

  {
    slug: "black-bass-sevilla",
    titulo: "Dónde pescar black bass en Sevilla",
    entradilla:
      "Los embalses con mejor población de la provincia, qué señuelo llevar a cada uno y, sobre todo, en cuáles se puede devolver al agua y en cuáles no.",
    provincia: "sevilla",
    especie: "black-bass",
    diasAtras: 12,
    contenido: `El black bass es la especie que mueve más pesca deportiva en la provincia, y Sevilla tiene sitios buenos de verdad. Antes de los sitios, lo que hay que saber sí o sí.

## Lo primero: no en todas partes se devuelve

El black bass es **especie exótica invasora**. Solo se puede pescar con normalidad —y devolver al agua— dentro de las **aguas delimitadas** que fija la orden de vedas. Fuera de ellas hay obligación de sacrificarlo.

En la [página de la provincia](/sevilla) está el listado completo tal cual figura en el boletín, y cada ficha de sitio dice si está dentro o fuera. Míralo antes de ir, no después.

## Los sitios

**Embalse José Torán.** El mejor de la provincia para bass y escenario habitual de las competiciones de la federación sevillana. Aguas limpias sobre el Retortillo, con mucha estructura sumergida: piedra, troncos, ramas. Está lejos —hora y cuarto desde la capital— pero merece el viaje. [Ficha completa](/sevilla/jose-toran).

**Embalse de El Pintado.** Sierra Norte, agua limpia y fría. Otro de los buenos, con mucha orilla que trabajar.

**Embalse de Torre del Águila.** El más cercano a la capital de los que tienen bass en cantidad. Es de riego, así que el nivel se mueve mucho: consúltalo antes.

**Embalse de La Minilla** y **Embalse del Agrio**. Poblaciones más discretas, pero menos gente.

## Qué llevar

- **Vinilo tipo senko o gusano de 9-10 cm.** El de partida. Negro para agua turbia, sandía con purpurina para agua clara.
- **Vinilo shad de 7-8 cm** en verde sandía.
- **Popper o paseante de superficie de 6-7 cm.** Para el amanecer, que es cuando de verdad funciona.
- **Crankbait pequeño.** Para localizar peces rápido en un embalse grande.

Todo montado en cabeza plomada o en texas rig si vas a meterte entre la estructura.

## Cuándo

Abril y mayo lo mejor, octubre muy bueno. En verano solo la primera hora del día y el atardecer: a mediodía en agosto no comen.

Está detallado en [cuándo pescar en Sevilla](/blog/cuando-pescar-sevilla).

## Cómo se pesca aquí

Peinando estructura, no agua abierta. El bass está pegado a algo: piedra, troncos, vegetación, una pared. Lanza al borde de eso y trabaja despacio. Si en media hora no pasa nada, cambia de punto antes que de señuelo.`,
  },

  {
    slug: "pescar-con-ninos",
    titulo: "Pescar con niños: cómo hacer que quieran repetir",
    entradilla:
      "El error es llevarlos a por el pez grande. Con qué especies, cuánto rato y qué equipo para que salga bien la primera vez.",
    provincia: null,
    diasAtras: 4,
    contenido: `La pesca con niños se estropea casi siempre por lo mismo: el adulto va a pescar y el niño va de acompañante. Al cuarto de hora se aburre, y ya no hay quien lo levante otro día.

Le das la vuelta con tres decisiones.

## Muchas picadas, no peces grandes

Un niño no quiere una carpa de cinco kilos: quiere que pase algo. Cinco alburnos de veinte gramos en media hora enganchan infinitamente más que una espera de dos horas a por algo gordo.

Así que: anzuelo pequeño, flotador, lombriz o un grano de maíz, y a una orilla con peces pequeños. El [Guadaíra a su paso por Oromana](/sevilla/guadaira-oromana) va bien para esto y está a veinte minutos de Sevilla.

## Corto

Una hora. Hora y media como mucho. Se termina **cuando todavía se lo está pasando bien**, no cuando ya está harto: eso es lo que hace que pida volver.

## Que haga cosas

Que monte el cebo, que recoja, que suelte el pez. Si su papel es estar sentado y callado mientras otro pesca, ha perdido.

## El equipo

- Una caña corta, de 2 a 2,40 m. Con una de tres metros no puede.
- Flotador, que se ve y da emoción.
- Anzuelos pequeños, del 12 al 16.
- **Un quitanzuelos**, y que aprenda a usarlo desde el primer día.

## Lo que sí hay que enseñar desde el principio

Las manos mojadas antes de tocar un pez, y devolverlo bien. Aprenden eso en la primera salida y ya no se les olvida. Está en [cómo devolver un pez al agua](/blog/devolver-un-pez-al-agua).

Y que hay peces que se devuelven siempre y otros que no se pueden devolver. No hace falta el detalle legal, pero sí que entiendan que no todos los peces son iguales.

## Papeles y seguridad

- **La licencia**: los menores necesitan la suya, y según la edad autorización del padre o tutor. Míralo en el [portal oficial](https://www.juntadeandalucia.es/organismos/sostenibilidadmedioambienteyeconomiaazul/areas/flora-fauna-silvestres/caza-pesca.html).
- **Chaleco** si la orilla tiene pendiente o el agua está honda. En los embalses de la sierra las bajadas son empinadas y la piedra suelta resbala.
- Gorra, agua y crema. En verano, temprano.

Y elige sitio de acceso fácil. En la [guía](/sevilla) están marcados: no lleves a un niño de seis años a una orilla donde hay que bajar agarrándose.`,
  },
  {
    slug: "donde-pescar-en-cadiz",
    titulo: "Dónde pescar en Cádiz: guía de embalses",
    entradilla:
      "Nueve embalses, tres paisajes distintos y un viento que decide la jornada. Cuál elegir según lo que busques y de dónde salgas.",
    provincia: "cadiz",
    diasAtras: 2,
    contenido: `La pesca continental de Cádiz se entiende con un mapa y dos ríos. Todo lo demás son detalles.

## El Guadalete: de la sierra a la campiña

El Guadalete baja de Grazalema y deja embalses por el camino, y no se parecen en nada entre el primero y el último.

Arriba está [Zahara-El Gastor](/cadiz/zahara-el-gastor), con el pueblo y su castillo colgados encima. Agua clara de sierra, orillas de piedra. Que se vea el fondo cambia la pesca: el pez te ve venir, así que afina el bajo y trabaja despacio. Es también el más bonito de la provincia, y eso cuenta.

Abajo, ya en la campiña, [Bornos](/cadiz/bornos) y [Arcos](/cadiz/arcos-de-la-frontera). Agua turbia, fondo de fango y carpa por todas partes. Son los dos sitios de diario de la comarca porque se llega en coche hasta casi la orilla. Si vas a estrenarte en la provincia, empieza por aquí.

Por el Majaceite, afluente del Guadalete, cuelgan otros dos: [Guadalcacín](/cadiz/guadalcacin), el más grande de Cádiz y el sitio para embarcación, y [Los Hurones](/cadiz/los-hurones), encajonado sobre Algar, el más escondido y el más incómodo de pescar desde orilla.

## Los Alcornocales: sombra y madera en el agua

Al sur el paisaje cambia por completo. El [embalse del Barbate](/cadiz/barbate) y el [Celemín](/cadiz/celemin) están metidos en el alcornocal, y eso significa dos cosas.

La primera, sombra de verdad en verano, que en esta provincia no la hay en casi ningún sitio. La segunda, y más importante para pescar: donde el monte llega a la orilla, mete troncos y ramas en el agua. Esa estructura sumergida es exactamente lo que busca el black bass. **Pesca los bordes, no el centro.**

A cambio, el entorno es parque natural: hay normativa propia de acceso, circulación y fuego además de la de pesca.

## El Campo de Gibraltar: aquí manda el levante

[Guadarranque](/cadiz/guadarranque) y [Charco Redondo](/cadiz/charco-redondo) están en cuencas costeras, a pocos kilómetros del mar. Son el sitio de casa de toda la comarca de Algeciras y Los Barrios.

Y tienen un factor que en el resto de la provincia es una molestia y aquí es el que decide la jornada: **el levante**. Con viento fuerte del este la orilla oeste se hace impescable y el lance se va a paseo. Si sopla, cámbiate de lado antes de montar el equipo, no después.

## Cómo elegir

- **Primera vez, sin complicaciones**: Bornos o Arcos. Acceso fácil, carpa segura.
- **A por black bass**: Barbate o Guadalcacín.
- **Un día bonito**: Zahara-El Gastor.
- **Sombra en verano**: Barbate, Celemín o Charco Redondo.
- **Con barca**: Guadalcacín.

En la [guía de Cádiz](/cadiz) tienes cada uno con sus especies, su acceso y a cuánto te pilla desde tu código postal.

## Dos cosas antes de salir

**La licencia.** Hace falta licencia de pesca continental andaluza en vigor, y seguro de responsabilidad civil. Lo tienes explicado en [este artículo](/blog/licencia-de-pesca-andalucia).

**Y las especies invasoras.** Esta es la importante y la que más gente se salta. En Andalucía, el black bass, el lucio, la carpa común y la trucha arcoíris solo se pueden devolver al agua dentro de unas aguas concretas, las llamadas *áreas delimitadas*. Fuera de ellas hay obligación de sacrificarlos.

Ese listado va por provincia y cambia con la orden de vedas. **Míralo en el boletín antes de ir**, no te fíes de lo que valga en la provincia de al lado. Está explicado en [qué hacer con un black bass](/blog/especies-invasoras-que-hacer), y el enlace al portal oficial lo tienes en la propia página de la provincia.`,
  },
  {
    slug: "cangrejo-rojo-americano",
    // El título no empieza por el nombre de la especie, y es a propósito. Con
    // «Cangrejo rojo americano: …» chocaba de frente con /especies/
    // cangrejo-rojo-americano, que se llama casi igual y va de lo mismo: dos
    // páginas nuestras peleándose por la consulta con más demanda de la web,
    // y ninguna de las dos pasando de la posición 55. La ficha se queda con el
    // nombre de la especie; este artículo, con la pregunta que se hace la
    // gente y con lo que solo cuenta él: que llevárselo vivo se sanciona
    // aparte, y que la mitad de lo que se lee por ahí está desfasado.
    titulo: "¿Se pueden coger cangrejos rojos? Lo que cambió y qué se sanciona",
    entradilla:
      "Su pesca no está abierta en Andalucía, y llevárselo vivo es otra infracción distinta. Las dos cosas se sancionan por separado, y buena parte de lo que circula por internet viene de cuando las normas eran otras.",
    provincia: null,
    especie: "cangrejo-rojo-americano",
    diasAtras: 0,
    contenido: `Si has enganchado uno pescando a fondo, o te has encontrado un montón en la orilla de un embalse, esto es lo que hay que saber. Va primero lo importante:

> **Su pesca no está abierta a la pesca deportiva en Andalucía, y trasladarlo vivo está prohibido.** Son dos cosas distintas y las dos se sancionan.

## Qué es exactamente

*Procambarus clarkii*. Le llaman cangrejo rojo americano, cangrejo rojo de las marismas o, mal, cangrejo de río. Rojo oscuro, pinzas granulosas, y aguanta lo que le echen: agua turbia, poco oxígeno, sequía parcial enterrándose en el barro.

Llegó a España en los años setenta y hoy está por toda la cuenca del Guadalquivir y mucho más allá. Es de las especies exóticas invasoras mejor instaladas del país.

**No lo confundas con el cangrejo de río autóctono** (*Austropotamobius pallipes*), que es el que se está extinguiendo y que también tiene su propia protección. Cuando alguien busca «cangrejo rojo de río» casi siempre está buscando este, el americano.

## Por qué es un problema

Dos motivos, y ninguno es el que la gente espera:

1. **Transmite la afanomicosis**, la peste del cangrejo. Él la aguanta; el autóctono se muere. Es la causa principal de que el cangrejo de río español haya desaparecido de casi todos los ríos donde estaba.
2. **Remueve el fondo y excava las orillas.** Enturbia el agua, se come puestas de anfibios y plantas acuáticas, y cambia el ecosistema entero de una charca.

Por eso está catalogado como especie exótica invasora, y ese catálogo es lo que activa las prohibiciones de las que va este artículo.

## Lo de «vivo» es una infracción aparte

Esta es la parte que más gente se salta, y la que hace que muchas búsquedas acaben aquí.

Con una especie exótica invasora, **la posesión, el transporte y la suelta de ejemplares vivos están prohibidos**. Da igual que sea un cubo con cuatro cangrejos para enseñárselos a los niños, o llevarlos vivos a otra charca. Eso es exactamente el mecanismo por el que la especie se ha extendido por España: a mano, en cubos.

Así que no. Ni vivo en el coche, ni vivo a otra balsa, ni vivo a casa.

## Entonces, ¿por qué veo gente pescándolos?

Porque hay dos cosas que no son pesca deportiva:

- **Los controladores autorizados.** En las Marismas del Guadalquivir hay una explotación regulada con gente que tiene autorización expresa. Eso no lo puede hacer cualquiera con una licencia de pesca.
- **La información vieja.** Y aquí está el lío de verdad.

Su captura **sí estuvo autorizada** en Andalucía para pesca deportiva en determinadas aguas, y hay guías, foros y vídeos de hace años que lo siguen diciendo. Esa información ya no vale. Si te fías de un foro de 2019 te puedes llevar una sanción, porque el que la firma no la paga.

**Comprueba siempre la orden de vedas vigente** en el [Portal de Caza y Pesca de la Junta de Andalucía](https://www.juntadeandalucia.es/organismos/sostenibilidadmedioambienteyeconomiaazul/areas/flora-fauna-silvestres/caza-pesca.html). Es el único sitio donde está lo que está en vigor hoy.

## ¿Y comerlos?

Se comen, y en Andalucía se comen mucho: el arroz con cangrejos es de aquí. Pero el que llega a la mesa sale de esa explotación regulada, con su control sanitario.

El que pescas tú en un embalse cualquiera no. Y hay un motivo concreto: **el cangrejo rojo acumula metales pesados** del sedimento donde vive. En aguas con historial minero o industrial eso deja de ser un detalle. En la guía marcamos los sitios con aviso sanitario justo por esto.

## Qué hago si engancho uno

Pescando a fondo con maíz o lombriz te van a robar el cebo una y otra vez, sobre todo al atardecer. Es lo normal en casi cualquier embalse andaluz.

- **Devuélvelo al agua ahí mismo**, en el sitio donde lo has sacado. No es una especie que se pueda soltar en otro lado, ni llevarse.
- Si te está haciendo la jornada imposible, sube el cebo del fondo o cámbiate de puesto. Suelen estar concentrados.
- Si vas a por carpa o barbo, un anzuelo algo mayor y cebo más duro te los quita de encima bastante.

## En resumen

- **Pescarlo deportivamente**: no está abierto.
- **Llevártelo vivo**: prohibido, y es una infracción aparte de la anterior.
- **Devolverlo al agua donde lo pescaste**: sí.
- **Soltarlo en otra charca**: prohibido, y es exactamente lo que ha extendido la plaga por España.
- **Fiarte de una guía de hace cinco años**: no.

Tienes la ficha completa, con dónde está y su situación legal, en [cangrejo rojo americano](/especies/cangrejo-rojo-americano). Y si lo que quieres es saber qué hacer con las otras invasoras —black bass, lucio, carpa, trucha arcoíris—, eso va justo al revés y lo tienes en [has pescado un black bass: ¿lo devuelves o no?](/blog/especies-invasoras-que-hacer).`,
  },
];
