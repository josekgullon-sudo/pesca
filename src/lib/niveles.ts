/**
 * Emparejar nuestros embalses con los del boletín hidrológico.
 *
 * Vive aquí y no dentro del script por un motivo que salió probándolo:
 * importar un script para poder testear sus funciones lo **ejecuta**, y este
 * en concreto se conecta a la base de datos y sale a internet. Las funciones
 * puras se sacan, el script se queda con lo que es suyo, y así esto se puede
 * probar sin efectos.
 */

/**
 * Deja un nombre listo para comparar: sin tildes, sin artículos y sin la
 * palabra «embalse».
 *
 * El boletín no usa nuestros nombres. «Embalse José Torán» allí puede ser
 * «JOSE TORAN». Emparejar mal no es un detalle: enseñar el porcentaje de otro
 * pantano manda a alguien a conducir dos horas para encontrarse el agua a
 * trescientos metros de donde aparcó.
 */
export function normalizar(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(embalses?|pantanos?|de|del|la|el|los|las)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Una fila del boletín, con lo único que hace falta para emparejar. */
export type FilaBoletin = {
  nombre: string;
  capacidadHm3: number;
  volumenHm3: number;
  fecha: Date;
  /**
   * Qué porcentaje suele llevar este embalse por estas fechas, sacado de los
   * años anteriores del propio boletín. En `null` cuando no hay histórico
   * suficiente para decirlo. Ver `historico-embalses.ts`.
   */
  medianaHistorica?: number | null;
};

/**
 * Prepara la búsqueda de un embalse nuestro dentro del boletín.
 *
 * Vive aquí, y no dentro del script, porque de las 52 fichas de embalse la
 * primera pasada emparejó 48. Las cuatro que no son justo los casos raros, y
 * los casos raros son los que hay que poder probar:
 *
 * - **Por prefijo.** El boletín numera las presas sucesivas —«Guadalcacín II»—
 *   y nosotros usamos el nombre de toda la vida. Solo se acepta si hay una
 *   única candidata: con dos no se puede decidir sin inventar, y prefiero
 *   dejar la ficha sin porcentaje.
 * - **Sumando varios**, escribiendo «A + B» en `nombreEnBoletin`. Hace falta
 *   para los complejos comunicados, como el de El Chorro: la ficha habla de
 *   Guadalhorce y Guadalteba juntos, y enseñar el nivel de uno solo sería
 *   contar otra cosa distinta de la que se está mirando.
 *
 * Devolver `null` es una respuesta válida y buena. Un embalse sin nivel se
 * queda sin la barra; uno con el nivel de otro manda a alguien a conducir dos
 * horas hasta un pantano que cree lleno.
 */
export function crearBuscador(filas: FilaBoletin[]) {
  const porNombre = new Map(filas.map((f) => [normalizar(f.nombre), f]));

  const buscar = (clave: string): FilaBoletin | null => {
    if (clave.includes("+")) {
      const trozos = clave.split("+").map((t) => buscar(t.trim()));
      if (trozos.some((t) => !t)) return null;
      const partes = trozos as FilaBoletin[];
      return {
        nombre: partes.map((p) => p.nombre).join(" + "),
        capacidadHm3: partes.reduce((a, p) => a + p.capacidadHm3, 0),
        volumenHm3: partes.reduce((a, p) => a + p.volumenHm3, 0),
        fecha: partes.reduce((a, p) => (p.fecha > a ? p.fecha : a), partes[0].fecha),
        // Sin mediana histórica a propósito: sumar dos porcentajes «normales»
        // no da el porcentaje normal del conjunto, y para hacerlo bien harían
        // falta los volúmenes históricos de cada presa, no sus porcentajes. El
        // complejo se queda sin la comparación, que es mejor que con una mal
        // hecha.
        medianaHistorica: null,
      };
    }

    const n = normalizar(clave);
    if (!n) return null;

    const exacta = porNombre.get(n);
    if (exacta) return exacta;

    const porPrefijo = [...porNombre.entries()].filter(([k]) => k.startsWith(`${n} `));
    return porPrefijo.length === 1 ? porPrefijo[0][1] : null;
  };

  /**
   * Qué hay en el boletín que se le parezca, para poder rellenar
   * `nombreEnBoletin` sin abrir el fichero a mano.
   */
  const parecidosA = (nombre: string): string[] => {
    const palabras = normalizar(nombre)
      .split(" ")
      .filter((p) => p.length > 3);
    if (palabras.length === 0) return [];
    return [...porNombre.entries()]
      .filter(([k]) => palabras.some((p) => k.includes(p)))
      .slice(0, 5)
      .map(([, f]) => f.nombre);
  };

  return { buscar, parecidosA };
}

/** «09/08/2026» o «2026-08-09». Nunca devuelve una fecha inválida. */
export function interpretarFecha(bruto: string): Date {
  const conBarras = bruto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (conBarras) {
    const [, d, m, a] = conBarras;
    return new Date(Date.UTC(+a, +m - 1, +d));
  }
  const iso = new Date(bruto);
  return Number.isNaN(iso.getTime()) ? new Date() : iso;
}
