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
  /** Días atrás desde hoy, para escalonar las fechas de publicación. */
  diasAtras: number;
  contenido: string;
};

export const ARTICULOS: ArticuloSemilla[] = [
  {
    slug: "licencia-de-pesca-andalucia",
    titulo: "¿Hace falta licencia para pescar en Andalucía?",
    entradilla:
      "Sí, y también seguro de responsabilidad civil. Qué necesitas llevar encima, cómo se saca y qué te puede pasar si te pillan sin ella.",
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

## Lo que de verdad se sanciona

Pescar sin licencia es una infracción administrativa con multa. Pero en la práctica lo que más denuncias genera no es eso, sino tres cosas que se hacen sin querer:

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
];
